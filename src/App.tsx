import { Suspense, useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { ContactShadows, OrbitControls, useTexture } from '@react-three/drei'
import { BufferGeometry, CanvasTexture, Float32BufferAttribute, RepeatWrapping, SRGBColorSpace, type Texture } from 'three'
import { Camera, CircleHelp, Moon, Move3D, RotateCcw, Sun, X } from 'lucide-react'
import './App.css'

function createTurfTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const context = canvas.getContext('2d')
  if (!context) return new CanvasTexture(canvas)

  context.fillStyle = '#137742'
  context.fillRect(0, 0, canvas.width, canvas.height)
  for (let index = 0; index < 9500; index += 1) {
    const x = Math.random() * canvas.width
    const y = Math.random() * canvas.height
    context.strokeStyle = Math.random() > 0.5 ? '#45a15b' : '#075f37'
    context.globalAlpha = 0.22 + Math.random() * 0.32
    context.lineWidth = 1 + Math.random() * 1.2
    context.beginPath()
    context.moveTo(x, y)
    context.lineTo(x + Math.random() * 3, y - 5 - Math.random() * 8)
    context.stroke()
  }
  context.globalAlpha = 1

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.wrapS = RepeatWrapping
  texture.wrapT = RepeatWrapping
  texture.repeat.set(19, 10)
  texture.anisotropy = 8
  return texture
}

function CourtScene({ night, resetKey }: { night: boolean; resetKey: number }) {
  const turf = useMemo(() => createTurfTexture(), [])
  const logo = useTexture(`${import.meta.env.BASE_URL}green-moments-logo.png`)

  const fenceGeometry = useMemo(() => {
    const points: number[] = []
    const addLine = (start: [number, number, number], end: [number, number, number]) => {
      points.push(...start, ...end)
    }

    for (const side of [-1, 1]) {
      for (let x = -10; x <= 10; x += 0.28) addLine([x, 3.08, side * 5.02], [x, 4.25, side * 5.02])
      for (let y = 3.08; y <= 4.25; y += 0.28) addLine([-10, y, side * 5.02], [10, y, side * 5.02])
    }
    for (const end of [-1, 1]) {
      for (let z = -5; z <= 5; z += 0.28) addLine([end * 10.02, 3.08, z], [end * 10.02, 4.25, z])
      for (let y = 3.08; y <= 4.25; y += 0.28) addLine([end * 10.02, y, -5], [end * 10.02, y, 5])
    }

    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new Float32BufferAttribute(points, 3))
    return geometry
  }, [])

  const floodlightPositions: [number, number, number][] = [
    [-11, 6, -6], [-11, 6, 6], [11, 6, -6], [11, 6, 6],
  ]

  return (
    <>
      <color attach="background" args={[night ? '#18221d' : '#cfd9d1']} />
      <fog attach="fog" args={[night ? '#18221d' : '#cfd9d1', 27, 58]} />
      <hemisphereLight args={['#e9f7ee', '#38443a', night ? 0.62 : 2.1]} />
      <directionalLight position={[-7, 15, 8]} intensity={night ? 0.22 : 3.2} castShadow shadow-mapSize={[2048, 2048]} />
      {floodlightPositions.map(([x, y, z]) => (
        <pointLight key={`${x}-${z}`} position={[x, y, z]} intensity={night ? 18 : 0.3} distance={night ? 24 : 6} color="#f1f8d6" decay={2} />
      ))}

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.14, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color={night ? '#26342c' : '#b2bdb3'} roughness={0.94} />
      </mesh>
      <mesh position={[0, 0, 0]} receiveShadow castShadow>
        <boxGeometry args={[20.35, 0.16, 10.35]} />
        <meshStandardMaterial color="#1e3228" roughness={0.7} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.083, 0]} receiveShadow>
        <planeGeometry args={[20, 10]} />
        <meshStandardMaterial map={turf} roughness={0.92} />
      </mesh>

      <CourtLines />
      <Net />
      {[-10, 10].map((x) => (
        <mesh key={`end-glass-${x}`} position={[x, 1.57, 0]} castShadow>
          <boxGeometry args={[0.07, 3.05, 9.96]} />
          <meshPhysicalMaterial color="#a6c5ba" transparent opacity={0.22} roughness={0.12} metalness={0.12} />
        </mesh>
      ))}
      {[-1, 1].map((side) => (
        <mesh key={`side-glass-${side}`} position={[0, 1.53, side * 5]} castShadow>
          <boxGeometry args={[14.7, 2.96, 0.07]} />
          <meshPhysicalMaterial color="#a6c5ba" transparent opacity={0.2} roughness={0.12} metalness={0.12} />
        </mesh>
      ))}
      <lineSegments geometry={fenceGeometry}><lineBasicMaterial color="#34433b" transparent opacity={0.74} /></lineSegments>
      <FenceSupports />
      <LogoSigns logo={logo} />
      <Floodlights night={night} />
      <mesh position={[0, 0.2, 0]}><sphereGeometry args={[0.12, 20, 20]} /><meshStandardMaterial color="#f2e955" roughness={0.35} /></mesh>
      <ContactShadows position={[0, -0.055, 0]} opacity={night ? 0.45 : 0.25} scale={28} blur={2.8} far={8} />
      <OrbitControls key={resetKey} makeDefault target={[0, 1.2, 0]} minDistance={13} maxDistance={32} minPolarAngle={0.35} maxPolarAngle={1.42} enablePan={false} dampingFactor={0.08} />
    </>
  )
}

