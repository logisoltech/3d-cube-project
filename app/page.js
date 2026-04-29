"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import * as XLSX from "xlsx";
import dynamic from "next/dynamic";

const EXCEL_PATH = "/3d-cube.xlsx";

const NAV_ITEMS = [
  { label: "Safety", face: "SAFETY" },
  { label: "Quality", face: "QUALITY" },
  { label: "Delivery", face: "DELIVERY" },
  { label: "Cost", face: "COST" },
  { label: "Inventory", face: "INVENTORY" },
];

function inventoryCategoryKey(categories) {
  return categories.find((c) => c.toLowerCase() === "inventory") || "";
}

function faceTitleToStoredCategory(faceTitle, categories) {
  const t = String(faceTitle).toUpperCase();
  if (t === "INVENTORY") {
    return inventoryCategoryKey(categories) || "";
  }
  const match = categories.find((c) => c.toUpperCase() === t);
  return match || faceTitle;
}

const CubeModel = dynamic(() => import("./components/CubeModel"), { ssr: false });

export default function Home() {
  const [rows, setRows] = useState([]);
  const [activeCategory, setActiveCategory] = useState("");
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [loading, setLoading] = useState(true);
  const [excelError, setExcelError] = useState("");
  const [targetFace, setTargetFace] = useState(null);

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

    const inventoryRowsForFace = () => {
      const key = inventoryCategoryKey(categories);
      if (!key) return [];
      return latestPerCategory[key.toLowerCase()] || [];
    };

    return catOrder.map((cat) => {
      if (cat === "1QDCI") return { title: "1QDCI", diagonal: true, items: [] };

      let catRows = [];
      if (cat === "Inventory") {
        catRows = inventoryRowsForFace();
      } else {
        const matched = Object.keys(latestPerCategory).find(
          (k) => k === cat.toLowerCase()
        );
        catRows = matched ? latestPerCategory[matched] : [];
      }

      return {
        title: cat.toUpperCase(),
        items: catRows.map((r) => ({ label: r.metric, value: r.value })),
      };
    });
  }, [rows, categories]);

  const selectedRows = useMemo(() => {
    if (!activeCategory) return [];
    const categoryRows = rows.filter(
      (row) => row.category.toLowerCase() === activeCategory.toLowerCase()
    );
    const dates = [...new Set(categoryRows.map((r) => r.date).filter(Boolean))];
    const latestDate = dates.length ? dates.sort().at(-1) : "";
    if (!latestDate) return categoryRows;
    return categoryRows.filter((row) => row.date === latestDate);
  }, [rows, activeCategory]);

  function selectCategoryFromNav(face, pillarLabel) {
    setTargetFace(face);
    setSelectedMetric(null);
    if (face === "INVENTORY") {
      const cat = pillarLabel || inventoryCategoryKey(categories);
      setActiveCategory(cat || "");
      return;
    }
    if (pillarLabel) {
      const resolved =
        categories.find(
          (c) => c.toLowerCase() === pillarLabel.toLowerCase()
        ) || pillarLabel;
      setActiveCategory(resolved);
    } else {
      setActiveCategory("");
    }
  }

  function openFaceCategory(faceTitle) {
    const resolved = faceTitleToStoredCategory(faceTitle, categories);
    if (resolved) setActiveCategory(resolved);
    setSelectedMetric(null);
  }

  return (
    <div className="appRoot">
      <div className="bgVideoWrap" aria-hidden>
        <video
          autoPlay
          loop
          muted
          playsInline
          className="bgVideo"
        >
          <source src="/Empty.mp4" type="video/mp4" />
        </video>
      </div>

      <header className="topBar">
        <div className="topBarLogo">
          <Image
            src="/new-logo.png"
            alt="Hoechst Pakistan"
            width={280}
            height={99}
            className="topBarLogoImg"
            priority
            sizes="(max-width: 768px) 40vw, 200px"
          />
        </div>
        <div className="topBarMeeting">WCM + QDCI L3 Meeting</div>
      </header>

      <div className="mainStage">
        <div className="cubeColumn">
          <div className="cubeWrap">
            <CubeModel
              cubeData={cubeData}
              onFaceClick={(title) => {
                openFaceCategory(title);
                setTargetFace(String(title).toUpperCase());
              }}
              targetFace={targetFace}
            />
          </div>
        </div>

        <aside className="sidePanelOuter">
          <div className="sidePanelHud hudFrame">
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
              {loading && (
                <div className="hudBody">
                  <div className="panelMuted">Loading data…</div>
                </div>
              )}

              {!loading && excelError && (
                <div className="hudBody">
                  <div className="panelError">{excelError}</div>
                </div>
              )}

              {!loading && !excelError && !activeCategory && (
                <div className="hudBody hudBodyEmpty">
                  <div className="panelEmpty">
                    <p className="panelEmptyLead">Overview</p>
                    <p className="panelEmptyText">
                      Choose a pillar below or tap a cube face to see metrics.
                    </p>
                  </div>
                </div>
              )}

              {!loading && !excelError && activeCategory && !selectedMetric && (
                <>
                  <div className="hudHeader">
                    <div>
                      <h2 className="hudTitle">{activeCategory}</h2>
                      <p className="hudSubtext">
                        {selectedRows[0]?.date
                          ? `Latest data for ${selectedRows[0].date}`
                          : "Available data"}
                      </p>
                    </div>
                  </div>
                  <div className="hudBody">
                    {selectedRows.length ? (
                      <div className="metricGrid">
                        {selectedRows.map((row, index) => (
                          <button
                            key={`${row.category}-${row.metric}-${index}`}
                            type="button"
                            className="metricButton"
                            onClick={() => setSelectedMetric(row)}
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
                </>
              )}

              {!loading && !excelError && selectedMetric && (
                <>
                  <div className="hudHeader">
                    <div>
                      <h2 className="hudTitle">{selectedMetric.metric}</h2>
                      <p className="hudSubtext">{selectedMetric.category}</p>
                    </div>
                    <button
                      type="button"
                      className="hudCloseButton"
                      onClick={() => setSelectedMetric(null)}
                      aria-label="Close detail"
                    >
                      ×
                    </button>
                  </div>
                  <div className="hudBody hudBodyDetail">
                    <div className="detailRow">
                      <span className="detailLabel">Value</span>
                      <span className="detailValue">{selectedMetric.value || "—"}</span>
                    </div>
                    <div className="detailRow">
                      <span className="detailLabel">Remarks</span>
                      <span className="detailValue">{selectedMetric.remarks || "—"}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </aside>
      </div>

      <nav className="bottomNav" aria-label="WCM pillars">
        {loading && (
          <div className="navStatusWrap">
            <div className="navStatus">Loading…</div>
          </div>
        )}
        {!loading && !excelError && (
          <div className="bottomNavDock">
            {NAV_ITEMS.map((item) => {
            const invKey = inventoryCategoryKey(categories);
            const canPickInventory =
              item.face !== "INVENTORY" || Boolean(invKey);
            const isActive =
              item.face === "INVENTORY"
                ? invKey &&
                  activeCategory &&
                  activeCategory.toLowerCase() === invKey.toLowerCase()
                : activeCategory &&
                  activeCategory.toLowerCase() === item.label.toLowerCase();

            return (
              <button
                key={item.face}
                type="button"
                className={`bottomNavBtn${isActive ? " bottomNavBtnActive" : ""}`}
                disabled={item.face === "INVENTORY" && !canPickInventory}
                onClick={() => {
                  if (item.face === "INVENTORY") {
                    if (!invKey) return;
                    selectCategoryFromNav("INVENTORY", invKey);
                  } else {
                    selectCategoryFromNav(item.face, item.label);
                  }
                }}
              >
                {item.label}
              </button>
            );
          })}
          </div>
        )}
      </nav>

      <style jsx>{`
        .appRoot {
          position: relative;
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          background: transparent;
          display: flex;
          flex-direction: column;
          z-index: 0;
          color: #f0f0f0;
        }

        .bgVideoWrap {
          position: absolute;
          inset: 0;
          z-index: 0;
          overflow: hidden;
          pointer-events: none;
        }

        .bgVideo {
          position: absolute;
          right: 0;
          bottom: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: 100% 100%;
          transform: scale(1.18) translateX(calc(-1 * min(18vw, 250px)));
          transform-origin: bottom right;
          will-change: transform;
        }

        .topBar {
          position: relative;
          z-index: 3;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px clamp(16px, 4vw, 48px);
          padding: clamp(20px, 4vh, 48px)
            clamp(16px, 4vw, 44px)
            clamp(14px, 2.5vh, 22px)
            clamp(14px, 3vw, 40px);
          flex-shrink: 0;
          background: transparent;
        }

        .topBarLogo {
          flex: 0 0 auto;
          display: flex;
          align-items: flex-start;
          justify-content: flex-start;
          line-height: 0;
          margin: clamp(16px, 3vh, 36px) 0 0;
          padding: 0;
          width: min(168px, 36vw);
          max-height: 40px;
        }

        .topBarLogoImg {
          display: block;
          width: 100%;
          height: auto;
          max-height: 38px;
          object-fit: contain;
          object-position: left top;
          clip-path: inset(10% 4% 8% 2%);
          -webkit-clip-path: inset(10% 4% 8% 2%);
          transform-origin: left top;
        }

        .topBarMeeting {
          align-self: flex-start;
          margin-top: clamp(14px, 2.5vh, 32px);
          font-size: clamp(15px, 1.55vw, 20px);
          font-weight: 600;
          letter-spacing: 0.08em;
          color: rgba(255, 255, 255, 0.95);
        }

        .mainStage {
          position: relative;
          z-index: 3;
          flex: 1;
          min-height: 0;
          display: grid;
          grid-template-columns: minmax(0, 1.15fr) minmax(280px, 0.92fr);
          gap: clamp(16px, 3vw, 36px);
          padding:
            clamp(52px, 10vh, 120px) clamp(20px, 4vw, 56px)
            clamp(8px, 1.5vw, 20px);
          align-items: stretch;
          pointer-events: none;
          background: transparent;
        }

        .cubeColumn {
          pointer-events: auto;
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: stretch;
          justify-content: flex-end;
          min-height: 240px;
        }

        .cubeWrap {
          position: relative;
          z-index: 1;
          flex: 1;
          min-height: 320px;
          /* Shift in 2D so the cube doesn’t move sideways in perspective (which looked “smaller”) */
          transform: translateX(-16%);
        }

        .sidePanelOuter {
          pointer-events: auto;
          position: relative;
          min-height: 0;
        }

        /* Docked panel uses same HUD styling as the original modals */
        .sidePanelHud.hudFrame {
          height: 100%;
          min-height: 280px;
          max-height: 100%;
        }

        .hudFrame {
          position: relative;
          width: 100%;
          background:
            radial-gradient(ellipse at 50% -20%, rgba(0, 120, 255, 0.15) 0%, transparent 60%),
            radial-gradient(ellipse at 50% 120%, rgba(0, 80, 200, 0.08) 0%, transparent 50%),
            linear-gradient(180deg, rgba(2, 10, 35, 0.97) 0%, rgba(4, 18, 55, 0.97) 100%);
          clip-path: polygon(
            0 20px,
            20px 0,
            calc(100% - 20px) 0,
            100% 20px,
            100% calc(100% - 20px),
            calc(100% - 20px) 100%,
            20px 100%,
            0 calc(100% - 20px)
          );
          overflow: hidden;
        }

        .hudContent {
          position: relative;
          z-index: 6;
          display: flex;
          flex-direction: column;
          height: 100%;
          padding: 6px;
          min-height: 0;
        }

        /* ── Scanlines & shimmer ── */
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
          animation: hudShimmerSweep 4s ease-in-out infinite;
          pointer-events: none;
          z-index: 3;
        }
        @keyframes hudShimmerSweep {
          0%,
          100% {
            background-position: 200% 0;
          }
          50% {
            background-position: -200% 0;
          }
        }

        /* ── Border glows ── */
        .hudBorderTop,
        .hudBorderBottom,
        .hudBorderLeft,
        .hudBorderRight {
          position: absolute;
          pointer-events: none;
          z-index: 4;
        }
        .hudBorderTop {
          top: 0;
          left: 40px;
          right: 40px;
          height: 2px;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(0, 180, 255, 0.8) 30%,
            rgba(0, 220, 255, 1) 50%,
            rgba(0, 180, 255, 0.8) 70%,
            transparent
          );
          box-shadow: 0 0 12px rgba(0, 180, 255, 0.6),
            0 0 30px rgba(0, 180, 255, 0.2);
          animation: hudBorderPulse 3s ease-in-out infinite;
        }
        .hudBorderBottom {
          bottom: 0;
          left: 40px;
          right: 40px;
          height: 2px;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(0, 180, 255, 0.5) 30%,
            rgba(0, 200, 255, 0.7) 50%,
            rgba(0, 180, 255, 0.5) 70%,
            transparent
          );
          box-shadow: 0 0 10px rgba(0, 180, 255, 0.4),
            0 0 25px rgba(0, 180, 255, 0.15);
          animation: hudBorderPulse 3s ease-in-out infinite 1.5s;
        }
        .hudBorderLeft {
          top: 40px;
          bottom: 40px;
          left: 0;
          width: 2px;
          background: linear-gradient(
            180deg,
            transparent,
            rgba(0, 180, 255, 0.6) 30%,
            rgba(0, 200, 255, 0.8) 50%,
            rgba(0, 180, 255, 0.6) 70%,
            transparent
          );
          box-shadow: 0 0 10px rgba(0, 180, 255, 0.4);
          animation: hudBorderPulse 3s ease-in-out infinite 0.75s;
        }
        .hudBorderRight {
          top: 40px;
          bottom: 40px;
          right: 0;
          width: 2px;
          background: linear-gradient(
            180deg,
            transparent,
            rgba(0, 180, 255, 0.6) 30%,
            rgba(0, 200, 255, 0.8) 50%,
            rgba(0, 180, 255, 0.6) 70%,
            transparent
          );
          box-shadow: 0 0 10px rgba(0, 180, 255, 0.4);
          animation: hudBorderPulse 3s ease-in-out infinite 2.25s;
        }
        @keyframes hudBorderPulse {
          0%,
          100% {
            opacity: 0.7;
          }
          50% {
            opacity: 1;
          }
        }

        /* ── Clip-edge borders ── */
        .hudClipEdge {
          position: absolute;
          width: 30px;
          height: 2px;
          pointer-events: none;
          z-index: 5;
          background: rgba(0, 220, 255, 0.85);
          box-shadow: 0 0 6px rgba(0, 200, 255, 0.7),
            0 0 14px rgba(0, 180, 255, 0.4),
            0 0 28px rgba(0, 150, 255, 0.15);
          transform-origin: center;
        }
        .hudClipTL {
          top: 9px;
          left: -1px;
          transform: rotate(-45deg);
        }
        .hudClipTR {
          top: 9px;
          right: -1px;
          transform: rotate(45deg);
        }
        .hudClipBL {
          bottom: 9px;
          left: -1px;
          transform: rotate(45deg);
        }
        .hudClipBR {
          bottom: 9px;
          right: -1px;
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
          box-shadow: 0 0 6px 2px rgba(0, 220, 255, 0.9),
            0 0 16px 6px rgba(0, 180, 255, 0.5),
            0 0 36px 12px rgba(0, 150, 255, 0.2);
          animation: hudCornerGlow 3s ease-in-out infinite;
        }
        .hudCornerTL {
          top: -4px;
          left: -4px;
        }
        .hudCornerTR {
          top: -4px;
          right: -4px;
          animation-delay: 0.75s;
        }
        .hudCornerBL {
          bottom: -4px;
          left: -4px;
          animation-delay: 1.5s;
        }
        .hudCornerBR {
          bottom: -4px;
          right: -4px;
          animation-delay: 2.25s;
        }
        @keyframes hudCornerGlow {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.8;
          }
          50% {
            transform: scale(1.4);
            opacity: 1;
          }
        }

        /* ── Circuit decorations ── */
        .hudCircuit {
          position: absolute;
          pointer-events: none;
          z-index: 4;
        }
        .hudCircuitTR {
          top: 8px;
          right: 44px;
          width: 80px;
          height: 18px;
          display: flex;
          background: repeating-linear-gradient(
            90deg,
            rgba(0, 180, 255, 0.6) 0px,
            rgba(0, 180, 255, 0.6) 6px,
            transparent 6px,
            transparent 10px
          );
          box-shadow: 0 0 8px rgba(0, 180, 255, 0.25);
          clip-path: polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%);
          animation: hudCircuitFlicker 5s steps(1) infinite;
        }
        .hudCircuitBL {
          bottom: 8px;
          left: 44px;
          width: 60px;
          height: 3px;
          background: linear-gradient(
            90deg,
            rgba(0, 180, 255, 0.7),
            rgba(0, 180, 255, 0.1)
          );
          box-shadow: 0 0 8px rgba(0, 180, 255, 0.3);
          animation: hudCircuitFlicker 5s steps(1) infinite 2s;
        }
        @keyframes hudCircuitFlicker {
          0%,
          48%,
          52%,
          100% {
            opacity: 1;
          }
          49%,
          51% {
            opacity: 0.4;
          }
        }

        /* ── Pulse bar ── */
        .hudPulseBar {
          position: absolute;
          left: 0;
          width: 100%;
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(0, 220, 255, 0.5) 50%,
            transparent
          );
          box-shadow: 0 0 20px 3px rgba(0, 200, 255, 0.15);
          animation: hudPulseTravel 6s linear infinite;
          pointer-events: none;
          z-index: 4;
        }
        @keyframes hudPulseTravel {
          0% {
            top: 0;
            opacity: 0;
          }
          5% {
            opacity: 1;
          }
          95% {
            opacity: 1;
          }
          100% {
            top: 100%;
            opacity: 0;
          }
        }

        .hudHeader {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          padding: 22px 26px 16px;
          border-bottom: 1px solid rgba(0, 160, 255, 0.12);
          color: #fff;
          flex-shrink: 0;
        }

        .hudTitle {
          margin: 0;
          font-size: clamp(20px, 2vw, 26px);
          line-height: 1.1;
          font-weight: 700;
          color: #fff;
          text-shadow: 0 0 8px rgba(0, 180, 255, 0.5),
            0 0 20px rgba(0, 150, 255, 0.2);
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
          flex-shrink: 0;
        }
        .hudCloseButton:hover {
          background: rgba(0, 160, 255, 0.2);
          box-shadow: 0 0 16px rgba(0, 180, 255, 0.4),
            inset 0 0 8px rgba(0, 180, 255, 0.1);
          border-color: rgba(0, 200, 255, 0.7);
        }

        .hudBody {
          padding: 20px 26px 26px;
          flex: 1;
          min-height: 0;
          overflow: auto;
        }

        .hudBodyDetail {
          max-height: none;
        }

        .hudBodyEmpty {
          display: flex;
          align-items: center;
          flex: 1;
        }

        .panelMuted {
          color: rgba(0, 200, 255, 0.65);
          font-size: 14px;
          letter-spacing: 0.5px;
        }

        .panelError {
          color: #ff8a80;
          font-size: 14px;
        }

        .panelEmpty {
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 10px;
          width: 100%;
          padding-bottom: 8px;
        }

        .panelEmptyLead {
          margin: 0;
          font-size: 22px;
          font-weight: 700;
          color: #fff;
          letter-spacing: 0.04em;
        }

        .panelEmptyText {
          margin: 0;
          font-size: 14px;
          line-height: 1.5;
          color: rgba(0, 200, 255, 0.6);
          max-width: 32ch;
        }

        .metricGrid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }

        @media (min-width: 480px) {
          .metricGrid {
            grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          }
        }

        .metricButton {
          position: relative;
          padding: 16px 18px 16px 36px;
          border-radius: 4px;
          border: 1px solid rgba(0, 160, 255, 0.2);
          background: linear-gradient(
            135deg,
            rgba(0, 60, 150, 0.12),
            rgba(0, 40, 100, 0.06)
          );
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
          top: 0;
          left: 0;
          width: 3px;
          height: 100%;
          background: linear-gradient(
            180deg,
            transparent,
            rgba(0, 200, 255, 0.6),
            transparent
          );
          opacity: 0;
          transition: opacity 0.2s;
        }

        .metricButton:hover {
          transform: translateY(-2px);
          background: linear-gradient(
            135deg,
            rgba(0, 80, 200, 0.25),
            rgba(0, 60, 150, 0.12)
          );
          border-color: rgba(0, 200, 255, 0.5);
          box-shadow: 0 0 20px rgba(0, 180, 255, 0.15),
            0 4px 16px rgba(0, 0, 0, 0.2), inset 0 0 15px rgba(0, 160, 255, 0.04);
        }
        .metricButton:hover::before {
          opacity: 1;
        }

        .metricButtonIcon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(0, 200, 255, 0.5);
          font-size: 12px;
        }

        .detailRow {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 18px;
          border-radius: 4px;
          margin-bottom: 12px;
          background: linear-gradient(
            135deg,
            rgba(0, 60, 150, 0.1),
            rgba(0, 40, 100, 0.04)
          );
          border: 1px solid rgba(0, 160, 255, 0.15);
          border-left: 3px solid rgba(0, 200, 255, 0.5);
        }

        .detailRow:last-child {
          margin-bottom: 0;
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
          font-weight: 600;
          color: #fff;
          line-height: 1.4;
          text-shadow: 0 0 6px rgba(0, 180, 255, 0.15);
        }

        .emptyState {
          color: rgba(0, 200, 255, 0.6);
          font-size: 14px;
          letter-spacing: 0.5px;
        }

        .bottomNav {
          position: relative;
          z-index: 3;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: flex-start;
          flex-wrap: wrap;
          gap: 12px;
          padding: 14px clamp(20px, 5vw, 56px)
            max(18px, env(safe-area-inset-bottom, 18px))
            clamp(20px, 5vw, 56px);
          pointer-events: auto;
          background: transparent;
        }

        .navStatusWrap {
          display: flex;
          justify-content: flex-start;
          width: 100%;
        }

        .navStatus {
          color: rgba(240, 240, 240, 0.72);
          font-size: 14px;
          padding: 12px 20px;
          border-radius: 14px;
          background: rgba(12, 24, 48, 0.35);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border: 1px solid rgba(255, 255, 255, 0.12);
        }

        .bottomNavDock {
          display: inline-flex;
          align-items: center;
          justify-content: flex-start;
          flex-wrap: wrap;
          gap: 6px clamp(14px, 3vw, 28px);
          padding: 10px 18px;
          border-radius: 999px;
          background:
            linear-gradient(
              165deg,
              rgba(255, 255, 255, 0.14),
              rgba(255, 255, 255, 0.04)
            ),
            rgba(8, 20, 45, 0.42);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          border: 1px solid rgba(255, 255, 255, 0.22);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.18),
            0 -2px 24px rgba(0, 120, 200, 0.08),
            0 12px 40px rgba(0, 8, 24, 0.45);
        }

        .bottomNavBtn {
          position: relative;
          padding: 8px 4px;
          margin: 0;
          min-height: auto;
          border: none;
          border-radius: 0;
          background: transparent;
          color: rgba(255, 255, 255, 0.88);
          font-size: 15px;
          font-weight: 400;
          letter-spacing: 0.02em;
          cursor: pointer;
          box-shadow: none;
          backdrop-filter: none;
          font-family: inherit;
        }

        .bottomNavBtn:hover:not(:disabled) {
          color: #fff;
          text-shadow: 0 0 12px rgba(0, 200, 255, 0.35);
        }

        .bottomNavBtn:disabled {
          opacity: 0.38;
          cursor: not-allowed;
        }

        .bottomNavBtnActive {
          font-weight: 600;
          color: #fff;
          text-decoration: none;
          padding: 8px 12px;
          margin: -2px -4px -2px -4px;
          border-radius: 999px;
          background: rgba(0, 140, 220, 0.22);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.2),
            0 0 20px rgba(0, 180, 255, 0.15);
          border: 1px solid rgba(0, 200, 255, 0.35);
          text-underline-offset: unset;
          text-decoration: none;
        }

        @media (max-width: 960px) {
          .mainStage {
            grid-template-columns: 1fr;
            grid-template-rows: minmax(220px, 48vh) minmax(200px, 1fr);
            padding-inline: clamp(14px, 4vw, 24px);
          }

          .hudTitle {
            font-size: 20px;
          }

          .bottomNav {
            gap: 10px;
            padding-bottom: max(14px, env(safe-area-inset-bottom, 14px));
          }

          .bottomNavDock {
            padding: 10px 14px;
            gap: 6px 12px;
            max-width: 100%;
          }

          .bottomNavBtn {
            padding: 7px 2px;
            font-size: 14px;
          }

          .bottomNavBtnActive {
            padding: 7px 10px;
            margin: -2px -2px;
          }
        }
      `}</style>
    </div>
  );
}
