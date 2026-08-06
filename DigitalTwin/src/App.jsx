import React, { useEffect, useMemo, useRef, useState } from 'react'
import persistedRoutes from './data/routes.json'

const PLATE = { width: 1672, height: 941 }
const STORAGE_KEY = 'orbita-route-calibration-v1'

const routeDefinitions = [
  { id: 'access', code: 'R-00', name: 'Acceso principal', from: 'entry', to: 'junction', direction: 'Entrada → Intersección J-01', color: '#83dfff' },
  { id: 'shovel01', code: 'R-01', name: 'Pala 01', from: 'junction', to: 'shovel01', direction: 'Intersección J-01 → Pala 01', color: '#ffad63' },
  { id: 'shovel02', code: 'R-02', name: 'Pala 02', from: 'junction', to: 'shovel02', direction: 'Intersección J-01 → Pala 02', color: '#51e6bf' },
  { id: 'crusher', code: 'R-03', name: 'Descarga', from: 'junction', to: 'crusher', direction: 'Intersección J-01 → Chancadora', color: '#d5c1ff' },
]

const mapNodes = {
  entry: { x: 1416, y: 878, code: 'N-00', label: 'ENTRADA / PATIO', side: 'left' },
  junction: { x: 994, y: 548, code: 'J-01', label: 'INTERSECCIÓN', side: 'right' },
  shovel01: { x: 922, y: 215, code: 'P-01', label: 'PALA 01', side: 'left' },
  shovel02: { x: 1200, y: 239, code: 'P-02', label: 'PALA 02', side: 'right' },
  crusher: { x: 868, y: 761, code: 'D-01', label: 'CHANCADORA', side: 'right' },
}

function loadRoutes() {
  try {
    const local = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (local && typeof local === 'object') return local
  } catch {
    // Si el navegador no tiene datos válidos, usamos el archivo del proyecto.
  }
  return persistedRoutes
}

const polylinePath = (points = []) => points.length
  ? `M ${points.map(([x, y]) => `${x} ${y}`).join(' L ')}`
  : ''

// Filtra el temblor fino del lápiz sin alterar los puntos guardados.
const lightlySmooth = (points = []) => points.map((point, index) => {
  if (index < 2 || index > points.length - 3) return point
  const weights = [.08, .17, .5, .17, .08]
  const window = points.slice(index - 2, index + 3)
  return [0, 1].map((axis) => window.reduce((sum, sample, sampleIndex) => sum + sample[axis] * weights[sampleIndex], 0))
})

// Reduce puntos redundantes y crea una spline suave que atraviesa el trazado.
// La tensión baja evita cortar las curvas reales de la carretera.
const smoothRoutePath = (points = []) => {
  if (points.length < 3) return polylinePath(points)
  const filtered = lightlySmooth(points).filter((_, index) => index === 0 || index === points.length - 1 || index % 3 === 0)
  const tension = .11
  return filtered.slice(0, -1).reduce((path, point, index) => {
    const p0 = filtered[Math.max(0, index - 1)]
    const p1 = point
    const p2 = filtered[index + 1]
    const p3 = filtered[Math.min(filtered.length - 1, index + 2)]
    const cp1 = [p1[0] + (p2[0] - p0[0]) * tension, p1[1] + (p2[1] - p0[1]) * tension]
    const cp2 = [p2[0] - (p3[0] - p1[0]) * tension, p2[1] - (p3[1] - p1[1]) * tension]
    return `${path} C ${cp1[0]} ${cp1[1]} ${cp2[0]} ${cp2[1]} ${p2[0]} ${p2[1]}`
  }, `M ${filtered[0][0]} ${filtered[0][1]}`)
}

const roundedPoints = (points) => points.map(([x, y]) => [Math.round(x * 10) / 10, Math.round(y * 10) / 10])

function DrawingRoute({ points, color, draft = false, id, terminals = true }) {
  if (!points?.length) return null
  const path = draft ? polylinePath(points) : smoothRoutePath(points)
  return <g style={{ '--route-color': color }}>
    <path id={id ? `motion-${id}` : undefined} className={`drawn-corridor ${draft ? 'is-draft' : ''}`} d={path} />
    <path className={`drawn-center ${draft ? 'is-draft' : ''}`} d={path} />
    {terminals && <>
      <circle className="route-terminal" cx={points[0][0]} cy={points[0][1]} r="8" />
      <circle className="route-terminal" cx={points.at(-1)[0]} cy={points.at(-1)[1]} r="8" />
    </>}
  </g>
}

