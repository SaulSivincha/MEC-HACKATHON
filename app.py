import streamlit as st
import plotly.graph_objects as go
from src.core.map_generator import generate_open_pit_map
from src.core.dispatcher import SmartDispatcher

st.set_page_config(page_title="SmartDispatch A*", layout="wide")

st.title("🚜 SmartDispatch A* + AI")
st.subheader("Optimización de Despacho mediante Visión Computacional")

# Inicializamos el generador del mapa y el despachador
size, depth = 50, 20
Z = generate_open_pit_map(size=size, depth=depth)
dispatcher = SmartDispatcher(map_3d=Z)

# --- MAQUETA DEL DASHBOARD ---
col_ctrl, col_3d = st.columns([1, 2.5])

with col_ctrl:
    st.markdown("### 📷 Datos de Visión (YOLOv8)")
    st.info("Simulando detecciones de cámara en tiempo real:")
    
    # Controles para simular lo que ve la cámara
    camiones_p1 = st.slider("🚛 Cola detectada en Pala 1", 0, 10, 4)
    camiones_p2 = st.slider("🚛 Cola detectada en Pala 2", 0, 10, 0)
    
    st.markdown("---")
    st.markdown("### 🧠 Motor de Decisión (Dispatch)")
    
    # El algoritmo calcula a dónde enviar el camión vacío que sale de la chancadora
    resultado = dispatcher.asignar_mejor_ruta(camiones_p1, camiones_p2)
    
    st.write(f"**Costo Calculado Pala 1:** {resultado['costos']['Pala 1']}")
    st.write(f"**Costo Calculado Pala 2:** {resultado['costos']['Pala 2']}")
    
    # Feedback visual de la decisión
    if resultado['asignacion'] == "Pala 1":
        st.success(f"✅ Enrutando camión vacío hacia: **{resultado['asignacion']}**")
    else:
        st.warning(f"⚠️ Cuello de botella evitado. Enrutando hacia: **{resultado['asignacion']}**")

with col_3d:
    st.markdown("### 🗺️ Monitoreo Satelital 3D")
    
    # 1. Capa del terreno
    fig = go.Figure(data=[go.Surface(
        z=Z, 
        colorscale='Earth',
        opacity=0.9,
        showscale=False
    )])
    
    # Obtener coordenadas
    cx, cy = dispatcher.chancadora_pos
    p1x, p1y = dispatcher.palas["Pala 1"]["pos"]
    p2x, p2y = dispatcher.palas["Pala 2"]["pos"]
    
    # Calcular elevación para que los puntos floten un poquito sobre la tierra
    cz = Z[cy, cx] + 2
    p1z = Z[p1y, p1x] + 2
    p2z = Z[p2y, p2x] + 2
    
    # 2. Capa de Nodos (Palas y Chancadora)
    fig.add_trace(go.Scatter3d(
        x=[cx, p1x, p2x], y=[cy, p1y, p2y], z=[cz, p1z, p2z],
        mode='markers+text',
        marker=dict(size=6, color=['blue', 'red', 'red']),
        text=["Chancadora", f"Pala 1 ({camiones_p1})", f"Pala 2 ({camiones_p2})"],
        textposition="top center",
        name="Instalaciones"
    ))
    
    # 3. Capa de la Ruta Óptima (Línea dinámica)
    inicio = resultado['ruta_inicio']
    fin = resultado['ruta_fin']
    fin_z = Z[fin[1], fin[0]] + 2
    
    fig.add_trace(go.Scatter3d(
        x=[inicio[0], fin[0]], y=[inicio[1], fin[1]], z=[cz, fin_z],
        mode='lines',
        line=dict(color='yellow', width=8),
        name=f"Ruta Asignada ({resultado['asignacion']})"
    ))
    
    # Configuramos la cámara 3D
    fig.update_layout(
        height=650,
        margin=dict(l=0, r=0, b=0, t=0),
        scene=dict(
            xaxis=dict(visible=False),
            yaxis=dict(visible=False),
            zaxis=dict(visible=False),
            camera=dict(eye=dict(x=1.5, y=-1.5, z=1.2))
        )
    )
    
    st.plotly_chart(fig, use_container_width=True)
