import { Suspense, useEffect, useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { ContactShadows, OrbitControls, Sky, useTexture } from '@react-three/drei'
import { BufferGeometry, CanvasTexture, DoubleSide, Float32BufferAttribute, RepeatWrapping, SRGBColorSpace } from 'three'
import { ArrowLeft, ArrowRight, Camera, Check, Mail, Moon, Move3D, Pencil, RotateCcw, SlidersHorizontal, Sun, X } from 'lucide-react'
import './App.css'

const courtTypes = [
  { id: 'modular', label: 'Pista modular', description: 'Montaje versátil con estructura modular.', image: 'court-model-modular.jpg' },
  { id: 'pillars', label: 'Pista de pilares', description: 'Estructura reforzada con pilares intermedios.', image: 'court-model-pillars.jpg' },
  { id: 'panoramic', label: 'Pista panorámica', description: 'Fondos acristalados continuos para una visión amplia.', image: 'court-model-panoramic.jpg' },
  { id: 'individual', label: 'Pista individual', description: 'Formato compacto para partidos uno contra uno.', image: 'court-model-individual.jpg' },
  { id: 'indoor', label: 'Pista indoor', description: 'Configuración bajo cubierta.', image: 'court-model-indoor.jpg' },
  { id: 'outdoor', label: 'Pista outdoor', description: 'Configuración para instalaciones al aire libre.', image: 'court-model-outdoor.jpg' },
] as const

const grassTypes = [
  { id: 'fibrillated', label: 'Césped fibrilado', description: 'Opción económica · requiere cepillado y mantenimiento regular.' },
  { id: 'monofilament', label: 'Césped monofilamento', description: 'Más duradero · mantenimiento reducido · bote homogéneo.' },
  { id: 'textured', label: 'Césped texturizado', description: 'Tacto suave y acabado mate · más indicado para zonas de ocio.' },
] as const

const grassColors = [
  { id: 'blue', label: 'Azul', color: '#187baa', dark: '#105779', fiber: '#48a2c8' },
  { id: 'green', label: 'Verde', color: '#137742', dark: '#075f37', fiber: '#45a15b' },
  { id: 'terracotta', label: 'Terracota', color: '#ad5540', dark: '#813e31', fiber: '#d77a59' },
  { id: 'black', label: 'Negro', color: '#343b38', dark: '#242a27', fiber: '#56605a' },
  { id: 'gray', label: 'Gris', color: '#838e89', dark: '#626d68', fiber: '#a8b1ac' },
  { id: 'sand', label: 'Arena', color: '#b59e72', dark: '#8a7651', fiber: '#d0ba8c' },
  { id: 'burgundy', label: 'Burdeos', color: '#81364b', dark: '#60273a', fiber: '#a95868' },
] as const

const frameColors = [
  { id: 'black', label: 'Negro', ral: 'RAL 9005', color: '#242a27' },
  { id: 'anthracite', label: 'Antracita', ral: 'RAL 7016', color: '#41494a' },
  { id: 'aluminum', label: 'Gris aluminio', ral: 'RAL 9006', color: '#929a99' },
  { id: 'white', label: 'Blanco', ral: 'RAL 9010', color: '#e9e9df' },
  { id: 'blue', label: 'Azul genciana', ral: 'RAL 5010', color: '#164d80' },
  { id: 'moss', label: 'Verde musgo', ral: 'RAL 6005', color: '#28543d' },
  { id: 'red', label: 'Rojo tráfico', ral: 'RAL 3020', color: '#bf312d' },
] as const

const lightingTypes = [
  { id: 'straight', label: 'Foco recto', description: 'Brazo vertical sobre el lateral' },
  { id: 'v', label: 'Foco en V', description: 'Brazos inclinados hacia la pista' },
  { id: 'none', label: 'Sin focos', description: 'Solo estructura' },
] as const

type CourtConfiguration = {
  courtType: (typeof courtTypes)[number]['id']
  grassType: (typeof grassTypes)[number]['id']
  grassColor: (typeof grassColors)[number]['id']
  frameColor: (typeof frameColors)[number]['id']
  lighting: (typeof lightingTypes)[number]['id']
}

const defaultCourtConfiguration: CourtConfiguration = {
  courtType: 'modular',
  grassType: 'monofilament',
  grassColor: 'green',
  frameColor: 'black',
  lighting: 'straight',
}

const configurationSteps = ['Tipo de pista', 'Césped', 'Color', 'Estructura', 'Iluminación']

function createTurfTexture(colorId: CourtConfiguration['grassColor'], grassType: CourtConfiguration['grassType']) {
  const turfColor = grassColors.find((option) => option.id === colorId) ?? grassColors[1]
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const context = canvas.getContext('2d')
  if (!context) return new CanvasTexture(canvas)

  context.fillStyle = turfColor.color
  context.fillRect(0, 0, canvas.width, canvas.height)
  for (let index = 0; index < 9500; index += 1) {
    const x = Math.random() * canvas.width
    const y = Math.random() * canvas.height
    context.strokeStyle = Math.random() > 0.5 ? turfColor.fiber : turfColor.dark
    context.globalAlpha = grassType === 'textured' ? 0.18 + Math.random() * 0.2 : 0.22 + Math.random() * 0.32
    context.lineWidth = grassType === 'fibrillated' ? 1.8 + Math.random() * 1.5 : grassType === 'textured' ? 1.5 + Math.random() * 1.8 : 1 + Math.random() * 1.2
    context.beginPath()
    context.moveTo(x, y)
    if (grassType === 'textured') {
      context.quadraticCurveTo(x + 4 + Math.random() * 5, y - 2, x + 1 + Math.random() * 4, y - 4 - Math.random() * 3)
    } else {
      const fiberLength = grassType === 'fibrillated' ? 3 + Math.random() * 5 : 5 + Math.random() * 8
      context.lineTo(x + Math.random() * (grassType === 'fibrillated' ? 5 : 3), y - fiberLength)
    }
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

function createPaverTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const context = canvas.getContext('2d')
  if (!context) return new CanvasTexture(canvas)

  context.fillStyle = '#798b79'
  context.fillRect(0, 0, canvas.width, canvas.height)
  for (let row = 0; row < 8; row += 1) {
    const offset = row % 2 === 0 ? 0 : -48
    for (let column = -1; column < 5; column += 1) {
      const shade = 184 + Math.floor(Math.random() * 25)
      context.fillStyle = `rgb(${shade}, ${shade + 3}, ${shade - 8})`
      context.fillRect(column * 128 + offset + 2, row * 64 + 2, 124, 60)
    }
  }

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.wrapS = RepeatWrapping
  texture.wrapT = RepeatWrapping
  texture.repeat.set(8, 5)
  texture.anisotropy = 8
  return texture
}

function createLandscapeTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const context = canvas.getContext('2d')
  if (!context) return new CanvasTexture(canvas)

  context.fillStyle = '#708d68'
  context.fillRect(0, 0, canvas.width, canvas.height)
  const grassShades = ['#789771', '#849d78', '#66845f', '#91a37e']
  for (let index = 0; index < 18000; index += 1) {
    const x = Math.random() * canvas.width
    const y = Math.random() * canvas.height
    context.globalAlpha = 0.12 + Math.random() * 0.2
    context.fillStyle = grassShades[Math.floor(Math.random() * grassShades.length)]
    context.fillRect(x, y, 1 + Math.random() * 3, 1 + Math.random() * 4)
  }
  context.globalAlpha = 1

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.wrapS = RepeatWrapping
  texture.wrapT = RepeatWrapping
  texture.repeat.set(12, 12)
  texture.anisotropy = 8
  return texture
}

function CourtScene({ night, court }: { night: boolean; court: CourtConfiguration }) {
  const turf = useMemo(() => createTurfTexture(court.grassColor, court.grassType), [court.grassColor, court.grassType])
  const frameColor = frameColors.find((option) => option.id === court.frameColor)?.color ?? '#242a27'
  const courtWidthScale = court.courtType === 'individual' ? 0.62 : 1

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
    [-11, 6, -6 * courtWidthScale], [-11, 6, 6 * courtWidthScale], [11, 6, -6 * courtWidthScale], [11, 6, 6 * courtWidthScale],
  ]

  return (
    <>
      <color attach="background" args={[night ? '#18221d' : '#a9c7c8']} />
      <fog attach="fog" args={[night ? '#18221d' : '#b9cdca', 38, 180]} />
      <Sky distance={90} sunPosition={night ? [0, -1, 0] : [-0.35, 0.72, 0.45]} turbidity={night ? 2 : 5} rayleigh={night ? 0.25 : 1.4} mieCoefficient={0.004} mieDirectionalG={0.78} />
      <hemisphereLight args={['#e9f7ee', '#38443a', night ? 0.62 : 2.1]} />
      <directionalLight position={[-7, 15, 8]} intensity={night ? 0.22 : 3.2} castShadow shadow-mapSize={[2048, 2048]} />
      {court.lighting !== 'none' && floodlightPositions.map(([x, y, z]) => (
        <pointLight key={`${x}-${z}`} position={[x, y, z]} intensity={night ? 18 : 0.3} distance={night ? 24 : 6} color="#f1f8d6" decay={2} />
      ))}

      <OutdoorEnvironment night={night} />
      <group scale={[1, 1, courtWidthScale]}>
      <mesh position={[0, 0, 0]} receiveShadow castShadow>
        <boxGeometry args={[20.35, 0.16, 10.35]} />
        <meshStandardMaterial color="#1e3228" roughness={0.7} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.083, 0]} receiveShadow>
        <planeGeometry args={[20, 10]} />
        <meshStandardMaterial map={turf} roughness={court.grassType === 'textured' ? 0.62 : court.grassType === 'monofilament' ? 0.82 : 0.95} />
      </mesh>

      <CourtLines />
      <Net />
      {[-10, 10].map((x) => (
        <mesh key={`end-glass-${x}`} position={[x, 1.57, 0]} castShadow>
          <boxGeometry args={[0.07, 3.05, 9.96]} />
          <meshPhysicalMaterial color="#a6c5ba" transparent opacity={0.22} roughness={0.12} metalness={0.12} depthWrite={false} side={DoubleSide} />
        </mesh>
      ))}
      {[-1, 1].map((side) => (
        <mesh key={`side-glass-${side}`} position={[0, 1.53, side * 5]} castShadow>
          <boxGeometry args={[14.7, 2.96, 0.07]} />
          <meshPhysicalMaterial color="#a6c5ba" transparent opacity={0.2} roughness={0.12} metalness={0.12} depthWrite={false} side={DoubleSide} />
        </mesh>
      ))}
      <lineSegments geometry={fenceGeometry}><lineBasicMaterial color="#34433b" transparent opacity={0.74} /></lineSegments>
      <FenceSupports courtType={court.courtType} frameColor={frameColor} />
      <Suspense fallback={null}><LogoSigns /></Suspense>
      <Floodlights night={night} type={court.lighting} frameColor={frameColor} />
      <mesh position={[0, 0.2, 0]}><sphereGeometry args={[0.12, 20, 20]} /><meshStandardMaterial color="#f2e955" roughness={0.35} /></mesh>
      {court.courtType === 'indoor' && <IndoorRoof frameColor={frameColor} />}
      </group>
      <ContactShadows position={[0, -0.055, 0]} opacity={night ? 0.45 : 0.25} scale={28} blur={2.8} far={8} />
      <OrbitControls makeDefault target={[0, 1.2, 0]} minDistance={13} maxDistance={32} minPolarAngle={0.35} maxPolarAngle={1.42} enablePan={false} dampingFactor={0.08} />
    </>
  )
}

