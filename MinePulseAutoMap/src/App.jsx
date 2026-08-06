import React, { useEffect, useMemo, useRef, useState } from 'react'
import persistedRoutes from './data/routes.json'

const PLATE = { width: 1672, height: 941 }
const STORAGE_KEY = 'pukaria-route-calibration-v1'

const routeDefinitions = [
  {
    id: 'access',
    code: 'R00',
    name: 'Acceso principal',
    from: 'entry',
    to: 'junction',
    direction: 'Patio central a cruce J01',
    status: 'Abierta',
    distance: '1.8 km',
    slope: '4.5%',
    maxSpeed: '34 km/h',
    color: '#8fc7ff',
  },
  {
    id: 'shovel01',
    code: 'R04',
    name: 'Rampa norte',
    from: 'junction',
    to: 'shovel01',
    direction: 'Cruce J01 a Pala P01',
    status: 'Congestionada',
    distance: '2.1 km',
    slope: '8.5%',
    maxSpeed: '24 km/h',
    color: '#ffb86b',
  },
  {
    id: 'shovel02',
    code: 'R07',
    name: 'Rampa este',
    from: 'junction',
    to: 'shovel02',
    direction: 'Cruce J01 a Pala P02',
    status: 'Abierta',
    distance: '2.4 km',
    slope: '6.2%',
    maxSpeed: '30 km/h',
    color: '#4bd9a8',
  },
  {
    id: 'crusher',
    code: 'R12',
    name: 'Descarga sur',
    from: 'junction',
    to: 'crusher',
    direction: 'Cruce J01 a chancadora',
    status: 'Pendiente de validacion',
    distance: '3.0 km',
    slope: '5.1%',
    maxSpeed: '28 km/h',
    color: '#d7c3ff',
  },
]

const mapNodes = {
  entry: { x: 1416, y: 878, code: 'N00', label: 'Patio', kind: 'Cruce', side: 'left' },
  junction: { x: 994, y: 548, code: 'J01', label: 'Cruce Norte', kind: 'Cruce', side: 'right' },
  shovel01: { x: 922, y: 215, code: 'P01', label: 'Pala 1', kind: 'Pala', side: 'left' },
  shovel02: { x: 1200, y: 239, code: 'P02', label: 'Pala 2', kind: 'Pala', side: 'right' },
  crusher: { x: 868, y: 761, code: 'D01', label: 'Chancadora', kind: 'Planta', side: 'right' },
}

const trucks = [
  {
    id: 'T01',
    model: 'CAT 797F',
    capacity: '360 t',
    state: 'En ruta',
    load: 'Vacio',
    speed: 24,
    route: 'R04',
    destination: 'Pala P01',
    shovel: 'P01',
    eta: '32 min',
    stopped: '0 min',
    gps: 'Alta',
    signal: 'Hace 18 s',
    battery: '82%',
    connection: 'Online',
    operator: 'J. Morales',
    routeId: 'shovel01',
  },
  {
    id: 'T02',
    model: 'CAT 797F',
    capacity: '360 t',
    state: 'Cargando',
    load: 'Vacio',
    speed: 0,
    route: 'R04',
    destination: 'Pala P01',
    shovel: 'P01',
    eta: '8 min',
    stopped: '6 min',
    gps: 'Media',
    signal: 'Hace 42 s',
    battery: '74%',
    connection: 'Online',
    operator: 'M. Rojas',
    routeId: 'shovel01',
  },
  {
    id: 'T03',
    model: 'Komatsu 930E',
    capacity: '290 t',
    state: 'Detenido',
    load: 'Cargado',
    speed: 0,
    route: 'R04',
    destination: 'Chancadora D01',
    shovel: 'P01',
    eta: '41 min',
    stopped: '7 min',
    gps: 'Alta',
    signal: 'Hace 22 s',
    battery: '68%',
    connection: 'Online',
    operator: 'L. Vega',
    routeId: 'shovel01',
  },
  {
    id: 'T04',
    model: 'CAT 797F',
    capacity: '360 t',
    state: 'En ruta',
    load: 'Vacio',
    speed: 35,
    route: 'R00',
    destination: 'Pala P02',
    shovel: 'P02',
    eta: '28 min',
    stopped: '0 min',
    gps: 'Alta',
    signal: 'Hace 15 s',
    battery: '91%',
    connection: 'Online',
    operator: 'A. Salas',
    routeId: 'access',
  },
  {
    id: 'T05',
    model: 'Komatsu 930E',
    capacity: '290 t',
    state: 'En cola',
    load: 'Vacio',
    speed: 4,
    route: 'R04',
    destination: 'Pala P01',
    shovel: 'P01',
    eta: '36 min',
    stopped: '5 min',
    gps: 'Media',
    signal: 'Hace 1 min',
    battery: '57%',
    connection: 'Online',
    operator: 'P. Luna',
    routeId: 'shovel01',
  },
  {
    id: 'T06',
    model: 'CAT 793F',
    capacity: '227 t',
    state: 'Sin conexion',
    load: 'Cargado',
    speed: 0,
    route: 'R12',
    destination: 'Chancadora D01',
    shovel: 'P02',
    eta: 'Sin dato',
    stopped: '12 min',
    gps: 'Baja',
    signal: 'Hace 9 min',
    battery: '23%',
    connection: 'Offline',
    operator: 'C. Huaman',
    routeId: 'crusher',
  },
  {
    id: 'T07',
    model: 'CAT 793F',
    capacity: '227 t',
    state: 'Disponible',
    load: 'Vacio',
    speed: 18,
    route: 'R07',
    destination: 'Pala P02',
    shovel: 'P02',
    eta: '28 min',
    stopped: '1 min',
    gps: 'Alta',
    signal: 'Hace 11 s',
    battery: '88%',
    connection: 'Online',
    operator: 'D. Quispe',
    routeId: 'shovel02',
  },
  {
    id: 'T08',
    model: 'CAT 793F',
    capacity: '227 t',
    state: 'Descargando',
    load: 'Cargado',
    speed: 0,
    route: 'R12',
    destination: 'Botadero Norte',
    shovel: 'P02',
    eta: '14 min',
    stopped: '3 min',
    gps: 'Alta',
    signal: 'Hace 28 s',
    battery: '76%',
    connection: 'Online',
    operator: 'R. Soria',
    routeId: 'crusher',
  },
]

