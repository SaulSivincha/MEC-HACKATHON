import nbformat as nbf

nb = nbf.v4.new_notebook()

# Markdown Introducción
text_1 = """# 🧠 Entrenamiento del Cerebro: PukarIA
En este notebook, presentaremos el proceso completo de entrenamiento del **Modelo de Machine Learning (Random Forest)** que da vida a **PukarIA**, nuestro agente de despacho minero autónomo.

A diferencia de heurísticas básicas basadas solo en distancia, PukarIA utiliza **Telemetría Minera Hiperrealista**."""

# Código de Carga
code_1 = """import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix
import joblib
import warnings
warnings.filterwarnings('ignore')

# Configuración visual
plt.style.use('dark_background')
sns.set_palette('viridis')"""

text_2 = """## 1. Generación de Telemetría Hiperrealista (Dataset)
Generamos 10,000 registros históricos de operaciones con las siguientes variables:
- `tiempo_giro`: Segundos de maniobra en la pala.
- `clima_severidad`: (0.0 a 1.0) Impacto de la lluvia/barro.
- `desgaste_motor`: (0.0 a 1.0) Estado mecánico del camión.
- `pendiente`: Grados de inclinación de la ruta.
- `cola`: Camiones en espera."""

code_2 = """# Cargar el dataset generado por el sistema central
# (Si no existe, corre primero: python src/core/ml_model.py)
df = pd.read_csv('../src/core/data/historial_mina_avanzado.csv')
df.head()"""

text_3 = """## 2. Entrenamiento del Modelo (Machine Learning)
Dividimos los datos (80% Entrenamiento, 20% Pruebas) y entrenamos un **RandomForestClassifier** con 100 árboles de decisión."""

code_3 = """X = df.drop(columns=['decision_optima'])
y = df['decision_optima']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

modelo = RandomForestClassifier(n_estimators=100, max_depth=15, random_state=42)
modelo.fit(X_train, y_train)

precision = modelo.score(X_test, y_test)
print(f"🎯 Precisión del Modelo (Accuracy) en Datos de Prueba: {precision*100:.2f}%")"""

text_4 = """## 3. ¿Qué aprendió la IA? (Importancia de Variables)
Aquí es donde PukarIA demuestra su inteligencia. Veamos qué variables considera más importantes al tomar una decisión de ruteo."""

code_4 = """importancias = modelo.feature_importances_
variables = X.columns

indices = np.argsort(importancias)[::-1]

plt.figure(figsize=(10, 6))
plt.title("🧠 ¿Qué variables analiza PukarIA para decidir? (Feature Importance)", fontsize=14)
sns.barplot(x=importancias[indices], y=variables[indices], palette="magma")
plt.xlabel("Peso de Importancia (%)")
plt.ylabel("Telemetría del Camión")
plt.tight_layout()
plt.show()"""

text_5 = """## 4. Matriz de Confusión
Validamos que el modelo no esté sesgado hacia una sola ruta."""

code_5 = """y_pred = modelo.predict(X_test)
cm = confusion_matrix(y_test, y_pred)

plt.figure(figsize=(6,5))
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
            xticklabels=['Pala 1', 'Pala 2'], 
            yticklabels=['Pala 1', 'Pala 2'])
plt.title('Matriz de Confusión: Decisiones de PukarIA')
plt.xlabel('Predicción de la IA')
plt.ylabel('Decisión Óptima Matemática')
plt.show()"""

nb['cells'] = [
    nbf.v4.new_markdown_cell(text_1),
    nbf.v4.new_code_cell(code_1),
    nbf.v4.new_markdown_cell(text_2),
    nbf.v4.new_code_cell(code_2),
    nbf.v4.new_markdown_cell(text_3),
    nbf.v4.new_code_cell(code_3),
    nbf.v4.new_markdown_cell(text_4),
    nbf.v4.new_code_cell(code_4),
    nbf.v4.new_markdown_cell(text_5),
    nbf.v4.new_code_cell(code_5)
]

nbf.write(nb, '/home/choflis/Documentos/PERUMEC/MEC-HACKATHON/notebooks/Entrenamiento_PukarIA.ipynb')
print("Notebook generado exitosamente.")