function CourtLines() {
  const lineColor = '#f5f4df'
  return (
    <group>
      <mesh position={[0, 0.095, -4.85]}><boxGeometry args={[19.7, 0.02, 0.075]} /><meshStandardMaterial color={lineColor} /></mesh>
      <mesh position={[0, 0.095, 4.85]}><boxGeometry args={[19.7, 0.02, 0.075]} /><meshStandardMaterial color={lineColor} /></mesh>
      <mesh position={[-9.85, 0.095, 0]}><boxGeometry args={[0.075, 0.02, 9.7]} /><meshStandardMaterial color={lineColor} /></mesh>
      <mesh position={[9.85, 0.095, 0]}><boxGeometry args={[0.075, 0.02, 9.7]} /><meshStandardMaterial color={lineColor} /></mesh>
      {[-6.95, 6.95].map((x) => <mesh key={`service-${x}`} position={[x, 0.096, 0]}><boxGeometry args={[0.065, 0.02, 9.7]} /><meshStandardMaterial color={lineColor} /></mesh>)}
      {[-1, 1].map((side) => <mesh key={`center-${side}`} position={[side * 8.475, 0.096, 0]}><boxGeometry args={[3.05, 0.02, 0.065]} /><meshStandardMaterial color={lineColor} /></mesh>)}
    </group>
  )
}

function Net() {
  return (
    <group>
      <mesh position={[0, 0.57, 0]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[9.85, 0.94, 42, 9]} /><meshBasicMaterial color="#d9dfd9" wireframe transparent opacity={0.7} /></mesh>
      <mesh position={[0, 1.05, 0]}><boxGeometry args={[0.055, 0.07, 10]} /><meshStandardMaterial color="#f2f1e8" /></mesh>
      {[-5, 5].map((z) => <mesh key={`post-${z}`} position={[0, 0.55, z]}><cylinderGeometry args={[0.045, 0.045, 1.1, 12]} /><meshStandardMaterial color="#e7e8dc" metalness={0.35} roughness={0.4} /></mesh>)}
    </group>
  )
}

function FenceSupports() {
  return (
    <group>
      {[-10, -7.5, 0, 7.5, 10].flatMap((x) => [-1, 1].map((side) => (
        <mesh key={`side-pole-${x}-${side}`} position={[x, 2.14, side * 5.03]}><boxGeometry args={[0.085, 4.28, 0.085]} /><meshStandardMaterial color="#27372e" metalness={0.72} roughness={0.32} /></mesh>
      )))}
      {[-10, 10].flatMap((x) => [-5, 0, 5].map((z) => (
        <mesh key={`end-pole-${x}-${z}`} position={[x, 2.14, z]}><boxGeometry args={[0.085, 4.28, 0.085]} /><meshStandardMaterial color="#27372e" metalness={0.72} roughness={0.32} /></mesh>
      )))}
      <mesh position={[0, 4.25, -5.03]}><boxGeometry args={[20.1, 0.09, 0.09]} /><meshStandardMaterial color="#293830" metalness={0.65} roughness={0.35} /></mesh>
      <mesh position={[0, 4.25, 5.03]}><boxGeometry args={[20.1, 0.09, 0.09]} /><meshStandardMaterial color="#293830" metalness={0.65} roughness={0.35} /></mesh>
      {[-10.03, 10.03].map((x) => <mesh key={`end-rail-${x}`} position={[x, 4.25, 0]}><boxGeometry args={[0.09, 0.09, 10.1]} /><meshStandardMaterial color="#293830" metalness={0.65} roughness={0.35} /></mesh>)}
    </group>
  )
}

function LogoSigns({ logo }: { logo: Texture }) {
  return (
    <group>
      {[-1, 1].map((end) => (
        <group key={`sign-${end}`} position={[end * 9.9, 2.45, 0]} rotation={[0, end === -1 ? Math.PI / 2 : -Math.PI / 2, 0]}>
          <mesh position={[0, 0, -0.02]}><planeGeometry args={[3.1, 1.08]} /><meshBasicMaterial color="#f7f8ef" /></mesh>
          <mesh position={[0, 0, 0.005]}><planeGeometry args={[2.88, 0.88]} /><meshBasicMaterial map={logo} transparent side={2} toneMapped={false} /></mesh>
        </group>
      ))}
    </group>
  )
}