const simulationStages = [
  { title: 'OPERACIÓN NORMAL', detail: 'Flujo continuo entre palas y chancadora', tone: 'normal', wait: '6.2 min', production: '1,240 t/h' },
  { title: 'CONGESTIÓN DETECTADA', detail: 'Cola creciente en Pala 01', tone: 'alert', wait: '+18 min', production: '980 t/h' },
  { title: 'ANÁLISIS PREDICTIVO', detail: 'Comparando 12 escenarios de despacho', tone: 'analysis', wait: 'Calculando', production: '12 escenarios' },
  { title: 'REDIRECCIÓN ACTIVA', detail: 'TRK-04 y TRK-06 enviados a Pala 02', tone: 'redirect', wait: '−21%', production: '+11%' },
  { title: 'FLUJO OPTIMIZADO', detail: 'Capacidad recuperada sin detener producción', tone: 'success', wait: '−28%', production: '+15%' },
]
const SIMULATION_DURATION = 23
const STAGE_DURATION = 5
const INSPECTION_TIMING = { cursor: 12.05, click: 12.75, modal: 12.95, closeStart: 22.4, close: 22.95 }
const REFERENCE_TRUCK = { model: 'CAT 793', payload: 240, maxLoadedSpeed: 60, grossPower: 1976 }

const clamp01 = (value) => Math.max(0, Math.min(1, value))
const between = (time, start, end, from, to) => from + (to - from) * clamp01((time - start) / (end - start))

const cubicPoint = (p1, c1, c2, p2, t) => {
  const inverse = 1 - t
  return [
    inverse ** 3 * p1[0] + 3 * inverse ** 2 * t * c1[0] + 3 * inverse * t ** 2 * c2[0] + t ** 3 * p2[0],
    inverse ** 3 * p1[1] + 3 * inverse ** 2 * t * c1[1] + 3 * inverse * t ** 2 * c2[1] + t ** 3 * p2[1],
  ]
}

const routeSample = (points, progress, direction = 1, lane = 0) => {
  const filtered = lightlySmooth(points).filter((_, index) => index === 0 || index === points.length - 1 || index % 3 === 0)
  const tension = .11
  const samples = []
  filtered.slice(0, -1).forEach((p1, index) => {
    const p0 = filtered[Math.max(0, index - 1)]
    const p2 = filtered[index + 1]
    const p3 = filtered[Math.min(filtered.length - 1, index + 2)]
    const c1 = [p1[0] + (p2[0] - p0[0]) * tension, p1[1] + (p2[1] - p0[1]) * tension]
    const c2 = [p2[0] - (p3[0] - p1[0]) * tension, p2[1] - (p3[1] - p1[1]) * tension]
    for (let step = index === 0 ? 0 : 1; step <= 8; step += 1) samples.push(cubicPoint(p1, c1, c2, p2, step / 8))
  })
  const cumulative = [0]
  for (let index = 1; index < samples.length; index += 1) {
    cumulative.push(cumulative[index - 1] + Math.hypot(samples[index][0] - samples[index - 1][0], samples[index][1] - samples[index - 1][1]))
  }
  const target = clamp01(progress) * cumulative.at(-1)
  let index = cumulative.findIndex((distance) => distance >= target)
  if (index <= 0) index = 1
  const segmentLength = cumulative[index] - cumulative[index - 1] || 1
  const t = (target - cumulative[index - 1]) / segmentLength
  const previous = samples[index - 1]
  const next = samples[index]
  const x = previous[0] + (next[0] - previous[0]) * t
  const y = previous[1] + (next[1] - previous[1]) * t
  const dx = next[0] - previous[0]
  const dy = next[1] - previous[1]
  const length = Math.hypot(dx, dy) || 1
  const laneX = (-dy / length) * lane
  const laneY = (dx / length) * lane
  return { x: x + laneX, y: y + laneY, angle: Math.atan2(dy * direction, dx * direction) * 180 / Math.PI }
}

