import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import confusion_matrix
import joblib
import warnings
warnings.filterwarnings('ignore')

print("=== PUKARIA ML VISUAL TRAINING ===")
print("Cargando dataset hiperrealista...")

# Cargar datos
df = pd.read_csv('data/historial_mina_avanzado.csv')

X = df.drop(columns=['decision_optima'])
y = df['decision_optima']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

print("Entrenando RandomForestClassifier (100 árboles)...")
modelo = RandomForestClassifier(n_estimators=100, max_depth=15, random_state=42)
modelo.fit(X_train, y_train)

print(f"Precisión en Test: {modelo.score(X_test, y_test)*100:.2f}%")

# GRÁFICA 1: Feature Importance
print("Generando Gráfica de Importancia de Variables... (Cierra la ventana de la gráfica para continuar)")
plt.style.use('dark_background')
importancias = modelo.feature_importances_
variables = X.columns
indices = np.argsort(importancias)[::-1]

plt.figure(figsize=(10, 6))
plt.title("¿Qué variables analiza PukarIA para decidir? (Feature Importance)", fontsize=14)
sns.barplot(x=importancias[indices], y=variables[indices], palette="magma")
plt.xlabel("Peso de Importancia (%)")
plt.ylabel("Telemetría del Camión")
plt.tight_layout()
plt.show() # ESTO ABRIRÁ UNA VENTANA

# GRÁFICA 2: Matriz de Confusión
print("Generando Matriz de Confusión... (Cierra la ventana para terminar)")
y_pred = modelo.predict(X_test)
cm = confusion_matrix(y_test, y_pred)

plt.figure(figsize=(6,5))
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
            xticklabels=['Pala 1', 'Pala 2'], 
            yticklabels=['Pala 1', 'Pala 2'])
plt.title('Matriz de Confusión: Decisiones de PukarIA')
plt.xlabel('Predicción de la IA')
plt.ylabel('Decisión Óptima Matemática')
plt.tight_layout()
plt.show() # ESTO ABRIRÁ OTRA VENTANA

print("¡Entrenamiento Visual Completado!")
