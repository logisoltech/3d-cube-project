"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import * as XLSX from "xlsx";
import dynamic from "next/dynamic";

const EXCEL_PATH = "/3d-cube.xlsx";

// Load the Canvas-heavy component on client only to avoid SSR issues
const CubeModel = dynamic(() => import("./components/CubeModel"), { ssr: false });

export default function Home() {
  const [rows, setRows] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [isMetricModalOpen, setIsMetricModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [excelError, setExcelError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadExcel() {
      try {
        setLoading(true);
        setExcelError("");

        const response = await fetch(EXCEL_PATH);
        if (!response.ok) {
          throw new Error(`Could not load ${EXCEL_PATH}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });

        // Uses first sheet by default
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const json = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        const formatted = json
          .map((item) => ({
            date: String(item.Date || "").trim(),
            category: String(item.Category || "").trim(),
            metric: String(item.Metric || "").trim(),
            value: String(item.Value || "").trim(),
            remarks: String(item.Remarks || "").trim(),
          }))
          .filter((item) => item.category && item.metric);

        if (isMounted) {
          setRows(formatted);
        }
      } catch (error) {
        console.error("Excel load error:", error);
        if (isMounted) {
          setExcelError("Failed to load Excel data.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadExcel();

    return () => {
      isMounted = false;
    };
  }, []);

  const categories = useMemo(() => {
    const unique = [...new Set(rows.map((row) => row.category))];
    return unique;
  }, [rows]);

  const cubeData = useMemo(() => {
    if (!rows.length) return [];

    const catOrder = ["Quality", "Delivery", "1QDCI", "Inventory", "Safety", "Cost"];
    const latestPerCategory = {};

    categories.forEach((cat) => {
      const catRows = rows.filter(
        (r) => r.category.toLowerCase() === cat.toLowerCase()
      );
      const dates = [...new Set(catRows.map((r) => r.date).filter(Boolean))];
      const latest = dates.length ? dates.sort().at(-1) : "";
      latestPerCategory[cat.toLowerCase()] = latest
        ? catRows.filter((r) => r.date === latest)
        : catRows;
    });

    return catOrder.map((cat) => {
      if (cat === "1QDCI") return { title: "1QDCI", diagonal: true, items: [] };
      const matched = Object.keys(latestPerCategory).find(
        (k) => k === cat.toLowerCase()
      );
      const catRows = matched ? latestPerCategory[matched] : [];
      return {
        title: cat.toUpperCase(),
        items: catRows.map((r) => ({ label: r.metric, value: r.value })),
      };
    });
  }, [rows, categories]);

  const selectedRows = useMemo(() => {
    if (!selectedCategory) return [];
    const categoryRows = rows.filter(
      (row) => row.category.toLowerCase() === selectedCategory.toLowerCase()
    );
    const dates = [...new Set(categoryRows.map((r) => r.date).filter(Boolean))];
    const latestDate = dates.length ? dates.sort().at(-1) : "";
    if (!latestDate) return categoryRows;
    return categoryRows.filter((row) => row.date === latestDate);
  }, [rows, selectedCategory]);

  function openCategory(category) {
    const match = categories.find(
      (c) => c.toLowerCase() === category.toLowerCase()
    );
    setSelectedCategory(match || category);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
  }

  function openMetric(row) {
    setSelectedMetric(row);
    setIsMetricModalOpen(true);
  }

  function closeMetricModal() {
    setIsMetricModalOpen(false);
    setSelectedMetric(null);
  }

  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        background: "#071f46",
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

      {/* 3D Cube Layer – pinned to bottom */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: "60%",
          zIndex: 1,
          pointerEvents: "auto",
        }}
      >
        <CubeModel cubeData={cubeData} onFaceClick={(title) => openCategory(title)} />
      </div>

      {/* Left stacked buttons */}
      <div
        style={{
          position: "absolute",
          left: "28px",
          bottom: "28px",
          zIndex: 3,
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          width: "220px",
        }}
      >
        {loading && (
          <div className="statusCard">Loading data...</div>
        )}

        {!loading && excelError && (
          <div className="statusCard errorCard">{excelError}</div>
        )}

        {!loading &&
          !excelError &&
          categories.map((category) => (
            <button
              key={category}
              onClick={() => openCategory(category)}
              className="categoryButton"
            >
              {category}
            </button>
          ))}
      </div>

      {/* Category Modal */}
      {isModalOpen && (
        <div className="modalOverlay" onClick={closeModal}>
          <div className="hudFrame" onClick={(e) => e.stopPropagation()}>
            <div className="hudClipEdge hudClipTL" />
            <div className="hudClipEdge hudClipTR" />
            <div className="hudClipEdge hudClipBL" />
            <div className="hudClipEdge hudClipBR" />
            <div className="hudScanlines" />
            <div className="hudShimmer" />
            <div className="hudBorderTop" />
            <div className="hudBorderBottom" />
            <div className="hudBorderLeft" />
            <div className="hudBorderRight" />
            <div className="hudCorner hudCornerTL" />
            <div className="hudCorner hudCornerTR" />
            <div className="hudCorner hudCornerBL" />
            <div className="hudCorner hudCornerBR" />
            <div className="hudCircuit hudCircuitTR" />
            <div className="hudCircuit hudCircuitBL" />
            <div className="hudPulseBar" />

            <div className="hudContent">
              <div className="hudHeader">
                <div>
                  <h2 className="hudTitle">{selectedCategory}</h2>
                  <p className="hudSubtext">
                    Showing {selectedRows[0]?.date ? `latest data for ${selectedRows[0].date}` : "available data"}
                  </p>
                </div>
                <button className="hudCloseButton" onClick={closeModal}>
                  ×
                </button>
              </div>

              <div className="hudBody">
                {selectedRows.length ? (
                  <div className="metricGrid">
                    {selectedRows.map((row, index) => (
                      <button
                        key={`${row.category}-${row.metric}-${index}`}
                        className="metricButton"
                        onClick={() => openMetric(row)}
                      >
                        <span className="metricButtonIcon">&#x25C8;</span>
                        {row.metric}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="emptyState">
                    No data found for this category.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Metric Detail Modal */}
      {isMetricModalOpen && selectedMetric && (
        <div className="modalOverlay metricOverlay" onClick={closeMetricModal}>
          <div className="hudFrame hudFrameSmall" onClick={(e) => e.stopPropagation()}>
            <div className="hudClipEdge hudClipTL" />
            <div className="hudClipEdge hudClipTR" />
            <div className="hudClipEdge hudClipBL" />
            <div className="hudClipEdge hudClipBR" />
            <div className="hudScanlines" />
            <div className="hudShimmer" />
            <div className="hudBorderTop" />
            <div className="hudBorderBottom" />
            <div className="hudBorderLeft" />
            <div className="hudBorderRight" />
            <div className="hudCorner hudCornerTL" />
            <div className="hudCorner hudCornerTR" />
            <div className="hudCorner hudCornerBL" />
            <div className="hudCorner hudCornerBR" />
            <div className="hudPulseBar" />

            <div className="hudContent">
              <div className="hudHeader">
                <div>
                  <h2 className="hudTitle">{selectedMetric.metric}</h2>
                  <p className="hudSubtext">{selectedMetric.category}</p>
                </div>
                <button className="hudCloseButton" onClick={closeMetricModal}>
                  ×
                </button>
              </div>

              <div className="hudBody">
                <div className="detailRow">
                  <span className="detailLabel">Value</span>
                  <span className="detailValue">{selectedMetric.value || "-"}</span>
                </div>
                <div className="detailRow">
                  <span className="detailLabel">Remarks</span>
                  <span className="detailValue">{selectedMetric.remarks || "-"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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

        .categoryButton,
        .statusCard {
          width: 100%;
          min-height: 48px;
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.22);
          background: rgba(8, 31, 79, 0.5);
          color: #d4d4d4;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.16);
          padding: 12px 16px;
          text-align: left;
          font-size: 15px;
        }

        .categoryButton {
          cursor: pointer;
          transition: transform 0.18s ease, background 0.18s ease, border-color 0.18s ease;
        }

        .categoryButton:hover {
          transform: translateY(-2px);
          background: rgba(18, 72, 160, 0.62);
          border-color: rgba(255, 255, 255, 0.35);
        }

        .errorCard {
          background: rgba(120, 22, 22, 0.55);
        }

        /* ── Overlay ── */
        .modalOverlay {
          position: absolute;
          inset: 0;
          z-index: 10;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }
        .metricOverlay { z-index: 20; }

        /* ── HUD Frame ── */
        .hudFrame {
          position: relative;
          width: min(920px, 100%);
          max-height: min(82vh, 900px);
          background:
            radial-gradient(ellipse at 50% -20%, rgba(0, 120, 255, 0.15) 0%, transparent 60%),
            radial-gradient(ellipse at 50% 120%, rgba(0, 80, 200, 0.08) 0%, transparent 50%),
            linear-gradient(180deg, rgba(2, 10, 35, 0.97) 0%, rgba(4, 18, 55, 0.97) 100%);
          clip-path: polygon(
            0 20px, 20px 0, calc(100% - 20px) 0, 100% 20px,
            100% calc(100% - 20px), calc(100% - 20px) 100%,
            20px 100%, 0 calc(100% - 20px)
          );
          overflow: hidden;
          animation: hudAppear 0.3s ease-out;
        }
        .hudFrameSmall {
          width: min(540px, 100%);
          max-height: min(60vh, 600px);
        }

        @keyframes hudAppear {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        /* ── Scanline overlay ── */
        .hudScanlines {
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0, 180, 255, 0.015) 2px,
            rgba(0, 180, 255, 0.015) 4px
          );
          pointer-events: none;
          z-index: 3;
        }

        /* ── Holographic shimmer sweep ── */
        .hudShimmer {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            105deg,
            transparent 40%,
            rgba(0, 180, 255, 0.06) 45%,
            rgba(0, 220, 255, 0.1) 50%,
            rgba(0, 180, 255, 0.06) 55%,
            transparent 60%
          );
          background-size: 200% 100%;
          animation: shimmerSweep 4s ease-in-out infinite;
          pointer-events: none;
          z-index: 3;
        }
        @keyframes shimmerSweep {
          0%, 100% { background-position: 200% 0; }
          50% { background-position: -200% 0; }
        }

        /* ── Glowing edges ── */
        .hudBorderTop, .hudBorderBottom, .hudBorderLeft, .hudBorderRight {
          position: absolute;
          pointer-events: none;
          z-index: 4;
        }
        .hudBorderTop {
          top: 0; left: 40px; right: 40px; height: 2px;
          background: linear-gradient(90deg, transparent, rgba(0, 180, 255, 0.8) 30%, rgba(0, 220, 255, 1) 50%, rgba(0, 180, 255, 0.8) 70%, transparent);
          box-shadow: 0 0 12px rgba(0, 180, 255, 0.6), 0 0 30px rgba(0, 180, 255, 0.2);
          animation: borderPulse 3s ease-in-out infinite;
        }
        .hudBorderBottom {
          bottom: 0; left: 40px; right: 40px; height: 2px;
          background: linear-gradient(90deg, transparent, rgba(0, 180, 255, 0.5) 30%, rgba(0, 200, 255, 0.7) 50%, rgba(0, 180, 255, 0.5) 70%, transparent);
          box-shadow: 0 0 10px rgba(0, 180, 255, 0.4), 0 0 25px rgba(0, 180, 255, 0.15);
          animation: borderPulse 3s ease-in-out infinite 1.5s;
        }
        .hudBorderLeft {
          top: 40px; bottom: 40px; left: 0; width: 2px;
          background: linear-gradient(180deg, transparent, rgba(0, 180, 255, 0.6) 30%, rgba(0, 200, 255, 0.8) 50%, rgba(0, 180, 255, 0.6) 70%, transparent);
          box-shadow: 0 0 10px rgba(0, 180, 255, 0.4);
          animation: borderPulse 3s ease-in-out infinite 0.75s;
        }
        .hudBorderRight {
          top: 40px; bottom: 40px; right: 0; width: 2px;
          background: linear-gradient(180deg, transparent, rgba(0, 180, 255, 0.6) 30%, rgba(0, 200, 255, 0.8) 50%, rgba(0, 180, 255, 0.6) 70%, transparent);
          box-shadow: 0 0 10px rgba(0, 180, 255, 0.4);
          animation: borderPulse 3s ease-in-out infinite 2.25s;
        }
        @keyframes borderPulse {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }

        /* ── Diagonal clip-edge borders ── */
        .hudClipEdge {
          position: absolute;
          width: 30px;
          height: 2px;
          pointer-events: none;
          z-index: 5;
          background: rgba(0, 220, 255, 0.85);
          box-shadow:
            0 0 6px rgba(0, 200, 255, 0.7),
            0 0 14px rgba(0, 180, 255, 0.4),
            0 0 28px rgba(0, 150, 255, 0.15);
          transform-origin: center;
        }
        .hudClipTL {
          top: 9px; left: -1px;
          transform: rotate(-45deg);
        }
        .hudClipTR {
          top: 9px; right: -1px;
          transform: rotate(45deg);
        }
        .hudClipBL {
          bottom: 9px; left: -1px;
          transform: rotate(45deg);
        }
        .hudClipBR {
          bottom: 9px; right: -1px;
          transform: rotate(-45deg);
        }

        /* ── Corner glows ── */
        .hudCorner {
          position: absolute;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(0, 220, 255, 1);
          pointer-events: none;
          z-index: 5;
          box-shadow:
            0 0 6px 2px rgba(0, 220, 255, 0.9),
            0 0 16px 6px rgba(0, 180, 255, 0.5),
            0 0 36px 12px rgba(0, 150, 255, 0.2);
          animation: cornerGlow 3s ease-in-out infinite;
        }
        .hudCornerTL { top: -4px; left: -4px; }
        .hudCornerTR { top: -4px; right: -4px; animation-delay: 0.75s; }
        .hudCornerBL { bottom: -4px; left: -4px; animation-delay: 1.5s; }
        .hudCornerBR { bottom: -4px; right: -4px; animation-delay: 2.25s; }
        @keyframes cornerGlow {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.4); opacity: 1; }
        }

        /* ── Circuit decorations ── */
        .hudCircuit {
          position: absolute;
          pointer-events: none;
          z-index: 4;
        }
        .hudCircuitTR {
          top: 8px; right: 44px;
          width: 80px; height: 18px;
          display: flex;
          background:
            repeating-linear-gradient(90deg,
              rgba(0, 180, 255, 0.6) 0px, rgba(0, 180, 255, 0.6) 6px,
              transparent 6px, transparent 10px
            );
          box-shadow: 0 0 8px rgba(0, 180, 255, 0.25);
          clip-path: polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%);
          animation: circuitFlicker 5s steps(1) infinite;
        }
        .hudCircuitBL {
          bottom: 8px; left: 44px;
          width: 60px; height: 3px;
          background: linear-gradient(90deg, rgba(0, 180, 255, 0.7), rgba(0, 180, 255, 0.1));
          box-shadow: 0 0 8px rgba(0, 180, 255, 0.3);
          animation: circuitFlicker 5s steps(1) infinite 2s;
        }
        @keyframes circuitFlicker {
          0%, 48%, 52%, 100% { opacity: 1; }
          49%, 51% { opacity: 0.4; }
        }

        /* ── Traveling pulse bar (horizontal light sweep) ── */
        .hudPulseBar {
          position: absolute;
          top: 0; left: 0;
          width: 100%;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(0, 220, 255, 0.5) 50%, transparent);
          box-shadow: 0 0 20px 3px rgba(0, 200, 255, 0.15);
          animation: pulseTravel 6s linear infinite;
          pointer-events: none;
          z-index: 4;
        }
        @keyframes pulseTravel {
          0% { top: 0; opacity: 0; }
          5% { opacity: 1; }
          95% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }

        /* ── Content ── */
        .hudContent {
          position: relative;
          z-index: 6;
          display: flex;
          flex-direction: column;
          height: 100%;
          padding: 6px;
        }

        .hudHeader {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          padding: 22px 26px 16px;
          border-bottom: 1px solid rgba(0, 160, 255, 0.12);
          color: #fff;
        }

        .hudTitle {
          margin: 0;
          font-size: 26px;
          line-height: 1.1;
          font-weight: 700;
          color: #fff;
          text-shadow: 0 0 8px rgba(0, 180, 255, 0.5), 0 0 20px rgba(0, 150, 255, 0.2);
          letter-spacing: 1px;
        }

        .hudSubtext {
          margin: 8px 0 0;
          font-size: 12px;
          color: rgba(0, 200, 255, 0.65);
          letter-spacing: 1.5px;
          text-transform: uppercase;
        }

        .hudCloseButton {
          width: 36px;
          height: 36px;
          border-radius: 2px;
          border: 1px solid rgba(0, 180, 255, 0.4);
          background: rgba(0, 160, 255, 0.06);
          color: rgba(0, 220, 255, 0.9);
          font-size: 24px;
          line-height: 1;
          cursor: pointer;
          transition: all 0.2s;
          text-shadow: 0 0 6px rgba(0, 200, 255, 0.5);
        }
        .hudCloseButton:hover {
          background: rgba(0, 160, 255, 0.2);
          box-shadow: 0 0 16px rgba(0, 180, 255, 0.4), inset 0 0 8px rgba(0, 180, 255, 0.1);
          border-color: rgba(0, 200, 255, 0.7);
        }

        .hudBody {
          padding: 20px 26px 26px;
          max-height: calc(82vh - 110px);
          overflow: auto;
        }

        /* ── Metric Buttons ── */
        .metricGrid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 12px;
        }

        .metricButton {
          position: relative;
          padding: 16px 18px 16px 36px;
          border-radius: 4px;
          border: 1px solid rgba(0, 160, 255, 0.2);
          background: linear-gradient(135deg, rgba(0, 60, 150, 0.12), rgba(0, 40, 100, 0.06));
          color: #fff;
          font-size: 15px;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s;
          overflow: hidden;
        }
        .metricButton::before {
          content: "";
          position: absolute;
          top: 0; left: 0;
          width: 3px; height: 100%;
          background: linear-gradient(180deg, transparent, rgba(0, 200, 255, 0.6), transparent);
          opacity: 0;
          transition: opacity 0.2s;
        }
        .metricButton:hover {
          transform: translateY(-2px);
          background: linear-gradient(135deg, rgba(0, 80, 200, 0.25), rgba(0, 60, 150, 0.12));
          border-color: rgba(0, 200, 255, 0.5);
          box-shadow: 0 0 20px rgba(0, 180, 255, 0.15), 0 4px 16px rgba(0, 0, 0, 0.2), inset 0 0 15px rgba(0, 160, 255, 0.04);
        }
        .metricButton:hover::before { opacity: 1; }

        .metricButtonIcon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(0, 200, 255, 0.5);
          font-size: 12px;
        }

        /* ── Detail rows ── */
        .detailRow {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 18px;
          border-radius: 4px;
          background: linear-gradient(135deg, rgba(0, 60, 150, 0.1), rgba(0, 40, 100, 0.04));
          border: 1px solid rgba(0, 160, 255, 0.15);
          margin-bottom: 12px;
          border-left: 3px solid rgba(0, 200, 255, 0.5);
        }

        .detailLabel {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          color: rgba(0, 200, 255, 0.55);
        }

        .detailValue {
          font-size: 20px;
          color: #fff;
          line-height: 1.4;
          text-shadow: 0 0 6px rgba(0, 180, 255, 0.15);
        }

        .emptyState {
          color: rgba(0, 200, 255, 0.6);
          font-size: 14px;
          letter-spacing: 0.5px;
        }

        @media (max-width: 768px) {
          .curvedBand {
            width: 160%;
            height: 140px;
          }
          .hudTitle { font-size: 20px; }
          .hudFrame { max-height: 86vh; }
          .hudBody { max-height: calc(86vh - 100px); }
          .categoryButton, .statusCard { font-size: 14px; }
          .metricGrid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); }
          .metricButton { padding: 14px 14px 14px 32px; font-size: 14px; }
          .detailValue { font-size: 17px; }
        }
      `}</style>
    </div>
  );
}