function truckState(id, time) {
  if (id === 'TRK-01') {
    if (time < 5) return { route: 'shovel01', progress: between(time, 0, 5, .35, .72), direction: 1, state: 'vacío' }
    if (time < 10) return { route: 'shovel01', progress: .72, direction: 1, state: 'cola' }
    if (time < 12) return { route: 'shovel01', progress: between(time, 10, 12, .72, .98), direction: 1, state: 'vacío' }
    if (time < 16) return { route: 'shovel01', progress: .98, direction: 1, state: 'cargando' }
    if (time < 22) return { route: 'shovel01', progress: between(time, 16, 22, .98, .03), direction: -1, state: 'cargado' }
    return { route: 'crusher', progress: between(time, 22, 25, .03, .17), direction: 1, state: 'cargado' }
  }
  if (id === 'TRK-02') {
    if (time < 1.5) return { route: 'shovel01', progress: between(time, 0, 1.5, .7, .98), direction: 1, state: 'vacío' }
    if (time < 10) return { route: 'shovel01', progress: .98, direction: 1, state: 'cargando' }
    if (time < 15) return { route: 'shovel01', progress: between(time, 10, 15, .98, .03), direction: -1, state: 'cargado' }
    return { route: 'crusher', progress: between(time, 15, 25, .03, .5), direction: 1, state: 'cargado' }
  }
  if (id === 'TRK-03') {
    if (time < 2) return { route: 'crusher', progress: between(time, 0, 2, .86, .98), direction: 1, state: 'cargado' }
    if (time < 5) return { route: 'crusher', progress: .98, direction: 1, state: 'descargando' }
    return { route: 'crusher', progress: between(time, 5, 25, .98, .03), direction: -1, state: 'vacío' }
  }
  if (id === 'TRK-04') {
    if (time < 6) return { route: 'access', progress: between(time, 0, 6, .05, .75), direction: 1, state: 'vacío' }
    if (time < 10) return { route: 'access', progress: .75, direction: 1, state: 'vacío' }
    if (time < 12) return { route: 'access', progress: between(time, 10, 12, .75, .95), direction: 1, state: 'analizando' }
    if (time < 15) return { route: 'access', progress: .95, direction: 1, state: 'analizando' }
    if (time < 21) return { route: 'shovel02', progress: between(time, 15, 21, .03, .98), direction: 1, state: 'redirigido' }
    return { route: 'shovel02', progress: .98, direction: 1, state: 'cargando' }
  }
  if (id === 'TRK-05') {
    if (time < 1.5) return { route: 'shovel02', progress: between(time, 0, 1.5, .72, .98), direction: 1, state: 'vacío' }
    if (time < 4.5) return { route: 'shovel02', progress: .98, direction: 1, state: 'cargando' }
    if (time < 9.5) return { route: 'shovel02', progress: between(time, 4.5, 9.5, .98, .03), direction: -1, state: 'cargado' }
    if (time < 11.5) return { route: 'shovel02', progress: .03, direction: -1, state: 'analizando', lane: 16 }
    return { route: 'crusher', progress: between(time, 11.5, 25, .03, .66), direction: 1, state: 'cargado' }
  }
  if (time < 6) return { route: 'crusher', progress: between(time, 0, 6, .5, .18), direction: -1, state: 'vacío' }
  if (time < 12) return { route: 'crusher', progress: .18, direction: -1, state: 'analizando', lane: 18 }
  if (time < 15) return { route: 'crusher', progress: between(time, 12, 15, .18, .09), direction: -1, state: 'analizando', lane: between(time, 12, 15, 18, 12) }
  if (time < 16) return { route: 'crusher', progress: between(time, 15, 16, .09, .03), direction: -1, state: 'redirigido', lane: between(time, 15, 16, 12, 9) }
  return { route: 'shovel02', progress: between(time, 16, 23, .03, .7), direction: 1, state: 'redirigido' }
}

