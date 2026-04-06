'use client';

import dynamic from "next/dynamic";
import Image from "next/image";

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
        <source src="/Empty.mp4" type="video/mp4" />
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

      <div
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          width: "100%",
          transform: "translateX(-50%)",
          zIndex: 2,
          pointerEvents: "none",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          className="curvedBand"
          style={{
            width: "135%",
            height: "170px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Image
            src="/hoechst.png"
            alt="Hoechst Pakistan"
            width={300}
            height={94}
            style={{ marginTop: "30px" }}
            priority
          />
        </div>
      </div>

      <style jsx>{`
        .curvedBand {
          --c: 85;
          background: rgba(255, 255, 255, 0.6);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.35);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1), inset 0 0 40px rgba(255, 255, 255, 0.15);
          -webkit-mask: radial-gradient(
              calc(var(--c) * 1%) 100% at 50%
                calc(-100% * cos(asin(50 / var(--c)))),
              #0000 calc(100% - 1px),
              #000
            );
          mask: radial-gradient(
              calc(var(--c) * 1%) 100% at 50%
                calc(-100% * cos(asin(50 / var(--c)))),
              #0000 calc(100% - 1px),
              #000
            );
          clip-path: ellipse(calc(var(--c) * 1%) 100% at top);
        }
      `}</style>
    </div>
  );
}