function Floodlights({ night }: { night: boolean }) {
  return (
    <group>
      {[-1, 1].flatMap((end) => [-1, 1].map((side) => (
        <group key={`flood-${end}-${side}`} position={[end * 10.85, 0, side * 5.9]}>
          <mesh position={[0, 2.85, 0]}><cylinderGeometry args={[0.055, 0.085, 5.7, 10]} /><meshStandardMaterial color="#313e36" metalness={0.72} roughness={0.32} /></mesh>
          <mesh position={[-end * 0.3, 5.8, 0]} rotation={[0, 0, end * 0.11]}><boxGeometry args={[0.78, 0.16, 0.36]} /><meshStandardMaterial color={night ? '#f3efcc' : '#68766d'} emissive={night ? '#fff1b7' : '#000000'} emissiveIntensity={night ? 2.1 : 0} /></mesh>
        </group>
      )))}
    </group>
  )
}

function App() {
  const [night, setNight] = useState(false)
  const [resetKey, setResetKey] = useState(0)
  const [showReference, setShowReference] = useState(false)

  return (
    <main className="experience">
      <Canvas className="court-canvas" shadows="percentage" dpr={[1, 1.8]} camera={{ position: [17.5, 14.5, 18.5], fov: 38, near: 0.1, far: 100 }} gl={{ antialias: true, powerPreference: 'high-performance' }}>
        <Suspense fallback={null}>
          <CourtScene night={night} resetKey={resetKey} />
        </Suspense>
      </Canvas>

      <header className="topbar">
        <a className="brand" href="https://greenmoments.es/" target="_blank" rel="noreferrer" aria-label="Green Moments, página web"><img src={`${import.meta.env.BASE_URL}green-moments-logo.png`} alt="Green Moments" /></a>
        <div className="topbar-meta"><span className="live-dot" /> VISUALIZACIÓN 3D <span className="meta-divider">/</span> PROYECTO 01</div>
        <div className="topbar-actions">
          <button className="icon-button" type="button" onClick={() => setResetKey((value) => value + 1)} title="Restablecer cámara" aria-label="Restablecer cámara"><RotateCcw size={17} strokeWidth={1.7} /></button>
          <button className="icon-button reference-toggle" type="button" onClick={() => setShowReference((value) => !value)} title="Referencia del proyecto" aria-label={showReference ? 'Cerrar referencia del proyecto' : 'Abrir referencia del proyecto'} aria-expanded={showReference} aria-controls="reference-panel"><Camera size={17} strokeWidth={1.7} /></button>
          <button className="light-toggle" type="button" onClick={() => setNight((value) => !value)} aria-label={night ? 'Cambiar a luz de día' : 'Cambiar a luz nocturna'}>{night ? <Moon size={16} /> : <Sun size={16} />}<span>{night ? 'NOCHE' : 'DÍA'}</span></button>
        </div>
      </header>

      <section className="project-caption" aria-label="Datos de la pista">
        <div className="caption-kicker"><span>GREEN MOMENTS</span><span className="kicker-line" /></div>
        <h1>Una pista.<br /><em>Todo por jugar.</em></h1>
        <div className="caption-bottom">
          <div><span className="caption-label">SUPERFICIE</span><strong>Césped artificial</strong></div>
          <div className="caption-separator" />
          <div><span className="caption-label">DIMENSIONES</span><strong>20 × 10 <small>m</small></strong></div>
        </div>
      </section>

      <aside id="reference-panel" className="reference-panel" hidden={!showReference}>
        <div className="reference-heading"><span>REFERENCIA DE PROYECTO</span><button className="icon-button reference-close" type="button" onClick={() => setShowReference(false)} title="Cerrar referencia" aria-label="Cerrar referencia del proyecto"><X size={15} strokeWidth={1.8} /></button></div>
        <img className="reference-image" src={`${import.meta.env.BASE_URL}padel-project.jpg`} alt="Pista de pádel de Green Moments" />
        <div className="reference-foot"><span>CONSTRUCCIÓN DE PISTAS DE PÁDEL</span><span>01 / 01</span></div>
      </aside>

      <div className="interaction-hint"><Move3D size={15} strokeWidth={1.7} /><span>ARRASTRA PARA EXPLORAR</span><span className="hint-dot">·</span><span>RUEDA PARA ZOOM</span></div>
      <button className="help-button" type="button" title="Visualización conceptual de pista de pádel" aria-label="Acerca de esta visualización"><CircleHelp size={17} strokeWidth={1.7} /></button>
      <div className="edge-coordinate coordinate-top">40°12′ N <span>·</span> 3°55′ O</div>
      <div className="edge-coordinate coordinate-bottom">GM / PÁDEL 2026</div>
    </main>
  )
}

export default App
