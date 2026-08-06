import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import confusion_matrix
import joblib
import warnings
import os
import sys

warnings.filterwarnings('ignore')

print("=== PUKARIA DUAL ML VISUAL TRAINING ===")
print("Cargando dataset hiperrealista (Ruta + ETA)...")

# Asegurar importación si falta el archivo
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))
from src.core.ml_model import PukarIAPredictor

if not os.path.exists('data/historial_mina_avanzado.csv'):
    print("El dataset no existe. Generando telemetría hiperrealista ahora mismo...")
    ia = PukarIAPredictor()
    ia.entrenar_modelo_y_guardar()

# Cargar datos
df = pd.read_csv('data/historial_mina_avanzado.csv')

# Features
X = df.drop(columns=['decision_optima', 'eta_minutos'])
# Targets
y_ruta = df['decision_optima']
y_tiempo = df['eta_minutos']

X_train, X_test, yr_train, yr_test, yt_train, yt_test = train_test_split(
    X, y_ruta, y_tiempo, test_size=0.2, random_state=42
)

print("\nEntrenando Modelo 1: Clasificador de Rutas...")
modelo_ruta = RandomForestClassifier(n_estimators=100, max_depth=15, random_state=42)
modelo_ruta.fit(X_train, yr_train)
print(f"Precisión Ruta: {modelo_ruta.score(X_test, yr_test)*100:.2f}%")

print("\nEntrenando Modelo 2: Regresor de Tiempo (ETA)...")
modelo_tiempo = RandomForestRegressor(n_estimators=100, max_depth=15, random_state=42)
modelo_tiempo.fit(X_train, yt_train)
print(f"Precisión Tiempo (R²): {modelo_tiempo.score(X_test, yt_test)*100:.2f}%")

plt.style.use('dark_background')

# GRÁFICA 1: Feature Importance (Ruta)
print("\n[1/3] Generando Gráfica de Importancia (Cierra la ventana para continuar)...")
importancias = modelo_ruta.feature_importances_
variables = X.columns
indices = np.argsort(importancias)[::-1]

plt.figure(figsize=(10, 6))
plt.title("¿Qué analiza PukarIA para elegir la Ruta? (Clasificador)", fontsize=14)
sns.barplot(x=importancias[indices], y=variables[indices], palette="magma")
plt.xlabel("Peso de Importancia (%)")
plt.tight_layout()
plt.show()

# GRÁFICA 2: Matriz de Confusión (Ruta)
print("[2/3] Generando Matriz de Confusión (Cierra la ventana para continuar)...")
yr_pred = modelo_ruta.predict(X_test)
cm = confusion_matrix(yr_test, yr_pred)

plt.figure(figsize=(6,5))
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
            xticklabels=['Pala 1', 'Pala 2'], 
            yticklabels=['Pala 1', 'Pala 2'])
plt.title('Matriz de Confusión: Asignación de Rutas')
plt.xlabel('Predicción de la IA')
plt.ylabel('Decisión Óptima Matemática')
plt.tight_layout()
plt.show()

# GRÁFICA 3: Dispersión de Predicción de Tiempo (Regresor)
print("[3/3] Generando Gráfica de Precisión de Tiempo ETA (Cierra la ventana para terminar)...")
yt_pred = modelo_tiempo.predict(X_test)

plt.figure(figsize=(8, 6))
plt.scatter(yt_test, yt_pred, alpha=0.5, color='cyan')
plt.plot([yt_test.min(), yt_test.max()], [yt_test.min(), yt_test.max()], 'r--', lw=2)
plt.title('Precisión del Modelo de Tiempo (ETA Real vs IA)', fontsize=14)
plt.xlabel('Tiempo Óptimo Matemático (Minutos)')
plt.ylabel('Tiempo Predecido por PukarIA (Minutos)')
plt.grid(True, alpha=0.3)
plt.tight_layout()
plt.show()

print("¡Entrenamiento Visual Dual Completado!")
