import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as CANNON from 'cannon-es';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { classNames } from '~/utils/classNames';

interface Hero3DProps {
  className?: string;
  accent?: string;
  accent2?: string;
  accent3?: string;
  bodyCount?: number;
}

const PALETTE_FALLBACK = ['#7c5cff', '#22d3ee', '#ff5fa2', '#ffffff'];

function prefersReducedMotion() {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function RigidBodies({ colors, bodyCount }: { colors: string[]; bodyCount: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { camera, gl } = useThree();
  const pointer = useRef(new THREE.Vector2(-10, -10));
  const raycaster = useMemo(() => new THREE.Raycaster(), []);

  const { world, bodies, radii, geometry } = useMemo(() => {
    const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.81, 0) });

    world.defaultContactMaterial.restitution = 0.68;
    world.defaultContactMaterial.friction = 0.22;
    world.allowSleep = false;

    const ground = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Plane(),
      quaternion: new CANNON.Quaternion().setFromEuler(-Math.PI / 2, 0, 0),
      position: new CANNON.Vec3(0, -2.4, 0),
    });

    world.addBody(ground);

    const radii: number[] = [];

    const bodies = Array.from({ length: bodyCount }, (_, index) => {
      const radius = 0.26 + Math.random() * 0.34;
      radii.push(radius);

      const body = new CANNON.Body({
        mass: radius * radius * 6,
        shape: new CANNON.Sphere(radius),
        position: new CANNON.Vec3((Math.random() - 0.5) * 9, 2 + index * 0.8, (Math.random() - 0.5) * 3.2),
        linearDamping: 0.008,
        angularDamping: 0.02,
      });

      body.velocity.set((Math.random() - 0.5) * 1.6, 0, (Math.random() - 0.5) * 1.6);
      world.addBody(body);

      return body;
    });

    return { world, bodies, radii, geometry: new THREE.IcosahedronGeometry(1, 1) };
  }, [bodyCount]);

  // pointer → world ray, then impulse on the body under the cursor
  useEffect(() => {
    const element = gl.domElement;

    const onPointerMove = (event: PointerEvent) => {
      const rect = element.getBoundingClientRect();

      pointer.current.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
      );
    };

    const onPointerDown = (event: PointerEvent) => {
      const rect = element.getBoundingClientRect();

      pointer.current.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer.current, camera);

      const hits = raycaster.intersectObject(meshRef.current as THREE.Object3D, false);

      if (hits.length === 0) {
        return;
      }

      const instanceId = hits[0].instanceId ?? -1;
      const body = bodies[instanceId];

      if (!body) {
        return;
      }

      const direction = raycaster.ray.direction.clone().normalize();

      body.velocity.x += direction.x * 9;
      body.velocity.y += Math.max(3.4, direction.y * 9);
      body.velocity.z += direction.z * 9;
      body.angularVelocity.set((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6);
    };

    element.addEventListener('pointermove', onPointerMove, { passive: true });
    element.addEventListener('pointerdown', onPointerDown, { passive: true });

    return () => {
      element.removeEventListener('pointermove', onPointerMove);
      element.removeEventListener('pointerdown', onPointerDown);
    };
  }, [bodies, camera, gl, raycaster]);

  useFrame((_, delta) => {
    const mesh = meshRef.current;

    if (!mesh) {
      return;
    }

    world.step(1 / 120, Math.min(delta, 0.05), 4);

    const matrix = new THREE.Matrix4();

    bodies.forEach((body, index) => {
      const position = new THREE.Vector3(body.position.x, body.position.y, body.position.z);
      const quaternion = new THREE.Quaternion(
        body.quaternion.x,
        body.quaternion.y,
        body.quaternion.z,
        body.quaternion.w,
      );
      const radius = radii[index] ?? 0.4;

      matrix.compose(position, quaternion, new THREE.Vector3(radius, radius, radius));
      mesh.setMatrixAt(index, matrix);
    });

    mesh.instanceMatrix.needsUpdate = true;
  });

  const instanceColors = useMemo(() => {
    const palette = colors.length > 0 ? colors : PALETTE_FALLBACK;
    const attribute = new Float32Array(bodyCount * 3);

    for (let index = 0; index < bodyCount; index++) {
      const color = new THREE.Color(palette[index % palette.length]);
      attribute[index * 3] = color.r;
      attribute[index * 3 + 1] = color.g;
      attribute[index * 3 + 2] = color.b;
    }

    return attribute;
  }, [bodyCount, colors]);

  return (
    <instancedMesh ref={meshRef} args={[geometry, undefined, bodyCount]} frustumCulled={false}>
      <meshStandardMaterial vertexColors roughness={0.16} metalness={0.72} emissive="#1b1040" emissiveIntensity={0.5} />
      <instancedBufferAttribute attach="instanceColor" args={[instanceColors, 3]} />
    </instancedMesh>
  );
}

