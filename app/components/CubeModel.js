"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { Suspense, useEffect, useMemo } from "react";
import * as THREE from "three";

const MODEL_PATH = "/cubest.glb";

function createBigFaceTexture(text, width = 1024, height = 1024) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create canvas context");

  ctx.clearRect(0, 0, width, height);

  // background
  ctx.fillStyle = "#0b4f96";
  ctx.fillRect(0, 0, width, height);

  // soft top glow
  const glow = ctx.createLinearGradient(0, 0, 0, height * 0.45);
  glow.addColorStop(0, "rgba(255,255,255,0.26)");
  glow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height * 0.45);

  // border
  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.lineWidth = 10;
  ctx.strokeRect(30, 30, width - 60, height - 60);

  // inner panel
  ctx.fillStyle = "rgba(255,255,255,0.05)";
  ctx.fillRect(60, 60, width - 120, height - 120);

  // text
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "bold 170px Arial";
  ctx.fillText(text, width / 2, height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.flipY = false;
  texture.needsUpdate = true;
  return texture;
}

function createShadowTexture(size = 1024) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create canvas context");

  const gradient = ctx.createRadialGradient(
    size / 2,
    size / 2,
    size * 0.1,
    size / 2,
    size / 2,
    size * 0.45
  );
  gradient.addColorStop(0, "rgba(0,0,0,0.42)");
  gradient.addColorStop(0.45, "rgba(0,0,0,0.22)");
  gradient.addColorStop(1, "rgba(0,0,0,0)");

  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.flipY = false;
  texture.needsUpdate = true;
  return texture;
}

function rotateTexture(texture, rotation = 0) {
  texture.center.set(0.5, 0.5);
  texture.rotation = rotation;
  texture.needsUpdate = true;
  return texture;
}

function makeFaceMaterial(texture) {
  return new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    side: THREE.DoubleSide,
  });
}

function makeShadowMaterial() {
  return new THREE.MeshBasicMaterial({
    map: createShadowTexture(),
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
}

function getFaceKey(name = "") {
  if (name.startsWith("ChamferBox001")) return "side1";
  if (name.startsWith("ChamferBox002")) return "side2";
  if (name.startsWith("ChamferBox003")) return "side3";
  if (name.startsWith("ChamferBox004")) return "side4";
  if (name.startsWith("ChamferBox005")) return "top";
  if (name.startsWith("ChamferBox006")) return "bottom";
  if (name.startsWith("Plane001")) return "shadow";
  return null;
}

function DashboardCubeModel() {
  const { scene } = useGLTF(MODEL_PATH);

  const materials = useMemo(() => {
    return {
      side1: makeFaceMaterial(
        rotateTexture(createBigFaceTexture("QUALITY"), 0)
      ),
      side2: makeFaceMaterial(
        rotateTexture(createBigFaceTexture("DELIVERY"), 0)
      ),
      side3: makeFaceMaterial(
        rotateTexture(createBigFaceTexture("INVENTORY"), 0)
      ),
      side4: makeFaceMaterial(
        rotateTexture(createBigFaceTexture("SAFETY"), 0)
      ),
      top: makeFaceMaterial(
        rotateTexture(createBigFaceTexture("1QDCI"), 0)
      ),
      bottom: makeFaceMaterial(
        rotateTexture(createBigFaceTexture("COST"), 0)
      ),
      shadow: makeShadowMaterial(),
    };
  }, []);

  useEffect(() => {
    scene.traverse((obj) => {
      if (!obj.isMesh) return;

      obj.frustumCulled = false;
      obj.castShadow = false;
      obj.receiveShadow = false;

      const faceKey = getFaceKey(obj.name);
      if (!faceKey) return;

      obj.material = materials[faceKey];

      if (faceKey === "shadow") {
        obj.renderOrder = 0;
      } else {
        obj.renderOrder = 1;
      }
    });
  }, [scene, materials]);

  return (
    <primitive
      object={scene}
      position={[0, 0, 0]}
      rotation={[0, -0.26, 0]}
      scale={0.052}
    />
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
        <DashboardCubeModel />
      </Suspense>

      <OrbitControls
        enableZoom={false}
        enableRotate
        enablePan={false}
        target={[0, 0, 0]}
      />
    </Canvas>
  );
}

useGLTF.preload(MODEL_PATH);