function OutdoorEnvironment({ night }: { night: boolean }) {
  const pavers = useMemo(() => createPaverTexture(), [])
  const landscape = useMemo(() => createLandscapeTexture(), [])

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.25, 0]} receiveShadow>
        <planeGeometry args={[120, 120]} />
        <meshStandardMaterial map={landscape} color={night ? '#9aa194' : '#ffffff'} roughness={1} />
      </mesh>
      <mesh position={[0, -0.15, 0]} receiveShadow>
        <boxGeometry args={[26, 0.14, 16]} />
        <meshStandardMaterial map={pavers} color={night ? '#89948a' : '#ffffff'} roughness={0.92} />
      </mesh>
    </group>
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

function FenceSupports({ courtType, frameColor }: { courtType: CourtConfiguration['courtType']; frameColor: string }) {
  const sidePostPositions = courtType === 'pillars' ? [-10, -7.5, -5, 0, 5, 7.5, 10] : [-10, -7.5, 0, 7.5, 10]
  const endPostPositions = courtType === 'panoramic' ? [-5, 5] : [-5, 0, 5]
  return (
    <group>
      {sidePostPositions.flatMap((x) => [-1, 1].map((side) => (
        <mesh key={`side-pole-${x}-${side}`} position={[x, 2.14, side * 5.03]}><boxGeometry args={[0.085, 4.28, 0.085]} /><meshStandardMaterial color={frameColor} metalness={0.72} roughness={0.32} /></mesh>
      )))}
      {[-10, 10].flatMap((x) => endPostPositions.map((z) => (
        <mesh key={`end-pole-${x}-${z}`} position={[x, 2.14, z]}><boxGeometry args={[0.085, 4.28, 0.085]} /><meshStandardMaterial color={frameColor} metalness={0.72} roughness={0.32} /></mesh>
      )))}
      <mesh position={[0, 4.25, -5.03]}><boxGeometry args={[20.1, 0.09, 0.09]} /><meshStandardMaterial color={frameColor} metalness={0.65} roughness={0.35} /></mesh>
      <mesh position={[0, 4.25, 5.03]}><boxGeometry args={[20.1, 0.09, 0.09]} /><meshStandardMaterial color={frameColor} metalness={0.65} roughness={0.35} /></mesh>
      {[-10.03, 10.03].map((x) => <mesh key={`end-rail-${x}`} position={[x, 4.25, 0]}><boxGeometry args={[0.09, 0.09, 10.1]} /><meshStandardMaterial color={frameColor} metalness={0.65} roughness={0.35} /></mesh>)}
    </group>
  )
}

