'use client';

import dynamic from "next/dynamic";
import Image from "next/image";

const CubeModel = dynamic(() => import("./components/CubeModel"), {
  ssr: false,
});

export default function Home() {
  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          zIndex: 0,
        }}
      >
        <source src="/Empty.mp4" type="video/mp4" />
      </video>

      {/* 3D Cube Model - bottom centered */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: "62vh",
          zIndex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-end",
          pointerEvents: "auto",
        }}
      >
        <div
          style={{
            width: "min(70vw, 560px)",
            height: "min(70vw, 560px)",
            minWidth: "320px",
            minHeight: "320px",
            maxWidth: "560px",
            maxHeight: "560px",
          }}
        >
          <CubeModel />
        </div>
      </div>

      {/* Top curved band with logo */}
      <div
        style={{
          position: "absolute",
          top: "40px",
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
            src="/logo.png"
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
            calc(var(--c) * 1%) 100% at 50% calc(-100% * cos(asin(50 / var(--c)))),
            #0000 calc(100% - 1px),
            #000
          );
          mask: radial-gradient(
            calc(var(--c) * 1%) 100% at 50% calc(-100% * cos(asin(50 / var(--c)))),
            #0000 calc(100% - 1px),
            #000
          );
          clip-path: ellipse(calc(var(--c) * 1%) 100% at top);
        }

        @media (max-width: 768px) {
          .curvedBand {
            width: 160%;
            height: 140px;
          }
        }
      `}</style>
    </div>
  );
}