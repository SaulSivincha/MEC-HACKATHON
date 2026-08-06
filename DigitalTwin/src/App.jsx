import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'

const DURATION = 20
const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value))
const lerp = (a, b, t) => a + (b - a) * t

const stages = [
  { until: 4, label: 'OPERACIÓN EN TIEMPO REAL', detail: '6 camiones · 2 palas · flujo estable', tone: 'neutral' },
  { until: 8, label: 'CUELLO DE BOTELLA DETECTADO', detail: 'Pala 01 · cola de 3 camiones · +18 min', tone: 'alert' },
  { until: 12, label: 'ORBITA ANALIZA ESCENARIOS', detail: 'Comparando rutas y tiempos de ciclo', tone: 'analysis' },
  { until: 16, label: 'REASIGNACIÓN RECOMENDADA', detail: 'TRK-03 y TRK-06 → Pala 02', tone: 'success' },
  { until: 20, label: 'FLUJO OPTIMIZADO', detail: 'Menos espera. Más material movido.', tone: 'success' },
]

function stageFor(time) {
  return stages.find((stage) => time < stage.until) ?? stages.at(-1)
}

function Road({ points, active = false, alert = false }) {
  const geometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(points.map((p) => new THREE.Vector3(...p))), [points])
  const color = alert ? '#ee6c4d' : active ? '#41e0b6' : '#557180'
  return (
    <line geometry={geometry}>
      <lineBasicMaterial color={color} transparent opacity={active || alert ? 0.95 : 0.5} linewidth={2} />
    </line>
  )
}

function Truck({ id, path, offset, time, reassigned = false, waiting = false }) {
  const group = useRef()
  const curve = useMemo(() => new THREE.CatmullRomCurve3(path.map((p) => new THREE.Vector3(...p))), [path])
  const isOptimized = reassigned && time > 12
  useFrame(() => {
    if (!group.current) return
    const paused = waiting && time > 4 && time < 12
    const speed = isOptimized ? 0.105 : 0.072
    const progress = paused ? 0.16 + offset * 0.025 : (time * speed + offset) % 0.98
    const point = curve.getPointAt(progress)
    const direction = curve.getTangentAt(progress)
    group.current.position.copy(point)
    group.current.rotation.y = Math.atan2(direction.x, direction.z)
  })
  const color = isOptimized ? '#42e2b8' : waiting && time > 4 ? '#ffaf5c' : '#54b7f5'
  return (
    <group ref={group}>
      <mesh castShadow position={[0, 0.36, 0]}>
        <boxGeometry args={[0.65, 0.34, 1.1]} />
        <meshStandardMaterial color={color} metalness={0.35} roughness={0.38} emissive={color} emissiveIntensity={0.16} />
      </mesh>
      <mesh castShadow position={[0, 0.62, -0.12]}>
        <boxGeometry args={[0.58, 0.24, 0.48]} />
        <meshStandardMaterial color="#cfebff" metalness={0.65} roughness={0.18} />
      </mesh>
      <mesh position={[0, 0.18, 0.48]}>
        <boxGeometry args={[0.72, 0.14, 0.35]} />
        <meshStandardMaterial color="#172532" />
      </mesh>
      <sprite position={[0, 1.35, 0]} scale={[1.55, 0.42, 1]}>
        <spriteMaterial color={color} transparent opacity={0.88} />
      </sprite>
    </group>
  )
}

function Shovel({ position, alert, active }) {
  const arm = useRef()
  useFrame(({ clock }) => {
    if (arm.current) arm.current.rotation.z = -0.5 + Math.sin(clock.elapsedTime * 1.8) * 0.16
  })
  const color = alert ? '#ef6c4d' : active ? '#41e0b6' : '#70a8be'
  return (
    <group position={position}>
      <mesh castShadow position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.6, 0.78, 0.35, 8]} />
        <meshStandardMaterial color="#f2bd52" metalness={0.25} roughness={0.5} />
      </mesh>
      <mesh castShadow position={[0, 1.05, 0]}>
        <boxGeometry args={[0.9, 0.78, 0.72]} />
        <meshStandardMaterial color="#e5aa38" />
      </mesh>
      <group ref={arm} position={[0.38, 1.22, 0]}>
        <mesh castShadow position={[0.45, 0, 0]}>
          <boxGeometry args={[1.05, 0.16, 0.2]} />
          <meshStandardMaterial color="#d99524" />
        </mesh>
        <mesh castShadow position={[0.95, -0.18, 0]} rotation-z={-0.65}>
          <boxGeometry args={[0.55, 0.18, 0.36]} />
          <meshStandardMaterial color="#c77f16" />
        </mesh>
      </group>
      <mesh position={[0, 0.18, 0]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[1.05, 1.15, 48]} />
        <meshBasicMaterial color={color} transparent opacity={0.8} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

