import json
import os

DB_PATH = "data/estado_mina.json"

def init_db():
    if not os.path.exists("data"):
        os.makedirs("data")
    if not os.path.exists(DB_PATH):
        reset_db()

def reset_db():
    estado_inicial = {
        "flota": {}, # Guardará: { "ID": {"nombre_conductor": "", "equipo": "", "estado": "OPERATIVO", "destino": "Pala 1", "minutos_espera": 0} }
        "ia_logs": [
            "[SISTEMA] PUKARIA INICIADO.",
            "[SISTEMA] Monitoreando red local en espera de dispositivos GPS..."
        ],
        "simulacion_activa": False
    }
    with open(DB_PATH, "w") as f:
        json.dump(estado_inicial, f, indent=4)

def read_db():
    init_db()
    try:
        with open(DB_PATH, "r") as f:
            db = json.load(f)
            if "flota" not in db:
                reset_db()
                return read_db()
            return db
    except:
        reset_db()
        return read_db()

def write_db(data):
    with open(DB_PATH, "w") as f:
        json.dump(data, f, indent=4)
        
def add_log(mensaje):
    db = read_db()
    db["ia_logs"].insert(0, f"[LOG] {mensaje}") # Insertar al principio para ver lo más reciente
    write_db(db)