const shovels = [
  { id: 'P01', state: 'Saturada', location: 'Banco Norte', loadTime: '5.8 min', queue: 3, capacity: '6 camiones/h', assigned: 'T01, T02, T03, T05', material: 'Sulfuro', availability: '92%' },
  { id: 'P02', state: 'Operativa', location: 'Banco Este', loadTime: '4.9 min', queue: 1, capacity: '7 camiones/h', assigned: 'T04, T07, T08', material: 'Oxido', availability: '96%' },
  { id: 'P03', state: 'Mantenimiento', location: 'Banco Sur', loadTime: '6.4 min', queue: 0, capacity: '5 camiones/h', assigned: '-', material: 'Mixto', availability: '0%' },
]

const devices = trucks.map((truck, index) => ({
  id: `PK-${String(index + 1).padStart(3, '0')}`,
  truck: truck.id,
  gps: truck.gps === 'Baja' ? 'Degradado' : 'Activo',
  connection: truck.connection,
  battery: truck.battery,
  lastSignal: truck.signal,
  quality: truck.gps,
}))

const alertsSeed = [
  {
    id: 'a1',
    type: 'Bloqueo probable',
    severity: 'critical',
    title: 'Bloqueo probable en Ruta R04',
    detail: 'Tres camiones detenidos por mas de cinco minutos cerca de Pala P01.',
    source: 'GPS flota + camara CR-02',
    actions: ['Confirmar', 'Descartar', 'Ver ubicacion', 'Cerrar ruta'],
  },
  {
    id: 'a2',
    type: 'Recomendacion PukarIA',
    severity: 'recommendation',
    title: 'T07 hacia Pala P02',
    detail: 'Tiempo previsto: 28 min. Motivo: menor cola y ruta disponible.',
    source: 'Prediccion de ciclo PukarIA',
    actions: ['Aceptar', 'Modificar', 'Rechazar', 'Enviar al vehiculo'],
  },
  {
    id: 'a3',
    type: 'Senal',
    severity: 'warning',
    title: 'T06 sin conexion',
    detail: 'Ultima senal recibida hace 9 minutos. Mantiene instruccion descargada.',
    source: 'Celular asociado PK-006',
    actions: ['Ver ubicacion', 'Notificar'],
  },
]

const predictionRows = [
  { truck: 'T01', p1: '32 min', p2: '27 min', decision: 'P02', reason: 'Menor cola y ruta R07 abierta' },
  { truck: 'T02', p1: '29 min', p2: '31 min', decision: 'P01', reason: 'Ya esta cargando en P01' },
  { truck: 'T03', p1: '34 min', p2: '26 min', decision: 'P02', reason: 'Evita tramo R04 saturado' },
  { truck: 'T07', p1: '35 min', p2: '28 min', decision: 'P02', reason: 'Compatible y disponible' },
]

const navItems = [
  { id: 'dashboard', label: 'Dashboard operativo', icon: '▦' },
  { id: 'mine', label: 'Configuracion de mina', icon: '≡' },
  { id: 'fleet', label: 'Flota y equipos', icon: '⚒' },
  { id: 'optimization', label: 'Optimizacion y analisis', icon: '▧' },
]

const statusTone = {
  Abierta: 'open',
  Congestionada: 'congested',
  Bloqueada: 'blocked',
  Restringida: 'restricted',
  'En mantenimiento': 'maintenance',
  'Pendiente de validacion': 'pending',
  Disponible: 'open',
  'En ruta': 'moving',
  'En cola': 'congested',
  Cargando: 'loading',
  Cargado: 'loaded',
  Descargando: 'unloading',
  Detenido: 'blocked',
  Averiado: 'blocked',
  'Sin conexion': 'offline',
  Operativa: 'open',
  Ocupada: 'loading',
  Saturada: 'congested',
  Mantenimiento: 'maintenance',
}

function loadRoutes() {
  try {
    const local = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (local && typeof local === 'object') return local
  } catch {
    // Use project data when the browser has no valid calibration.
  }
  return persistedRoutes
}

const clamp01 = (value) => Math.max(0, Math.min(1, value))
const between = (time, start, end, from, to) => from + (to - from) * clamp01((time - start) / (end - start))
const roundedPoints = (points) => points.map(([x, y]) => [Math.round(x * 10) / 10, Math.round(y * 10) / 10])
const polylinePath = (points = []) => points.length ? `M ${points.map(([x, y]) => `${x} ${y}`).join(' L ')}` : ''

const lightlySmooth = (points = []) => points.map((point, index) => {
  if (index < 2 || index > points.length - 3) return point
  const weights = [.08, .17, .5, .17, .08]
  const window = points.slice(index - 2, index + 3)
  return [0, 1].map((axis) => window.reduce((sum, sample, sampleIndex) => sum + sample[axis] * weights[sampleIndex], 0))
})

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

