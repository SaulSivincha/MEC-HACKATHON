import streamlit as st
from src.core.state import read_db, write_db, add_log
from src.vision.detector import ColaDetector
import time

st.set_page_config(page_title="Terminal Conductor", layout="centered")

@st.cache_resource
def load_vision():
    return ColaDetector()

detector = load_vision()

st.markdown("""
<style>
    .stButton>button { height: 70px; font-size: 18px; font-weight: bold; border-radius: 10px; width: 100%; }
</style>
""", unsafe_allow_html=True)

st.title("Red de Despacho")

if "user_id" not in st.session_state:
    st.markdown("### Escaneo Visual Inteligente")
    st.write("PukarIA requiere comprobar visualmente tu equipo (YOLOv8). Toma una foto de tu maquinaria.")
    
    foto = st.file_uploader("Tomar Foto / Sube Imagen", type=['jpg', 'jpeg', 'png'])
    
    with st.form("registro"):
        conductor = st.text_input("Nombre del Conductor (Ej. Juan Pérez)")
        equipo = st.text_input("ID del Equipo (Ej. CAT-01)")
        
        if st.form_submit_button("Analizar Imagen y Conectar"):
            if conductor and equipo and foto is not None:
                with st.spinner("PukarIA escaneando imagen con YOLOv8..."):
                    datos = detector.extraer_coordenadas(foto)
                
                # Lógica: Si detecta muchos elementos, asume que es camión o la red.
                # Como es una foto a nivel de piso del vehículo, si encuentra algo, vemos qué es.
                if len(datos['camiones']) > 0:
                    tipo = "Camión Volquete"
                elif datos['pala'] is not None:
                    tipo = "Pala Excavadora"
                else:
                    tipo = "Desconocido"
                
                if tipo != "Desconocido":
                    db = read_db()
                    user_id = equipo.upper()
                    db["flota"][user_id] = {
                        "conductor": conductor,
                        "tipo": tipo,
                        "estado": "OPERATIVO",
                        "destino": "Pala 1" if tipo == "Camión Volquete" else "Posición Fija",
                        "minutos_espera": 0
                    }
                    write_db(db)
                    add_log(f"VISIÓN ARTIFICIAL: Se ha identificado visualmente un {tipo} asignado a {conductor}.")
                    st.session_state["user_id"] = user_id
                    st.rerun()
                else:
                    st.error("La IA no logró identificar maquinaria pesada en esta imagen.")
            else:
                st.error("Por favor completa los datos y sube la foto de la maquinaria.")
else:
    user_id = st.session_state["user_id"]
    db = read_db()
    
    if user_id not in db["flota"]:
        st.session_state.clear()
        st.rerun()
        
    mi_data = db["flota"][user_id]
    
    st.success(f"Verificado por IA: **{mi_data['conductor']}** | {mi_data['tipo']} {user_id}")
    
    st.markdown("---")
    st.markdown("### Órdenes de PukarIA")
    
    if mi_data["tipo"] == "Camión Volquete":
        st.info(f"Destino asignado: **{mi_data['destino']}**")
    else:
        st.info(f"Mantén posición en: **{mi_data['destino']}**")
        
    st.markdown("---")
    st.markdown("### Panel de Conductor")
    
    if mi_data["estado"] == "OPERATIVO":
        if st.button("REPORTAR ESTADO: VARADO / TRÁFICO", type="primary"):
            db["flota"][user_id]["estado"] = "VARADO"
            db["flota"][user_id]["minutos_espera"] = 15
            write_db(db)
            add_log(f"ALERTA: {user_id} reporta pérdida de movimiento (Tiempo de espera excesivo).")
            st.rerun()
    else:
        st.error("PukarIA está evaluando tu situación y la del resto de la flota...")
        if st.button("REANUDAR OPERACIÓN (Falsa Alarma)"):
            db["flota"][user_id]["estado"] = "OPERATIVO"
            db["flota"][user_id]["minutos_espera"] = 0
            write_db(db)
            add_log(f"{user_id} ha reanudado su marcha.")
            st.rerun()
            
    st.markdown("---")
    if st.button("Refrescar Pantalla"):
        st.rerun()
        
    if st.button("Desconectar GPS"):
        db = read_db()
        if user_id in db["flota"]:
            del db["flota"][user_id]
            write_db(db)
            add_log(f"Conexión perdida con {user_id}.")
        st.session_state.clear()
        st.rerun()
