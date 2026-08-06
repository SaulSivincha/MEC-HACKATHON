import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
import joblib
import os

MODEL_PATH = "data/pukaria_model.pkl"

class PukarIAPredictor:
    """
    Cerebro de PukarIA. 
    Modelo RandomForest entrenado con telemetría hiperrealista.
    """
    def __init__(self):
        self.modelo = None
        self.entrenado = False
        self._cargar_o_entrenar()
        
    def _cargar_o_entrenar(self):
        if os.path.exists(MODEL_PATH):
            self.modelo = joblib.load(MODEL_PATH)
            self.entrenado = True
        else:
            self.entrenar_modelo_y_guardar()
            
    def entrenar_modelo_y_guardar(self):
        print("🤖 [PUKARIA] Iniciando fase de entrenamiento (Dataset Hiperrealista)...")
        np.random.seed(42)
        n_samples = 10000
        
        # 1. Variables Base
        cola_p1 = np.random.randint(0, 50, n_samples)
        cola_p2 = np.random.randint(0, 50, n_samples)
        dist_p1 = np.full(n_samples, 5.0)  # Más cerca
        dist_p2 = np.full(n_samples, 12.0) # Más lejos
        
        # 2. Variables de Telemetría Hiperrealista
        clima_severidad = np.random.uniform(0.0, 1.0, n_samples) # 0=Despejado, 1=Tormenta
        desgaste_motor = np.random.uniform(0.0, 1.0, n_samples)  # 0=Nuevo, 1=Falla inminente
        
        # 3. Geometría y Maniobrabilidad
        pendiente_p1 = np.full(n_samples, 18.0) # 18 grados (muy empinada)
        pendiente_p2 = np.full(n_samples, 5.0)  # 5 grados (plana)
        
        tiempo_giro_p1 = np.random.randint(30, 180, n_samples) # Segundos que toma cuadrarse
        tiempo_giro_p2 = np.random.randint(30, 180, n_samples)
        
        # Etiquetado: Lógica de costo de vida real
        y = []
        for i in range(n_samples):
            # Costo 1 = Distancia + Cola + Dificultad de Subida(Desgaste*Pendiente) + Tiempo Giro + Peligro Clima
            costo_1 = (dist_p1[i] * 1.5) + (cola_p1[i] * 2.0) + \
                      (desgaste_motor[i] * pendiente_p1[i] * 5.0) + \
                      (tiempo_giro_p1[i] / 60.0) + \
                      (clima_severidad[i] * pendiente_p1[i] * 3.0) + \
                      np.random.normal(0, 5) # Ruido humano
                      
            costo_2 = (dist_p2[i] * 1.5) + (cola_p2[i] * 2.0) + \
                      (desgaste_motor[i] * pendiente_p2[i] * 5.0) + \
                      (tiempo_giro_p2[i] / 60.0) + \
                      (clima_severidad[i] * pendiente_p2[i] * 3.0) + \
                      np.random.normal(0, 5)
                      
            if costo_1 <= costo_2:
                y.append("Pala 1")
            else:
                y.append("Pala 2")
                
        df = pd.DataFrame({
            "cola_p1": cola_p1,
            "cola_p2": cola_p2,
            "dist_p1": dist_p1,
            "dist_p2": dist_p2,
            "clima_severidad": clima_severidad,
            "desgaste_motor": desgaste_motor,
            "pendiente_p1": pendiente_p1,
            "pendiente_p2": pendiente_p2,
            "tiempo_giro_p1": tiempo_giro_p1,
            "tiempo_giro_p2": tiempo_giro_p2
        })
        
        if not os.path.exists("data"):
            os.makedirs("data")
            
        df_export = df.copy()
        df_export["decision_optima"] = y
        df_export.to_csv("data/historial_mina_avanzado.csv", index=False)
        
        print("\n👀 MUESTRA DEL DATASET (Hiperrealista):")
        print(df_export[['cola_p1', 'clima_severidad', 'desgaste_motor', 'tiempo_giro_p1', 'decision_optima']].head().to_string(index=False))
        
        X_train, X_test, y_train, y_test = train_test_split(df, y, test_size=0.2, random_state=42)
        
        print("\n🧠 Entrenando Random Forest con 10 variables...")
        self.modelo = RandomForestClassifier(n_estimators=100, max_depth=15, random_state=42)
        self.modelo.fit(X_train, y_train)
        self.entrenado = True
        
        joblib.dump(self.modelo, MODEL_PATH)
        print(f"✅ ¡Entrenamiento exitoso! Precisión Test Set: {self.modelo.score(X_test, y_test)*100:.2f}%")
        
    def predecir_ruta(self, datos_telemetria):
        """
        Recibe un diccionario con los datos en vivo.
        """
        df_vivo = pd.DataFrame([datos_telemetria])
        
        # Asegurar que las columnas coincidan con el entrenamiento
        columnas = ["cola_p1", "cola_p2", "dist_p1", "dist_p2", "clima_severidad", 
                    "desgaste_motor", "pendiente_p1", "pendiente_p2", "tiempo_giro_p1", "tiempo_giro_p2"]
        df_vivo = df_vivo[columnas]
        
        prediccion = self.modelo.predict(df_vivo)[0]
        probabilidades = self.modelo.predict_proba(df_vivo)[0]
        confianza = max(probabilidades) * 100
        
        return {
            "asignacion": prediccion,
            "confianza": round(confianza, 1)
        }

if __name__ == "__main__":
    print("=== PUKARIA ML ENGINE (TELEMETRÍA AVANZADA) ===")
    ia = PukarIAPredictor()
    ia.entrenar_modelo_y_guardar()
    print("==============================================")