function HaulTruck({ routes, id, time, selected = false }) {
  const state = truckState(id, time)
  const lane = state.lane ?? (state.direction === 1 ? -12 : 12)
  const position = routeSample(routes[state.route], state.progress, state.direction, lane)
  return <g className={`haul-truck truck-${state.state} ${selected ? 'is-selected' : ''}`} transform={`translate(${position.x} ${position.y})`}>
    {selected && <circle className="selection-ring" r="35" />}
    <circle className="truck-signal" r="29" />
    <g className="truck-body" transform={`rotate(${position.angle})`}>
      <ellipse className="truck-shadow" cx="0" cy="2" rx="24" ry="15" />
      <rect className="truck-chassis" x="-21" y="-10" width="42" height="20" rx="5" />
      <path className="truck-bed" d="M-20-9H3V9H-20l-4-4V-5z" />
      <path className="truck-bed-ribs" d="M-15-8v16M-9-8v16M-3-8v16" />
      <rect className="truck-cab" x="5" y="-9" width="15" height="18" rx="4" />
      <path className="truck-window" d="M12-7h5l2 4H12zM12 7h5l2-4H12z" />
      <rect className="truck-wheel" x="-15" y="-14" width="9" height="5" rx="2" />
      <rect className="truck-wheel" x="-15" y="9" width="9" height="5" rx="2" />
      <rect className="truck-wheel" x="8" y="-14" width="9" height="5" rx="2" />
      <rect className="truck-wheel" x="8" y="9" width="9" height="5" rx="2" />
      <circle className="truck-light" cx="21" cy="-5" r="2" />
      <circle className="truck-light" cx="21" cy="5" r="2" />
      <text className="truck-number" x="-9" y="3" textAnchor="middle">{id.replace('TRK-', '')}</text>
    </g>
    <g className="truck-status" transform="translate(0 -25)">
      <rect x="-24" y="-8" width="48" height="13" rx="4" />
      <text y="1" textAnchor="middle">{id}</text>
    </g>
  </g>
}

function VehicleLayer({ routes, time, selectedId }) {
  return <g className={`vehicle-layer ${selectedId ? 'has-selection' : ''}`}>
    {['TRK-01', 'TRK-02', 'TRK-03', 'TRK-04', 'TRK-05', 'TRK-06'].map((id) => <HaulTruck key={id} routes={routes} id={id} time={time} selected={id === selectedId} />)}
  </g>
}

function InspectionCursor({ routes, time }) {
  if (time < INSPECTION_TIMING.cursor || time >= INSPECTION_TIMING.modal + .45) return null
  const state = truckState('TRK-02', time)
  const lane = state.lane ?? (state.direction === 1 ? -12 : 12)
  const truck = routeSample(routes[state.route], state.progress, state.direction, lane)
  const approach = clamp01((time - INSPECTION_TIMING.cursor) / (INSPECTION_TIMING.click - INSPECTION_TIMING.cursor))
  const x = truck.x + between(approach, 0, 1, 82, 13)
  const y = truck.y + between(approach, 0, 1, 60, 12)
  const clicked = time >= INSPECTION_TIMING.click
  return <g className={`inspection-cursor ${clicked ? 'has-clicked' : ''}`}>
    {clicked && <g className="click-feedback" transform={`translate(${truck.x} ${truck.y})`}>
      <circle r="27" /><circle r="27" />
    </g>}
    <g className="cursor-pointer" transform={`translate(${x} ${y})`}>
      <path d="M0 0 3 24 9 17 15 28 21 25 15 14 24 12z" />
    </g>
  </g>
}

function ScenarioEffects({ stage }) {
  return <g className={`scenario-effects stage-${stage}`}>
    {(stage === 2 || stage === 3) && <g className="decision-pulse" transform="translate(994 548)">
      <circle r="30" /><circle r="58" /><circle r="86" />
      <text x="0" y="-103" textAnchor="middle">MOTOR PREDICTIVO</text>
    </g>}
    {stage === 1 && <g className="queue-warning" transform="translate(949 330)">
      <path d="M0-16 15 12h-30z" /><text x="25" y="4">ESPERA +18 MIN</text>
    </g>}
  </g>
}

function MapNode({ nodeId, active, role, compact }) {
  const node = mapNodes[nodeId]
  const labelX = node.side === 'left' ? -28 : 28
  const anchor = node.side === 'left' ? 'end' : 'start'
  return <g className={`map-node ${active ? 'is-active' : ''} ${compact ? 'is-compact' : ''}`} transform={`translate(${node.x} ${node.y})`}>
    <circle className="node-ring" r="17" />
    <circle className="node-core" r="5" />
    <path className="node-tick" d="M-24 0H24M0-24V24" />
    <text className="node-code" x={labelX} y="-5" textAnchor={anchor}>{node.code} · {node.label}</text>
    {role && <text className={`node-role role-${role.toLowerCase()}`} x={labelX} y="13" textAnchor={anchor}>{role}</text>}
  </g>
}

