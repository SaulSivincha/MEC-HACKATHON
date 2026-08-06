import streamlit as st
import plotly.graph_objects as go
from src.core.map_generator import generate_open_pit_map
from src.core.dispatcher import SmartDispatcher
from src.vision.detector import ColaDetector

st.set_page_config(page_title="SmartDispatch A*", layout="wide")

st.title("🚜 SmartDispatch A* + AI")
st.subheader("Optimización de Despacho mediante Visión Computacional")

# Usamos caché para cargar la IA de YOLO solo una vez
@st.cache_resource
def load_detector():
    return ColaDetector()

detector = load_detector()

# Inicializamos el generador del mapa y el despachador
size, depth = 50, 20
Z = generate_open_pit_map(size=size, depth=depth)
dispatcher = SmartDispatcher(map_3d=Z)

# --- MAQUETA DEL DASHBOARD ---
col_ctrl, col_3d = st.columns([1, 2.5])

with col_ctrl:
    st.markdown("### 📷 Cámara de la Pala 1 (IA)")
    st.info("Sube una foto de camiones haciendo cola.")
    
    # Uploader para que el usuario ponga la foto real
    uploaded_file = st.file_uploader("Subir feed de cámara", type=['jpg', 'jpeg', 'png'])
    
    camiones_p1 = 0
    camiones_p2 = 0 # Asumiremos Pala 2 vacía para el ejemplo de la demo
    
    if uploaded_file is not None:
        with st.spinner("🤖 YOLOv8 analizando congestión..."):
            camiones_p1, img_cajas = detector.contar_camiones(uploaded_file)
            
        st.success(f"¡IA Detectó **{camiones_p1} vehículos** en la cola!")
        # Mostramos la imagen procesada con las cajitas
        st.image(img_cajas, caption="Detección en tiempo real", use_container_width=True)
    else:
        st.write("Esperando imagen para procesar...")
        
    st.markdown("---")
    st.markdown("### 🧠 Decisión del Dashboard")
    
    # El algoritmo calcula
    resultado = dispatcher.asignar_mejor_ruta(camiones_p1, camiones_p2)
    
    st.write(f"Costo a Pala 1 (Más cerca pero con cola): **{resultado['costos']['Pala 1']}**")
    st.write(f"Costo a Pala 2 (Más lejos pero vacía): **{resultado['costos']['Pala 2']}**")
    
    if resultado['asignacion'] == "Pala 1":
        st.success(f"✅ Flujo normal. Enrutando hacia: **{resultado['asignacion']}**")
    else:
        st.error(f"⚠️ Cuello de botella inminente. Reenrutando hacia: **{resultado['asignacion']}**")

with col_3d:
    st.markdown("### 🗺️ Gemelo Digital de Asignación")
    
    fig = go.Figure(data=[go.Surface(
        z=Z, 
        colorscale='Earth',
        opacity=0.9,
        showscale=False
    )])
    
    cx, cy = dispatcher.chancadora_pos
    p1x, p1y = dispatcher.palas["Pala 1"]["pos"]
    p2x, p2y = dispatcher.palas["Pala 2"]["pos"]
    
    cz = Z[cy, cx] + 2
    p1z = Z[p1y, p1x] + 2
    p2z = Z[p2y, p2x] + 2
    
    fig.add_trace(go.Scatter3d(
        x=[cx, p1x, p2x], y=[cy, p1y, p2y], z=[cz, p1z, p2z],
        mode='markers+text',
        marker=dict(size=6, color=['blue', 'red', 'red']),
        text=["Chancadora", f"Pala 1 ({camiones_p1} u)", f"Pala 2 (0 u)"],
        textposition="top center",
        name="Instalaciones"
    ))
    
    inicio = resultado['ruta_inicio']
    fin = resultado['ruta_fin']
    fin_z = Z[fin[1], fin[0]] + 2
    
    fig.add_trace(go.Scatter3d(
        x=[inicio[0], fin[0]], y=[inicio[1], fin[1]], z=[cz, fin_z],
        mode='lines',
        line=dict(color='yellow', width=8),
        name=f"Ruta Activa"
    ))
    
    fig.update_layout(
        height=700,
        margin=dict(l=0, r=0, b=0, t=0),
        scene=dict(
            xaxis=dict(visible=False),
            yaxis=dict(visible=False),
            zaxis=dict(visible=False),
            camera=dict(eye=dict(x=1.5, y=-1.5, z=1.2))
        )
    )
    
    st.plotly_chart(fig)
