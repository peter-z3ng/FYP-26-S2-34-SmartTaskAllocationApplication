"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";

function roundedRectShape(width, height, radius) {
  const x = -width / 2;
  const y = -height / 2;
  const shape = new THREE.Shape();

  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);

  return shape;
}

function Badge({ color = "#2563EB" }) {
  const cardRef = useRef(null);
  const [flipped, setFlipped] = useState(false);
  const shape = useMemo(() => roundedRectShape(2.3, 3.15, 0.16), []);

  useFrame(({ clock }) => {
    if (!cardRef.current) return;

    const targetY = flipped ? Math.PI : 0;
    const time = clock.getElapsedTime();

    cardRef.current.rotation.y = THREE.MathUtils.lerp(
      cardRef.current.rotation.y,
      targetY,
      0.07
    );

    cardRef.current.rotation.x = Math.sin(time * 0.8) * 0.025;
    cardRef.current.rotation.z = Math.sin(time * 0.6) * 0.018;
  });

  return (
    <group position={[0, 0.4, 0]}>
      <mesh position={[0, 1.85, 0]}>
        <boxGeometry args={[0.26, 2.8, 0.04]} />
        <meshStandardMaterial color="#020617" />
      </mesh>

      <mesh position={[0, 0.45, 0.04]}>
        <torusGeometry args={[0.25, 0.045, 16, 48]} />
        <meshStandardMaterial color="#020617" metalness={0.7} roughness={0.3} />
      </mesh>

      <group
        ref={cardRef}
        position={[0, -1.25, 0]}
        onClick={(e) => {
          e.stopPropagation();
          setFlipped((current) => !current);
        }}
      >
        <mesh>
          <extrudeGeometry
            args={[
              shape,
              {
                depth: 0.08,
                bevelEnabled: true,
                bevelSize: 0.025,
                bevelThickness: 0.025,
                bevelSegments: 8,
              },
            ]}
          />
          <meshPhysicalMaterial
            color="#f8fafc"
            roughness={0.4}
            metalness={0.04}
            clearcoat={1}
            side={THREE.DoubleSide}
          />
        </mesh>

        <Text position={[0, 0.25, 0.15]} fontSize={0.9} color="#020617">
          ✦
        </Text>

        <Text position={[0, -0.58, 0.15]} fontSize={0.22} color={color}>
          OPTIMA
        </Text>

        <Text
          position={[0, 0.28, -0.15]}
          rotation={[0, Math.PI, 0]}
          fontSize={0.22}
          color={color}
        >
          OPTIMUS AI
        </Text>

        <Text
          position={[0, -0.15, -0.15]}
          rotation={[0, Math.PI, 0]}
          fontSize={0.13}
          color="#020617"
          maxWidth={1.6}
          textAlign="center"
        >
          Smart task allocation for modern teams
        </Text>
      </group>
    </group>
  );
}

export default function Lanyard({ color = "#2563EB" }) {
  return (
    <div className="h-full w-full cursor-pointer">
      <Canvas orthographic camera={{ position: [0, 0, 10], zoom: 95 }}>
        <ambientLight intensity={2} />
        <directionalLight position={[3, 4, 6]} intensity={3} />
        <Badge color={color} />
      </Canvas>
    </div>
  );
}