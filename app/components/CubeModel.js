"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

// Creates diagonal heading texture for the 1QDCI face
function createDiagonalTexture(text, width = 500, height = 500) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create canvas context");

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  ctx.fillStyle = "rgba(18, 45, 110, 0.9)";
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
  ctx.lineWidth = 4.5;
  ctx.strokeRect(3, 3, width - 6, height - 6);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(15, 15, width - 30, height - 30);

  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.rotate(-Math.PI / 6);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 117px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 0, 0);
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;

  return texture;
}

function isAlertValue(val) {
  const str = String(val).trim();
  if (!str || /[%a-zA-Z]/.test(str)) return false;
  const num = parseFloat(str);
  return !isNaN(num) && num > 0;
}

function createFaceTexture(title, items, width = 500, height = 500) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create canvas context");

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  ctx.fillStyle = "rgba(18, 45, 110, 0.9)";
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
  ctx.lineWidth = 4.5;
  ctx.strokeRect(3, 3, width - 6, height - 6);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(15, 15, width - 30, height - 30);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 35px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(title, width / 2, 53);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(39, 70);
  ctx.lineTo(width - 39, 70);
  ctx.stroke();

  ctx.textAlign = "left";
  ctx.font = "20px Arial";

  let y = 107;

  items.forEach((item) => {
    const alert = isAlertValue(item.value);

    if (alert) {
      ctx.fillStyle = "rgba(255, 50, 50, 0.08)";
      ctx.fillRect(30, y - 20, width - 60, 30);
    }

    ctx.fillStyle = alert ? "#ff4444" : "#ffffff";
    ctx.font = "20px Arial";
    ctx.fillText(item.label, 34, y);

    if (item.value) {
      ctx.fillStyle = alert ? "#ff4444" : "#ffffff";
      ctx.font = "bold 20px Arial";
      ctx.textAlign = "right";
      ctx.fillText(item.value, width - 34, y);
      ctx.textAlign = "left";
    }

    y += 37;
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;

  return { texture };
}

const DEFAULT_FACES = [
  { title: "QUALITY", items: [] },
  { title: "DELIVERY", items: [] },
  { title: "1QDCI", diagonal: true, items: [] },
  { title: "INVENTORY", items: [] },
  { title: "SAFETY", items: [] },
  { title: "COST", items: [] },
];

const FACE_STEP = Math.PI / 2;
const START_ROTATION_Y = -0.26;

function DashboardCube({ faceData }) {
  const yawRef = useRef(null);
  const pitchRef = useRef(null);
  const { gl } = useThree();

  const [faceIndexX, setFaceIndexX] = useState(0);
  const [faceIndexY, setFaceIndexY] = useState(0);

  const dragState = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    deltaX: 0,
    deltaY: 0,
  });

  const faces = faceData && faceData.length ? faceData : DEFAULT_FACES;

  const materials = useMemo(() => {
    const mats = [];

    faces.forEach((face) => {
      if (face.diagonal) {
        const tex = createDiagonalTexture(face.title);
        mats.push(
          new THREE.MeshPhysicalMaterial({
            map: tex,
            metalness: 0.3,
            roughness: 0.15,
            reflectivity: 0.8,
            clearcoat: 0.6,
            clearcoatRoughness: 0.1,
            envMapIntensity: 0.9,
            transparent: false,
            side: THREE.FrontSide,
          })
        );
      } else {
        const { texture } = createFaceTexture(face.title, face.items);
        mats.push(
          new THREE.MeshPhysicalMaterial({
            map: texture,
            metalness: 0.3,
            roughness: 0.15,
            reflectivity: 0.8,
            clearcoat: 0.6,
            clearcoatRoughness: 0.1,
            envMapIntensity: 0.9,
            transparent: false,
            side: THREE.FrontSide,
          })
        );
      }
    });

    return mats;
  }, [faces]);

  const edgeGeometry = useMemo(() => {
    return new THREE.EdgesGeometry(new THREE.BoxGeometry(1.51, 1.51, 1.51));
  }, []);

  useEffect(() => {
    const dom = gl.domElement;

    const onPointerDown = (e) => {
      dragState.current.isDragging = true;
      dragState.current.startX = e.clientX;
      dragState.current.startY = e.clientY;
      dragState.current.deltaX = 0;
      dragState.current.deltaY = 0;
    };

    const onPointerMove = (e) => {
      if (!dragState.current.isDragging) return;
      dragState.current.deltaX = e.clientX - dragState.current.startX;
      dragState.current.deltaY = e.clientY - dragState.current.startY;
    };

    const onPointerUp = () => {
      if (!dragState.current.isDragging) return;

      const dragX = dragState.current.deltaX;
      const dragY = dragState.current.deltaY;
      const threshold = 30;

      if (Math.abs(dragX) > Math.abs(dragY) && Math.abs(dragX) > threshold) {
        if (dragX > 0) {
          setFaceIndexY((prev) => prev + 1);
        } else {
          setFaceIndexY((prev) => prev - 1);
        }
        setFaceIndexX(0);
      } else if (Math.abs(dragY) > Math.abs(dragX) && Math.abs(dragY) > threshold) {
        if (dragY > 0) {
          setFaceIndexX(1);
        } else {
          setFaceIndexX(-1);
        }
      }

      dragState.current.isDragging = false;
      dragState.current.startX = 0;
      dragState.current.startY = 0;
      dragState.current.deltaX = 0;
      dragState.current.deltaY = 0;
    };

    dom.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    window.addEventListener("mouseleave", onPointerUp);

    return () => {
      dom.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      window.removeEventListener("mouseleave", onPointerUp);
    };
  }, [gl]);

  useFrame(() => {
    if (!yawRef.current || !pitchRef.current) return;

    const targetY = START_ROTATION_Y + faceIndexY * FACE_STEP;
    const targetX = faceIndexX * FACE_STEP;

    yawRef.current.rotation.y = THREE.MathUtils.lerp(
      yawRef.current.rotation.y,
      targetY,
      0.12
    );

    pitchRef.current.rotation.x = THREE.MathUtils.lerp(
      pitchRef.current.rotation.x,
      targetX,
      0.12
    );
  });

  return (
    <group ref={yawRef} position={[0, 0.4, 0]} rotation={[0, START_ROTATION_Y, 0]}>
      <group ref={pitchRef}>
        <group scale={2.3}>
          <mesh material={materials}>
            <boxGeometry args={[1.5, 1.5, 1.5]} />
          </mesh>

          <lineSegments geometry={edgeGeometry}>
            <lineBasicMaterial color="#ffffff" transparent opacity={0.25} />
          </lineSegments>
        </group>
      </group>
    </group>
  );
}

export default function CubeModel({ cubeData }) {
  const faceData = cubeData && cubeData.length ? cubeData : DEFAULT_FACES;

  return (
    <Canvas
      camera={{ position: [4.8, 2.4, 4.8], fov: 50 }}
      style={{ width: "100%", height: "100%", background: "transparent" }}
      gl={{ alpha: true, antialias: true }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
      }}
    >
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <directionalLight position={[-3, 2, -4]} intensity={0.3} />

      <Suspense fallback={null}>
        <Environment preset="city" />
        <DashboardCube faceData={faceData} />
      </Suspense>
    </Canvas>
  );
}