function SceneLights({ accent, accent2 }: { accent: string; accent2: string }) {
  return (
    <>
      <hemisphereLight intensity={0.9} groundColor="#05060f" />
      <directionalLight position={[5, 9, 6]} intensity={2.1} />
      <pointLight position={[-6, 2, 4]} intensity={26} distance={30} color={accent} />
      <pointLight position={[6, -2, -2]} intensity={18} distance={30} color={accent2} />
    </>
  );
}

function CameraDrift({ enabled }: { enabled: boolean }) {
  const { camera } = useThree();
  const pointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const onPointerMove = (event: PointerEvent) => {
      pointer.current = {
        x: (event.clientX / window.innerWidth) * 2 - 1,
        y: (event.clientY / window.innerHeight) * 2 - 1,
      };
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });

    return () => window.removeEventListener('pointermove', onPointerMove);
  }, [enabled]);

  useFrame(() => {
    if (!enabled) {
      return;
    }

    camera.position.x += (pointer.current.x * 1.4 - camera.position.x) * 0.03;
    camera.position.y += (1.6 - pointer.current.y * 1.1 - camera.position.y) * 0.03;
    camera.lookAt(0, 0.1, 0);
  });

  return null;
}

export const Hero3D = memo(
  ({ className, accent = '#7c5cff', accent2 = '#22d3ee', accent3 = '#ff5fa2', bodyCount }: Hero3DProps) => {
    const [ready, setReady] = useState(false);
    const [failed, setFailed] = useState(false);
    const reduce = useMemo(prefersReducedMotion, []);

    useEffect(() => {
      const timer = window.setTimeout(() => setReady(true), 60);

      return () => window.clearTimeout(timer);
    }, []);

    const count = bodyCount ?? (typeof window !== 'undefined' && window.innerWidth < 820 ? 12 : 26);

    if (reduce || failed) {
      return <div className={classNames('xv-hero-fallback', className)} aria-hidden="true" />;
    }

    return (
      <div className={classNames('absolute inset-0', className)} aria-hidden="true">
        <div className="xv-hero-fallback absolute inset-0" />
        {ready && (
          <Canvas
            className="!absolute inset-0"
            dpr={[1, 1.75]}
            camera={{ position: [0, 1.6, 9], fov: 45 }}
            gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
            onCreated={({ gl }) => {
              gl.setClearAlpha(0);
            }}
            onError={() => setFailed(true)}
          >
            <fog attach="fog" args={['#05060f', 12, 26]} />
            <SceneLights accent={accent} accent2={accent2} />
            <CameraDrift enabled />
            <RigidBodies colors={[accent, accent2, accent3, '#ffffff']} bodyCount={count} />

            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.4, 0]} receiveShadow>
              <circleGeometry args={[18, 64]} />
              <meshStandardMaterial color="#05060f" roughness={0.9} metalness={0.25} />
            </mesh>

            <gridHelper args={[36, 36, accent, '#1b1b2c']} position={[0, -2.38, 0]} />

            <mesh position={[0, 1.1, -3.4]} rotation={[0, 0.5, 0]}>
              <torusGeometry args={[2.6, 0.02, 12, 96]} />
              <meshBasicMaterial color={accent2} transparent opacity={0.5} />
            </mesh>
            <mesh position={[0, 1.4, -5]} rotation={[0.3, -0.4, 0.2]}>
              <torusGeometry args={[3.6, 0.015, 12, 96]} />
              <meshBasicMaterial color={accent3} transparent opacity={0.35} />
            </mesh>
          </Canvas>
        )}
      </div>
    );
  },
);
