import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

// ── Simplified country boundary arcs (lat/lon pairs for major landmass outlines) ──
// Stored as [lon, lat] pairs, grouped into polylines

const LANDMASS_OUTLINES: [number, number][][] = [
  // North America (simplified)
  [[-130,50],[-125,48],[-123,46],[-120,35],[-117,33],[-110,32],[-105,30],[-100,28],[-97,26],[-97,28],[-95,30],[-90,30],[-85,30],[-82,25],[-80,26],[-82,30],[-85,35],[-75,35],[-70,42],[-67,45],[-65,47],[-60,47],[-55,47],[-52,48],[-56,50],[-60,50],[-65,50],[-70,55],[-75,55],[-80,55],[-85,55],[-90,55],[-95,55],[-100,55],[-105,55],[-110,55],[-115,55],[-120,55],[-125,55],[-130,55],[-135,58],[-140,60],[-145,60],[-150,60],[-155,60],[-160,62],[-165,64],[-168,66],[-165,68],[-160,70],[-155,72],[-140,70],[-130,70],[-120,68],[-110,65],[-100,63],[-95,60],[-90,58],[-85,60],[-80,62],[-75,62],[-70,58],[-65,55],[-60,53],[-55,50],[-130,50]],
  // South America
  [[-80,10],[-77,8],[-75,5],[-75,0],[-78,-5],[-75,-10],[-70,-15],[-65,-20],[-60,-25],[-57,-30],[-55,-35],[-65,-40],[-68,-45],[-70,-50],[-75,-52],[-72,-48],[-70,-42],[-72,-35],[-70,-30],[-68,-22],[-65,-18],[-60,-15],[-55,-10],[-50,-5],[-50,0],[-52,5],[-55,5],[-60,8],[-65,10],[-70,12],[-75,10],[-80,10]],
  // Europe
  [[-10,36],[-5,36],[0,38],[5,40],[10,38],[12,42],[15,45],[13,46],[10,47],[8,48],[5,48],[2,49],[0,48],[-5,48],[-10,44],[-10,36]],
  // Northern Europe / Scandinavia
  [[5,55],[8,55],[10,57],[12,56],[12,58],[10,60],[5,62],[8,63],[15,65],[18,68],[20,70],[25,70],[28,68],[30,65],[28,62],[25,60],[20,58],[18,55],[15,54],[10,55],[5,55]],
  // Africa
  [[-15,12],[-17,15],[-15,20],[-12,25],[-5,30],[0,32],[5,35],[10,37],[12,35],[15,32],[20,32],[25,30],[30,28],[33,30],[35,28],[40,12],[42,8],[45,5],[42,0],[40,-5],[38,-10],[35,-15],[33,-20],[35,-25],[30,-30],[28,-33],[25,-34],[20,-33],[18,-28],[15,-25],[12,-20],[10,-15],[8,-5],[5,0],[0,5],[-5,5],[-10,8],[-15,12]],
  // Asia (mainland)
  [[30,40],[35,42],[40,40],[45,38],[50,38],[55,37],[60,35],[65,35],[70,30],[72,25],[75,20],[78,15],[80,10],[82,8],[85,15],[90,22],[95,18],[100,15],[105,10],[108,15],[110,20],[115,25],[120,30],[122,35],[125,38],[128,35],[130,33],[132,35],[135,35],[140,38],[142,42],[145,45],[135,50],[130,48],[125,45],[120,45],[115,48],[110,50],[105,52],[100,55],[95,55],[90,55],[85,55],[80,55],[75,55],[70,55],[65,55],[60,55],[55,55],[50,55],[45,50],[40,45],[35,42],[30,40]],
  // Australia
  [[115,-35],[118,-33],[120,-30],[125,-25],[130,-15],[135,-12],[140,-15],[145,-15],[150,-22],[153,-27],[152,-32],[150,-35],[148,-38],[145,-38],[140,-35],[135,-35],[130,-32],[125,-32],[118,-35],[115,-35]],
  // British Isles
  [[-8,52],[-5,50],[-3,51],[0,51],[2,53],[0,55],[-3,56],[-5,58],[-7,57],[-8,55],[-6,54],[-8,52]],
  // Japan
  [[130,31],[131,33],[133,34],[135,35],[137,36],[139,36],[140,38],[141,40],[142,43],[141,44],[140,43],[138,38],[136,35],[134,34],[131,32],[130,31]],
]

function latLonToSphere(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lon + 180) * (Math.PI / 180)
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  )
}

// ── Shaders ──────────────────────────────────────────────────────────────

const globeVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const globeFragmentShader = `
  uniform vec3 uSunDirection;
  uniform float uTime;

  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;

  // Simple noise function for city lights
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  void main() {
    // Sun illumination
    float sunDot = dot(vNormal, uSunDirection);
    float dayFactor = smoothstep(-0.1, 0.3, sunDot);

    // Procedural ocean vs land
    float landNoise = noise(vUv * 8.0 + vec2(3.0, 7.0));
    float isLand = smoothstep(0.35, 0.55, landNoise);
    vec3 oceanColor = vec3(0.01, 0.03, 0.12) * (0.5 + 0.5 * dayFactor);
    vec3 landColor = vec3(0.04, 0.06, 0.03) * (0.5 + 0.5 * dayFactor);
    vec3 dayColor = mix(oceanColor, landColor, isLand);

    // Night side: faint city lights
    float cityNoise = noise(vUv * 120.0) * noise(vUv * 60.0 + 5.0);
    cityNoise = pow(cityNoise, 3.0) * 2.0;
    // Concentrate lights in "land" regions using coarse noise
    float landMask = smoothstep(0.35, 0.55, noise(vUv * 8.0 + vec2(3.0, 7.0)));
    float cityLights = cityNoise * landMask * (1.0 - dayFactor);
    vec3 nightGlow = vec3(1.0, 0.85, 0.5) * cityLights * 0.8;

    // Subtle latitude grid lines
    float latLine = abs(sin(vUv.y * 3.14159 * 12.0));
    latLine = smoothstep(0.97, 1.0, latLine) * 0.03;
    float lonLine = abs(sin(vUv.x * 3.14159 * 24.0));
    lonLine = smoothstep(0.97, 1.0, lonLine) * 0.03;
    float grid = max(latLine, lonLine);

    vec3 finalColor = dayColor + nightGlow + vec3(grid) * vec3(0.1, 0.2, 0.4);

    // Slight terminator glow
    float terminatorGlow = exp(-pow((sunDot + 0.05) * 8.0, 2.0)) * 0.15;
    finalColor += vec3(0.1, 0.15, 0.3) * terminatorGlow;

    // Rim darkening (edges of sphere)
    vec3 viewDir = normalize(-vPosition);
    float rimDot = dot(viewDir, vNormal);
    float rimDarken = smoothstep(0.0, 0.4, rimDot);
    finalColor *= rimDarken;

    gl_FragColor = vec4(finalColor, 0.92);
  }
`

const atmosphereVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const atmosphereFragmentShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    // Fresnel effect for edge glow
    vec3 viewDir = normalize(-vPosition);
    float fresnel = 1.0 - dot(viewDir, vNormal);
    fresnel = pow(fresnel, 3.0);

    vec3 color = vec3(0.1, 0.5, 1.0);
    float alpha = fresnel * 0.5;

    gl_FragColor = vec4(color, alpha);
  }
`

interface EarthGlobeProps {
  visible: boolean
}

export function EarthGlobe({ visible }: EarthGlobeProps) {
  const globeRef = useRef<THREE.Mesh>(null)
  const sunDirRef = useRef(new THREE.Vector3(1, 0.3, 0.5).normalize())

  // Country boundary lines geometry
  const boundaryGeometry = useMemo(() => {
    const positions: number[] = []

    for (const outline of LANDMASS_OUTLINES) {
      for (let i = 0; i < outline.length - 1; i++) {
        const [lon1, lat1] = outline[i]
        const [lon2, lat2] = outline[i + 1]

        // Interpolate between points for smoother curves on sphere
        const steps = 3
        for (let s = 0; s < steps; s++) {
          const t1 = s / steps
          const t2 = (s + 1) / steps
          const la1 = lat1 + (lat2 - lat1) * t1
          const lo1 = lon1 + (lon2 - lon1) * t1
          const la2 = lat1 + (lat2 - lat1) * t2
          const lo2 = lon1 + (lon2 - lon1) * t2

          const p1 = latLonToSphere(la1, lo1, 4.02)
          const p2 = latLonToSphere(la2, lo2, 4.02)

          positions.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z)
        }
      }
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    return geo
  }, [])

  // Update sun direction based on time of day
  useFrame(({ clock }) => {
    const hours = new Date().getHours() + new Date().getMinutes() / 60
    const angle = ((hours - 12) / 24) * Math.PI * 2
    sunDirRef.current.set(Math.cos(angle), 0.3, Math.sin(angle)).normalize()

    if (globeRef.current) {
      const mat = globeRef.current.material as THREE.ShaderMaterial
      if (mat.uniforms) {
        mat.uniforms.uSunDirection.value.copy(sunDirRef.current)
        mat.uniforms.uTime.value = clock.elapsedTime
      }
    }
  })

  const globeUniforms = useMemo(
    () => ({
      uSunDirection: { value: new THREE.Vector3(1, 0.3, 0.5).normalize() },
      uTime: { value: 0 },
    }),
    [],
  )

  if (!visible) return null

  return (
    <group>
      {/* Main globe sphere */}
      <mesh ref={globeRef}>
        <sphereGeometry args={[4, 48, 48]} />
        <shaderMaterial
          vertexShader={globeVertexShader}
          fragmentShader={globeFragmentShader}
          uniforms={globeUniforms}
          transparent
          depthWrite={false}
          side={THREE.FrontSide}
        />
      </mesh>

      {/* Country boundary lines */}
      <lineSegments geometry={boundaryGeometry}>
        <lineBasicMaterial
          color="#00D4FF"
          transparent
          opacity={0.35}
          depthWrite={false}
        />
      </lineSegments>

      {/* Atmosphere glow */}
      <mesh>
        <sphereGeometry args={[4.5, 48, 48]} />
        <shaderMaterial
          vertexShader={atmosphereVertexShader}
          fragmentShader={atmosphereFragmentShader}
          transparent
          depthWrite={false}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  )
}
