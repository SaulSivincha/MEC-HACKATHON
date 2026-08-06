import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.model_selection import train_test_split
import joblib
import os

MODEL_CLASSIFIER_PATH = "data/pukaria_model.pkl"
MODEL_REGRESSOR_PATH = "data/pukaria_time_model.pkl"

class PukarIAPredictor:
    """
    Cerebro Dual de PukarIA. 
    1. RandomForestClassifier (Para predecir Ruta).
    2. RandomForestRegressor (Para predecir ETA en minutos).
    """
    def __init__(self):
        self.modelo_ruta = None
        self.modelo_tiempo = None
        self.entrenado = False
        self._cargar_o_entrenar()
        
    def _cargar_o_entrenar(self):
        if os.path.exists(MODEL_CLASSIFIER_PATH) and os.path.exists(MODEL_REGRESSOR_PATH):
            self.modelo_ruta = joblib.load(MODEL_CLASSIFIER_PATH)
            self.modelo_tiempo = joblib.load(MODEL_REGRESSOR_PATH)
            self.entrenado = True
        else:
            self.entrenar_modelo_y_guardar()
            
    def entrenar_modelo_y_guardar(self):
        print("🤖 [PUKARIA] Iniciando entrenamiento de Arquitectura Dual (Ruta + ETA)...")
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
        
        tiempo_giro_p1 = np.random.randint(30, 180, n_samples) # Segundos
        tiempo_giro_p2 = np.random.randint(30, 180, n_samples)
        
        # Etiquetado Dual (Ruta y Tiempo)
        y_ruta = []
        y_tiempo = []
        
        for i in range(n_samples):
            # Tiempo estimado real en minutos
            # Base: asumiendo 30km/h velocidad base -> dist/30 * 60 = dist * 2
            tiempo_1 = (dist_p1[i] * 2.0) + (cola_p1[i] * 2.5) + \
                      (desgaste_motor[i] * pendiente_p1[i] * 0.5) + \
                      (tiempo_giro_p1[i] / 60.0) + \
                      (clima_severidad[i] * pendiente_p1[i] * 0.8) + \
                      np.random.normal(0, 2) # Ruido humano
                      
            tiempo_2 = (dist_p2[i] * 2.0) + (cola_p2[i] * 2.5) + \
                      (desgaste_motor[i] * pendiente_p2[i] * 0.5) + \
                      (tiempo_giro_p2[i] / 60.0) + \
                      (clima_severidad[i] * pendiente_p2[i] * 0.8) + \
                      np.random.normal(0, 2)
                      
            if tiempo_1 <= tiempo_2:
                y_ruta.append("Pala 1")
                y_tiempo.append(round(tiempo_1, 1))
            else:
                y_ruta.append("Pala 2")
                y_tiempo.append(round(tiempo_2, 1))
                
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
        df_export["decision_optima"] = y_ruta
        df_export["eta_minutos"] = y_tiempo
        df_export.to_csv("data/historial_mina_avanzado.csv", index=False)
        
        # ENTRENAMIENTO DUAL
        X = df
        X_train, X_test, yr_train, yr_test, yt_train, yt_test = train_test_split(
            X, y_ruta, y_tiempo, test_size=0.2, random_state=42
        )
        
        print("\n🧠 Entrenando Modelo 1: Clasificador de Rutas...")
        self.modelo_ruta = RandomForestClassifier(n_estimators=100, max_depth=15, random_state=42)
        self.modelo_ruta.fit(X_train, yr_train)
        
        print("🧠 Entrenando Modelo 2: Regresor de Tiempos (ETA)...")
        self.modelo_tiempo = RandomForestRegressor(n_estimators=100, max_depth=15, random_state=42)
        self.modelo_tiempo.fit(X_train, yt_train)
        self.entrenado = True
        
        joblib.dump(self.modelo_ruta, MODEL_CLASSIFIER_PATH)
        joblib.dump(self.modelo_tiempo, MODEL_REGRESSOR_PATH)
        
        print(f"✅ ¡Entrenamiento exitoso!")
        print(f"🎯 Precisión Ruta (Test): {self.modelo_ruta.score(X_test, yr_test)*100:.2f}%")
        print(f"🎯 Precisión Tiempo ETA (R² Score): {self.modelo_tiempo.score(X_test, yt_test)*100:.2f}%\n")
        
    def predecir_ruta(self, datos_telemetria):
        """
        Recibe un diccionario con los datos en vivo.
        Devuelve tanto la ruta como el ETA.
        """
        df_vivo = pd.DataFrame([datos_telemetria])
        columnas = ["cola_p1", "cola_p2", "dist_p1", "dist_p2", "clima_severidad", 
                    "desgaste_motor", "pendiente_p1", "pendiente_p2", "tiempo_giro_p1", "tiempo_giro_p2"]
        df_vivo = df_vivo[columnas]
        
        # Predicción 1: Ruta
        pred_ruta = self.modelo_ruta.predict(df_vivo)[0]
        prob_ruta = max(self.modelo_ruta.predict_proba(df_vivo)[0]) * 100
        
        # Predicción 2: Tiempo ETA
        pred_tiempo = self.modelo_tiempo.predict(df_vivo)[0]
        
        return {
            "asignacion": pred_ruta,
            "confianza": round(prob_ruta, 1),
            "eta_minutos": round(pred_tiempo, 1)
        }

if __name__ == "__main__":
    print("=== PUKARIA DUAL ML ENGINE ===")
    ia = PukarIAPredictor()
    ia.entrenar_modelo_y_guardar()
    print("==============================")
