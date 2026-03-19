"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";

// Creates diagonal heading texture for the QDCI face
function createDiagonalTexture(text, width = 500, height = 500) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  // Enable high-quality text rendering
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.textRenderingOptimization = "optimizeQuality";

  // Background - semi-transparent dark blue
  ctx.fillStyle = "rgba(5, 15, 45, 0.85)";
  ctx.fillRect(0, 0, width, height);

  // Border glow
  ctx.strokeStyle = "rgba(0, 180, 255, 0.6)";
  ctx.lineWidth = 4.5;
  ctx.strokeRect(3, 3, width - 6, height - 6);

  // Inner subtle border
  ctx.strokeStyle = "rgba(0, 180, 255, 0.2)";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(15, 15, width - 30, height - 30);

  // Diagonal text
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.rotate(-Math.PI / 6); // ~30 degrees diagonal
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 117px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 0, 0);
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  return texture;
}

// Creates a canvas texture with text for a cube face
function createFaceTexture(title, items, width = 500, height = 500) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  // Enable high-quality text rendering
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.textRenderingOptimization = "optimizeQuality";

  // Background - semi-transparent dark blue
  ctx.fillStyle = "rgba(5, 15, 45, 0.85)";
  ctx.fillRect(0, 0, width, height);

  // Border glow
  ctx.strokeStyle = "rgba(0, 180, 255, 0.6)";
  ctx.lineWidth = 4.5;
  ctx.strokeRect(3, 3, width - 6, height - 6);

  // Inner subtle border
  ctx.strokeStyle = "rgba(0, 180, 255, 0.2)";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(15, 15, width - 30, height - 30);

  // Title
  ctx.fillStyle = "#00d4ff";
  ctx.font = "bold 35px Arial";
  ctx.textAlign = "center";
  ctx.fillText(title, width / 2, 53);

  // Divider line under title
  ctx.strokeStyle = "rgba(0, 180, 255, 0.4)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(39, 70);
  ctx.lineTo(width - 39, 70);
  ctx.stroke();

  // Items
  ctx.textAlign = "left";
  ctx.font = "20px Arial";
  let y = 107;

  items.forEach((item) => {
    // Item label
    ctx.fillStyle = "#ffffff";
    ctx.font = "20px Arial";
    ctx.fillText(item.label, 34, y);

    // Item value (right-aligned)
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
  texture.needsUpdate = true;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  return texture;
}

// Face data for each side of the cube
const faceData = [
  {
    // Right face (+X)
    title: "QUALITY",
    items: [
      { label: "Pharma Sterile", value: "98%" },
      { label: "Differential Pressure", value: "Pass" },
      { label: "Min. Solid", value: "103%" },
      { label: "Coating Thickness", value: "OK" },
    ],
  },
  {
    // Left face (-X)
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
    // Bottom face (-Y)
    title: "INVENTORY",
    items: [
      { label: "Raw Materials", value: "85%" },
      { label: "WIP", value: "12 Units" },
      { label: "Finished Goods", value: "340" },
      { label: "Turnover Rate", value: "4.2x" },
    ],
  },
  {
    // Front face (+Z)
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
    // Back face (-Z)
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

  // Create materials for each face
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

  

  return (
    <mesh ref={meshRef} material={materials} rotation={[0, -0.16, 0]}>
      <boxGeometry args={[2, 2, 2]} />
    </mesh>
  );
}
// Glowing edges wireframe
function CubeEdges() {
  const edgesRef = useRef();

  

  return (
    <lineSegments ref={edgesRef} rotation={[0, -0.16, 0]}>
      <edgesGeometry args={[new THREE.BoxGeometry(2.01, 2.01, 2.01)]} />
      <lineBasicMaterial color="#00b4ff" linewidth={2} transparent opacity={0.7} />
    </lineSegments>
  );
}



export default function CubeModel() {
  return (
    <Canvas
      camera={{ position: [3.5, 2, 3.5], fov: 50 }}
      style={{ width: "100%", height: "100%", background: "transparent" }}
      gl={{ alpha: true }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
      }}
    >
      <ambientLight intensity={1} />
      <Suspense fallback={null}>
        <DashboardCube />
        <CubeEdges />
      </Suspense>
      <OrbitControls
        enableZoom={true}
        enableRotate={true}
        enablePan={false}
      />
    </Canvas>
  );
}