const routeSample = (points = [], progress, direction = 1, lane = 0) => {
  if (!points.length) return { x: 0, y: 0, angle: 0 }
  const filtered = lightlySmooth(points).filter((_, index) => index === 0 || index === points.length - 1 || index % 3 === 0)
  if (filtered.length < 2) return { x: filtered[0]?.[0] ?? 0, y: filtered[0]?.[1] ?? 0, angle: 0 }
  const scaled = clamp01(progress) * (filtered.length - 1)
  const index = Math.min(filtered.length - 2, Math.floor(scaled))
  const t = scaled - index
  const p0 = filtered[Math.max(0, index - 1)]
  const p1 = filtered[index]
  const p2 = filtered[index + 1]
  const p3 = filtered[Math.min(filtered.length - 1, index + 2)]
  const tension = .11
  const c1 = [p1[0] + (p2[0] - p0[0]) * tension, p1[1] + (p2[1] - p0[1]) * tension]
  const c2 = [p2[0] - (p3[0] - p1[0]) * tension, p2[1] - (p3[1] - p1[1]) * tension]
  const inverse = 1 - t
  const x = inverse ** 3 * p1[0] + 3 * inverse ** 2 * t * c1[0] + 3 * inverse * t ** 2 * c2[0] + t ** 3 * p2[0]
  const y = inverse ** 3 * p1[1] + 3 * inverse ** 2 * t * c1[1] + 3 * inverse * t ** 2 * c2[1] + t ** 3 * p2[1]
  const dx = 3 * inverse ** 2 * (c1[0] - p1[0]) + 6 * inverse * t * (c2[0] - c1[0]) + 3 * t ** 2 * (p2[0] - c2[0])
  const dy = 3 * inverse ** 2 * (c1[1] - p1[1]) + 6 * inverse * t * (c2[1] - c1[1]) + 3 * t ** 2 * (p2[1] - c2[1])
  const length = Math.hypot(dx, dy) || 1
  return { x: x + (-dy / length) * lane, y: y + (dx / length) * lane, angle: Math.atan2(dy * direction, dx * direction) * 180 / Math.PI }
}

function useClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(timer)
  }, [])
  return now
}

function Badge({ children, tone = 'open' }) {
  return <span className={`badge tone-${tone}`}>{children}</span>
}

function Sidebar({ section, setSection, openMobile }) {
  return <aside className="sidebar">
    <div className="brand-block">
      <img className="brand-logo" src="/assets/pukaria-logo.png" alt="PukarIA" />
      <div>
        <strong>PukarIA</strong>
        <span>Route Optimization</span>
      </div>
    </div>
    <nav className="primary-nav">
      {navItems.map((item) => <button
        key={item.id}
        className={section === item.id ? 'active' : ''}
        onClick={() => setSection(item.id)}
      >
        <span>{item.icon}</span>
        {item.label}
      </button>)}
    </nav>
    <button className="mobile-launch" onClick={openMobile}>Abrir vista vehiculo</button>
    <div className="user-block">
      <span>AD</span>
      <div>
        <strong>Admin Dispatch</strong>
        <small>Nivel de acceso 5</small>
      </div>
    </div>
  </aside>
}

