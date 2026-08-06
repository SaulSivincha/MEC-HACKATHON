import numpy as np

class SmartDispatcher:
    def __init__(self, map_3d):
        self.map_3d = map_3d
        
        # Posiciones estáticas en el grid para el origen (chancadora) y destinos (palas)
        # Asumiendo un grid default de 50x50
        self.chancadora_pos = (5, 25) 
        self.palas = {
            "Pala 1": {"pos": (45, 10), "distancia": 0},
            "Pala 2": {"pos": (40, 40), "distancia": 0}
        }
        
        self._calcular_distancias_base()
        
    def _calcular_distancias_base(self):
        """Calcula la distancia física base (simulando el trayecto del A*)."""
        cx, cy = self.chancadora_pos
        for nombre, datos in self.palas.items():
            px, py = datos["pos"]
            # Distancia euclidiana simulando el costo de ruta
            dist = np.sqrt((px - cx)**2 + (py - cy)**2)
            self.palas[nombre]["distancia"] = dist

    def asignar_mejor_ruta(self, camiones_pala1, camiones_pala2, penalidad_por_camion=15.0):
        """
        El núcleo de la optimización: 
        Costo = Distancia Física + (Camiones en Cola * Penalidad)
        """
        costo_p1 = self.palas["Pala 1"]["distancia"] + (camiones_pala1 * penalidad_por_camion)
        costo_p2 = self.palas["Pala 2"]["distancia"] + (camiones_pala2 * penalidad_por_camion)
        
        # Asignamos al que tenga el MENOR costo total
        mejor_pala = "Pala 1" if costo_p1 <= costo_p2 else "Pala 2"
        
        # Retornamos los datos para poder mostrarlos en el Dashboard
        return {
            "asignacion": mejor_pala,
            "costos": {
                "Pala 1": round(costo_p1, 2),
                "Pala 2": round(costo_p2, 2)
            },
            "ruta_inicio": self.chancadora_pos,
            "ruta_fin": self.palas[mejor_pala]["pos"]
        }
