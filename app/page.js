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
    setSelectedCategory(category);
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
        <CubeModel />
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
          <div
            className="modalCard"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modalHeader">
              <div>
                <h2 className="modalTitle">{selectedCategory}</h2>
                <p className="modalSubtext">
                  Showing {selectedRows[0]?.date ? `latest data for ${selectedRows[0].date}` : "available data"}
                </p>
              </div>

              <button className="closeButton" onClick={closeModal}>
                ×
              </button>
            </div>

            <div className="modalBody">
              {selectedRows.length ? (
                <div className="metricGrid">
                  {selectedRows.map((row, index) => (
                    <button
                      key={`${row.category}-${row.metric}-${index}`}
                      className="metricButton"
                      onClick={() => openMetric(row)}
                    >
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
      )}

      {/* Metric Detail Modal */}
      {isMetricModalOpen && selectedMetric && (
        <div className="modalOverlay metricOverlay" onClick={closeMetricModal}>
          <div
            className="metricDetailCard"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modalHeader">
              <div>
                <h2 className="modalTitle">{selectedMetric.metric}</h2>
                <p className="modalSubtext">{selectedMetric.category}</p>
              </div>
              <button className="closeButton" onClick={closeMetricModal}>
                ×
              </button>
            </div>

            <div className="metricDetailBody">
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

        .modalOverlay {
          position: absolute;
          inset: 0;
          z-index: 10;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }

        .modalCard {
          width: min(920px, 100%);
          max-height: min(82vh, 900px);
          overflow: hidden;
          border-radius: 22px;
          border: 1px solid rgba(255, 255, 255, 0.24);
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(200px);
          -webkit-backdrop-filter: blur(200px);
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.28);
        }

        .modalHeader {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          padding: 22px 22px 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.16);
          color: #fff;
        }

        .modalTitle {
          margin: 0;
          font-size: 28px;
          line-height: 1.1;
        }

        .modalSubtext {
          margin: 8px 0 0;
          font-size: 14px;
          opacity: 0.86;
        }

        .closeButton {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.22);
          background: rgba(255, 255, 255, 0.12);
          color: #fff;
          font-size: 28px;
          line-height: 1;
          cursor: pointer;
        }

        .modalBody {
          padding: 20px 22px 22px;
          max-height: calc(82vh - 90px);
          overflow: auto;
        }

        .metricGrid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 12px;
        }

        .metricButton {
          padding: 16px 18px;
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.18);
          background: rgba(255, 255, 255, 0.08);
          color: #fff;
          font-size: 15px;
          text-align: left;
          cursor: pointer;
          transition: transform 0.18s ease, background 0.18s ease, border-color 0.18s ease;
        }

        .metricButton:hover {
          transform: translateY(-2px);
          background: rgba(18, 72, 160, 0.5);
          border-color: rgba(255, 255, 255, 0.35);
        }

        .metricOverlay {
          z-index: 20;
        }

        .metricDetailCard {
          width: min(520px, 100%);
          border-radius: 22px;
          border: 1px solid rgba(255, 255, 255, 0.24);
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(200px);
          -webkit-backdrop-filter: blur(200px);
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35);
          overflow: hidden;
        }

        .metricDetailBody {
          padding: 22px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .detailRow {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding: 16px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .detailLabel {
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: rgba(255, 255, 255, 0.5);
        }

        .detailValue {
          font-size: 18px;
          color: #fff;
          line-height: 1.4;
        }

        .emptyState {
          color: white;
          font-size: 15px;
          opacity: 0.92;
        }

        @media (max-width: 768px) {
          .curvedBand {
            width: 160%;
            height: 140px;
          }

          .modalTitle {
            font-size: 22px;
          }

          .modalCard {
            max-height: 86vh;
          }

          .modalBody {
            max-height: calc(86vh - 90px);
          }

          .categoryButton,
          .statusCard {
            font-size: 14px;
          }

          .metricGrid {
            grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          }

          .metricButton {
            padding: 14px;
            font-size: 14px;
          }

          .detailValue {
            font-size: 16px;
          }
        }
      `}</style>
    </div>
  );
}