function Topbar({ currentSection, openMobile, runOptimization }) {
  const now = useClock()
  const sectionLabel = navItems.find((item) => item.id === currentSection)?.label ?? 'Vista movil'
  return <header className="app-topbar">
    <div>
      <small>Operacion minera</small>
      <strong>Cerro El Oso · Turno A</strong>
    </div>
    <label className="global-search">
      <span>⌕</span>
      <input placeholder="Buscar vehiculos, rutas, palas o alertas..." />
    </label>
    <div className="topbar-meta">
      <Badge tone="open">Conexion nominal</Badge>
      <span>Actualizado {now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</span>
      <span>{sectionLabel}</span>
      <button className="ghost-button" onClick={openMobile}>Movil</button>
      <button className="primary-button" onClick={runOptimization}>Optimizar flota</button>
    </div>
  </header>
}

function KpiCard({ label, value, detail, tone = 'neutral' }) {
  return <article className={`kpi-card tone-${tone}`}>
    <span>{label}</span>
    <strong>{value}</strong>
    <small>{detail}</small>
  </article>
}

function DrawingRoute({ points, color, status, draft = false, terminals = false }) {
  if (!points?.length) return null
  const path = draft ? polylinePath(points) : smoothRoutePath(points)
  const tone = statusTone[status] ?? 'open'
  return <g style={{ '--route-color': color }} className={`route-group tone-${tone}`}>
    <path className={`route-corridor ${draft ? 'is-draft' : ''}`} d={path} />
    <path className={`route-center ${draft ? 'is-draft' : ''}`} d={path} />
    {terminals && <>
      <circle className="route-terminal" cx={points[0][0]} cy={points[0][1]} r="8" />
      <circle className="route-terminal" cx={points.at(-1)[0]} cy={points.at(-1)[1]} r="8" />
    </>}
  </g>
}

function TruckMarker({ truck, routes, time, selected, onSelect }) {
  const route = routes[truck.routeId] || routes.access || []
  const progressByTruck = {
    T01: between(time, 0, 20, .05, .78),
    T02: .94,
    T03: .58,
    T04: between(time, 0, 20, .18, .92),
    T05: .72,
    T06: .28,
    T07: between(time, 0, 20, .2, .88),
    T08: .86,
  }
  const direction = truck.load === 'Cargado' ? -1 : 1
  const sample = routeSample(route, progressByTruck[truck.id] ?? .45, direction, direction === 1 ? -9 : 9)
  return <g
    className={`truck-marker tone-${statusTone[truck.state] ?? 'moving'} ${selected ? 'selected' : ''}`}
    transform={`translate(${sample.x} ${sample.y})`}
    onClick={(event) => { event.stopPropagation(); onSelect(truck.id) }}
  >
    <circle className="truck-pulse" r="28" />
    <g transform={`rotate(${sample.angle})`}>
      <rect className="truck-body" x="-21" y="-11" width="42" height="22" rx="5" />
      <path className="truck-bed" d="M-21-10H3V10H-21l-5-5V-5z" />
      <rect className="truck-cab" x="6" y="-9" width="15" height="18" rx="4" />
      <rect className="truck-wheel" x="-15" y="-15" width="9" height="5" rx="2" />
      <rect className="truck-wheel" x="-15" y="10" width="9" height="5" rx="2" />
      <rect className="truck-wheel" x="8" y="-15" width="9" height="5" rx="2" />
      <rect className="truck-wheel" x="8" y="10" width="9" height="5" rx="2" />
    </g>
    <text className="truck-label" y="-27" textAnchor="middle">{truck.id}</text>
  </g>
}

function MapNode({ nodeId, compact = false }) {
  const node = mapNodes[nodeId]
  const labelX = node.side === 'left' ? -28 : 28
  const anchor = node.side === 'left' ? 'end' : 'start'
  return <g className={`map-node node-${node.kind.toLowerCase()} ${compact ? 'compact' : ''}`} transform={`translate(${node.x} ${node.y})`}>
    <circle className="node-ring" r="17" />
    <circle className="node-core" r="5" />
    <text className="node-code" x={labelX} y="-5" textAnchor={anchor}>{node.code} · {node.label}</text>
    <text className="node-kind" x={labelX} y="13" textAnchor={anchor}>{node.kind}</text>
  </g>
}

function MineMap({ routes, routeStatuses = {}, selectedTruck, onSelectTruck, mode = 'dashboard', draft, activeRoute }) {
  const [time, setTime] = useState(0)
  useEffect(() => {
    let frame
    const startedAt = performance.now()
    const animate = (now) => {
      setTime(((now - startedAt) / 1000) % 20)
      frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [])

  return <svg className="mine-map" viewBox={`0 0 ${PLATE.width} ${PLATE.height}`} preserveAspectRatio="xMidYMid slice">
    <image href="/assets/open-pit-mine-hero-v2.png" x="0" y="0" width={PLATE.width} height={PLATE.height} preserveAspectRatio="none" />
    <rect className="map-shade" width={PLATE.width} height={PLATE.height} />
    <polygon className="restricted-zone" points="610,390 730,346 792,476 646,526" />
    <text className="restricted-label" x="662" y="445" transform="rotate(-15 662 445)">Zona restringida</text>
    {routeDefinitions.map((route) => <DrawingRoute
      key={route.id}
      points={routes[route.id]}
      color={route.color}
      status={routeStatuses[route.id] ?? route.status}
      terminals={mode === 'editor'}
    />)}
    {draft?.length > 0 && <DrawingRoute points={draft} color={activeRoute.color} draft terminals />}
    <g className="recommended-route">
      <path d="M 1010 548 C 1115 575 1178 668 1198 792" />
      <text x="1185" y="705">Ruta alterna recomendada</text>
    </g>
    {mode === 'dashboard' && <g className="congestion-marker" transform="translate(952 362)">
      <circle r="34" />
      <text y="5" textAnchor="middle">R04</text>
    </g>}
    {Object.keys(mapNodes).map((nodeId) => <MapNode key={nodeId} nodeId={nodeId} compact={mode !== 'editor'} />)}
    {mode === 'dashboard' && trucks.map((truck) => <TruckMarker
      key={truck.id}
      truck={truck}
      routes={routes}
      time={time}
      selected={selectedTruck === truck.id}
      onSelect={onSelectTruck}
    />)}
  </svg>
}

function TruckPanel({ truck }) {
  return <aside className="dynamic-panel">
    <div className="panel-title">
      <span>Camion seleccionado</span>
      <Badge tone={statusTone[truck.state]}>{truck.state}</Badge>
    </div>
    <strong className="vehicle-code">{truck.id}</strong>
    <div className="vehicle-model">{truck.model} · {truck.capacity}</div>
    <dl className="detail-grid">
      <div><dt>Velocidad</dt><dd>{truck.speed} km/h</dd></div>
      <div><dt>Carga</dt><dd>{truck.load}</dd></div>
      <div><dt>Ruta actual</dt><dd>{truck.route}</dd></div>
      <div><dt>Destino</dt><dd>{truck.destination}</dd></div>
      <div><dt>Pala asignada</dt><dd>{truck.shovel}</dd></div>
      <div><dt>Tiempo estimado</dt><dd>{truck.eta}</dd></div>
      <div><dt>Tiempo detenido</dt><dd>{truck.stopped}</dd></div>
      <div><dt>Ultima senal</dt><dd>{truck.signal}</dd></div>
      <div><dt>Calidad GPS</dt><dd>{truck.gps}</dd></div>
      <div><dt>Conexion</dt><dd>{truck.connection}</dd></div>
    </dl>
    <div className="panel-actions">
      <button>Ver historial</button>
      <button>Enviar ruta</button>
    </div>
  </aside>
}

function AlertList({ alerts, onAction }) {
  return <div className="alert-stack">
    {alerts.map((alert) => <article key={alert.id} className={`alert-card tone-${alert.severity}`}>
      <div>
        <small>{alert.type} · {alert.source}</small>
        <strong>{alert.title}</strong>
        <p>{alert.detail}</p>
      </div>
      <div className="alert-actions">
        {alert.actions.slice(0, 4).map((action) => <button key={action} onClick={() => onAction(alert.id, action)}>{action}</button>)}
      </div>
    </article>)}
  </div>
}

function Dashboard({ routes, routeStatuses, selectedTruck, setSelectedTruck, alerts, onAlertAction }) {
  const truck = trucks.find((item) => item.id === selectedTruck) ?? trucks[0]
  return <section className="section dashboard-section">
    <div className="kpi-grid">
      <KpiCard label="Camiones activos" value="7 / 8" detail="1 sin conexion" />
      <KpiCard label="Camiones detenidos" value="2" detail="R04 concentra el riesgo" tone="warning" />
      <KpiCard label="Palas operativas" value="2 / 3" detail="P01 saturada" />
      <KpiCard label="Rutas congestionadas" value="1" detail="R04 pendiente de confirmacion" tone="critical" />
      <KpiCard label="Bloqueos probables" value="1" detail="No cerrado automaticamente" tone="critical" />
      <KpiCard label="Ciclo promedio" value="31 min" detail="Meta 28 min" />
      <KpiCard label="Espera promedio" value="12 min" detail="-15 min si se acepta IA" tone="accent" />
    </div>
    <div className="dashboard-layout">
      <div className="map-panel">
        <div className="map-toolbar">
          <Badge>Activo</Badge>
          <Badge tone="congested">Congestion</Badge>
          <Badge tone="blocked">Bloqueo probable</Badge>
          <Badge tone="pending">Pendiente de validacion</Badge>
        </div>
        <MineMap routes={routes} routeStatuses={routeStatuses} selectedTruck={selectedTruck} onSelectTruck={setSelectedTruck} />
      </div>
      <div className="ops-side">
        <TruckPanel truck={truck} />
        <AlertList alerts={alerts} onAction={onAlertAction} />
      </div>
    </div>
  </section>
}

function RouteEditor({ routes, setRoutes, routeStatuses }) {
  const svgRef = useRef(null)
  const drawingRef = useRef(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [draft, setDraft] = useState([])
  const [message, setMessage] = useState('Mantenga presionado y dibuje sobre el centro de la via.')
  const activeRoute = routeDefinitions[activeIndex]
  const activeStatus = routeStatuses[activeRoute.id] ?? activeRoute.status
  const savedCount = useMemo(() => routeDefinitions.filter(({ id }) => routes[id]?.length > 1).length, [routes])

  const eventPoint = (event) => {
    const svg = svgRef.current
    const point = svg.createSVGPoint()
    point.x = event.clientX
    point.y = event.clientY
    const mapped = point.matrixTransform(svg.getScreenCTM().inverse())
    return [mapped.x, mapped.y]
  }

  const persist = async (nextRoutes) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextRoutes))
    try {
      const response = await fetch('/api/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextRoutes),
      })
      return response.ok
    } catch {
      return false
    }
  }

  const beginDrawing = (event) => {
    if (event.button !== 0) return
    event.currentTarget.setPointerCapture(event.pointerId)
    drawingRef.current = true
    const point = eventPoint(event)
    setDraft([[point[0], point[1]]])
    setMessage(`Dibujando ${activeRoute.code}. Suelte para terminar.`)
  }

  const continueDrawing = (event) => {
    if (!drawingRef.current) return
    const mapped = eventPoint(event)
    const next = [mapped[0], mapped[1]]
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
    setMessage('Trazo listo. Revise y guarde para que aparezca en el dashboard.')
  }

  const saveRoute = async () => {
    if (draft.length < 2) {
      setMessage('Primero dibuje la ruta completa.')
      return
    }
    const nextRoutes = { ...routes, [activeRoute.id]: roundedPoints(draft) }
    setRoutes(nextRoutes)
    setDraft([])
    const synced = await persist(nextRoutes)
    const nextIndex = Math.min(activeIndex + 1, routeDefinitions.length - 1)
    setActiveIndex(nextIndex)
    setMessage(synced ? `${activeRoute.code} guardada en el proyecto.` : `${activeRoute.code} guardada en este navegador.`)
  }

  const clearRoute = async () => {
    const nextRoutes = { ...routes }
    delete nextRoutes[activeRoute.id]
    setRoutes(nextRoutes)
    setDraft([])
    await persist(nextRoutes)
    setMessage(`${activeRoute.code} eliminada. Puede dibujarla nuevamente.`)
  }

  return <div className="config-editor">
    <div className="editor-map">
      <svg
        ref={svgRef}
        className="mine-map editable"
        viewBox={`0 0 ${PLATE.width} ${PLATE.height}`}
        preserveAspectRatio="xMidYMid slice"
        onPointerDown={beginDrawing}
        onPointerMove={continueDrawing}
        onPointerUp={endDrawing}
        onPointerCancel={endDrawing}
      >
        <image href="/assets/open-pit-mine-hero-v2.png" x="0" y="0" width={PLATE.width} height={PLATE.height} preserveAspectRatio="none" />
        <rect className="map-shade strong" width={PLATE.width} height={PLATE.height} />
        {routeDefinitions.map((route) => route.id !== activeRoute.id && <DrawingRoute
          key={route.id}
          points={routes[route.id]}
          color={route.color}
          status={routeStatuses[route.id] ?? route.status}
          terminals
        />)}
        {routes[activeRoute.id] && draft.length === 0 && <DrawingRoute points={routes[activeRoute.id]} color={activeRoute.color} status={activeStatus} terminals />}
        {draft.length > 0 && <DrawingRoute points={draft} color={activeRoute.color} draft terminals />}
        {Object.keys(mapNodes).map((nodeId) => <MapNode key={nodeId} nodeId={nodeId} />)}
      </svg>
      <div className="coordinate-readout">Escala calibrada · Grafo: {Object.keys(mapNodes).length} nodos / {savedCount} vias</div>
    </div>
    <aside className="properties-panel">
      <div className="panel-title">
        <span>Corregir rutas</span>
        <Badge tone="pending">{savedCount} / {routeDefinitions.length}</Badge>
      </div>
      <div className="route-tabs">
        {routeDefinitions.map((route, index) => <button
          key={route.id}
          className={`${index === activeIndex ? 'active' : ''} ${routes[route.id]?.length ? 'saved' : ''}`}
          onClick={() => { setActiveIndex(index); setDraft([]); setMessage(`Dibuje ${route.code}: ${route.direction}`) }}
        >
          <i style={{ background: route.color }} />
          <span><strong>{route.code}</strong>{route.name}</span>
          <em>{routes[route.id]?.length ? 'OK' : String(index + 1).padStart(2, '0')}</em>
        </button>)}
      </div>
      <div className="property-list">
        <label>Tipo de via<input value="Acarreo principal" readOnly /></label>
        <label>Velocidad maxima<input value={activeRoute.maxSpeed} readOnly /></label>
        <label>Pendiente<input value={activeRoute.slope} readOnly /></label>
        <label>Estado<input value={activeStatus} readOnly /></label>
      </div>
      <p className="editor-message">{message}</p>
      <div className="split-actions">
        <button onClick={() => { setDraft([]); setMessage('Trazo descartado.') }}>Deshacer</button>
        <button className="primary-button" onClick={saveRoute}>Guardar ruta</button>
      </div>
      <button className="danger-link" onClick={clearRoute}>Eliminar ruta guardada</button>
    </aside>
  </div>
}

