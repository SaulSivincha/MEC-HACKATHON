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
    code: 'R04B',
    name: 'Desvio norte',
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
    route: 'R04B',
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
  { truck: 'T01', p1: '32 min', p2: '27 min', decision: 'P02', reason: 'Menor cola y ruta R04B abierta' },
  { truck: 'T02', p1: '29 min', p2: '31 min', decision: 'P01', reason: 'Ya esta cargando en P01' },
  { truck: 'T03', p1: '34 min', p2: '26 min', decision: 'P02', reason: 'Evita tramo R04 saturado' },
  { truck: 'T07', p1: '35 min', p2: '28 min', decision: 'P02', reason: 'Compatible y disponible' },
]

const modelSignals = [
  { name: 'cola_p1', value: '3 camiones', weight: 'Alta', detail: 'P01 esta saturada y sube el costo esperado.' },
  { name: 'cola_p2', value: '1 camion', weight: 'Alta', detail: 'P02 mantiene menor espera operacional.' },
  { name: 'dist_p1 / dist_p2', value: '5.0 / 12.0', weight: 'Media', detail: 'La distancia no gana sola si hay cola o pendiente.' },
  { name: 'pendiente_p1 / p2', value: '18 / 5 grados', weight: 'Alta', detail: 'El modelo castiga pendientes fuertes con desgaste alto.' },
  { name: 'desgaste_motor', value: '0.63 prom.', weight: 'Media', detail: 'Reduce prioridad de rutas exigentes.' },
  { name: 'tiempo_giro', value: '92 s prom.', weight: 'Media', detail: 'Afecta acceso y maniobra en pala.' },
]

const liveTelemetry = [
  { truck: 'T01', current: 'R04 hacia P01', cola_p1: 9, cola_p2: 1, dist_p1: 5, dist_p2: 12, clima_severidad: .22, desgaste_motor: .58, pendiente_p1: 18, pendiente_p2: 5, tiempo_giro_p1: 116, tiempo_giro_p2: 74, etaP1: 32, etaP2: 27, safety: 'normal' },
  { truck: 'T02', current: 'Cargando en P01', cola_p1: 3, cola_p2: 1, dist_p1: 5, dist_p2: 12, clima_severidad: .2, desgaste_motor: .41, pendiente_p1: 18, pendiente_p2: 5, tiempo_giro_p1: 58, tiempo_giro_p2: 91, etaP1: 8, etaP2: 31, safety: 'loading' },
  { truck: 'T03', current: 'Detenido en R04', cola_p1: 10, cola_p2: 1, dist_p1: 5, dist_p2: 12, clima_severidad: .35, desgaste_motor: .67, pendiente_p1: 18, pendiente_p2: 5, tiempo_giro_p1: 142, tiempo_giro_p2: 80, etaP1: 34, etaP2: 26, safety: 'blocked' },
  { truck: 'T04', current: 'R00 acceso principal', cola_p1: 3, cola_p2: 1, dist_p1: 5, dist_p2: 12, clima_severidad: .12, desgaste_motor: .35, pendiente_p1: 18, pendiente_p2: 5, tiempo_giro_p1: 103, tiempo_giro_p2: 68, etaP1: 35, etaP2: 28, safety: 'normal' },
  { truck: 'T06', current: 'R12 hacia chancadora', cola_p1: 3, cola_p2: 1, dist_p1: 5, dist_p2: 12, clima_severidad: .28, desgaste_motor: .74, pendiente_p1: 18, pendiente_p2: 5, tiempo_giro_p1: 130, tiempo_giro_p2: 86, etaP1: null, etaP2: null, safety: 'offline' },
  { truck: 'T07', current: 'Disponible', cola_p1: 3, cola_p2: 1, dist_p1: 5, dist_p2: 12, clima_severidad: .16, desgaste_motor: .46, pendiente_p1: 18, pendiente_p2: 5, tiempo_giro_p1: 98, tiempo_giro_p2: 66, etaP1: 35, etaP2: 28, safety: 'normal' },
]

function estimatePukarIA(telemetry) {
  const etaP1 = (telemetry.dist_p1 * 2)
    + (telemetry.cola_p1 * 2.5)
    + (telemetry.desgaste_motor * telemetry.pendiente_p1 * .5)
    + (telemetry.tiempo_giro_p1 / 60)
    + (telemetry.clima_severidad * telemetry.pendiente_p1 * .8)
  const etaP2 = (telemetry.dist_p2 * 2)
    + (telemetry.cola_p2 * 2.5)
    + (telemetry.desgaste_motor * telemetry.pendiente_p2 * .5)
    + (telemetry.tiempo_giro_p2 / 60)
    + (telemetry.clima_severidad * telemetry.pendiente_p2 * .8)
  const decision = etaP1 <= etaP2 ? 'Pala P01' : 'Pala P02'
  const eta = decision === 'Pala P01' ? etaP1 : etaP2
  const margin = Math.abs(etaP1 - etaP2)
  const confidence = Math.round(Math.min(96, 58 + margin * 2.1))
  return { decision, confidence, eta: Math.round(eta), etaP1: Math.round(etaP1), etaP2: Math.round(etaP2) }
}

const aiInstructionRows = liveTelemetry.map((telemetry) => {
  const truck = trucks.find((item) => item.id === telemetry.truck)
  const prediction = estimatePukarIA(telemetry)
  const isP2 = prediction.decision === 'Pala P02'
  const base = {
    truck: telemetry.truck,
    operator: truck?.operator ?? 'Operador',
    current: telemetry.current,
    destination: prediction.decision,
    eta: `${prediction.eta} min`,
    confidence: prediction.confidence,
    modelEta: `${prediction.etaP1} / ${prediction.etaP2}`,
    telemetry,
  }

  if (telemetry.safety === 'loading') {
    return {
      ...base,
      instruction: 'Mantener ciclo actual',
      destination: 'Pala P01',
      confidence: 94,
      consensus: 'Regla operacional domina',
      reason: 'El camion ya esta cargando; moverlo generaria tiempo muerto aunque el modelo compare destinos.',
      status: 'No enviar',
      risk: 'Bajo',
    }
  }

  if (telemetry.safety === 'offline') {
    return {
      ...base,
      instruction: 'Mantener ultima instruccion descargada',
      destination: 'Chancadora D01',
      confidence: 52,
      consensus: 'Falta senal GPS',
      reason: 'El celular esta offline; PukarIA no emite nueva orden remota hasta recuperar sincronizacion.',
      status: 'Retener',
      risk: 'Alto',
    }
  }

  if (telemetry.safety === 'blocked') {
    return {
      ...base,
      instruction: 'Esperar confirmacion de bloqueo y preparar desvio',
      consensus: 'Modelo + seguridad coinciden',
      reason: `ETA ML P01/P02: ${base.modelEta} min. El bloqueo probable exige confirmacion humana antes de cerrar R04.`,
      status: 'Requiere confirmacion',
      risk: 'Alto',
    }
  }

  return {
    ...base,
    instruction: isP2 ? 'Asignar a Pala P02 por R04B' : 'Asignar a Pala P01 por R04',
    consensus: 'Modelo + dispatcher coinciden',
    reason: `ETA ML P01/P02: ${base.modelEta} min. Luego la optimizacion asigna camiones a palas minimizando colas.`,
    status: isP2 ? 'Lista para enviar' : 'Pendiente despacho',
    risk: isP2 ? 'Bajo' : 'Medio',
  }
})

