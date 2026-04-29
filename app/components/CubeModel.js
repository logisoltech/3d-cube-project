"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

function getTodayDiagonalLabels() {
  const d = new Date();
  return {
    weekday: d.toLocaleDateString(undefined, { weekday: "long" }),
    dateLine: d.toLocaleDateString(undefined, {
      month: "long",
      day: "numeric",
      year: "numeric",
    }),
  };
}

const QDCI_TAGLINE = "Only Pharma Solid and Pharma Sterile";

function wrapCenteredLines(ctx, text, cx, baselineY, maxWidth, lineHeight) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";

  for (const w of words) {
    const trial = line ? `${line} ${w}` : w;
    if (ctx.measureText(trial).width <= maxWidth) {
      line = trial;
    } else {
      if (line) lines.push(line);
      line = w;
    }
  }
  if (line) lines.push(line);

  let y = baselineY;
  lines.forEach((ln) => {
    ctx.fillText(ln, cx, y);
    y += lineHeight;
  });
}

// Top face texture: 1QDCI title + day / date / tagline (all horizontal)
function createDiagonalTexture(
  text,
  today = getTodayDiagonalLabels(),
  width = 500,
  height = 500
) {
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

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 68px Arial";
  ctx.fillText(text, width / 2, 104);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(48, 138);
  ctx.lineTo(width - 48, 138);
  ctx.stroke();

  ctx.fillStyle = "rgba(180, 230, 255, 0.95)";
  ctx.font = "600 42px Arial";
  ctx.fillText(today.weekday, width / 2, 198);

  ctx.fillStyle = "rgba(230, 240, 255, 0.92)";
  ctx.font = "600 36px Arial";
  ctx.fillText(today.dateLine, width / 2, 262);

  ctx.fillStyle = "rgba(200, 220, 245, 0.92)";
  ctx.font = "500 28px Arial";
  const maxW = width - 40;
  wrapCenteredLines(
    ctx,
    QDCI_TAGLINE,
    width / 2,
    324,
    maxW,
    34
  );

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

const FACE_ROTATION_MAP = {
  QUALITY:   { x: 0, y: 0 },
  SAFETY:    { x: 0, y: 1 },
  COST:      { x: 0, y: -1 },
  DELIVERY:  { x: 0, y: 2 },
  "1QDCI":   { x: 1, y: 0 },
  INVENTORY: { x: -1, y: 0 },
};

const FACE_STEP = Math.PI / 2;
const START_ROTATION_Y = -0.26;

const _helper = new THREE.Object3D();
_helper.lookAt(4.8, 2.4, 4.8);
const _lookAtQuat = _helper.quaternion.clone();

const _topBottomPreEulers = {
  "1QDCI":   new THREE.Euler(Math.PI / 2, 0, 0),
  INVENTORY: new THREE.Euler(-Math.PI / 2, 0, 0),
};
const FLAT_QUATS = {};
for (const [name, euler] of Object.entries(_topBottomPreEulers)) {
  FLAT_QUATS[name] = _lookAtQuat.clone().multiply(
    new THREE.Quaternion().setFromEuler(euler)
  );
}

/** Env map bias for 1QDCI (top) only — shifts reflection toward the viewer’s right edge of the face */
const QDCI_ENV_MAP_ROTATION = new THREE.Euler(0.18, -2.05, 0.1, "XYZ");

function getTargetQuat(fx, fy) {
  if (fx === 1) return FLAT_QUATS["1QDCI"];
  if (fx === -1) return FLAT_QUATS["INVENTORY"];
  const euler = new THREE.Euler(0, START_ROTATION_Y + fy * FACE_STEP, 0, "XYZ");
  return new THREE.Quaternion().setFromEuler(euler);
}

function DashboardCube({ faceData, onFaceClick, targetFace }) {
  const groupRef = useRef(null);
  const meshRef = useRef(null);
  const topSpotRef = useRef(null);
  const topSpotTargetRef = useRef(null);
  const { gl, camera } = useThree();
  const raycaster = useMemo(() => new THREE.Raycaster(), []);

  useLayoutEffect(() => {
    const spot = topSpotRef.current;
    const tgt = topSpotTargetRef.current;
    if (spot && tgt) {
      spot.target = tgt;
      tgt.updateMatrixWorld(true);
    }
  }, []);

  const [faceIndexX, setFaceIndexX] = useState(0);
  const [faceIndexY, setFaceIndexY] = useState(0);
  /** Refreshes 1QDCI face texture periodically so day/date stays current */
  const [todayTick, setTodayTick] = useState(() => Date.now());

  useEffect(() => {
    setTodayTick(Date.now());
    const id = window.setInterval(() => setTodayTick(Date.now()), 60 * 1000);
    return () => window.clearInterval(id);
  }, []);

  const dragState = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    deltaX: 0,
    deltaY: 0,
  });

  const faces = faceData && faceData.length ? faceData : DEFAULT_FACES;

  useEffect(() => {
    if (!targetFace) return;
    const rot = FACE_ROTATION_MAP[targetFace.toUpperCase()];
    if (rot) {
      setFaceIndexX(rot.x);
      setFaceIndexY(rot.y);
    }
  }, [targetFace]);

  const materials = useMemo(() => {
    const mats = [];
    const todayLbl = getTodayDiagonalLabels();

    faces.forEach((face) => {
      if (face.diagonal) {
        const tex = createDiagonalTexture(face.title, todayLbl);
        const qdciMat = new THREE.MeshPhysicalMaterial({
          map: tex,
          metalness: 0.3,
          roughness: 0.15,
          reflectivity: 0.8,
          clearcoat: 0.6,
          clearcoatRoughness: 0.1,
          envMapIntensity: 0.9,
          transparent: false,
          side: THREE.FrontSide,
        });
        qdciMat.envMapRotation.copy(QDCI_ENV_MAP_ROTATION);
        mats.push(qdciMat);
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
  }, [faces, todayTick]);

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

    const onPointerUp = (e) => {
      if (!dragState.current.isDragging) return;

      const dragX = dragState.current.deltaX;
      const dragY = dragState.current.deltaY;
      const threshold = 30;
      const clickThreshold = 5;

      const isClick =
        Math.abs(dragX) < clickThreshold && Math.abs(dragY) < clickThreshold;

      if (isClick && meshRef.current && onFaceClick) {
        const rect = gl.domElement.getBoundingClientRect();
        const mouse = new THREE.Vector2(
          ((e.clientX - rect.left) / rect.width) * 2 - 1,
          -((e.clientY - rect.top) / rect.height) * 2 + 1
        );
        raycaster.setFromCamera(mouse, camera);
        const hits = raycaster.intersectObject(meshRef.current);
        if (hits.length > 0) {
          const faceIndex = Math.floor(hits[0].faceIndex / 2);
          const face = faces[faceIndex];
          if (face && !face.diagonal) {
            onFaceClick(face.title);
          }
        }
      } else if (Math.abs(dragX) > Math.abs(dragY) && Math.abs(dragX) > threshold) {
        if (dragX > 0) {
          setFaceIndexY((prev) => prev + 1);
        } else {
          setFaceIndexY((prev) => prev - 1);
        }
        setFaceIndexX(0);
      } else if (Math.abs(dragY) > Math.abs(dragX) && Math.abs(dragY) > threshold) {
        if (dragY > 0) {
          setFaceIndexX((prev) => Math.min(prev + 1, 1));
        } else {
          setFaceIndexX((prev) => Math.max(prev - 1, -1));
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

  const ambientRef = useRef(null);
  const dir1Ref = useRef(null);
  const dir2Ref = useRef(null);
  const isInventoryFlat = faceIndexX === -1;
  const isQdciFlat = faceIndexX === 1;
  const dimsSceneLights = isInventoryFlat || isQdciFlat;

  const TOP_SPOT_INTENSITY_DEFAULT = 11;

  useFrame(() => {
    if (!groupRef.current) return;
    const targetQuat = getTargetQuat(faceIndexX, faceIndexY);
    groupRef.current.quaternion.slerp(targetQuat, 0.12);

    const targetIntensity = dimsSceneLights ? 0 : 1;
    if (ambientRef.current) ambientRef.current.intensity = THREE.MathUtils.lerp(ambientRef.current.intensity, targetIntensity * 0.8, 0.08);
    if (dir1Ref.current) dir1Ref.current.intensity = THREE.MathUtils.lerp(dir1Ref.current.intensity, targetIntensity * 0.8, 0.08);
    if (dir2Ref.current) dir2Ref.current.intensity = THREE.MathUtils.lerp(dir2Ref.current.intensity, targetIntensity * 0.3, 0.08);
    if (topSpotRef.current) {
      topSpotRef.current.intensity = THREE.MathUtils.lerp(
        topSpotRef.current.intensity,
        dimsSceneLights ? 0 : TOP_SPOT_INTENSITY_DEFAULT,
        0.08
      );
    }
  });

  return (
    <>
      {/* Narrow spot aimed at the top face’s right half so the gleam isn’t confined to center-front */}
      <object3D ref={topSpotTargetRef} position={[1.72, 2.28, 0.15]} />
      <spotLight
        ref={topSpotRef}
        color="#eaf2ff"
        position={[10, 12, 6.5]}
        intensity={11}
        angle={0.28}
        penumbra={0.62}
        distance={48}
        decay={1.25}
        castShadow={false}
      />

      <ambientLight ref={ambientRef} intensity={0.8} />
      <directionalLight ref={dir1Ref} position={[5, 5, 5]} intensity={0.8} />
      <directionalLight ref={dir2Ref} position={[-3, 2, -4]} intensity={0.3} />
      <group ref={groupRef} position={[0, 0.56, 0]} scale={2.3}>
        <mesh ref={meshRef} material={materials}>
          <boxGeometry args={[1.5, 1.5, 1.5]} />
        </mesh>

        <lineSegments geometry={edgeGeometry}>
          <lineBasicMaterial color="#ffffff" transparent opacity={0.25} />
        </lineSegments>
      </group>
    </>
  );
}

export default function CubeModel({ cubeData, onFaceClick, targetFace }) {
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
      <Suspense fallback={null}>
        <Environment preset="city" />
        <DashboardCube faceData={faceData} onFaceClick={onFaceClick} targetFace={targetFace} />
      </Suspense>
    </Canvas>
  );
}