function MineConfig({ routes, setRoutes, routeStatuses }) {
  return <section className="section">
    <div className="section-heading">
      <div>
        <small>Asistente de mapa</small>
        <h1>Configuracion de mina</h1>
        <p>Las rutas detectadas o dibujadas quedan en revision hasta que un administrador valida el grafo operativo.</p>
      </div>
      <div className="stepper">
        <span className="done">1 Importar</span>
        <span className="active">2 Corregir rutas</span>
        <span>3 Validar</span>
      </div>
    </div>
    <div className="config-status-row">
      <KpiCard label="Mapa cargado" value="OK" detail="Imagen de tajo abierto" />
      <KpiCard label="Rutas detectadas" value="4" detail="Asistidas, no automaticas" />
      <KpiCard label="Revision" value="Pendiente" detail="R12 requiere validacion" tone="warning" />
      <KpiCard label="Grafo interno" value="5 / 4" detail="Nodos / aristas" tone="accent" />
    </div>
    <RouteEditor routes={routes} setRoutes={setRoutes} routeStatuses={routeStatuses} />
  </section>
}

function FleetTable({ rows, columns, selectedId, onSelect }) {
  return <div className="table-wrap">
    <table>
      <thead><tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr></thead>
      <tbody>
        {rows.map((row) => <tr key={row.id} className={selectedId === row.id ? 'selected' : ''} onClick={() => onSelect(row.id)}>
          {columns.map((column) => <td key={column.key}>{column.render ? column.render(row) : row[column.key]}</td>)}
        </tr>)}
      </tbody>
    </table>
  </div>
}