const navItems = [
  { id: 'dashboard', label: 'Dashboard operativo', icon: '▦' },
  { id: 'mine', label: 'Configuracion de mina', icon: '≡' },
  { id: 'fleet', label: 'Flota y equipos', icon: '⚒' },
  { id: 'optimization', label: 'Optimizacion y analisis', icon: '▧' },
  { id: 'instructions', label: 'Indicaciones IA', icon: 'IA' },
]

const statusTone = {
  Abierta: 'open',
  Congestionada: 'congested',
  Bloqueada: 'blocked',
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

const cubicPoint = (p1, c1, c2, p2, t) => {
  const inverse = 1 - t
  return [
    inverse ** 3 * p1[0] + 3 * inverse ** 2 * t * c1[0] + 3 * inverse * t ** 2 * c2[0] + t ** 3 * p2[0],
    inverse ** 3 * p1[1] + 3 * inverse ** 2 * t * c1[1] + 3 * inverse * t ** 2 * c2[1] + t ** 3 * p2[1],
  ]
}

const routeSample = (points = [], progress, direction = 1, lane = 0) => {
  if (!points.length) return { x: 0, y: 0, angle: 0 }
  const filtered = lightlySmooth(points).filter((_, index) => index === 0 || index === points.length - 1 || index % 3 === 0)
  if (filtered.length < 2) return { x: filtered[0]?.[0] ?? 0, y: filtered[0]?.[1] ?? 0, angle: 0 }
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
  const target = clamp01(progress) * (cumulative.at(-1) || 1)
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

function useSimulationClock(isRunning = true, resetKey = 0) {
  const [time, setTime] = useState(0)
  useEffect(() => {
    setTime(0)
  }, [resetKey])

  useEffect(() => {
    if (!isRunning) return undefined
    let frame
    let last = performance.now()
    const animate = (now) => {
      const elapsed = (now - last) / 1000
      last = now
      setTime((current) => (current + elapsed) % 70)
      frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [isRunning, resetKey])
  return time
}

function pukariaTruckMotion(id, time, accepted) {
  const t = time
  if (id === 'T01') {
    if (t < 10) return { route: 'access', progress: between(t, 0, 10, .02, .78), direction: 1, state: 'En ruta', load: 'Vacio', lane: -16 }
    if (t < 20) return { route: 'shovel01', progress: between(t, 10, 20, .08, .72), direction: 1, state: 'En ruta', load: 'Vacio', lane: -12 }
    if (t < 30) return { route: 'shovel01', progress: .72, direction: 1, state: 'En cola', load: 'Vacio', lane: -12 }
    if (t < 40) return { route: 'shovel01', progress: between(t, 30, 40, .72, .98), direction: 1, state: 'Cargando', load: 'Vacio', lane: -12 }
    if (t < 52) return { route: 'shovel01', progress: between(t, 40, 52, .98, .05), direction: -1, state: 'En ruta', load: 'Cargado', lane: 12 }
    return { route: 'crusher', progress: between(t, 52, 70, .05, .74), direction: 1, state: 'Descargando', load: 'Cargado', lane: -12 }
  }
  if (id === 'T02') {
    if (t < 8) return { route: 'access', progress: between(t, 0, 8, .01, .88), direction: 1, state: 'En ruta', load: 'Vacio', lane: -6 }
    if (t < 18) return { route: 'shovel01', progress: between(t, 8, 18, .12, .98), direction: 1, state: 'Cargando', load: 'Vacio', lane: -6 }
    if (t < 30) return { route: 'shovel01', progress: between(t, 18, 30, .98, .04), direction: -1, state: 'En ruta', load: 'Cargado', lane: 10 }
    if (t < 45) return { route: 'crusher', progress: between(t, 30, 45, .05, .98), direction: 1, state: 'Descargando', load: 'Cargado', lane: -10 }
    return { route: 'crusher', progress: between(t, 45, 70, .98, .08), direction: -1, state: 'En ruta', load: 'Vacio', lane: 10 }
  }
  if (id === 'T03') {
    if (t < 10) return { route: 'access', progress: between(t, 0, 10, .00, .70), direction: 1, state: 'En ruta', load: 'Vacio', lane: -24 }
    if (t < 23) return { route: 'shovel01', progress: between(t, 10, 23, .04, .58), direction: 1, state: 'En ruta', load: 'Vacio', lane: -20 }
    if (t < 42) return { route: 'shovel01', progress: .58, direction: 1, state: 'Detenido', load: 'Vacio', lane: -20 }
    if (t < 50) return { route: 'shovel01', progress: between(t, 42, 50, .58, .18), direction: -1, state: 'En ruta', load: 'Vacio', lane: 18 }
    return { route: accepted ? 'shovel02' : 'shovel01', progress: between(t, 50, 70, .05, accepted ? .84 : .98), direction: 1, state: accepted ? 'En ruta' : 'En cola', load: 'Vacio', lane: accepted ? -18 : -20 }
  }
  if (id === 'T04') {
    if (t < 12) return { route: 'access', progress: between(t, 0, 12, .00, .95), direction: 1, state: 'En ruta', load: 'Vacio', lane: 6 }
    if (t < 35) return { route: 'access', progress: .95, direction: 1, state: 'En cola', load: 'Vacio', lane: 6 }
    if (t < 45) return { route: 'access', progress: .95, direction: 1, state: 'En ruta', load: 'Vacio', lane: 12, aiState: 'Analizando IA' }
    if (t < 62) return { route: 'shovel02', progress: between(t, 45, 62, .04, .98), direction: 1, state: 'En ruta', load: 'Vacio', lane: -12, aiState: 'Redirigido IA' }
    return { route: 'shovel02', progress: .98, direction: 1, state: 'Cargando', load: 'Vacio', lane: -12 }
  }
  if (id === 'T05') {
    if (t < 14) return { route: 'access', progress: between(t, 0, 14, .00, .82), direction: 1, state: 'En ruta', load: 'Vacio', lane: 18 }
    if (t < 25) return { route: 'shovel01', progress: between(t, 14, 25, .06, .70), direction: 1, state: 'En ruta', load: 'Vacio', lane: -28 }
    if (t < 43) return { route: 'shovel01', progress: .70, direction: 1, state: 'En cola', load: 'Vacio', lane: -28 }
    if (t < 52) return { route: 'shovel01', progress: between(t, 43, 52, .70, .12), direction: -1, state: 'En ruta', load: 'Vacio', lane: 26, aiState: 'Liberado' }
    return { route: 'shovel02', progress: between(t, 52, 70, .03, .66), direction: 1, state: 'En ruta', load: 'Vacio', lane: -22, aiState: 'Redirigido IA' }
  }
  if (id === 'T06') {
    if (t < 12) return { route: 'access', progress: between(t, 0, 12, .00, .62), direction: 1, state: 'En ruta', load: 'Vacio', lane: 28 }
    if (t < 28) return { route: 'crusher', progress: between(t, 12, 28, .18, .98), direction: 1, state: 'Descargando', load: 'Cargado', lane: -14 }
    if (t < 45) return { route: 'crusher', progress: between(t, 28, 45, .98, .18), direction: -1, state: 'Sin conexion', load: 'Vacio', lane: 16 }
    if (t < 55) return { route: 'crusher', progress: between(t, 45, 55, .18, .04), direction: -1, state: 'En ruta', load: 'Vacio', lane: 14, aiState: 'Reconectado' }
    return { route: 'shovel02', progress: between(t, 55, 70, .04, .72), direction: 1, state: 'En ruta', load: 'Vacio', lane: -14, aiState: 'Redirigido IA' }
  }
  if (id === 'T07') {
    if (t < 11) return { route: 'access', progress: between(t, 0, 11, .00, .74), direction: 1, state: 'En ruta', load: 'Vacio', lane: 34 }
    if (t < 38) return { route: 'access', progress: .74, direction: 1, state: 'Disponible', load: 'Vacio', lane: 34, aiState: 'Esperando ETA' }
    if (t < 47) return { route: 'access', progress: between(t, 38, 47, .74, .95), direction: 1, state: 'En ruta', load: 'Vacio', lane: 24, aiState: 'Analizando IA' }
    return { route: accepted ? 'shovel02' : 'shovel01', progress: between(t, 47, 70, .04, accepted ? .90 : .68), direction: 1, state: 'En ruta', load: 'Vacio', lane: accepted ? -30 : -24, aiState: accepted ? 'Redirigido IA' : 'Pendiente' }
  }
  if (t < 16) return { route: 'access', progress: between(t, 0, 16, .00, .58), direction: 1, state: 'En ruta', load: 'Vacio', lane: 42 }
  if (t < 35) return { route: 'crusher', progress: between(t, 16, 35, .12, .98), direction: 1, state: 'Descargando', load: 'Cargado', lane: -22 }
  if (t < 56) return { route: 'crusher', progress: between(t, 35, 56, .98, .05), direction: -1, state: 'En ruta', load: 'Vacio', lane: 20 }
  return { route: 'access', progress: between(t, 56, 70, .95, .18), direction: -1, state: 'En ruta', load: 'Vacio', lane: 36 }
}

function getSimulationSnapshot(time, sentInstructions = {}) {
  const stageIndex = Math.min(6, Math.floor(time / 10))
  const stageProgress = (time % 10) / 10
  const accepted = stageIndex >= 4 || sentInstructions.T01 === 'Enviado al vehiculo' || sentInstructions.T07 === 'Enviado al vehiculo'
  const normalized = (from, to) => between(stageProgress, 0, 1, from, to)
  const dayHour = 6 + (time / 70) * 12
  const dayH = Math.floor(dayHour)
  const dayM = Math.floor((dayHour - dayH) * 60)
  const simulatedHour = `${String(dayH).padStart(2, '0')}:${String(dayM).padStart(2, '0')}`

  const p01WaitByStage = [
    normalized(0, 4),
    normalized(4, 7),
    normalized(7, 14),
    normalized(14, 19),
    normalized(19, 10),
    normalized(10, 6),
    normalized(6, 3),
  ]
  const p02WaitByStage = [
    normalized(0, 3),
    normalized(3, 5),
    normalized(5, 6),
    normalized(6, 7),
    normalized(7, 10),
    normalized(10, 8),
    normalized(8, 4),
  ]
  const r04SpeedByStage = [
    normalized(0, 28),
    normalized(28, 24),
    normalized(24, 11),
    normalized(11, 3),
    normalized(3, 16),
    normalized(16, 24),
    normalized(24, 18),
  ]
  const p01Wait = p01WaitByStage[stageIndex]
  const p02Wait = p02WaitByStage[stageIndex]
  const r04Speed = r04SpeedByStage[stageIndex]
  const truckCountP01 = stageIndex === 0 ? Math.round(normalized(0, 2)) : stageIndex < 3 ? 3 : stageIndex < 5 ? 4 : 3
  const truckCountP02 = stageIndex === 0 ? Math.round(normalized(0, 1)) : stageIndex < 4 ? 1 : stageIndex < 6 ? 2 : 2
  const motion = Object.fromEntries(trucks.map((truck) => [truck.id, pukariaTruckMotion(truck.id, time, accepted)]))

  return {
    time,
    stageIndex,
    simulatedHour,
    accepted,
    title: ['Inicio de jornada', 'Ingreso de flota', 'Cola creciendo', 'Bloqueo probable', 'Reasignacion IA', 'Despeje de R04', 'Cierre de jornada'][stageIndex],
    detail: [
      'Todos los camiones parten desde patio/acceso. PukarIA toma la primera senal GPS y despacha entradas escalonadas.',
      'Los camiones entran desde patio y PukarIA calcula ETA antes de asignar pala.',
      'Aumenta la espera en P01; el sistema compara ETA camion-pala cada ciclo.',
      'R04 cae casi a cero por detenciones consecutivas. La ruta queda pendiente de confirmacion.',
      'La optimizacion redistribuye camiones a P02 para bajar cola sin cerrar automaticamente R04.',
      'Los camiones retenidos vuelven a moverse y la velocidad de R04 se recupera.',
      'La flota cierra ciclos, reduce velocidad y vuelve a patio para el cierre operacional del dia.',
    ][stageIndex],
    routeOverrides: {
      T01: motion.T01.route,
      T02: motion.T02.route,
      T03: motion.T03.route,
      T04: motion.T04.route,
      T05: motion.T05.route,
      T06: motion.T06.route,
      T07: motion.T07.route,
      T08: motion.T08.route,
    },
    routeStatuses: {
      shovel01: stageIndex < 2 ? 'Abierta' : stageIndex < 3 ? 'Congestionada' : stageIndex < 5 ? 'Bloqueada' : 'Abierta',
      shovel02: accepted ? 'Abierta' : 'Abierta',
      crusher: stageIndex >= 4 ? 'Abierta' : 'Pendiente de validacion',
    },
    vehicleStates: {
      T01: motion.T01.state,
      T02: motion.T02.state,
      T03: motion.T03.state,
      T04: motion.T04.state,
      T05: motion.T05.state,
      T06: motion.T06.state,
      T07: motion.T07.state,
      T08: motion.T08.state,
    },
    progress: {
      T01: motion.T01.progress,
      T02: motion.T02.progress,
      T03: motion.T03.progress,
      T04: motion.T04.progress,
      T05: motion.T05.progress,
      T06: motion.T06.progress,
      T07: motion.T07.progress,
      T08: motion.T08.progress,
    },
    motion,
    queues: [
      { label: 'Pala P01', value: Math.round(p01Wait), trucks: truckCountP01, tone: p01Wait > 12 ? 'critical' : 'warning' },
      { label: 'Pala P02', value: Math.round(p02Wait), trucks: truckCountP02, tone: 'accent' },
      { label: 'Chancadora', value: stageIndex < 2 ? 9 : 7, trucks: 2, tone: 'open' },
    ],
    cycle: {
      current: stageIndex === 0 ? Math.round(normalized(0, 24)) : stageIndex < 3 ? 42 : Math.round(normalized(39, 29)),
      optimized: stageIndex === 0 ? Math.round(normalized(0, 18)) : stageIndex < 3 ? 27 : Math.round(normalized(31, 27)),
      r04Speed: Math.round(r04Speed),
      confidence: stageIndex === 0 ? Math.round(normalized(48, 70)) : stageIndex < 3 ? 74 : 88,
    },
    assignment: {
      p01: truckCountP01,
      p02: truckCountP02,
      reducedWait: Math.max(0, Math.round(18 - p01Wait)),
    },
  }
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

function Topbar({ currentSection, openMobile, runOptimization, detailMode, setDetailMode }) {
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
      <button className="ghost-button" onClick={() => setDetailMode(detailMode === 'simple' ? 'complete' : 'simple')}>
        {detailMode === 'simple' ? 'Ver completo' : 'Ver resumen'}
      </button>
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

function TruckMarker({ truck, routes, time, simulation, selected, onSelect }) {
  const motion = simulation?.motion?.[truck.id]
  const routeId = motion?.route ?? simulation?.routeOverrides?.[truck.id] ?? truck.routeId
  const visualState = motion?.state ?? simulation?.vehicleStates?.[truck.id] ?? truck.state
  const route = routes[routeId] || routes.access || []
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
  const progress = motion?.progress ?? simulation?.progress?.[truck.id] ?? progressByTruck[truck.id] ?? .45
  const direction = motion?.direction ?? (truck.load === 'Cargado' ? -1 : 1)
  const lane = motion?.lane ?? (direction === 1 ? -12 : 12)
  const sample = routeSample(route, progress, direction, lane)
  const statusLabel = motion?.aiState ?? motion?.load ?? visualState
  return <g
    className={`truck-marker tone-${statusTone[visualState] ?? 'moving'} ${selected ? 'selected' : ''}`}
    transform={`translate(${sample.x} ${sample.y})`}
    onPointerDown={(event) => event.stopPropagation()}
    onClick={(event) => { event.stopPropagation(); onSelect(truck.id) }}
  >
    <circle className="truck-pulse" r="28" />
    <g className="truck-visual" transform={`rotate(${sample.angle})`}>
      <ellipse className="truck-shadow" cx="0" cy="2" rx="25" ry="15" />
      <rect className="truck-chassis" x="-22" y="-10" width="44" height="20" rx="5" />
      <path className="truck-bed" d="M-21-9H3V9H-21l-5-5V-5z" />
      <path className="truck-ribs" d="M-15-8v16M-9-8v16M-3-8v16" />
      <rect className="truck-cab" x="6" y="-9" width="16" height="18" rx="4" />
      <path className="truck-window" d="M13-7h5l2 4h-7zM13 7h5l2-4h-7z" />
      <rect className="truck-wheel" x="-16" y="-15" width="9" height="5" rx="2" />
      <rect className="truck-wheel" x="-16" y="10" width="9" height="5" rx="2" />
      <rect className="truck-wheel" x="9" y="-15" width="9" height="5" rx="2" />
      <rect className="truck-wheel" x="9" y="10" width="9" height="5" rx="2" />
      <circle className="truck-light" cx="23" cy="-5" r="2" />
      <circle className="truck-light" cx="23" cy="5" r="2" />
      <text className="truck-number" x="-9" y="3" textAnchor="middle">{truck.id.replace('T', '')}</text>
    </g>
    <g className="truck-status-tag" transform="translate(0 -30)">
      <rect x="-32" y="-9" width="64" height="16" rx="5" />
      <text y="2" textAnchor="middle">{truck.id} · {statusLabel}</text>
    </g>
  </g>
}

function OperationalEffects({ simulation }) {
  if (!simulation) return null
  return <g className={`scenario-effects stage-${simulation.stageIndex}`}>
    {(simulation.stageIndex === 3 || simulation.stageIndex === 4) && <g className="decision-pulse" transform="translate(994 548)">
      <circle r="30" />
      <circle r="58" />
      <circle r="86" />
      <text x="0" y="-103" textAnchor="middle">MOTOR PREDICTIVO IA</text>
    </g>}
    {(simulation.stageIndex === 2 || simulation.stageIndex === 3) && <g className="queue-warning" transform="translate(949 330)">
      <path d="M0-16 15 12h-30z" />
      <text x="25" y="4">ESPERA +{simulation.queues[0].value} MIN</text>
    </g>}
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

function MineMap({ routes, routeStatuses = {}, selectedTruck, onSelectTruck, mode = 'dashboard', draft, activeRoute, simulation }) {
  const svgRef = useRef(null)
  const dragRef = useRef(null)
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, w: PLATE.width, h: PLATE.height })
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

  const zoomMap = (factor) => {
    setViewBox((current) => {
      const nextW = Math.max(520, Math.min(PLATE.width, current.w * factor))
      const nextH = Math.max(300, Math.min(PLATE.height, current.h * factor))
      return {
        x: Math.max(0, Math.min(PLATE.width - nextW, current.x + (current.w - nextW) / 2)),
        y: Math.max(0, Math.min(PLATE.height - nextH, current.y + (current.h - nextH) / 2)),
        w: nextW,
        h: nextH,
      }
    })
  }

  const resetMap = () => setViewBox({ x: 0, y: 0, w: PLATE.width, h: PLATE.height })

  const beginPan = (event) => {
    if (mode !== 'dashboard' || event.button !== 0) return
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = { x: event.clientX, y: event.clientY, viewBox }
  }

  const movePan = (event) => {
    if (!dragRef.current || !svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const dx = -(event.clientX - dragRef.current.x) * dragRef.current.viewBox.w / rect.width
    const dy = -(event.clientY - dragRef.current.y) * dragRef.current.viewBox.h / rect.height
    setViewBox({
      ...dragRef.current.viewBox,
      x: Math.max(0, Math.min(PLATE.width - dragRef.current.viewBox.w, dragRef.current.viewBox.x + dx)),
      y: Math.max(0, Math.min(PLATE.height - dragRef.current.viewBox.h, dragRef.current.viewBox.y + dy)),
    })
  }

  const endPan = (event) => {
    dragRef.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  }

  return <div className="mine-map-shell">
    <div className="map-controls">
      <button onClick={() => zoomMap(.78)}>+</button>
      <button onClick={() => zoomMap(1.28)}>-</button>
      <button onClick={resetMap}>Todo</button>
    </div>
    <svg
      ref={svgRef}
      className="mine-map"
      viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
      preserveAspectRatio="xMidYMid meet"
      onPointerDown={beginPan}
      onPointerMove={movePan}
      onPointerUp={endPan}
      onPointerCancel={endPan}
    >
    <image href="/assets/open-pit-mine-hero-v2.png" x="0" y="0" width={PLATE.width} height={PLATE.height} preserveAspectRatio="none" />
    <rect className="map-shade" width={PLATE.width} height={PLATE.height} />
    {routeDefinitions.map((route) => <DrawingRoute
      key={route.id}
      points={routes[route.id]}
      color={route.color}
      status={simulation?.routeStatuses?.[route.id] ?? routeStatuses[route.id] ?? route.status}
      terminals={mode === 'editor'}
    />)}
    <g className="route-map-labels">
      <text x="1224" y="733">R02</text>
      <text x="952" y="366">R04</text>
      <text x="1124" y="402">R04B</text>
      <text x="1028" y="704">R05</text>
      <text x="800" y="748">Botadero B01</text>
    </g>
    {draft?.length > 0 && <DrawingRoute points={draft} color={activeRoute.color} draft terminals />}
    {mode === 'dashboard' && <OperationalEffects simulation={simulation} />}
    <g className="recommended-route">
      <path d="M 1010 548 C 1115 575 1178 668 1198 792" />
      <text x="1185" y="705">Ruta alterna recomendada</text>
    </g>
    {mode === 'dashboard' && simulation?.stageIndex >= 3 && simulation?.stageIndex < 5 && <g className="congestion-marker" transform="translate(952 362)">
      <circle r="34" />
      <text y="-3" textAnchor="middle">R04</text>
      <text y="14" textAnchor="middle">BLOQ</text>
    </g>}
    {Object.keys(mapNodes).map((nodeId) => <MapNode key={nodeId} nodeId={nodeId} compact={mode !== 'editor'} />)}
    {mode === 'dashboard' && trucks.map((truck) => <TruckMarker
      key={truck.id}
      truck={truck}
      routes={routes}
      time={simulation?.time ?? time}
      simulation={simulation}
      selected={selectedTruck === truck.id}
      onSelect={onSelectTruck}
    />)}
    </svg>
  </div>
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

function SimulationPanel({ simulation, isRunning, onStart, onPause, onReset }) {
  return <article className="simulation-panel">
    <div className="panel-title">
      <span>Jornada simulada - {simulation.simulatedHour} - t+{Math.floor(simulation.time)}s</span>
      <Badge tone={simulation.accepted ? 'accent' : 'warning'}>{simulation.title}</Badge>
    </div>
    <div className="sim-controls">
      <button className="primary-button" onClick={onStart}>{isRunning ? 'Simulando jornada' : 'Iniciar jornada'}</button>
      <button onClick={onPause} disabled={!isRunning}>Pausar</button>
      <button onClick={onReset}>Reiniciar dia</button>
    </div>
    <p>{simulation.detail}</p>
    <div className="sim-timeline">
      {['Inicio', 'Ingreso', 'Cola', 'Bloqueo', 'IA', 'Despeje', 'Cierre'].map((stage, index) => <i key={stage} className={index <= simulation.stageIndex ? 'active' : ''}>
        <span>{stage}</span>
      </i>)}
    </div>
    <div className="wait-distribution">
      {simulation.queues.map((queue) => <div key={queue.label} className="wait-row">
        <div>
          <strong>{queue.label}</strong>
          <small>{queue.trucks} camiones asignados</small>
        </div>
        <div className="wait-bar"><i className={`tone-${queue.tone}`} style={{ width: `${Math.min(100, queue.value * 5)}%` }} /></div>
        <b>{queue.value} min</b>
      </div>)}
    </div>
    <div className="sim-metrics">
      <div><small>Ciclo actual</small><strong>{simulation.cycle.current} min</strong></div>
      <div><small>Ciclo PukarIA</small><strong>{simulation.cycle.optimized} min</strong></div>
      <div><small>Vel. R04</small><strong>{simulation.cycle.r04Speed} km/h</strong></div>
      <div><small>Confianza</small><strong>{simulation.cycle.confidence}%</strong></div>
    </div>
    <div className="motion-feed">
      {Object.entries(simulation.motion).slice(0, 6).map(([truckId, motion]) => <div key={truckId}>
        <strong>{truckId}</strong>
        <span>{motion.state}</span>
        <small>{motion.aiState ?? motion.route} · {motion.load}</small>
      </div>)}
    </div>
    <div className="decision-strip">
      <div>
        <small>1. Machine Learning</small>
        <strong>Predice ETA de ciclo por camion-pala</strong>
        <span>Ejemplo: T07 a P02 en 28 min segun cola, distancia, pendiente, clima y desgaste.</span>
      </div>
      <div>
        <small>2. Optimizacion lineal</small>
        <strong>Redistribuye flota para minimizar cola</strong>
        <span>P01: {simulation.assignment.p01} camiones · P02: {simulation.assignment.p02} camiones · espera reducida {simulation.assignment.reducedWait} min.</span>
      </div>
    </div>
  </article>
}

function DashboardKpi({ icon, title, value, suffix, trend, tone = 'neutral', progress }) {
  return <article className={`control-kpi tone-${tone}`}>
    <div className="kpi-heading">
      <span>{icon}</span>
      <small>{title}</small>
    </div>
    <div className="kpi-main">
      <strong>{value}</strong>
      {suffix && <em>{suffix}</em>}
    </div>
    {trend && <b>{trend}</b>}
    {typeof progress === 'number' && <div className="kpi-progress"><i style={{ width: `${progress}%` }} /></div>}
  </article>
}

function getTruckRows(simulation) {
  const motion = simulation.motion
  return [
    { id: 'T01', status: motion.T01.state, route: 'R02', shovel: 'P01', eta: '11:02', tone: 'moving' },
    { id: 'T02', status: motion.T02.state, route: 'R04', shovel: 'P01', eta: '10:56', tone: 'loading' },
    { id: 'T03', status: motion.T03.state, route: simulation.stageIndex >= 5 ? 'R05' : 'R04', shovel: simulation.stageIndex >= 5 ? 'D01' : 'P01', eta: '11:05', tone: motion.T03.state === 'Detenido' ? 'blocked' : 'moving' },
    { id: 'T07', status: simulation.stageIndex >= 4 ? 'En ruta (reasignado)' : motion.T07.state, route: simulation.stageIndex >= 4 ? 'R04B' : 'R04', shovel: 'P02', eta: '10:59', tone: 'accent' },
    { id: 'T08', status: simulation.stageIndex >= 5 ? 'En espera' : motion.T08.state, route: 'R05', shovel: 'P02', eta: '11:12', tone: 'pending' },
  ]
}

function FleetLivePanel({ simulation, selectedTruck, setSelectedTruck, isRunning, onStart, onPause, onReset }) {
  const rows = getTruckRows(simulation)
  return <aside className="fleet-live-panel">
    <div className="panel-title">
      <span>Simulacion en tiempo real</span>
      <Badge tone={isRunning ? 'open' : 'pending'}>{isRunning ? 'En vivo' : 'Pausada'}</Badge>
    </div>
    <small className="panel-clock">Actualizado: {simulation.simulatedHour}</small>
    <div className="sim-controls compact">
      <button className="primary-button" onClick={onStart}>{isRunning ? 'Simulando' : 'Iniciar'}</button>
      <button onClick={onPause} disabled={!isRunning}>Pausar</button>
      <button onClick={onReset}>Reiniciar</button>
    </div>
    <div className="truck-tabs"><button className="active">Camiones</button><span>Activos (27)</span></div>
    <div className="truck-live-list">
      {rows.map((row) => <button key={row.id} className={`truck-live-card tone-${row.tone} ${selectedTruck === row.id ? 'selected' : ''}`} onClick={() => setSelectedTruck(row.id)}>
        <div>
          <strong>{row.id}</strong>
          <span>{row.status}</span>
        </div>
        <dl>
          <div><dt>Ruta</dt><dd>{row.route}</dd></div>
          <div><dt>Pala</dt><dd>{row.shovel}</dd></div>
          <div><dt>ETA</dt><dd>{row.eta}</dd></div>
        </dl>
        <i>⌖</i>
      </button>)}
    </div>
    <button className="text-link">Ver todos los camiones {'->'}</button>
  </aside>
}

function MapShell({ routes, routeStatuses, selectedTruck, setSelectedTruck, simulation }) {
  return <section className="control-map-card">
    <div className="map-legend">
      <span><i className="open" />Ruta activa</span>
      <span><i className="recommended" />Ruta recomendada</span>
      <span><i className="blocked" />Bloqueada</span>
      <span><i className="alternate" />Alternativa</span>
    </div>
    <div className="map-compass">N</div>
    <MineMap routes={routes} routeStatuses={routeStatuses} selectedTruck={selectedTruck} onSelectTruck={setSelectedTruck} simulation={simulation} />
    <div className="weather-card">
      <span>Clima</span>
      <strong>18 C</strong>
      <small>Viento 12 km/h · Visibilidad 4.8 km</small>
    </div>
    <div className="map-scale"><i /> 500 m</div>
  </section>
}

function AiRecommendationPanel({ simulation, selectedTruck }) {
  const isT07 = selectedTruck === 'T07'
  const confidence = simulation.stageIndex >= 4 ? 92 : 78
  return <aside className="ai-recommendation-panel">
    <div className="panel-title">
      <span>Recomendacion IA</span>
      <Badge tone="open">IA conectada</Badge>
    </div>
    <div className="selected-unit">
      <small>Camion seleccionado</small>
      <strong>{selectedTruck}</strong>
      <Badge tone={isT07 && simulation.stageIndex >= 4 ? 'warning' : 'pending'}>{isT07 && simulation.stageIndex >= 4 ? 'Reasignado' : 'Evaluando'}</Badge>
    </div>
    <dl className="ai-decision-grid">
      <div><dt>Pala asignada</dt><dd>{isT07 ? 'P02' : 'P01'}</dd></div>
      <div><dt>Ruta recomendada</dt><dd>{isT07 ? 'R04B' : 'R02'}</dd></div>
      <div><dt>Tiempo ciclo</dt><dd>{isT07 ? '31.2 min' : `${simulation.cycle.optimized} min`}</dd></div>
      <div><dt>Mejora</dt><dd>-3.4 min</dd></div>
    </dl>
    <div className="ai-reason">
      <strong>Motivo</strong>
      <p>Bloqueo en R04 detectado. Se optimiza por menor congestion, menor cola en P02 y ruta alternativa disponible.</p>
    </div>
    <div className="confidence-meter">
      <div><span>Nivel de confianza</span><b>{confidence}%</b></div>
      <i><em style={{ width: `${confidence}%` }} /></i>
    </div>
    <div className="driver-directions">
      <strong>Indicaciones de camino</strong>
      <ol>
        <li>Salir por Ruta R04B.</li>
        <li>Tomar desvio norte en el km 0.8.</li>
        <li>Ingresar a Pala P02 por acceso norte.</li>
      </ol>
    </div>
    <div className="ai-change-cards">
      <article className="critical"><small>10:44</small><strong>Bloqueo confirmado en Ruta R04</strong><p>Caida de rocas entre km 1.2 y km 2.7.</p></article>
      <article className="success"><small>10:45</small><strong>Nueva asignacion generada</strong><p>IA reoptimiza en 8.4 s. Nueva ruta: R04B.</p></article>
    </div>
  </aside>
}

function EventsPanel() {
  const events = [
    ['10:45', 'T07 reasignado a P02 por Ruta R04B', 'Sistema IA'],
    ['10:45', 'Reoptimizacion ejecutada', 'Motor de rutas'],
    ['10:44', 'Bloqueo confirmado en Ruta R04', 'Mantenimiento'],
    ['10:42', 'Congestion detectada en R04', 'Deteccion IA'],
  ]
  return <article className="events-panel">
    <div className="panel-title"><span>Eventos</span><Badge tone="pending">Auditoria</Badge></div>
    {events.map(([time, text, source]) => <div key={`${time}-${text}`} className="event-row">
      <b>{time}</b>
      <span>{text}</span>
      <small>{source}</small>
    </div>)}
  </article>
}

function DriverInstructionPreview({ selectedTruck }) {
  return <article className="driver-preview-panel">
    <div>
      <small>Vista del vehiculo</small>
      <strong>{selectedTruck}</strong>
      <span>Destino: PALA P02 · Ruta R04B</span>
    </div>
    <div className="driver-progress">
      <span>Distancia restante</span>
      <b>3.4 km</b>
      <i><em style={{ width: '64%' }} /></i>
    </div>
    <button className="primary-button">Confirmar instruccion</button>
  </article>
}

function Dashboard({ routes, routeStatuses, selectedTruck, setSelectedTruck, sentInstructions }) {
  const [simulationRunning, setSimulationRunning] = useState(false)
  const [simulationResetKey, setSimulationResetKey] = useState(0)
  const simulationTime = useSimulationClock(simulationRunning, simulationResetKey)
  const simulation = getSimulationSnapshot(simulationTime, sentInstructions)
  const startedTrucks = simulation.stageIndex === 0 ? Math.min(8, Math.floor((simulation.time % 10) / 1.25)) : 7
  const stoppedTrucks = simulation.stageIndex >= 3 && simulation.stageIndex <= 4 ? 2 : 0
  const congestedRoutes = simulation.stageIndex >= 2 && simulation.stageIndex <= 3 ? 1 : 0
  const probableBlocks = simulation.stageIndex === 3 ? 1 : 0
  const resetSimulation = () => {
    setSimulationRunning(false)
    setSimulationResetKey((current) => current + 1)
  }
  return <section className="dashboard-control-room">
    <header className="control-room-header">
      <div className="control-brand">
        <img src="/assets/pukaria-logo.png" alt="PukarIA" />
        <div>
          <strong><span>Pukar</span>IA</strong>
          <small>Centro de control de flota minera</small>
        </div>
      </div>
      <div className="control-header-actions">
        <span className="connection-dot"><i />Conectado</span>
        <button>🔔<b>3</b></button>
        <button>⚙</button>
        <div className="control-profile"><i>OP</i><span>Operador<small>Turno A</small></span></div>
      </div>
    </header>
    <div className="control-kpi-grid">
      <DashboardKpi icon="▣" title="Camiones activos" value="27" suffix="/ 34" trend={`${Math.max(0, Math.round(startedTrucks / 8 * 79))}%`} tone="accent" progress={79} />
      <DashboardKpi icon="⚒" title="Palas operativas" value="2" suffix="/ 3" trend="67%" tone="accent" progress={67} />
      <DashboardKpi icon="◷" title="Tiempo ciclo prom." value={simulation.stageIndex >= 4 ? '31.2' : '32.6'} suffix="min" trend="-4.1 min" tone="success" />
      <DashboardKpi icon="△" title="Rutas congestionadas" value={String(congestedRoutes || 2)} trend="Ver detalle ->" tone="warning" />
      <DashboardKpi icon="⛔" title="Bloqueos detectados" value={String(probableBlocks || 1)} trend="Ver detalle ->" tone="critical" />
    </div>

    <div className="control-main-grid">
      <FleetLivePanel
        simulation={simulation}
        selectedTruck={selectedTruck}
        setSelectedTruck={setSelectedTruck}
        isRunning={simulationRunning}
        onStart={() => setSimulationRunning(true)}
        onPause={() => setSimulationRunning(false)}
        onReset={resetSimulation}
      />
      <MapShell routes={routes} routeStatuses={routeStatuses} selectedTruck={selectedTruck} setSelectedTruck={setSelectedTruck} simulation={simulation} />
      <AiRecommendationPanel simulation={simulation} selectedTruck={selectedTruck} />
      <EventsPanel />
      <DriverInstructionPreview selectedTruck={selectedTruck} />
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
      <KpiCard label="ML ETA" value="27 min" detail="Regresor predice tiempo de ciclo" tone="accent" />
      <KpiCard label="Impacto esperado" value="-15 min" detail="Reduccion de ciclo" tone="accent" />
      <KpiCard label="Confianza" value="86%" detail="Datos GPS + vision validada" />
    </div>
    <div className="analysis-layout">
      <article className="matrix-panel">
        <div className="panel-title">
          <span>Matriz de tiempos predichos</span>
          <Badge tone="open">ML + optimizacion</Badge>
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
          <li>Machine Learning predice ETA por combinacion camion-pala.</li>
          <li>Optimizacion lineal reparte camiones para minimizar colas.</li>
          <li>Restricciones: R04 no se cierra sin confirmacion humana.</li>
          <li>Reduccion estimada de congestion: 21%.</li>
        </ul>
      </article>
    </div>
  </section>
}

function getLiveInstructionRows(simulation) {
  return aiInstructionRows.map((row) => {
    if (simulation.stageIndex === 0) {
      return { ...row, liveInstruction: row.truck === 'T06' ? 'Esperar señal GPS' : 'Ingresar por acceso principal', liveStatus: 'Monitoreando', liveEta: row.eta, liveTone: 'pending' }
    }
    if (simulation.stageIndex === 1) {
      return { ...row, liveInstruction: row.truck === 'T01' || row.truck === 'T05' ? 'Reducir velocidad y mantener distancia' : row.instruction, liveStatus: 'Recalculando ETA', liveEta: row.eta, liveTone: 'warning' }
    }
    if (simulation.stageIndex === 2) {
      return { ...row, liveInstruction: row.truck === 'T03' || row.truck === 'T05' ? 'Detener y esperar confirmacion de R04' : 'Evitar R04 si esta por ingresar', liveStatus: 'Alerta activa', liveEta: row.truck === 'T03' ? '+6 min' : row.eta, liveTone: 'critical' }
    }
    if (simulation.stageIndex === 3) {
      return { ...row, liveInstruction: row.destination.includes('P02') ? 'Ir a Pala P02 por R04B' : row.instruction, liveStatus: 'Orden recomendada', liveEta: row.eta, liveTone: 'accent' }
    }
    if (simulation.stageIndex === 4) {
      return { ...row, liveInstruction: row.truck === 'T03' || row.truck === 'T05' ? 'Reanudar movimiento' : 'Mantener ruta asignada', liveStatus: 'Despejando', liveEta: row.eta, liveTone: 'open' }
    }
    return { ...row, liveInstruction: row.destination.includes('P02') ? 'Continuar a P02' : 'Continuar ciclo asignado', liveStatus: 'Balanceado', liveEta: row.eta, liveTone: 'open' }
  })
}

function Instructions({ sentInstructions, onInstructionAction, setSelectedTruck }) {
  const simulationTime = useSimulationClock()
  const simulation = getSimulationSnapshot(simulationTime, sentInstructions)
  const liveRows = getLiveInstructionRows(simulation)
  const pendingCount = liveRows.filter((row) => ['Pendiente despacho', 'Lista para enviar', 'Requiere confirmacion'].includes(sentInstructions[row.truck] ?? row.status)).length
  const sentCount = Object.values(sentInstructions).filter((status) => status === 'Enviado al vehiculo').length

  return <section className="section">
    <div className="section-heading">
      <div>
        <small>Actualizacion continua · t+{Math.floor(simulation.time)}s</small>
        <h1>Indicaciones IA</h1>
        <p>Orden viva para cada camion. PukarIA recalcula ETA, detecta cola/bloqueo y adapta la instruccion antes de enviarla al operador.</p>
      </div>
      <div className="heading-actions">
        <button onClick={() => setSelectedTruck('T03')}>Revisar riesgo R04</button>
        <button className="primary-button" onClick={() => onInstructionAction('T07', 'Enviar')}>Enviar T07</button>
      </div>
    </div>

    <div className="analysis-kpis compact-kpis">
      <KpiCard label="Modelo operativo" value="Ruta + ETA" detail="Classifier + Regressor" />
      <KpiCard label="Estado actual" value={simulation.title} detail={simulation.detail} tone={simulation.stageIndex === 2 ? 'critical' : 'accent'} />
      <KpiCard label="Indicaciones pendientes" value={pendingCount} detail="Requieren supervision" tone="warning" />
      <KpiCard label="Enviadas" value={sentCount} detail="Confirmadas para operador" tone="accent" />
    </div>

    <div className="instructions-layout">
      <article className="instruction-board">
        <div className="panel-title">
          <span>Ordenes actuales</span>
          <Badge tone={simulation.stageIndex === 2 ? 'critical' : 'accent'}>{simulation.title}</Badge>
        </div>
        <div className="instruction-list">
          {liveRows.map((row) => {
            const status = sentInstructions[row.truck] ?? row.status
            const tone = row.liveTone
            return <article key={row.truck} className={`instruction-card risk-${tone}`}>
              <div className="instruction-main">
                <div className="vehicle-chip">
                  <strong>{row.truck}</strong>
                  <span>{row.operator}</span>
                </div>
                <div>
                  <small>{row.current} → {row.destination}</small>
                  <strong>{row.liveInstruction}</strong>
                  <p>{row.liveStatus} · ETA ML {row.liveEta} · confianza {row.confidence}%</p>
                </div>
              </div>
              <div className="instruction-meta">
                <div><small>ETA</small><strong>{row.liveEta}</strong></div>
                <div><small>ETA P01/P02</small><strong>{row.modelEta ?? '-'}</strong></div>
                <div><small>Accion</small><strong>{row.liveStatus}</strong></div>
                <div><small>Estado</small><Badge tone={status === 'Enviado al vehiculo' ? 'accent' : status === 'Bloqueada por supervisor' ? 'blocked' : 'pending'}>{status}</Badge></div>
              </div>
              <div className="instruction-actions">
                <button onClick={() => { setSelectedTruck(row.truck); onInstructionAction(row.truck, 'Ver') }}>Ver camion</button>
                <button onClick={() => onInstructionAction(row.truck, 'Bloquear')}>Retener</button>
                <button className="primary-button" onClick={() => onInstructionAction(row.truck, 'Enviar')}>Enviar</button>
              </div>
            </article>
          })}
        </div>
      </article>

      <aside className="model-panel">
        <div className="panel-title">
          <span>Proceso aplicado</span>
          <Badge tone="accent">En vivo</Badge>
        </div>
        <div className="model-summary">
          <strong>ML ETA + Optimizacion</strong>
          <p>Cada ciclo toma GPS, cola y estado de ruta. El regresor estima tiempos y el optimizador reparte camiones para bajar espera.</p>
        </div>
        <div className="decision-flow">
          <div><span>1</span><strong>GPS celulares</strong><small>Ubicacion, velocidad, detenciones y estado.</small></div>
          <div><span>2</span><strong>Vision critica</strong><small>Colas y eventos en pala/cruces.</small></div>
          <div><span>3</span><strong>Modelo + dispatcher</strong><small>Predice pala y valida costo/riesgo.</small></div>
          <div><span>4</span><strong>Despacho</strong><small>Acepta, retiene o envia al operador.</small></div>
        </div>
      </aside>
    </div>
  </section>
}

function MobileVehicle({ closeMobile }) {
  const [tab, setTab] = useState('route')
  const [status, setStatus] = useState('Vacio')
  const [incident, setIncident] = useState('Ruta bloqueada')
  const [driverName, setDriverName] = useState('')
  const [vehicleId, setVehicleId] = useState('T07')
  const [bound, setBound] = useState(false)
  const [assignmentConfirmed, setAssignmentConfirmed] = useState(false)
  const [reportSent, setReportSent] = useState(false)
  const [comment, setComment] = useState('')
  const assignment = aiInstructionRows.find((row) => row.truck === vehicleId) ?? aiInstructionRows.find((row) => row.truck === 'T07')
  const activeTruck = trucks.find((truck) => truck.id === vehicleId) ?? trucks.find((truck) => truck.id === 'T07')
  const displayName = driverName.trim() || activeTruck.operator
  const connectDriver = (event) => {
    event.preventDefault()
    if (!driverName.trim()) return
    setBound(true)
    setTab('route')
    setAssignmentConfirmed(false)
    setReportSent(false)
  }
  const disconnectDriver = () => {
    setBound(false)
    setDriverName('')
    setAssignmentConfirmed(false)
    setReportSent(false)
    setComment('')
    setTab('route')
  }

  if (!bound) {
    return <section className="mobile-view">
      <div className="phone-shell">
        <header className="phone-top">
          <div><strong>PukarIA</strong><span>Conductor</span></div>
          <h1>Inicio</h1>
          <button onClick={closeMobile}>Admin</button>
        </header>
        <form className="phone-content setup-content" onSubmit={connectDriver}>
          <div className="destination-band">
            <small>Identificacion del turno</small>
            <strong>Vincular vehiculo</strong>
            <p>El celular se usara como sensor GPS y recibira la instruccion aprobada por despacho.</p>
          </div>
          <label className="phone-field">
            Nombre del operador
            <input value={driverName} onChange={(event) => setDriverName(event.target.value)} placeholder="Ej. Diego Quispe" />
          </label>
          <label className="phone-field">
            Camion asignado
            <select value={vehicleId} onChange={(event) => setVehicleId(event.target.value)}>
              {trucks.map((truck) => <option key={truck.id} value={truck.id}>{truck.id} · {truck.model}</option>)}
            </select>
          </label>
          <div className="shift-grid">
            <div><dt>GPS</dt><dd>Listo para activar</dd></div>
            <div><dt>Modelo IA</dt><dd>Ruta + ETA</dd></div>
            <div><dt>Decision</dt><dd>{assignment.destination}</dd></div>
            <div><dt>ETA</dt><dd>{assignment.eta}</dd></div>
          </div>
          <button className="primary-button wide" type="submit" disabled={!driverName.trim()}>Guardar y conectar turno</button>
          <button className="ghost-button wide" type="button" onClick={closeMobile}>Volver a despacho</button>
        </form>
      </div>
    </section>
  }

  return <section className="mobile-view">
    <div className="phone-shell">
      <header className="phone-top">
        <div><strong>{vehicleId}</strong><span>{displayName}</span></div>
        <h1>{tab === 'route' ? 'Ruta' : tab === 'status' ? 'Estado' : tab === 'report' ? 'Reportar' : 'Turno'}</h1>
        <button onClick={closeMobile}>Admin</button>
      </header>
      {tab === 'route' && <div className="phone-content">
        <div className="destination-band">
          <small>{assignmentConfirmed ? 'Asignacion confirmada' : 'Asignacion recibida'}</small>
          <strong>{assignment.destination}</strong>
          <Badge tone={assignmentConfirmed ? 'accent' : 'pending'}>{assignmentConfirmed ? 'Confirmada' : 'Pendiente'}</Badge>
          <div className="trip-stats">
            <span><b>{assignment.destination.includes('P02') ? '2.4' : '2.1'}</b> km</span>
            <span><b>{String(assignment.eta).replace(' min', '')}</b> min</span>
            <span>{assignment.instruction}</span>
          </div>
        </div>
        <div className="phone-map">
          <span className="route-line" />
          <i className="truck-dot" />
          <i className="target-dot" />
        </div>
        <button className="primary-button wide" onClick={() => setAssignmentConfirmed(true)}>{assignmentConfirmed ? 'Asignacion confirmada' : 'Confirmar asignacion'}</button>
        <button className="danger-button wide" onClick={() => setTab('report')}>Reportar imposibilidad</button>
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
        <textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Comentario opcional" />
        <button className="primary-button wide" onClick={() => setReportSent(true)}>{reportSent ? 'Reporte enviado' : 'Enviar reporte con ubicacion'}</button>
        <small className="phone-note">{reportSent ? `Reporte registrado: ${incident}. Despacho recibe ubicacion y estado del camion.` : 'Se adjunta camion, ruta, fecha, hora y GPS automaticamente.'}</small>
      </div>}
      {tab === 'shift' && <div className="phone-content">
        <dl className="shift-grid">
          <div><dt>GPS</dt><dd>Activo</dd></div>
          <div><dt>Conexion</dt><dd>Online</dd></div>
          <div><dt>Ultima sinc.</dt><dd>Hace 11 s</dd></div>
          <div><dt>Vehiculo</dt><dd>{vehicleId}</dd></div>
          <div><dt>Operador</dt><dd>{displayName}</dd></div>
          <div><dt>Destino</dt><dd>{assignment.destination}</dd></div>
          <div><dt>Asignacion</dt><dd>{assignmentConfirmed ? 'Confirmada' : 'Pendiente'}</dd></div>
          <div><dt>Ciclos</dt><dd>5</dd></div>
          <div><dt>Movimiento</dt><dd>3 h 24 min</dd></div>
          <div><dt>Detenido</dt><dd>18 min</dd></div>
          <div><dt>Distancia</dt><dd>42.7 km</dd></div>
        </dl>
        <div className="phone-actions">
          <button onClick={() => setBound(false)}>Editar vehiculo</button>
          <button className="danger-button" onClick={disconnectDriver}>Desconectar turno</button>
        </div>
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
  const [selectedTruck, setSelectedTruck] = useState('T07')
  const [alerts, setAlerts] = useState(alertsSeed)
  const [routeStatuses, setRouteStatuses] = useState({})
  const [sentInstructions, setSentInstructions] = useState({})
  const [detailMode, setDetailMode] = useState('simple')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [toast, setToast] = useState('')

  const runOptimization = () => {
    setSection('instructions')
    setToast('Optimizacion ejecutada. Recomendaciones pendientes de aprobacion.')
    window.setTimeout(() => setToast(''), 3200)
  }

  const onInstructionAction = (truckId, action) => {
    if (action === 'Enviar') {
      setSentInstructions((current) => ({ ...current, [truckId]: 'Enviado al vehiculo' }))
      setToast(`${truckId}: indicacion enviada a la vista movil del operador.`)
    } else if (action === 'Bloquear') {
      setSentInstructions((current) => ({ ...current, [truckId]: 'Bloqueada por supervisor' }))
      setToast(`${truckId}: indicacion retenida para revision de despacho.`)
    } else {
      setSection('dashboard')
      setToast(`${truckId}: ubicacion abierta en dashboard operativo.`)
    }
    window.setTimeout(() => setToast(''), 2800)
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
      <Topbar currentSection={section} openMobile={() => setMobileOpen(true)} runOptimization={runOptimization} detailMode={detailMode} setDetailMode={setDetailMode} />
      {section === 'dashboard' && <Dashboard routes={routes} routeStatuses={routeStatuses} selectedTruck={selectedTruck} setSelectedTruck={setSelectedTruck} alerts={alerts} onAlertAction={onAlertAction} sentInstructions={sentInstructions} detailMode={detailMode} />}
      {section === 'mine' && <MineConfig routes={routes} setRoutes={setRoutes} routeStatuses={routeStatuses} />}
      {section === 'fleet' && <Fleet selectedTruck={selectedTruck} setSelectedTruck={setSelectedTruck} />}
      {section === 'optimization' && <Optimization onRun={runOptimization} />}
      {section === 'instructions' && <Instructions sentInstructions={sentInstructions} onInstructionAction={onInstructionAction} setSelectedTruck={setSelectedTruck} />}
    </div>}
    {mobileOpen && <MobileVehicle closeMobile={() => setMobileOpen(false)} />}
    {toast && <div className="toast">{toast}</div>}
  </main>
}