function IndoorRoof({ frameColor }: { frameColor: string }) {
  return (
    <group>
      <mesh position={[0, 8.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[21, 10.8]} />
        <meshPhysicalMaterial color="#d7dfd8" transparent opacity={0.22} roughness={0.5} metalness={0.08} depthWrite={false} side={DoubleSide} />
      </mesh>
      {[-9, -4.5, 0, 4.5, 9].map((x) => <mesh key={`roof-rafter-${x}`} position={[x, 8.18, 0]}><boxGeometry args={[0.12, 0.12, 10.6]} /><meshStandardMaterial color={frameColor} metalness={0.42} roughness={0.48} /></mesh>)}
    </group>
  )
}

function LogoSigns() {
  const logo = useTexture(`${import.meta.env.BASE_URL}green-moments-logo.png`)
  return (
    <group>
      {[-1, 1].map((end) => (
        <group key={`sign-${end}`} position={[end * 10.06, 2.45, 0]} rotation={[0, end === -1 ? Math.PI / 2 : -Math.PI / 2, 0]}>
          <mesh position={[0, 0, -0.02]}><planeGeometry args={[2.82, 1.4]} /><meshBasicMaterial color="#f7f8ef" transparent opacity={0.36} depthWrite={false} side={DoubleSide} /></mesh>
          <mesh position={[0, 0, 0.005]}><planeGeometry args={[2.62, 1.2]} /><meshBasicMaterial map={logo} transparent depthWrite={false} side={DoubleSide} toneMapped={false} /></mesh>
        </group>
      ))}
      <group position={[-5.8, 0.95, 5.06]}>
        <mesh position={[0, 0, -0.02]}><planeGeometry args={[2.82, 1.4]} /><meshBasicMaterial color="#f7f8ef" transparent opacity={0.36} depthWrite={false} side={DoubleSide} /></mesh>
        <mesh position={[0, 0, 0.005]}><planeGeometry args={[2.62, 1.2]} /><meshBasicMaterial map={logo} transparent depthWrite={false} side={DoubleSide} toneMapped={false} /></mesh>
      </group>
    </group>
  )
}

function Floodlights({ night, type, frameColor }: { night: boolean; type: CourtConfiguration['lighting']; frameColor: string }) {
  if (type === 'none') return null

  return (
    <group>
      {[-1, 1].flatMap((end) => [-1, 1].map((side) => (
        <group key={`flood-${end}-${side}`} position={[end * 10.85, 0, side * 5.9]}>
          <mesh position={[0, 2.85, 0]}><cylinderGeometry args={[0.055, 0.085, 5.7, 10]} /><meshStandardMaterial color={frameColor} metalness={0.72} roughness={0.32} /></mesh>
          {type === 'straight' ? (
            <mesh position={[-end * 0.3, 5.8, 0]} rotation={[0, 0, end * 0.11]}><boxGeometry args={[0.78, 0.16, 0.36]} /><meshStandardMaterial color={night ? '#f3efcc' : '#68766d'} emissive={night ? '#fff1b7' : '#000000'} emissiveIntensity={night ? 2.1 : 0} /></mesh>
          ) : (
            [-1, 1].map((arm) => (
              <group key={`v-arm-${arm}`} position={[-end * 0.3, 5.62, arm * 0.12]} rotation={[0, 0, arm * 0.36]}>
                <mesh position={[0, 0.25, 0]}><cylinderGeometry args={[0.035, 0.045, 0.65, 8]} /><meshStandardMaterial color={frameColor} metalness={0.55} roughness={0.38} /></mesh>
                <mesh position={[0, 0.62, 0]}><boxGeometry args={[0.68, 0.14, 0.28]} /><meshStandardMaterial color={night ? '#f3efcc' : '#68766d'} emissive={night ? '#fff1b7' : '#000000'} emissiveIntensity={night ? 2.1 : 0} /></mesh>
              </group>
            ))
          )}
        </group>
      )))}
    </group>
  )
}

function App() {
  const [night, setNight] = useState(false)
  const [resetKey, setResetKey] = useState(0)
  const [showReference, setShowReference] = useState(false)
  const [activeStep, setActiveStep] = useState<number | null>(0)
  const [configuration, setConfiguration] = useState<CourtConfiguration>(defaultCourtConfiguration)

  useEffect(() => {
    const timeout = window.setTimeout(() => window.dispatchEvent(new Event('resize')), 0)
    return () => window.clearTimeout(timeout)
  }, [])

  const selectedCourt = courtTypes.find((option) => option.id === configuration.courtType)!
  const selectedGrass = grassTypes.find((option) => option.id === configuration.grassType)!
  const selectedGrassColor = grassColors.find((option) => option.id === configuration.grassColor)!
  const selectedFrame = frameColors.find((option) => option.id === configuration.frameColor)!
  const selectedLighting = lightingTypes.find((option) => option.id === configuration.lighting)!
  const quoteBody = [
    'Hola, me gustaría solicitar información sobre una pista de pádel con esta configuración:',
    `Tipo de pista: ${selectedCourt.label}`,
    `Césped: ${selectedGrass.label}`,
    `Color: ${selectedGrassColor.label}`,
    `Estructura: ${selectedFrame.label} (${selectedFrame.ral})`,
    `Iluminación: ${selectedLighting.label}`,
  ].join('\n')
  const quoteHref = `mailto:victor@greenmoments.es?subject=${encodeURIComponent('Configuración de pista de pádel')}&body=${encodeURIComponent(quoteBody)}`

  function updateConfiguration<K extends keyof CourtConfiguration>(key: K, value: CourtConfiguration[K]) {
    setConfiguration((current) => ({ ...current, [key]: value }))
  }

  function resetConfigurator() {
    setResetKey((value) => value + 1)
    setConfiguration(defaultCourtConfiguration)
    setNight(false)
    setShowReference(false)
    setActiveStep(0)
  }

  function renderChoices<T extends { id: string; label: string; description: string }>(
    options: readonly T[],
    selectedId: string,
    onSelect: (id: string) => void,
  ) {
    return (
      <div className="choice-list">
        {options.map((option) => (
          <button key={option.id} className={`choice-card${selectedId === option.id ? ' is-selected' : ''}`} type="button" aria-pressed={selectedId === option.id} onClick={() => onSelect(option.id)}>
            <span className="choice-check"><Check size={13} strokeWidth={2.4} /></span>
            <span className="choice-copy"><strong>{option.label}</strong><small>{option.description}</small></span>
          </button>
        ))}
      </div>
    )
  }

  function renderCourtChoices() {
    return (
      <div className="court-choice-grid">
        {courtTypes.map((option) => (
          <button key={option.id} className={`court-model-card${configuration.courtType === option.id ? ' is-selected' : ''}`} type="button" aria-pressed={configuration.courtType === option.id} onClick={() => updateConfiguration('courtType', option.id)}>
            <span className="court-model-image"><img src={`${import.meta.env.BASE_URL}${option.image}`} alt="" loading="lazy" /><span className="court-model-mark"><Check size={13} strokeWidth={2.5} /></span></span>
            <span className="court-model-copy"><strong>{option.label}</strong><small>{option.description}</small></span>
          </button>
        ))}
      </div>
    )
  }

  return (
    <main className={`experience${activeStep === null ? ' is-configurator-collapsed' : ''}`}>
      <Canvas key={resetKey} className="court-canvas" shadows="percentage" dpr={[1, 1.8]} camera={{ position: [17.5, 14.5, 18.5], fov: 38, near: 0.1, far: 100 }} gl={{ antialias: true, powerPreference: 'high-performance' }}>
        <Suspense fallback={null}>
          <CourtScene night={night} court={configuration} />
        </Suspense>
      </Canvas>

      <header className="topbar">
        <a className="brand" href="https://greenmoments.es/" target="_blank" rel="noreferrer" aria-label="Green Moments, página web"><img src={`${import.meta.env.BASE_URL}green-moments-logo.png`} alt="Green Moments" /></a>
        <div className="topbar-meta"><span className="live-dot" /> CONFIGURADOR 3D <span className="meta-divider">/</span> PISTA DE PÁDEL</div>
        <div className="topbar-actions">
          <button className="icon-button" type="button" onClick={resetConfigurator} title="Restablecer cámara y configuración" aria-label="Restablecer cámara y configuración"><RotateCcw size={17} strokeWidth={1.7} /></button>
          <button className="icon-button reference-toggle" type="button" onClick={() => setShowReference((value) => !value)} title="Referencia del proyecto" aria-label={showReference ? 'Cerrar referencia del proyecto' : 'Abrir referencia del proyecto'} aria-expanded={showReference} aria-controls="reference-panel"><Camera size={17} strokeWidth={1.7} /></button>
          <button className={`lighting-switch${night ? ' is-night' : ''}`} type="button" role="switch" aria-checked={night} aria-label="Modo nocturno" title={night ? 'Cambiar a luz de día' : 'Cambiar a luz nocturna'} onClick={() => setNight((value) => !value)}>
            <span className="lighting-mode day-mode"><Sun size={14} /></span>
            <span className="lighting-track"><span className="lighting-thumb" /></span>
            <span className="lighting-mode night-mode"><Moon size={14} /></span>
          </button>
        </div>
      </header>

      <aside className={`configurator-panel${activeStep === null ? ' is-collapsed' : ''}`} aria-label="Configurador de pista">
        {activeStep !== null && (
          <>
            <div className="configurator-header">
              <div className="configurator-heading">
                <span className="panel-eyebrow">GREEN MOMENTS <span>·</span> CONFIGURADOR</span>
                <h1>Diseña tu pista</h1>
              </div>
              <button className="icon-button panel-dismiss" type="button" onClick={() => setActiveStep(null)} aria-label="Ocultar configurador" title="Ocultar configurador"><X size={17} /></button>
            </div>

            <nav className="configurator-steps" aria-label="Pasos de configuración">
              {configurationSteps.map((label, index) => (
                <button key={label} className={`step-button${activeStep === index ? ' is-active' : ''}${activeStep > index ? ' is-complete' : ''}`} type="button" aria-current={activeStep === index ? 'step' : undefined} aria-label={`Paso ${index + 1}: ${label}`} onClick={() => setActiveStep(index)}>
                  <span className="step-number">{activeStep > index ? <Check size={12} /> : index + 1}</span>
                  <span className="step-label">{label}</span>
                </button>
              ))}
              <button className={`step-button summary-step${activeStep === 5 ? ' is-active' : ''}`} type="button" aria-current={activeStep === 5 ? 'step' : undefined} aria-label="Resumen" onClick={() => setActiveStep(5)}>
                <span className="step-number"><Check size={12} /></span>
                <span className="step-label">Resumen</span>
              </button>
            </nav>

            <div className="configurator-content" key={activeStep}>
              {activeStep === 0 && <>
                <div className="step-intro"><span>PASO 01 / 05</span><h2>¿Qué tipo de pista quieres?</h2><p>Elige la estructura que mejor se adapta a tu espacio.</p></div>
                {renderCourtChoices()}
              </>}
              {activeStep === 1 && <>
                <div className="step-intro"><span>PASO 02 / 05</span><h2>¿Qué césped prefieres?</h2><p>Elige entre las tres fibras disponibles para pádel.</p></div>
                {renderChoices(grassTypes, configuration.grassType, (id) => updateConfiguration('grassType', id as CourtConfiguration['grassType']))}
              </>}
              {activeStep === 2 && <>
                <div className="step-intro"><span>PASO 03 / 05</span><h2>Elige el color del césped</h2><p>La pista se actualiza al instante.</p></div>
                <div className="swatch-grid turf-swatches">
                  {grassColors.map((option) => <button key={option.id} className={`swatch-option${configuration.grassColor === option.id ? ' is-selected' : ''}`} type="button" aria-label={option.label} aria-pressed={configuration.grassColor === option.id} onClick={() => updateConfiguration('grassColor', option.id)}><span className="color-swatch" style={{ backgroundColor: option.color }}><Check size={14} /></span><span>{option.label}</span></button>)}
                </div>
              </>}
              {activeStep === 3 && <>
                <div className="step-intro"><span>PASO 04 / 05</span><h2>Color lacado de la estructura</h2><p>Acabado en pintura al horno · carta RAL.</p></div>
                <div className="swatch-grid frame-swatches">
                  {frameColors.map((option) => <button key={option.id} className={`swatch-option${configuration.frameColor === option.id ? ' is-selected' : ''}`} type="button" aria-label={`${option.label} ${option.ral}`} aria-pressed={configuration.frameColor === option.id} onClick={() => updateConfiguration('frameColor', option.id)}><span className="color-swatch" style={{ backgroundColor: option.color }}><Check size={14} /></span><span>{option.label}<small>{option.ral}</small></span></button>)}
                </div>
              </>}
              {activeStep === 4 && <>
                <div className="step-intro"><span>PASO 05 / 05</span><h2>¿Qué tipo de focos?</h2><p>Elige una iluminación integrada en la estructura.</p></div>
                {renderChoices(lightingTypes, configuration.lighting, (id) => updateConfiguration('lighting', id as CourtConfiguration['lighting']))}
              </>}
              {activeStep === 5 && <>
                <div className="step-intro"><span>CONFIGURACIÓN COMPLETA</span><h2>Tu pista</h2><p>Revisa tu selección y solicita información.</p></div>
                <dl className="configuration-summary">
                  {[
                    ['Tipo de pista', selectedCourt.label, 0],
                    ['Césped', selectedGrass.label, 1],
                    ['Color del césped', selectedGrassColor.label, 2],
                    ['Estructura', `${selectedFrame.label} · ${selectedFrame.ral}`, 3],
                    ['Iluminación', selectedLighting.label, 4],
                  ].map(([label, value, editStep]) => <div className="summary-row" key={label}><dt>{label}</dt><dd>{value}</dd><button className="summary-edit" type="button" aria-label={`Editar ${label}`} onClick={() => setActiveStep(Number(editStep))}><Pencil size={13} /></button></div>)}
                </dl>
                <a className="quote-link" href={quoteHref}><Mail size={16} /> Solicitar presupuesto <ArrowRight size={15} /></a>
                <p className="quote-note">Se abrirá un correo a victor@greenmoments.es con las opciones de tu pista.</p>
              </>}
            </div>

            <footer className="configurator-footer">
              <span className="step-count">{activeStep < 5 ? `PASO ${String(activeStep + 1).padStart(2, '0')} / 05` : 'RESUMEN'}</span>
              <div className="step-actions">
                {activeStep > 0 && <button className="back-button" type="button" onClick={() => setActiveStep((current) => current === null ? null : Math.max(0, current - 1))}><ArrowLeft size={15} /> Atrás</button>}
                {activeStep < 5 && <button className="next-button" type="button" onClick={() => setActiveStep((current) => current === null ? 0 : Math.min(5, current + 1))}>Siguiente <ArrowRight size={15} /></button>}
              </div>
            </footer>
          </>
        )}
        {activeStep === null && <button className="configurator-reopen" type="button" onClick={() => setActiveStep(0)}><SlidersHorizontal size={16} /> Configurar pista</button>}
      </aside>

      <aside id="reference-panel" className="reference-panel" hidden={!showReference}>
        <div className="reference-heading"><span>REFERENCIA DE PROYECTO</span><button className="icon-button reference-close" type="button" onClick={() => setShowReference(false)} title="Cerrar referencia" aria-label="Cerrar referencia del proyecto"><X size={15} strokeWidth={1.8} /></button></div>
        <img className="reference-image" src={`${import.meta.env.BASE_URL}padel-project.jpg`} alt="Pista de pádel de Green Moments" />
        <div className="reference-foot"><span>CONSTRUCCIÓN DE PISTAS DE PÁDEL</span><span>01 / 01</span></div>
      </aside>

      <div className="interaction-hint"><Move3D size={15} strokeWidth={1.7} /><span>ARRASTRA PARA EXPLORAR</span><span className="hint-dot">·</span><span>RUEDA PARA ZOOM</span></div>
    </main>
  )
}

export default App
