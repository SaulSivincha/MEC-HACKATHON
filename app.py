import streamlit as st
import plotly.graph_objects as go
from src.core.map_generator import generate_open_pit_map

st.set_page_config(page_title="SmartDispatch A*", layout="wide")

st.title("🚜 SmartDispatch A* + AI")
st.subheader("Sistema de Enrutamiento Inteligente para Minería a Tajo Abierto")

# Dividimos la pantalla en 2 columnas: Controles(Izquierda) y 3D(Derecha)
col_ctrl, col_3d = st.columns([1, 3])

with col_ctrl:
    st.markdown("### 🎛️ Controles de Simulación")
    size = st.slider("Tamaño del Tajo (Grid)", min_value=30, max_value=100, value=50, step=10)
    depth = st.slider("Profundidad de la Mina", min_value=10, max_value=50, value=20, step=5)
    
    st.markdown("---")
    st.markdown("### 📷 Monitor IA (Visión)")
    st.info("🚧 El feed de la cámara con YOLOv8 se conectará aquí en la Tarea 4.")

with col_3d:
    st.markdown("### 🗺️ Gemelo Digital 3D")
    
    # Llamamos a nuestro generador matemático
    Z = generate_open_pit_map(size=size, depth=depth)
    
    # Ploteamos con Plotly Surface
    fig = go.Figure(data=[go.Surface(
        z=Z, 
        colorscale='Earth',
        colorbar=dict(title='Elevación')
    )])
    
    # Mejoramos el aspecto visual del gráfico
    fig.update_layout(
        title='Topografía Sintética Escalonada',
        autosize=False,
        height=650,
        margin=dict(l=0, r=0, b=0, t=40),
        scene=dict(
            xaxis_title='Eje X',
            yaxis_title='Eje Y',
            zaxis_title='Profundidad (Z)'
        )
    )
    
    st.plotly_chart(fig, use_container_width=True)
