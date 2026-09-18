"use client";
import {
  Component,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Environment,
  Float,
  Lightformer,
  OrbitControls,
  RoundedBox,
} from "@react-three/drei";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { MathUtils, Shape, type Group } from "three";
import { useReducedMotion } from "framer-motion";

class SceneBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="scene-fallback">
        HD<span>INDEPENDENT BY DESIGN.</span>
      </div>
    ) : (
      this.props.children
    );
  }
}

function ChromeArtifact({ reduced }: { reduced: boolean }) {
  const group = useRef<Group>(null);
  const velocity = useRef(0);
  const star = useMemo(() => {
    const s = new Shape();
    for (let i = 0; i < 16; i++) {
      const angle = (i * Math.PI) / 8 + Math.PI / 2;
      const radius = i % 2 === 0 ? 1.52 : 0.88;
      if (i === 0) s.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
      else s.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
    }
    s.closePath();
    return s;
  }, []);
  useEffect(() => {
    let last = window.scrollY;
    const move = () => {
      velocity.current = MathUtils.clamp(
        (window.scrollY - last) * 0.012,
        -0.6,
        0.6,
      );
      last = window.scrollY;
    };
    window.addEventListener("scroll", move, { passive: true });
    return () => window.removeEventListener("scroll", move);
  }, []);
  useFrame(({ pointer, clock }, dt) => {
    if (!group.current || reduced) return;
    const delta = Math.min(dt, 0.1);
    velocity.current = MathUtils.damp(velocity.current, 0, 4, delta);
    group.current.rotation.y = MathUtils.damp(
      group.current.rotation.y,
      pointer.x * 0.35 +
        Math.sin(clock.elapsedTime * 0.24) * 0.38 +
        velocity.current,
      3,
      delta,
    );
    group.current.rotation.x = MathUtils.damp(
      group.current.rotation.x,
      -pointer.y * 0.22 + 0.05,
      3,
      delta,
    );
    group.current.rotation.z = Math.sin(clock.elapsedTime * 0.25) * 0.08 - 0.1;
  });
  const chrome = (
    <meshStandardMaterial color="#dedee0" metalness={1} roughness={0.14} />
  );
  return (
    <group ref={group} rotation={[0.12, -0.2, -0.1]}>
      <mesh position={[0, 0, -0.2]} castShadow>
        <extrudeGeometry
          args={[
            star,
            {
              depth: 0.24,
              bevelEnabled: true,
              bevelSegments: 4,
              steps: 1,
              bevelSize: 0.08,
              bevelThickness: 0.08,
            },
          ]}
        />
        {chrome}
      </mesh>
      <mesh position={[0, 0, 0.1]}>
        <torusGeometry args={[0.82, 0.13, 20, 90]} />
        {chrome}
      </mesh>
      <mesh position={[0, 0, 0.06]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.78, 0.78, 0.13, 72]} />
        <meshStandardMaterial
          color="#111214"
          metalness={0.8}
          roughness={0.23}
        />
      </mesh>
      <group position={[-0.3, 0, 0.17]}>
        <RoundedBox
          args={[0.1, 0.58, 0.13]}
          radius={0.02}
          position={[-0.13, 0, 0]}
        >
          {chrome}
        </RoundedBox>
        <RoundedBox
          args={[0.1, 0.58, 0.13]}
          radius={0.02}
          position={[0.13, 0, 0]}
        >
          {chrome}
        </RoundedBox>
        <RoundedBox args={[0.24, 0.1, 0.13]} radius={0.02}>
          {chrome}
        </RoundedBox>
      </group>
      <group position={[0.24, 0, 0.17]}>
        <mesh rotation={[0, 0, -Math.PI / 2]}>
          <torusGeometry args={[0.24, 0.058, 16, 40, Math.PI]} />
          {chrome}
        </mesh>
        <RoundedBox args={[0.1, 0.57, 0.13]} radius={0.02} position={[0, 0, 0]}>
          {chrome}
        </RoundedBox>
      </group>
      <mesh position={[0, 1.73, -0.15]} rotation={[0, 0, 0.1]}>
        <torusGeometry args={[0.26, 0.09, 16, 48]} />
        {chrome}
      </mesh>
      {Array.from({ length: 8 }, (_, i) => (
        <mesh
          key={i}
          position={[Math.sin(i * 0.15) * 0.25, 2.1 + i * 0.36, -0.18]}
          scale={[0.7, 1, 1]}
          rotation={[0, i % 2 ? Math.PI / 2 : 0, 0.12]}
        >
          <torusGeometry args={[0.22, 0.065, 12, 32]} />
          {chrome}
        </mesh>
      ))}
    </group>
  );
}