function NodeLayer({ active, mode }) {
  return <g className="node-layer">
    {Object.keys(mapNodes).map((nodeId) => {
      const role = mode === 'editor' ? active.from === nodeId ? 'INICIO' : active.to === nodeId ? 'FIN' : null : null
      return <MapNode key={nodeId} nodeId={nodeId} active={Boolean(role)} role={role} compact={mode === 'preview'} />
    })}
  </g>
}

export default function App() {
  const svgRef = useRef(null)
  const drawingRef = useRef(false)
  const [routes, setRoutes] = useState(loadRoutes)
  const [activeIndex, setActiveIndex] = useState(0)
  const [draft, setDraft] = useState([])
  const [mode, setMode] = useState(() => Object.keys(loadRoutes()).length === 4 ? 'preview' : 'editor')
  const [simulationTime, setSimulationTime] = useState(0)
  const [message, setMessage] = useState('Mantén presionado y dibuja sobre el centro de la carretera')
  const active = routeDefinitions[activeIndex]
  const savedCount = useMemo(() => routeDefinitions.filter(({ id }) => routes[id]?.length > 1).length, [routes])
  const stageIndex = Math.max(0, Math.min(simulationStages.length - 1, Math.floor(simulationTime / STAGE_DURATION) || 0))
  const scenario = simulationStages[stageIndex]
  const inspectedTruck = simulationTime >= INSPECTION_TIMING.click && simulationTime < INSPECTION_TIMING.close ? 'TRK-02' : null
  const inspectionOpen = simulationTime >= INSPECTION_TIMING.modal && simulationTime < INSPECTION_TIMING.close
  const inspectionClosing = simulationTime >= INSPECTION_TIMING.closeStart
  const inspectedSpeed = Math.round(40 + Math.sin(simulationTime * 1.35) * 2)

  useEffect(() => {
    if (!Object.values(routes).some((points) => points?.length > 1)) return
    fetch('/api/routes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(routes),
    }).then((response) => {
      if (response.ok) setMessage('Rutas del navegador sincronizadas con el proyecto')
    }).catch(() => {
      setMessage('Rutas guardadas en el navegador. Reinicia Vite para sincronizarlas con el proyecto')
    })
  }, [])

  useEffect(() => {
    if (mode !== 'preview') return undefined
    let animationFrame
    const startedAt = performance.now()
    const animate = (now) => {
      const elapsed = Number.isFinite(now) ? (now - startedAt) / 1000 : 0
      setSimulationTime(((elapsed % SIMULATION_DURATION) + SIMULATION_DURATION) % SIMULATION_DURATION)
      animationFrame = requestAnimationFrame(animate)
    }
    animationFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrame)
  }, [mode])

  const eventPoint = (event) => {
    const svg = svgRef.current
    const point = svg.createSVGPoint()
    point.x = event.clientX
    point.y = event.clientY
    const mapped = point.matrixTransform(svg.getScreenCTM().inverse())
    return [mapped.x, mapped.y]
  }

  const beginDrawing = (event) => {
    if (mode !== 'editor' || event.button !== 0) return
    event.currentTarget.setPointerCapture(event.pointerId)
    drawingRef.current = true
    setDraft([eventPoint(event)])
    setMessage(`Dibujando ${active.code}… suelta para terminar`)
  }

  const continueDrawing = (event) => {
    if (!drawingRef.current) return
    const next = eventPoint(event)
    setDraft((current) => {
      const previous = current.at(-1)
      if (previous && Math.hypot(next[0] - previous[0], next[1] - previous[1]) < 3) return current
      return [...current, next]
    })
  }

  const endDrawing = (event) => {
    if (!drawingRef.current) return
    drawingRef.current = false
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    setMessage('Trazo listo. Revísalo y pulsa “Guardar ruta”')
  }

  const persist = async (nextRoutes) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextRoutes))
    try {
      const response = await fetch('/api/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextRoutes),
      })
      if (!response.ok) throw new Error('No se pudo escribir el archivo')
      return true
    } catch {
      return false
    }
  }

  const saveRoute = async () => {
    if (draft.length < 2) {
      setMessage('Primero dibuja la ruta completa sobre la carretera')
      return
    }
    const nextRoutes = { ...routes, [active.id]: roundedPoints(draft) }
    setRoutes(nextRoutes)
    setDraft([])
    const savedInProject = await persist(nextRoutes)
    const nextIndex = Math.min(activeIndex + 1, routeDefinitions.length - 1)
    setActiveIndex(nextIndex)
    setMessage(savedInProject
      ? `${active.code} guardada en el proyecto. Continúa con ${routeDefinitions[nextIndex].code}`
      : `${active.code} guardada en este navegador. Continúa con ${routeDefinitions[nextIndex].code}`)
  }

  const clearActive = async () => {
    const nextRoutes = { ...routes }
    delete nextRoutes[active.id]
    setRoutes(nextRoutes)
    setDraft([])
    await persist(nextRoutes)
    setMessage(`${active.code} eliminada. Puedes dibujarla nuevamente`)
  }

  return <main className={`app-shell ${mode}-mode tone-${scenario.tone}`}>
    <svg
      ref={svgRef}
      className="route-canvas"
      viewBox={`0 0 ${PLATE.width} ${PLATE.height}`}
      preserveAspectRatio="xMidYMid slice"
      onPointerDown={beginDrawing}
      onPointerMove={continueDrawing}
      onPointerUp={endDrawing}
      onPointerCancel={endDrawing}
    >
      <image href="/assets/open-pit-mine-hero-v2.png" x="0" y="0" width={PLATE.width} height={PLATE.height} preserveAspectRatio="none" />
      <rect className="image-shade" width={PLATE.width} height={PLATE.height} />
      {routeDefinitions.map((route) => {
        const isBeingRedrawn = route.id === active.id && draft.length > 0
        const simulationColor = mode === 'preview' && route.id === 'shovel01' && (stageIndex === 1 || stageIndex === 2)
          ? '#ff765d'
          : mode === 'preview' && route.id === 'shovel02' && stageIndex >= 3
            ? '#4ce7b9'
            : route.color
        return !isBeingRedrawn && <DrawingRoute key={route.id} id={route.id} points={routes[route.id]} color={simulationColor} terminals={mode === 'editor'} />
      })}
      {mode === 'editor' && <DrawingRoute points={draft} color={active.color} draft />}
      {mode === 'preview' && <ScenarioEffects stage={stageIndex} />}
      {mode === 'preview' && <VehicleLayer routes={routes} time={simulationTime} selectedId={inspectedTruck} />}
      {mode === 'preview' && <InspectionCursor routes={routes} time={simulationTime} />}
      <NodeLayer active={active} mode={mode} />
    </svg>

    <header className="topbar">
      <div className="brand"><span className="brand-mark">◈</span><span>ORBITA</span><small>{mode === 'editor' ? 'ROUTE EDITOR' : 'MINING DIGITAL TWIN'}</small></div>
      <button className="mode-switch" onClick={() => { setMode(mode === 'editor' ? 'preview' : 'editor'); setDraft([]) }}>
        {mode === 'editor' ? '▶ Probar movimiento' : '✎ Editar rutas'}
      </button>
      <div className="save-counter"><i /> {mode === 'editor' ? `${savedCount} / 4 RUTAS GUARDADAS` : '06 UNIDADES EN VIVO'}</div>
    </header>

    {mode === 'editor' && <aside className="editor-panel">
      <div className="panel-heading"><span>CALIBRACIÓN MANUAL</span><b>✎ LÁPIZ</b></div>
      <div className="route-tabs">
        {routeDefinitions.map((route, index) => <button
          key={route.id}
          className={`${index === activeIndex ? 'active' : ''} ${routes[route.id]?.length ? 'saved' : ''}`}
          onClick={() => { setActiveIndex(index); setDraft([]); setMessage(`Dibuja ${route.code}: ${route.direction}`) }}
        >
          <i style={{ background: route.color }} />
          <span><strong>{route.code}</strong>{route.name}</span>
          <em>{routes[route.id]?.length ? '✓' : String(index + 1).padStart(2, '0')}</em>
        </button>)}
      </div>
      <div className="active-route">
        <small>RUTA ACTIVA</small>
        <strong style={{ color: active.color }}>{active.code} · {active.name}</strong>
        <span>{active.direction}</span>
        <div className="route-direction">
          <b>{mapNodes[active.from].code}<small>INICIO</small></b>
          <i>→</i>
          <b>{mapNodes[active.to].code}<small>FIN</small></b>
        </div>
      </div>
      <p className="editor-message">{message}</p>
      <div className="editor-actions">
        <button className="secondary" onClick={() => { setDraft([]); setMessage('Trazo descartado. Dibuja nuevamente') }}>Deshacer trazo</button>
        <button className="primary" onClick={saveRoute}>Guardar ruta</button>
      </div>
      <button className="clear-button" onClick={clearActive}>Eliminar ruta guardada</button>
    </aside>}

    {mode === 'preview' && <aside className={`preview-panel tone-${scenario.tone}`}>
      <strong>{scenario.title}</strong>
      <span>{scenario.detail}</span>
      <div className="simulation-kpis">
        <div><small>ESPERA</small><b>{scenario.wait}</b></div>
        <div><small>PRODUCCIÓN</small><b>{scenario.production}</b></div>
      </div>
    </aside>}

    {mode === 'preview' && inspectionOpen && <aside className={`vehicle-modal ${inspectionClosing ? 'is-closing' : ''}`} aria-label="Datos de TRK-02">
      <div className="vehicle-modal-heading">
        <span><i /> UNIDAD SELECCIONADA</span>
        <b>TRK-02</b>
      </div>
      <div className="vehicle-model-reference">{REFERENCE_TRUCK.model} <i /> CLASE {REFERENCE_TRUCK.payload} T</div>
      <div className="vehicle-side-view">
        <svg viewBox="0 0 320 126" role="img" aria-label="Vista lateral del camión TRK-02">
          <path className="inspection-ground" d="M18 105H302" />
          <ellipse className="side-truck-shadow" cx="166" cy="105" rx="133" ry="9" />
          <g className="side-truck-body">
            <path className="side-truck-chassis" d="M45 78h218l21 14-9 10H46L33 90z" />
            <path className="side-truck-bed" d="M43 38h139l31 42H58L35 67z" />
            <path className="side-truck-ore" d="M51 38c15-10 28 1 40-5 15-8 27 3 41-3 15-7 31 2 44 8l19 28H62L43 57z" />
            <path className="side-truck-bed-ribs" d="M61 43 73 73M95 40l8 33M130 39l5 34M164 42l3 31" />
            <path className="side-truck-cab" d="M211 37h45l20 23v31h-73V56z" />
            <path className="side-truck-window" d="M224 45h25l15 17h-40z" />
            <path className="side-truck-nose" d="M276 65h18v25h-18z" />
            <path className="side-truck-ladder" d="M208 61h-15v31m0-23h13m-13 9h13m-13 9h13" />
            <text className="side-truck-id" x="239" y="81" textAnchor="middle">02</text>
            {[82, 147, 248].map((x) => <g className="side-wheel" transform={`translate(${x} 96)`} key={x}>
              <circle r="25" /><circle r="14" /><circle r="5" />
            </g>)}
            <circle className="side-truck-light" cx="293" cy="72" r="3" />
          </g>
        </svg>
        <div className="side-view-status"><i /> EN ACARREO · {inspectedSpeed} KM/H</div>
      </div>
      <div className="vehicle-modal-data">
        <div><span>CARGA NOMINAL</span><b>{REFERENCE_TRUCK.payload} t</b></div>
        <div><span>VELOCIDAD</span><b>{inspectedSpeed} km/h</b></div>
        <div><span>PALA ASIGNADA</span><b>PALA 01</b></div>
        <div><span>VEL. MÁX. CARGADO</span><b>{REFERENCE_TRUCK.maxLoadedSpeed} km/h</b></div>
        <div><span>POTENCIA BRUTA</span><b>{REFERENCE_TRUCK.grossPower.toLocaleString('es-PE')} kW</b></div>
        <div><span>CICLOS / TURNO</span><b>Según ruta</b></div>
      </div>
      <div className="load-meter-label"><span>CAPACIDAD NOMINAL</span><b>{REFERENCE_TRUCK.payload} t</b></div>
      <div className="load-meter"><i style={{ width: '100%' }} /></div>
      <p><i /> Telemetría sincronizada en tiempo real</p>
    </aside>}

    <footer className="editor-footer">{mode === 'editor' ? <>DIBUJA EN EL SENTIDO INDICADO <b>•</b> EL TRAZO SE GUARDA EN <code>src/data/routes.json</code></> : <>SIMULACIÓN DE MOVIMIENTO <b>•</b> 06 UNIDADES <b>•</b> CICLO 23 S</>}</footer>
  </main>
}
