from ultralytics import YOLO
import numpy as np
import cv2
from PIL import Image

class ColaDetector:
    def __init__(self):
        self.model = YOLO('yolov8n.pt')
        
    def extraer_coordenadas(self, image_file):
        """
        Escanea la imagen y devuelve las coordenadas espaciales (x,y) de cada vehículo encontrado
        para poder construir un mapa digital 2D desde cero.
        """
        img = Image.open(image_file).convert('RGB')
        img_array = np.array(img)
        # Altura y anchura de la imagen (para mapear al plano cartesiano)
        height, width, _ = img_array.shape 
        
        resultados = self.model(img_array)
        
        vehiculos = []
        for r in resultados:
            for box in r.boxes:
                clase = int(box.cls[0])
                # COCO: 2=car, 5=bus, 6=train, 7=truck
                if clase in [2, 5, 6, 7]: 
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                    area = (x2 - x1) * (y2 - y1)
                    
                    # Calcular el centroide geométrico del vehículo
                    cx = (x1 + x2) / 2
                    cy = (y1 + y2) / 2
                    
                    # Invertimos el eje Y porque en las fotos el pixel (0,0) está arriba, 
                    # pero en los gráficos matemáticos (0,0) está abajo.
                    y_cartesiano = height - cy
                    
                    vehiculos.append({
                        'pixel_x': cx,
                        'pixel_y': y_cartesiano,
                        'area': area,
                        'coords': (int(x1), int(y1), int(x2), int(y2))
                    })
                    
        pala = None
        camiones = []
        
        if len(vehiculos) > 0:
            # Asumimos que el objeto más grande es la PALA
            vehiculos = sorted(vehiculos, key=lambda x: x['area'], reverse=True)
            pala = vehiculos[0]
            camiones = vehiculos[1:]
            
            # Dibujamos en la imagen original para el "preview" del escáner
            px1, py1, px2, py2 = pala['coords']
            cv2.rectangle(img_array, (px1, py1), (px2, py2), (255, 50, 50), 3)
            cv2.putText(img_array, "PALA", (px1, max(py1-10, 0)), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 50, 50), 2)
            
            for c in camiones:
                cx1, cy1, cx2, cy2 = c['coords']
                cv2.rectangle(img_array, (cx1, cy1), (cx2, cy2), (0, 255, 0), 2)
                
        return {
            'pala': pala,
            'camiones': camiones,
            'img_preview': img_array,
            'map_size': (width, height)
        }