export default function HeroScene() {
  const reduced = !!useReducedMotion();
  const [active, setActive] = useState(true);
  const [webglAvailable, setWebglAvailable] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Canvas fallback children are hidden by browsers that support <canvas>
    // but disable WebGL. Check the actual graphics capability before mounting
    // the renderer, so those visitors still see the editorial hero.
    const frame = requestAnimationFrame(() => {
      const probe = document.createElement("canvas");
      try {
        const context = probe.getContext("webgl2");
        setWebglAvailable(!!context);
        context?.getExtension("WEBGL_lose_context")?.loseContext();
      } catch {
        setWebglAvailable(false);
      }
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => setActive(entry.isIntersecting),
      { rootMargin: "80px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return (
    <div
      className="hero-canvas"
      ref={container}
      role="img"
      aria-label={
        webglAvailable
          ? "Interactive chrome HD pendant. Drag to rotate. Decorative concept artifact."
          : "Chrome HD monogram. Independent by design."
      }
    >
      {!webglAvailable ? (
        <div className="scene-fallback">
          HD<span>INDEPENDENT BY DESIGN.</span>
        </div>
      ) : (
        <SceneBoundary>
          <Suspense
            fallback={
              <div className="scene-fallback">
                HD<span>INDEPENDENT BY DESIGN.</span>
              </div>
            }
          >
            <Canvas
              dpr={[1, 1.5]}
              camera={{ position: [0, 0.25, 6.9], fov: 37 }}
              gl={{
                antialias: true,
                alpha: true,
                powerPreference: "low-power",
              }}
              frameloop={active && !reduced ? "always" : "demand"}
              fallback={
                <div className="scene-fallback">
                  HD<span>INDEPENDENT BY DESIGN.</span>
                </div>
              }
            >
              <ambientLight intensity={0.6} />
              <directionalLight
                position={[2, 4, 5]}
                intensity={4}
                color="#ffffff"
              />
              <pointLight
                position={[-3, -2, 3]}
                intensity={15}
                color="#ff6254"
              />
              <Environment resolution={128}>
                <Lightformer
                  position={[0, 4, 4]}
                  scale={[9, 3, 1]}
                  intensity={5}
                />
                <Lightformer
                  position={[-4, 1, 2]}
                  rotation={[0, Math.PI / 4, 0]}
                  scale={[1, 9, 1]}
                  intensity={7}
                />
                <Lightformer
                  position={[4, -2, 2]}
                  rotation={[0, -Math.PI / 4, 0]}
                  scale={[2, 8, 1]}
                  intensity={4}
                  color="#cad0de"
                />
              </Environment>
              <Float
                speed={reduced ? 0 : 1.2}
                rotationIntensity={0.12}
                floatIntensity={0.3}
              >
                <ChromeArtifact reduced={reduced} />
              </Float>
              <OrbitControls
                enablePan={false}
                enableZoom={false}
                enableDamping
                minPolarAngle={0.7}
                maxPolarAngle={2.3}
              />
              {!reduced && (
                <EffectComposer multisampling={0}>
                  <Bloom intensity={0.3} luminanceThreshold={1.5} mipmapBlur />
                </EffectComposer>
              )}
            </Canvas>
          </Suspense>
        </SceneBoundary>
      )}
    </div>
  );
}
