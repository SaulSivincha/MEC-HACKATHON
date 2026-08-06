import streamlit as st
import plotly.graph_objects as go
from src.core.dispatcher import SmartDispatcher
from src.vision.detector import ColaDetector

st.set_page_config(page_title="SmartDispatch AI", layout="wide")

st.title("🚜 SmartDispatch AI")
st.subheader("Optimización de Despacho mediante Visión Computacional")

@st.cache_resource
def load_detector():
    return ColaDetector()

detector = load_detector()

# Inicializamos el despachador (ya no necesita el mapa 3D)
dispatcher = SmartDispatcher(map_3d=None)

# --- MAQUETA DEL DASHBOARD ---
col_ctrl, col_2d = st.columns([1, 2.5])

with col_ctrl:
    st.markdown("### 📷 Cámara de la Pala 1 (IA)")
    st.info("Sube una foto de camiones haciendo cola.")
    
    uploaded_file = st.file_uploader("Subir feed de cámara", type=['jpg', 'jpeg', 'png', 'webp', 'bmp'])
    
    camiones_p1 = 0
    camiones_p2 = 0 
    
    if uploaded_file is not None:
        with st.spinner("🤖 YOLOv8 analizando congestión..."):
            camiones_p1, img_cajas = detector.contar_camiones(uploaded_file)
            
        st.success(f"¡IA Detectó **{camiones_p1} vehículos** en la cola!")
        st.image(img_cajas, caption="Detección en tiempo real", use_container_width=True)
    else:
        st.write("Esperando imagen para procesar...")
        
    st.markdown("---")
    st.markdown("### 🧠 Central de Despacho")
    
    resultado = dispatcher.asignar_mejor_ruta(camiones_p1, camiones_p2)
    
    st.write(f"Costo a Pala 1 (Más cerca, incluye cola): **{resultado['costos']['Pala 1']}**")
    st.write(f"Costo a Pala 2 (Más lejos, cero cola): **{resultado['costos']['Pala 2']}**")
    
    st.markdown("#### 📡 ORDEN DE RADIO ENVIADA:")
    if resultado['asignacion'] == "Pala 1":
        st.success(f"🗣️ **'ATENCIÓN CAMIÓN 77: Tu destino asignado es la PALA 1. Flujo normal.'**")
    else:
        st.error(f"🗣️ **'ATENCIÓN CAMIÓN 77: CUELLO DE BOTELLA EN PALA 1. Aborta ruta. TÚ VAS A LA PALA 2.'**")

with col_2d:
    st.markdown("### 🗺️ Radar de Gestión de Flota (2D)")
    
    fig = go.Figure()
    
    cx, cy = dispatcher.chancadora_pos
    p1x, p1y = dispatcher.palas["Pala 1"]["pos"]
    p2x, p2y = dispatcher.palas["Pala 2"]["pos"]
    
    # 1. Trazar rutas posibles de fondo (líneas punteadas oscuras)
    fig.add_trace(go.Scatter(
        x=[cx, p1x], y=[cy, p1y],
        mode='lines', line=dict(color='#333333', width=2, dash='dot'),
        name="Rutas Físicas", hoverinfo='skip'
    ))
    fig.add_trace(go.Scatter(
        x=[cx, p2x], y=[cy, p2y],
        mode='lines', line=dict(color='#333333', width=2, dash='dot'),
        showlegend=False, hoverinfo='skip'
    ))
    
    # 2. Dibujar Sensores / Nodos (Chancadora y Palas)
    # Usamos colores vivos estilo radar sobre fondo negro
    color_p1 = '#ff0055' if camiones_p1 > 3 else '#00ffaa'
    
    fig.add_trace(go.Scatter(
        x=[cx, p1x, p2x], y=[cy, p1y, p2y],
        mode='markers+text',
        marker=dict(
            size=[28, 22, 22], 
            color=['#00f0ff', color_p1, '#00ffaa'], 
            symbol=['square', 'circle', 'circle'],
            line=dict(width=2, color='white')
        ),
        text=[
            "CHANCADORA", 
            f"PALA 1<br>({camiones_p1} Esperando)", 
            f"PALA 2<br>(0 Esperando)"
        ],
        textposition=["top center", "bottom center", "bottom center"],
        textfont=dict(color="white", size=14, family="Arial Black"),
        name="Sensores Activos"
    ))
    
    # 3. Dibujar la Decisión de Enrutamiento (Línea Láser Amarilla)
    inicio = resultado['ruta_inicio']
    fin = resultado['ruta_fin']
    
    fig.add_trace(go.Scatter(
        x=[inicio[0], fin[0]], y=[inicio[1], fin[1]],
        mode='lines',
        line=dict(color='#ffff00', width=6),
        name=f"Asignación Dispatch: {resultado['asignacion']}"
    ))
    
    # 4. Estilizar el gráfico para que parezca un software industrial real (FMS)
    fig.update_layout(
        plot_bgcolor='#0e1117',  # Fondo negro/oscuro
        paper_bgcolor='#0e1117',
        height=700,
        margin=dict(l=20, r=20, t=40, b=20),
        xaxis=dict(
            showgrid=True, gridcolor='#1f2937', zeroline=False, showticklabels=False,
            range=[0, 50], title=""
        ),
        yaxis=dict(
            showgrid=True, gridcolor='#1f2937', zeroline=False, showticklabels=False,
            range=[0, 50], title=""
        ),
        legend=dict(
            font=dict(color="white"),
            bgcolor="rgba(0,0,0,0)",
            orientation="h",
            yanchor="bottom", y=1.02, xanchor="right", x=1
        )
    )
    
    st.plotly_chart(fig, width='stretch')
