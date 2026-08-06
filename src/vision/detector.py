from ultralytics import YOLO
import numpy as np
import cv2
from PIL import Image

class ColaDetector:
    def __init__(self):
        # YOLOv8 nano pre-entrenado
        self.model = YOLO('yolov8n.pt')
        
    def contar_camiones(self, image_file):
        """
        Detecta Pala y Camiones. 
        Truco de Hackathon: Como COCO no tiene 'Pala Minera', asumimos que 
        el vehículo detectado con el área más grande es la pala, y los demás son camiones en cola.
        """
        img = Image.open(image_file).convert('RGB')
        img_array = np.array(img)
        
        resultados = self.model(img_array)
        
        vehiculos = []
        for r in resultados:
            for box in r.boxes:
                clase = int(box.cls[0])
                # COCO: 2=car, 3=motorcycle, 5=bus, 6=train, 7=truck. 
                # (A veces las excavadoras gigantes las clasifica como tren o truck).
                if clase in [2, 5, 6, 7]: 
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                    area = (x2 - x1) * (y2 - y1)
                    vehiculos.append({
                        'coords': (int(x1), int(y1), int(x2), int(y2)), 
                        'area': area
                    })
                    
        camiones_count = 0
        
        if len(vehiculos) > 0:
            # Ordenamos por tamaño (el más grande primero)
            vehiculos = sorted(vehiculos, key=lambda x: x['area'], reverse=True)
            
            # El más grande es la PALA
            pala = vehiculos[0]
            # El resto son CAMIONES
            camiones = vehiculos[1:]
            camiones_count = len(camiones)
            
            # Dibujamos nuestras propias cajas con CV2 para que se vea hiper-pro
            # 1. Dibujar PALA (Rojo)
            px1, py1, px2, py2 = pala['coords']
            cv2.rectangle(img_array, (px1, py1), (px2, py2), (255, 50, 50), 4) # Red
            cv2.putText(img_array, "PALA MINERA", (px1, max(py1-10, 0)), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.9, (255, 50, 50), 3)
            
            # 2. Dibujar CAMIONES (Verde brillante)
            for c in camiones:
                cx1, cy1, cx2, cy2 = c['coords']
                cv2.rectangle(img_array, (cx1, cy1), (cx2, cy2), (0, 255, 0), 2)
                cv2.putText(img_array, "CAMION (En Cola)", (cx1, max(cy1-10, 0)), 
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
                            
        return camiones_count, img_array
