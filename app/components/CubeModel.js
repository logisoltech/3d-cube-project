"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";

function roundedRectPath(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function createDiagonalTexture(text, width = 1024, height = 1024) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.textRenderingOptimization = "optimizeQuality";

  ctx.fillStyle = "#2b4ccc";
  ctx.fillRect(0, 0, width, height);

  roundedRectPath(ctx, 6, 6, width - 12, height - 12, 28);
  ctx.fillStyle = "#2b4ccc";
  ctx.fill();

  const diagonalVignette = ctx.createRadialGradient(
    width / 2,
    height / 2,
    width * 0.12,
    width / 2,
    height / 2,
    width * 0.78
  );
  diagonalVignette.addColorStop(0, "rgba(255, 255, 255, 0.035)");
  diagonalVignette.addColorStop(1, "rgba(255, 255, 255, 0.0)");
  ctx.fillStyle = diagonalVignette;
  ctx.fillRect(0, 0, width, height);

  roundedRectPath(ctx, 28, 28, width - 56, height - 56, 18);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.26)";
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.rotate(-Math.PI / 6);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 234px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 0, 0);
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  return texture;
}

function createFaceTexture(title, items, width = 1024, height = 1024) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.textRenderingOptimization = "optimizeQuality";

  ctx.fillStyle = "#2b4ccc";
  ctx.fillRect(0, 0, width, height);

  roundedRectPath(ctx, 6, 6, width - 12, height - 12, 28);
  ctx.fillStyle = "#2b4ccc";
  ctx.fill();

  const faceVignette = ctx.createRadialGradient(
    width / 2,
    height / 2,
    width * 0.12,
    width / 2,
    height / 2,
    width * 0.78
  );
  faceVignette.addColorStop(0, "rgba(255, 255, 255, 0.035)");
  faceVignette.addColorStop(1, "rgba(255, 255, 255, 0.0)");
  ctx.fillStyle = faceVignette;
  ctx.fillRect(0, 0, width, height);

  roundedRectPath(ctx, 28, 28, width - 56, height - 56, 18);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.26)";
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 70px Arial";
  ctx.textAlign = "center";
  ctx.fillText(title, width / 2, 106);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.42)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(78, 140);
  ctx.lineTo(width - 78, 140);
  ctx.stroke();

  ctx.textAlign = "left";
  ctx.font = "40px Arial";
  let y = 214;

  items.forEach((item) => {
    ctx.fillStyle = "#ffffff";
    ctx.font = "40px Arial";
    ctx.fillText(item.label, 68, y);

    if (item.value) {
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 40px Arial";
      ctx.textAlign = "right";
      ctx.fillText(item.value, width - 68, y);
      ctx.textAlign = "left";
    }

    y += 74;
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  texture.colorSpace = THREE.SRGBColorSpace;
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

function DashboardCube() {
  const meshRef = useRef();

  const materials = useMemo(() => {
    return faceData.map((face) => {
      const texture = face.diagonal
        ? createDiagonalTexture(face.title)
        : createFaceTexture(face.title, face.items);

      return new THREE.MeshPhongMaterial({
        map: texture,
        specular: new THREE.Color("#ffffff"),
        shininess: 320,
        reflectivity: 1,
        emissive: new THREE.Color("#1f1f1f"),
      });
    });
  }, []);

  return (
    <group ref={meshRef} position={[0, -2.3, 0]} rotation={[0, -0.16, 0]}>
      <mesh material={materials}>
        <boxGeometry args={[1.9, 1.9, 1.9]} />
      </mesh>

      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(1.92, 1.92, 1.925)]} />
        <lineBasicMaterial color="#ffffff" transparent opacity={0.8} />
      </lineSegments>
    </group>
  );
}

export default function CubeModel() {
  return (
    <Canvas
      camera={{ position: [3.2, 1.4, 3.2], fov: 60 }}
      style={{ width: "100%", height: "100%", background: "transparent" }}
      gl={{ alpha: true, antialias: true }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        gl.physicallyCorrectLights = true;
      }}
    >
      <ambientLight intensity={0.52} />
      <directionalLight position={[5, 5, 5]} intensity={1.25} />
      <directionalLight position={[-3, -2, -5]} intensity={0.46} />
      <directionalLight position={[0, 1.5, -6]} intensity={0.36} color="#d6e4ff" />
      <pointLight position={[3.5, 2.2, 5.5]} intensity={0.62} color="#ffffff" />

      <Suspense fallback={null}>
        <DashboardCube />
      </Suspense>

      <OrbitControls
        enableZoom={true}
        enableRotate={true}
        enablePan={false}
        target={[0, -2.3, 0]}
      />
    </Canvas>
  );
}