function Fleet({ selectedTruck, setSelectedTruck }) {
  const [tab, setTab] = useState('trucks')
  const truck = trucks.find((item) => item.id === selectedTruck) ?? trucks[0]
  const rows = tab === 'trucks' ? trucks : tab === 'shovels' ? shovels : devices
  const columns = tab === 'trucks'
    ? [
      { key: 'id', label: 'Codigo' },
      { key: 'model', label: 'Modelo' },
      { key: 'capacity', label: 'Capacidad' },
      { key: 'state', label: 'Estado', render: (row) => <Badge tone={statusTone[row.state]}>{row.state}</Badge> },
      { key: 'speed', label: 'Velocidad', render: (row) => `${row.speed} km/h` },
      { key: 'load', label: 'Carga' },
      { key: 'route', label: 'Ruta' },
      { key: 'destination', label: 'Destino' },
      { key: 'shovel', label: 'Pala' },
      { key: 'stopped', label: 'Detenido' },
      { key: 'signal', label: 'Ult. act.' },
    ]
    : tab === 'shovels'
      ? [
        { key: 'id', label: 'ID' },
        { key: 'state', label: 'Estado', render: (row) => <Badge tone={statusTone[row.state]}>{row.state}</Badge> },
        { key: 'location', label: 'Ubicacion' },
        { key: 'loadTime', label: 'Carga prom.' },
        { key: 'queue', label: 'Cola' },
        { key: 'capacity', label: 'Capacidad' },
        { key: 'assigned', label: 'Asignados' },
        { key: 'material', label: 'Material' },
        { key: 'availability', label: 'Disp.' },
      ]
      : [
        { key: 'id', label: 'Dispositivo' },
        { key: 'truck', label: 'Camion asociado' },
        { key: 'gps', label: 'GPS' },
        { key: 'connection', label: 'Conexion', render: (row) => <Badge tone={row.connection === 'Online' ? 'open' : 'offline'}>{row.connection}</Badge> },
        { key: 'battery', label: 'Bateria' },
        { key: 'lastSignal', label: 'Ultima senal' },
        { key: 'quality', label: 'Calidad' },
      ]

  return <section className="section">
    <div className="section-heading compact">
      <div>
        <small>Sincronizacion en tiempo real</small>
        <h1>Flota y equipos</h1>
      </div>
      <div className="tab-row">
        <button className={tab === 'trucks' ? 'active' : ''} onClick={() => setTab('trucks')}>Camiones</button>
        <button className={tab === 'shovels' ? 'active' : ''} onClick={() => setTab('shovels')}>Palas</button>
        <button className={tab === 'devices' ? 'active' : ''} onClick={() => setTab('devices')}>Dispositivos</button>
      </div>
    </div>
    <div className="fleet-layout">
      <FleetTable rows={rows} columns={columns} selectedId={selectedTruck} onSelect={tab === 'trucks' ? setSelectedTruck : () => {}} />
      <aside className="equipment-panel">
        <div className="vehicle-hero">
          <span>▣</span>
          <div>
            <strong>{truck.id}</strong>
            <small>{truck.model}</small>
          </div>
          <Badge tone={truck.connection === 'Online' ? 'open' : 'offline'}>{truck.connection}</Badge>
        </div>
        <div className="equipment-visual">
          <div className="wireframe-truck">CAT 797F</div>
        </div>
        <div className="mini-grid">
          <div><small>Operador</small><strong>{truck.operator}</strong></div>
          <div><small>Capacidad</small><strong>{truck.capacity}</strong></div>
          <div><small>GPS</small><strong>{truck.gps}</strong></div>
          <div><small>Bateria</small><strong>{truck.battery}</strong></div>
        </div>
        <dl className="detail-grid">
          <div><dt>Peso vacio</dt><dd>623 t</dd></div>
          <div><dt>Vel. max.</dt><dd>64 km/h</dd></div>
          <div><dt>Vel. cargado</dt><dd>42 km/h</dd></div>
          <div><dt>Pendiente max.</dt><dd>10%</dd></div>
          <div><dt>Palas compatibles</dt><dd>P01, P02</dd></div>
          <div><dt>Destino</dt><dd>{truck.destination}</dd></div>
        </dl>
        <div className="panel-actions">
          <button>Asignar ruta</button>
          <button>Editar equipo</button>
        </div>
      </aside>
    </div>
  </section>
}