function Mine({ time }) {
  const reassignment = time > 12
  const alert = time > 4 && time < 12
  const roads = {
    left: [[-8, 0.35, 5], [-5, 0.4, 1], [-3.8, 0.7, -2.7], [-0.9, 0.75, -3.7]],
    right: [[7.5, 0.35, 5.4], [5.1, 0.4, 1.5], [3.8, 0.7, -2.2], [0.9, 0.75, -3.7]],
    center: [[-0.9, 0.75, -3.7], [0, 1.2, -0.7], [0.9, 0.75, -3.7]],
  }
  return (
    <group>
      <mesh receiveShadow position={[0, -0.35, 0]}>
        <cylinderGeometry args={[11, 12, 0.7, 6]} />
        <meshStandardMaterial color="#423327" roughness={0.96} />
      </mesh>
      <mesh receiveShadow position={[0, 0.02, 0]}>
        <cylinderGeometry args={[8.9, 9.8, 0.48, 6]} />
        <meshStandardMaterial color="#65452e" roughness={0.95} />
      </mesh>
      <mesh receiveShadow position={[0, 0.36, -0.1]}>
        <cylinderGeometry args={[6.7, 7.6, 0.42, 6]} />
        <meshStandardMaterial color="#89593a" roughness={0.94} />
      </mesh>
      <mesh receiveShadow position={[0, 0.72, -0.3]}>
        <cylinderGeometry args={[4.7, 5.6, 0.34, 6]} />
        <meshStandardMaterial color="#ad7145" roughness={0.9} />
      </mesh>

      <Road points={roads.left} alert={alert} />
      <Road points={roads.right} active={reassignment} />
      <Road points={roads.center} active={reassignment} />

      <Shovel position={[-1.35, 1.12, -3.85]} alert={alert} />
      <Shovel position={[1.35, 1.12, -3.85]} active={reassignment} />
      <Truck id="TRK-01" path={roads.left} offset={0.02} time={time} waiting />
      <Truck id="TRK-02" path={roads.left} offset={0.2} time={time} waiting />
      <Truck id="TRK-03" path={roads.left} offset={0.38} time={time} waiting reassigned />
      <Truck id="TRK-04" path={roads.right} offset={0.1} time={time} />
      <Truck id="TRK-05" path={roads.right} offset={0.34} time={time} />
      <Truck id="TRK-06" path={roads.right} offset={0.55} time={time} reassigned />
      {time > 8 && time < 14 && <mesh position={[0, 3.2, -1.3]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[0.7, 0.76, 64]} />
        <meshBasicMaterial color="#6ec8ff" transparent opacity={0.9} side={THREE.DoubleSide} />
      </mesh>}
    </group>
  )
}

function CameraRig({ time }) {
  const { camera } = useThree()
  const target = useMemo(() => new THREE.Vector3(), [])
  useFrame(() => {
    const focus = time < 4 ? [0, 1.1, 0] : time < 8 ? [-1.4, 1.1, -3.8] : time < 16 ? [0, 1.15, -2.4] : [0, 1.1, -0.4]
    const position = time < 4 ? [12, 12, 14] : time < 8 ? [7.8, 6.4, 8.2] : time < 16 ? [10, 8, 10.5] : [12, 10, 13]
    target.set(...focus)
    camera.position.lerp(new THREE.Vector3(...position), 0.025)
    camera.lookAt(target)
  })
  return null
}

function Scene({ time }) {
  return <Canvas shadows dpr={[1, 1.5]} camera={{ position: [12, 12, 14], fov: 42 }}>
    <color attach="background" args={['#07111a']} />
    <fog attach="fog" args={['#07111a', 15, 35]} />
    <ambientLight intensity={1.4} color="#b7d9ec" />
    <directionalLight castShadow position={[7, 13, 8]} intensity={2.6} color="#ffe1b5" shadow-mapSize={[1024, 1024]} />
    <pointLight position={[-4, 5, -4]} intensity={20} distance={10} color={time > 4 && time < 12 ? '#ee6c4d' : '#41e0b6'} />
    <Mine time={time} />
    <CameraRig time={time} />
  </Canvas>
}

export default function App() {
  const [time, setTime] = useState(0)
  const [playing, setPlaying] = useState(true)

  useEffect(() => {
    if (!playing) return undefined
    let frame
    let last = performance.now()
    const animate = (now) => {
      const delta = (now - last) / 1000
      last = now
      setTime((current) => {
        const next = current + delta
        if (next >= DURATION) {
          setPlaying(false)
          return DURATION
        }
        return next
      })
      frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [playing])

  const stage = stageFor(time)
  const optimized = time >= 16
  const restart = () => {
    setTime(0)
    setPlaying(true)
  }

  return <main className="app-shell">
    <Scene time={time} />
    <div className="vignette" />
    <header className="topbar">
      <div className="brand"><span className="brand-mark">◈</span><span>ORBITA</span><small>DIGITAL TWIN</small></div>
      <div className="live-pill"><i /> SIMULACIÓN {playing ? 'EN CURSO' : 'FINALIZADA'}</div>
    </header>
    <section className="story" aria-live="polite">
      <p className={`stage ${stage.tone}`}>ETAPA {String(stages.indexOf(stage) + 1).padStart(2, '0')}</p>
      <h1>{stage.label}</h1>
      <p className="detail">{stage.detail}</p>
    </section>
    <aside className="kpis">
      <div className="kpi"><span>TIEMPO DE ESPERA</span><strong className={optimized ? 'good' : ''}>{optimized ? '−28%' : '+18 min'}</strong></div>
      <div className="kpi"><span>TONELADAS / HORA</span><strong className={optimized ? 'good' : ''}>{optimized ? '+15%' : '1,240'}</strong></div>
      <div className="kpi"><span>ASIGNACIÓN</span><strong className={optimized ? 'good' : ''}>{optimized ? 'ÓPTIMA' : 'ANALIZANDO'}</strong></div>
    </aside>
    <footer className="controls">
      <button onClick={() => (playing ? setPlaying(false) : time >= DURATION ? restart() : setPlaying(true))}>
        {playing ? 'Pausar' : time >= DURATION ? 'Reproducir simulación' : 'Continuar'}
      </button>
      <div className="timeline"><div className="timeline-fill" style={{ width: `${(time / DURATION) * 100}%` }} /></div>
      <span>{Math.floor(time).toString().padStart(2, '0')} / 20 s</span>
    </footer>
  </main>
}
