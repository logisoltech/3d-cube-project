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

  const latestDate = useMemo(() => {
    const dates = [...new Set(rows.map((row) => row.date).filter(Boolean))];
    if (!dates.length) return "";
    return dates.sort().at(-1) || "";
  }, [rows]);

  const selectedRows = useMemo(() => {
    if (!selectedCategory) return [];
    return rows.filter(
      (row) =>
        row.category.toLowerCase() === selectedCategory.toLowerCase() &&
        (!latestDate || row.date === latestDate)
    );
  }, [rows, selectedCategory, latestDate]);

  function openCategory(category) {
    setSelectedCategory(category);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
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

      {/* Modal */}
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
                  Showing {latestDate ? `latest data for ${latestDate}` : "available data"}
                </p>
              </div>

              <button className="closeButton" onClick={closeModal}>
                ×
              </button>
            </div>

            <div className="modalBody">
              {selectedRows.length ? (
                <div className="tableWrap">
                  <table className="dataTable">
                    <thead>
                      <tr>
                        <th>Metric</th>
                        <th>Value</th>
                        <th>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRows.map((row, index) => (
                        <tr key={`${row.category}-${row.metric}-${index}`}>
                          <td>{row.metric}</td>
                          <td>{row.value}</td>
                          <td>{row.remarks || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
          color: #ffffff;
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
          background: rgba(0, 0, 0, 0.45);
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
          background: rgba(255, 255, 255, 0.18);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
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

        .tableWrap {
          overflow: auto;
          border-radius: 16px;
        }

        .dataTable {
          width: 100%;
          border-collapse: collapse;
          background: rgba(255, 255, 255, 0.92);
          color: #10213f;
          border-radius: 16px;
          overflow: hidden;
        }

        .dataTable th,
        .dataTable td {
          padding: 14px 16px;
          text-align: left;
          border-bottom: 1px solid rgba(16, 33, 63, 0.08);
          font-size: 14px;
          vertical-align: top;
        }

        .dataTable th {
          background: #eaf1ff;
          font-weight: 700;
        }

        .dataTable tr:last-child td {
          border-bottom: none;
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

          .dataTable th,
          .dataTable td {
            padding: 12px;
            font-size: 13px;
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
        }
      `}</style>
    </div>
  );
}