function Optimization({ onRun }) {
  return <section className="section">
    <div className="section-heading">
      <div>
        <small>Motor supervisado</small>
        <h1>Optimizacion y analisis</h1>
        <p>La plataforma muestra la recomendacion, restricciones e impacto esperado. La decision final queda en despacho.</p>
      </div>
      <div className="heading-actions">
        <button>Parametrizar</button>
        <button className="primary-button" onClick={onRun}>Ejecutar optimizacion</button>
      </div>
    </div>
    <div className="analysis-kpis">
      <KpiCard label="Metodo actual" value="42 min" detail="Espera total estimada" />
      <KpiCard label="PukarIA IA" value="27 min" detail="Espera proyectada" tone="accent" />
      <KpiCard label="Impacto esperado" value="-15 min" detail="Reduccion de ciclo" tone="accent" />
      <KpiCard label="Confianza" value="86%" detail="Datos GPS + vision validada" />
    </div>
    <div className="analysis-layout">
      <article className="matrix-panel">
        <div className="panel-title">
          <span>Matriz de tiempos predichos</span>
          <Badge tone="open">MVP simulado</Badge>
        </div>
        <table>
          <thead><tr><th>Camion</th><th>Pala P01</th><th>Pala P02</th><th>Decision</th><th>Motivo</th></tr></thead>
          <tbody>
            {predictionRows.map((row) => <tr key={row.truck}>
              <td>{row.truck}</td>
              <td>{row.p1}</td>
              <td>{row.p2}</td>
              <td><Badge tone="accent">{row.decision}</Badge></td>
              <td>{row.reason}</td>
            </tr>)}
          </tbody>
        </table>
      </article>
      <article className="impact-panel">
        <div className="panel-title">
          <span>Comparacion operativa</span>
          <Badge tone="pending">Pendiente aprobar</Badge>
        </div>
        <div className="bar-chart">
          {[68, 82, 96].map((height, index) => <div key={index} className="bar-group">
            <i style={{ height: `${height - 18}%` }} />
            <b style={{ height: `${height}%` }} />
            <span>{['08:00', '08:30', '09:00'][index]}</span>
          </div>)}
        </div>
        <ul className="plain-list">
          <li>Camiones disponibles: T01, T03, T07.</li>
          <li>Palas activas: P01 saturada, P02 operativa.</li>
          <li>Restricciones: R04 no se cierra sin confirmacion humana.</li>
          <li>Reduccion estimada de congestion: 21%.</li>
        </ul>
      </article>
    </div>
  </section>
}

