from ultralytics import YOLO
import numpy as np
from PIL import Image

class ColaDetector:
    def __init__(self):
        # YOLOv8 nano: El modelo más rápido y ligero
        # Se descargará automáticamente la primera vez que se corra
        self.model = YOLO('yolov8n.pt')
        
    def contar_camiones(self, image_file):
        """
        Procesa una imagen y cuenta cuántos vehículos/camiones hay.
        """
        # Convertir la imagen de Streamlit a numpy array
        img = Image.open(image_file)
        # Convertimos a RGB por si la imagen tiene canal alpha (PNG)
        img = img.convert('RGB')
        img_array = np.array(img)
        
        # Correr inferencia con YOLO
        resultados = self.model(img_array)
        
        cantidad = 0
        # YOLO devuelve una lista de resultados, iteramos sobre las cajas (boxes)
        for r in resultados:
            for box in r.boxes:
                clase = int(box.cls[0])
                # En el dataset COCO: 2 = car (auto/camioneta), 7 = truck (camión)
                # Para la demo, cualquier vehículo cuenta como congestión
                if clase in [2, 5, 7]: 
                    cantidad += 1
                    
        # YOLO tiene un método genial para pintar las cajitas automáticamente
        img_con_cajas = resultados[0].plot()
        
        return cantidad, img_con_cajas
