# 🚜 SmartDispatch A* + AI 
**Sistema de Enrutamiento Inteligente para Minería a Tajo Abierto - PERUMEC-athon**

![MEC-HACKATHON](https://img.shields.io/badge/PERUMEC-Hackathon-orange.svg)
![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)
![Streamlit](https://img.shields.io/badge/Streamlit-Dashboard-red.svg)
![YOLOv8](https://img.shields.io/badge/AI-YOLOv8-yellow.svg)

## 📌 El Problema: Cuellos de Botella en la Mina
En la minería a tajo abierto, el sistema de Dispatch tradicional asigna camiones a la pala más cercana (distancia plana). Esto genera un problema crítico: **Cuellos de Botella**. Múltiples camiones se dirigen a la misma pala, formando colas interminables, desperdiciando combustible y tiempo, mientras otras palas pueden estar vacías.

## 💡 Nuestra Solución: Vision-Based Dynamic Dispatch
Optimizamos la asignación de palas y camiones para evitar el cuello de botella utilizando Visión Computacional.

### ¿Cómo funciona la optimización?

```mermaid
graph TD
    A[Camión Vacío solicita destino] --> B{Motor de Optimización SmartDispatch}
    
    subgraph 1. Inteligencia Artificial (Los Ojos)
    C[Cámara en Pala 1] -->|YOLOv8 cuenta: 4 Camiones| D[Detecta Congestión]
    E[Cámara en Pala 2] -->|YOLOv8 cuenta: 0 Camiones| F[Detecta Pala Libre]
    end
    
    D -.->|Envía Dato: Alta Espera| B
    F -.->|Envía Dato: Cero Espera| B
    
    subgraph 2. Dashboard y Asignación (El Cerebro)
    B -->|Calcula: Costo Distancia + Costo de Cola| G[Asigna Ruta Óptima]
    end
    
    G -->|Se visualiza en el Dashboard| H((✅ Cero Colas))
    
    classDef ai fill:#f9f,stroke:#333,stroke-width:2px;
    classDef motor fill:#bbf,stroke:#333,stroke-width:2px;
    class C,D,E,F ai;
    class B,G motor;
```

1. **Visión Computacional:** Integramos **YOLOv8** simulando cámaras en las palas. La IA cuenta en tiempo real los camiones haciendo cola.
2. **Motor de Optimización:** El algoritmo toma el dato de la IA y suma: `Costo del Viaje Físico + Penalidad por Tiempo en Cola`. 
3. **Dashboard Interactivo:** Si la Pala 1 está cerca pero saturada, el Dashboard calcula que es más barato ir a la Pala 2 y **visualiza en tiempo real** cómo re-asigna el camión hacia la ruta libre. 

---

## 🚀 Cómo ejecutar el Dashboard

Sigue estos pasos para levantar la plataforma en tu máquina local.

### 1. Instalar dependencias
Abre tu terminal en esta carpeta e instala las librerías necesarias con:
```bash
pip install -r requirements.txt
```

### 2. Correr la aplicación
Levanta el dashboard interactivo ejecutando este comando en tu terminal:
```bash
streamlit run app.py
```
Esto abrirá automáticamente una pestaña en tu navegador web donde podrás ver la simulación de optimización en vivo.

---

## 🛠 Arquitectura del Proyecto
El proyecto está diseñado con una estructura profesional y escalable:

```text
MEC-HACKATHON/
├── app.py                  # Entry point del Dashboard web (Streamlit)
├── requirements.txt        # Dependencias del proyecto
├── data/
│   ├── images/             # Imágenes de prueba para la demo de IA
│   └── raw/                # Datos o logs crudos (si es necesario)
├── models/                 # Aquí se descargarán los pesos de YOLOv8 (yolov8n.pt)
├── notebooks/              # Jupyter notebooks para experimentación
└── src/                    # Código fuente principal
    ├── core/               # Motor de Optimización y Lógica Matemática
    ├── vision/             # Módulo de Inteligencia Artificial (YOLOv8)
    └── ui/                 # Componentes y gráficos para Streamlit
```

---

## 🔮 Trabajo Futuro
* **Gemelos Digitales (Digital Twins):** Integrar este motor de despacho con un software de Gemelo Digital hiperrealista usando los archivos topográficos DEM de la mina para tener un control 1:1 de toda la operación física.
