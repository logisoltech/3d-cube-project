"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
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

  ctx.fillStyle = "rgba(20, 50, 100, 0.82)";
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "rgba(80, 200, 255, 0.65)";
  ctx.lineWidth = 4.5;
  ctx.strokeRect(3, 3, width - 6, height - 6);

  ctx.strokeStyle = "rgba(80, 200, 255, 0.25)";
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

function createFaceTexture(title, items, width = 500, height = 500) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create canvas context");

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  ctx.fillStyle = "rgba(20, 50, 100, 0.82)";
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "rgba(80, 200, 255, 0.65)";
  ctx.lineWidth = 4.5;
  ctx.strokeRect(3, 3, width - 6, height - 6);

  ctx.strokeStyle = "rgba(80, 200, 255, 0.25)";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(15, 15, width - 30, height - 30);

  ctx.fillStyle = "#00d4ff";
  ctx.font = "bold 35px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(title, width / 2, 53);

  ctx.strokeStyle = "rgba(80, 200, 255, 0.45)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(39, 70);
  ctx.lineTo(width - 39, 70);
  ctx.stroke();

  ctx.textAlign = "left";
  ctx.font = "20px Arial";

  let y = 107;

  items.forEach((item) => {
    ctx.fillStyle = "#ffffff";
    ctx.font = "20px Arial";
    ctx.fillText(item.label, 34, y);

    if (item.value) {
      ctx.fillStyle = "#00ff88";
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

  return texture;
}

const faceData = [
  {
    title: "QUALITY",
    items: [
      { label: "Pharma Sterile", value: "98%" },
      { label: "Differential Pressure", value: "Pass" },
      { label: "Min. Solid", value: "103%" },
      { label: "Coating Thickness", value: "OK" },
    ],
  },
  {
    title: "DELIVERY",
    items: [
      { label: "On-Time Shipment", value: "97%" },
      { label: "Order Fulfillment", value: "99%" },
      { label: "Lead Time", value: "3 Days" },
      { label: "Backorder Rate", value: "1.2%" },
    ],
  },
  {
    title: "1QDCI",
    diagonal: true,
    items: [],
  },
  {
    title: "INVENTORY",
    items: [
      { label: "Raw Materials", value: "85%" },
      { label: "WIP", value: "12 Units" },
      { label: "Finished Goods", value: "340" },
      { label: "Turnover Rate", value: "4.2x" },
    ],
  },
  {
    title: "SAFETY",
    items: [
      { label: "Packaging Material Defect", value: "0" },
      { label: "Mfg. Plan Adherence", value: "100%" },
      { label: "Prod. Plan Adherence", value: "100%" },
      { label: "RM & FG Release", value: "100%" },
      { label: "Line Clearance > 1st", value: "100%" },
    ],
  },
  {
    title: "COST",
    items: [
      { label: "Scrap Rate", value: "0.8%" },
      { label: "Yield", value: "99.2%" },
      { label: "OEE", value: "87%" },
      { label: "Energy Usage", value: "Normal" },
    ],
  },
];

const FACE_STEP = Math.PI / 2;
const START_ROTATION_Y = -0.26;
const START_ROTATION_X = 0;

function DashboardCube() {
  const groupRef = useRef(null);
  const { gl } = useThree();

  const [faceIndexX, setFaceIndexX] = useState(0); // up/down
  const [faceIndexY, setFaceIndexY] = useState(0); // left/right

  const dragState = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    deltaX: 0,
    deltaY: 0,
  });

  const materials = useMemo(() => {
    return faceData.map((face) => {
      const texture = face.diagonal
        ? createDiagonalTexture(face.title)
        : createFaceTexture(face.title, face.items);

      return new THREE.MeshBasicMaterial({
        map: texture,
        transparent: false,
        side: THREE.FrontSide,
      });
    });
  }, []);

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
          // drag right
          setFaceIndexY((prev) => prev + 1);
        } else {
          // drag left
          setFaceIndexY((prev) => prev - 1);
        }
      } else if (Math.abs(dragY) > Math.abs(dragX) && Math.abs(dragY) > threshold) {
        if (dragY < 0) {
          // drag down
          setFaceIndexX((prev) => Math.max(prev - 1, -1));
        } else {
          // drag up
          setFaceIndexX((prev) => Math.min(prev + 1, 1));
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
    if (!groupRef.current) return;

    const targetY = START_ROTATION_Y + faceIndexY * FACE_STEP;
    const targetX = START_ROTATION_X + faceIndexX * FACE_STEP;

    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      targetY,
      0.12
    );

    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      targetX,
      0.12
    );
  });

  return (
    <group
      ref={groupRef}
      position={[0, 0, 0]}
      rotation={[START_ROTATION_X, START_ROTATION_Y, 0]}
      scale={1.8}
    >
      <mesh material={materials}>
        <boxGeometry args={[1.5, 1.5, 1.5]} />
      </mesh>

      <lineSegments geometry={edgeGeometry}>
        <lineBasicMaterial color="#60ccff" transparent opacity={0.75} />
      </lineSegments>
    </group>
  );
}

export default function CubeModel() {
  return (
    <Canvas
      camera={{ position: [4.8, 2.4, 4.8], fov: 50 }}
      style={{ width: "100%", height: "100%", background: "transparent" }}
      gl={{ alpha: true, antialias: true }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
      }}
    >
      <ambientLight intensity={1} />

      <Suspense fallback={null}>
        <DashboardCube />
      </Suspense>
    </Canvas>
  );
}