function MobileVehicle({ closeMobile }) {
  const [tab, setTab] = useState('route')
  const [status, setStatus] = useState('Vacio')
  const [incident, setIncident] = useState('Ruta bloqueada')
  return <section className="mobile-view">
    <div className="phone-shell">
      <header className="phone-top">
        <div><strong>T07</strong><span>PukarIA Route Optimization</span></div>
        <h1>{tab === 'route' ? 'Ruta' : tab === 'status' ? 'Estado' : tab === 'report' ? 'Reportar' : 'Turno'}</h1>
        <button onClick={closeMobile}>Admin</button>
      </header>
      {tab === 'route' && <div className="phone-content">
        <div className="destination-band">
          <small>Destino actual</small>
          <strong>Pala P02</strong>
          <Badge tone="open">{status}</Badge>
          <div className="trip-stats">
            <span><b>2.4</b> km</span>
            <span><b>7</b> min</span>
            <span>Via abierta</span>
          </div>
        </div>
        <div className="phone-map">
          <span className="route-line" />
          <i className="truck-dot" />
          <i className="target-dot" />
        </div>
        <button className="primary-button wide">Confirmar asignacion</button>
        <button className="danger-button wide">Reportar imposibilidad</button>
      </div>}
      {tab === 'status' && <div className="phone-content">
        <div className="status-grid">
          {['Disponible', 'Vacio', 'Cargado', 'En cola', 'Cargando', 'Descargando', 'Averiado', 'En mantenimiento'].map((item) => <button
            key={item}
            className={status === item ? 'active' : ''}
            onClick={() => setStatus(item)}
          >{item}</button>)}
        </div>
      </div>}
      {tab === 'report' && <div className="phone-content">
        <div className="status-grid compact">
          {['Ruta bloqueada', 'Derrumbe', 'Via deteriorada', 'Camion detenido', 'Pala fuera de servicio', 'Congestion', 'Otro incidente'].map((item) => <button
            key={item}
            className={incident === item ? 'active' : ''}
            onClick={() => setIncident(item)}
          >{item}</button>)}
        </div>
        <textarea placeholder="Comentario opcional" />
        <button className="primary-button wide">Enviar reporte con ubicacion</button>
        <small className="phone-note">Se adjunta camion, ruta, fecha, hora y GPS automaticamente.</small>
      </div>}
      {tab === 'shift' && <div className="phone-content">
        <dl className="shift-grid">
          <div><dt>GPS</dt><dd>Activo</dd></div>
          <div><dt>Conexion</dt><dd>Online</dd></div>
          <div><dt>Ultima sinc.</dt><dd>Hace 11 s</dd></div>
          <div><dt>Vehiculo</dt><dd>T07</dd></div>
          <div><dt>Ciclos</dt><dd>5</dd></div>
          <div><dt>Movimiento</dt><dd>3 h 24 min</dd></div>
          <div><dt>Detenido</dt><dd>18 min</dd></div>
          <div><dt>Distancia</dt><dd>42.7 km</dd></div>
        </dl>
      </div>}
      <nav className="phone-nav">
        <button className={tab === 'route' ? 'active' : ''} onClick={() => setTab('route')}>Ruta</button>
        <button className={tab === 'status' ? 'active' : ''} onClick={() => setTab('status')}>Estado</button>
        <button className={tab === 'report' ? 'active' : ''} onClick={() => setTab('report')}>Reportar</button>
        <button className={tab === 'shift' ? 'active' : ''} onClick={() => setTab('shift')}>Turno</button>
      </nav>
    </div>
  </section>
}

export default function App() {
  const [section, setSection] = useState('dashboard')
  const [routes, setRoutes] = useState(loadRoutes)
  const [selectedTruck, setSelectedTruck] = useState('T05')
  const [alerts, setAlerts] = useState(alertsSeed)
  const [routeStatuses, setRouteStatuses] = useState({})
  const [mobileOpen, setMobileOpen] = useState(false)
  const [toast, setToast] = useState('')

  const runOptimization = () => {
    setSection('optimization')
    setToast('Optimizacion ejecutada. Recomendaciones pendientes de aprobacion.')
    window.setTimeout(() => setToast(''), 3200)
  }

  const onAlertAction = (id, action) => {
    if (action === 'Confirmar' || action === 'Cerrar ruta') {
      setRouteStatuses((current) => ({ ...current, shovel01: 'Bloqueada' }))
    }
    if (['Confirmar', 'Descartar', 'Aceptar', 'Rechazar', 'Cerrar ruta'].includes(action)) {
      setAlerts((current) => current.filter((alert) => alert.id !== id))
    }
    if (action === 'Ver ubicacion') setSelectedTruck('T05')
    if (action === 'Recalcular asignaciones' || action === 'Aceptar') runOptimization()
    setToast(`${action}: decision registrada para auditoria.`)
    window.setTimeout(() => setToast(''), 2800)
  }

  return <main className={`app-shell ${mobileOpen ? 'show-mobile' : ''}`}>
    {!mobileOpen && <Sidebar section={section} setSection={setSection} openMobile={() => setMobileOpen(true)} />}
    {!mobileOpen && <div className="workspace">
      <Topbar currentSection={section} openMobile={() => setMobileOpen(true)} runOptimization={runOptimization} />
      {section === 'dashboard' && <Dashboard routes={routes} routeStatuses={routeStatuses} selectedTruck={selectedTruck} setSelectedTruck={setSelectedTruck} alerts={alerts} onAlertAction={onAlertAction} />}
      {section === 'mine' && <MineConfig routes={routes} setRoutes={setRoutes} routeStatuses={routeStatuses} />}
      {section === 'fleet' && <Fleet selectedTruck={selectedTruck} setSelectedTruck={setSelectedTruck} />}
      {section === 'optimization' && <Optimization onRun={runOptimization} />}
    </div>}
    {mobileOpen && <MobileVehicle closeMobile={() => setMobileOpen(false)} />}
    {toast && <div className="toast">{toast}</div>}
  </main>
}
