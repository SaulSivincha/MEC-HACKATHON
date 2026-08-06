import numpy as np

def generate_open_pit_map(size=50, depth=20):
    """
    Genera una topografía sintética de un tajo abierto (cono invertido).
    
    Args:
        size (int): El tamaño de la matriz (N x N).
        depth (int): La profundidad máxima del tajo.
        
    Returns:
        np.ndarray: Matriz 2D representando la elevación (Z) en cada punto (X, Y).
    """
    x = np.linspace(-size/2, size/2, size)
    y = np.linspace(-size/2, size/2, size)
    X, Y = np.meshgrid(x, y)
    
    # Ecuación matemática para un "Tajo Abierto": Un paraboloide o cono invertido
    # Z = sqrt(X^2 + Y^2) escalado por la profundidad
    distance_from_center = np.sqrt(X**2 + Y**2)
    max_distance = np.max(distance_from_center)
    
    # Normalizamos y escalamos para que el centro sea la parte más profunda
    Z = (distance_from_center / max_distance) * depth
    
    # Añadimos "terrazas" (bermas) para que parezca una mina real escalonada
    # Usamos np.floor para crear los escalones
    Z = np.floor(Z)
    
    # Invertimos para que el nivel del suelo sea 0 y el fondo sea negativo
    Z = Z - depth
    
    return Z

if __name__ == "__main__":
    # Test rápido del generador
    terrain = generate_open_pit_map(size=20, depth=5)
    print("Muestra del terreno 3D (Tajo Abierto):")
    print(terrain)
