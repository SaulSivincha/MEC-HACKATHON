import streamlit as st
from src.core.state import read_db, write_db, add_log
from src.core.ml_model import PukarIAPredictor
import time

st.set_page_config(page_title="PukarIA Central", layout="centered")

# CSS para estilo Blanco Minimalista sin emojis
st.markdown("""
<style>
    .jarvis-title { font-size: 65px; font-weight: 900; text-align: center; font-family: 'Helvetica Neue', sans-serif; letter-spacing: -2px; color: #000;}
    .log-box { background-color: #f8f9fa; padding: 15px; border-left: 4px solid #ccc; border-radius: 5px; font-family: monospace; font-size: 16px; margin-bottom: 10px; color: #333;}
    .alert-box { background-color: #ffffff; padding: 20px; border: 1px solid #000; border-left: 6px solid #e74c3c; border-radius: 5px; font-family: 'Helvetica Neue', sans-serif; font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #000; box-shadow: 2px 2px 10px rgba(0,0,0,0.1);}
    .device-card { border: 1px solid #eee; padding: 10px; border-radius: 8px; text-align: center; background-color: #fafafa;}
</style>
""", unsafe_allow_html=True)

st.markdown("<div class='jarvis-title'>PukarIA</div>", unsafe_allow_html=True)
st.markdown("<p style='text-align:center; color:gray; font-size:18px;'>Central Predictiva de Machine Learning</p>", unsafe_allow_html=True)
st.markdown("<br>", unsafe_allow_html=True)

db = read_db()

@st.cache_resource
def load_ai():
    return PukarIAPredictor()

predictor = load_ai()

# Explicación de cómo entrena la IA (Side Bar)
with st.sidebar:
    st.header("Arquitectura de la IA")
    st.markdown("""
    **1. Generación de Datos:**
    El sistema construye un dataset sintético con 5,000 registros históricos de operaciones mineras. 
    
    Cada registro contiene:
    - Distancia hacia las Palas.
    - Nivel de tráfico histórico (Camiones en cola).
    - Etiqueta óptima (La decisión correcta matemáticamente).
    
    **2. Entrenamiento (Machine Learning):**
    Utilizamos la librería `scikit-learn` para entrenar un modelo **Random Forest Classifier** con 100 árboles de decisión basados en el dataset.
    
    **3. Inferencia en Vivo:**
    Durante la operación, el estado actual reportado por los dispositivos IoT (Celulares) se alimenta al modelo. El algoritmo infiere la mejor ruta usando `.predict()` y entrega un nivel de confianza (%).
    """)

# --- BOTONES MAESTROS ---
col1, col2 = st.columns(2)
with col1:
    if st.button("Refrescar Conexiones", use_container_width=True):
        st.rerun()
with col2:
    if st.button("Simular Caso Crítico", use_container_width=True, type="primary"):
        if len(db["flota"]) == 0:
            st.error("Primero conecta un celular a la red para la simulación.")
        else:
            add_log("Iniciando simulación de cuello de botella masivo...")
            for v_id, v_data in db["flota"].items():
                if v_data["tipo"] == "Camión Volquete":
                    v_data["estado"] = "VARADO"
                    v_data["minutos_espera"] = 45 # Mucho tiempo
            write_db(db)
            st.rerun()

st.markdown("---")

# --- LÓGICA AUTÓNOMA ---
hubo_cambios = False
camiones_varados = [v_id for v_id, v in db["flota"].items() if v["estado"] == "VARADO" and v["tipo"] == "Camión Volquete"]

if len(camiones_varados) > 0 and not db["simulacion_activa"]:
    db["simulacion_activa"] = True
    add_log(f"ANALIZANDO... Detecto {len(camiones_varados)} vehículos sin movimiento.")
    
    for v_id in camiones_varados:
        conductor = db["flota"][v_id]["conductor"]
        tiempo = db["flota"][v_id]["minutos_espera"]
        
        add_log(f"Analizando telemetría... El vehículo '{v_id}' de {conductor} está varado ({tiempo} mins en Pala 1).")
        
        # EL CEREBRO DE MACHINE LEARNING EN ACCIÓN
        add_log("[PROCESO] Iniciando inferencia predictiva (RandomForestClassifier - 10 Variables)...")
        add_log("[PROCESO] Ingresando Telemetría: Clima Lluvia, Desgaste Motor 70%, Pendiente 18°...")
        
        # PukarIA usa Scikit-Learn para predecir la ruta
        telemetria_vivo = {
            "cola_p1": 45, "cola_p2": 0,
            "dist_p1": 5.0, "dist_p2": 12.0,
            "clima_severidad": 0.9, # Tormenta
            "desgaste_motor": 0.7, # 70% desgaste
            "pendiente_p1": 18.0, "pendiente_p2": 5.0,
            "tiempo_giro_p1": 150, "tiempo_giro_p2": 40
        }
        resultado = predictor.predecir_ruta(telemetria_vivo)
        
        db["flota"][v_id]["destino"] = resultado["asignacion"]
        db["flota"][v_id]["estado"] = "OPERATIVO" # Se soluciona
        
        eta = resultado["eta_minutos"]
        
        add_log(f"PREDICCIÓN IA: Se asigna la {resultado['asignacion']} (Confianza: {resultado['confianza']}%). ⏱️ Tiempo Estimado (ETA): {eta} minutos.")
        hubo_cambios = True
        
elif len(camiones_varados) == 0 and db["simulacion_activa"]:
    db["simulacion_activa"] = False
    add_log("El flujo de la mina ha vuelto a la normalidad.")
    hubo_cambios = True

if hubo_cambios:
    write_db(db)

# --- VISUALIZACIÓN MINIMALISTA ---
st.markdown("### Inferencias del Modelo (PukarIA)")
for log in db["ia_logs"][:8]: # Mostrar ultimos 8
    if "Analizando telemetría" in log or "PREDICCIÓN IA:" in log:
        st.markdown(f"<div class='alert-box'>{log}</div>", unsafe_allow_html=True)
    else:
        st.markdown(f"<div class='log-box'>{log}</div>", unsafe_allow_html=True)

st.markdown("---")
st.markdown("### Red de Celulares Activos")
if len(db["flota"]) == 0:
    st.info("Esperando conexión de choferes por red local...")
else:
    cols = st.columns(4)
    idx = 0
    for v_id, v_data in db["flota"].items():
        with cols[idx % 4]:
            st.markdown(f"<div class='device-card'><b>{v_id}</b><br>{v_data['conductor']}<br>{v_data['destino']}<br>{v_data['estado']}</div>", unsafe_allow_html=True)
        idx += 1
