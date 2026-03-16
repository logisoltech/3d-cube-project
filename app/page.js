'use client';

import dynamic from "next/dynamic";

const CubeModel = dynamic(() => import("./components/CubeModel"), {
  ssr: false,
});

export default function Home() {
  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh", overflow: "hidden" }}>
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          zIndex: 0,
        }}
      >
        <source src="/bg.mp4" type="video/mp4" />
      </video>

      {/* 3D Cube Model - Full overlay */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 1,
      }}>
        <CubeModel />
      </div>
    </div>
  );
}
