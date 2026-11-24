import React, { useState } from "react";
import {
  FileText, Eye, Shield, CheckCircle2, Clock, XCircle,
  AlertTriangle, ZoomIn, X, Download, Lock
} from "lucide-react";

export default function KYCDocumentPreview({ documents = [] }) {
  const [selectedDoc, setSelectedDoc] = useState(null);

  // Fallback image generator / placeholder based on document type
  const getDocVisual = (doc) => {
    if (doc.preview_url && doc.preview_url.startsWith("http")) {
      return (
        <img
          src={doc.preview_url}
          alt={doc.label}
          style={{ width: "100%", height: "160px", objectFit: "cover", borderRadius: "6px" }}
          onError={(e) => {
            e.target.style.display = "none";
            e.target.nextSibling.style.display = "flex";
          }}
        />
      );
    }

    return null;
  };

  return (
    <div style={{ marginTop: "12px" }}>
      {documents.length === 0 ? (
        <div style={{
          padding: "30px",
          textAlign: "center",
          background: "#061224",
          border: "1px dashed #1b3557",
          borderRadius: "8px",
          color: "#94a3b8"
        }}>
          <FileText size={32} color="#64748b" style={{ margin: "0 auto 8px" }} />
          <p>No documents uploaded for this application yet.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
          {documents.map((doc) => {
            const status = (doc.document_status || "pending").toLowerCase();
            const isVerified = status === "verified" || status === "approved";
            const isRejected = status === "rejected";

            return (
              <div
                key={doc.id}
                style={{
                  background: "#08152b",
                  border: "1px solid #1a3254",
                  borderRadius: "8px",
                  padding: "14px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between"
                }}
              >
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <span style={{ fontSize: "13px", fontWeight: "700", color: "#e2ecff" }}>
                    {doc.label}
                  </span>
                  <span className={`badge-pill ${isVerified ? "verified" : isRejected ? "rejected" : "pending"}`} style={{ fontSize: "10px", padding: "2px 8px" }}>
                    {status.toUpperCase()}
                  </span>
                </div>

                {/* Preview Thumbnail Container */}
                <div
                  style={{
                    position: "relative",
                    background: "#040b17",
                    border: "1px solid #122542",
                    borderRadius: "6px",
                    overflow: "hidden",
                    height: "150px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer"
                  }}
                  onClick={() => setSelectedDoc(doc)}
                >
                  {getDocVisual(doc)}

                  {/* Fallback stylized official card graphic */}
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      display: doc.preview_url ? "none" : "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "linear-gradient(135deg, #0b1a33 0%, #061124 100%)",
                      padding: "12px",
                      textAlign: "center"
                    }}
                  >
                    <FileText size={36} color="#38bdf8" style={{ marginBottom: "6px" }} />
                    <span style={{ fontSize: "12px", fontWeight: "600", color: "#e2ecff" }}>
                      {doc.label}
                    </span>
                    <span style={{ fontSize: "10px", color: "#7a90b3", marginTop: "4px" }}>
                      Encrypted Gov ID Archive
                    </span>
                  </div>

                  {/* Hover Overlay Button */}
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "rgba(5, 11, 24, 0.6)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      color: "#fff",
                      fontSize: "12px",
                      fontWeight: "600",
                      opacity: 0,
                      transition: "opacity 0.2s"
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = 1)}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = 0)}
                  >
                    <ZoomIn size={16} /> Click to Inspect
                  </div>
                </div>

                {/* Footer details */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px", fontSize: "11px", color: "#64748b" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <Lock size={11} color="#38bdf8" /> 256-Bit Encrypted
                  </span>
                  <button
                    onClick={() => setSelectedDoc(doc)}
                    style={{
                      background: "#0f2747",
                      border: "1px solid #1e4577",
                      color: "#60a5fa",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "11px",
                      fontWeight: "600",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px"
                    }}
                  >
                    <Eye size={12} /> Inspect
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Fullscreen / High-Res Zoom Modal */}
      {selectedDoc && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.85)",
          display: "grid",
          placeItems: "center",
          zIndex: 10000,
          padding: "20px"
        }}>
          <div style={{
            background: "#08152b",
            border: "1px solid #1c3d69",
            borderRadius: "10px",
            width: "100%",
            maxWidth: "680px",
            maxHeight: "90vh",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            boxShadow: "0 20px 40px rgba(0,0,0,0.6)"
          }}>
            {/* Modal Header */}
            <div style={{
              padding: "16px 20px",
              background: "#050e1c",
              borderBottom: "1px solid #162c4a",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#e2ecff" }}>
                  {selectedDoc.label} - Secure Inspection
                </h3>
                <span style={{ fontSize: "11px", color: "#7a90b3" }}>
                  Document ID: #{selectedDoc.id} · Status: {selectedDoc.document_status?.toUpperCase()}
                </span>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#94a3b8",
                  cursor: "pointer",
                  padding: "4px",
                  display: "grid",
                  placeItems: "center"
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Image Body */}
            <div style={{
              padding: "20px",
              overflowY: "auto",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              background: "#030812"
            }}>
              {selectedDoc.preview_url && selectedDoc.preview_url.startsWith("http") ? (
                <img
                  src={selectedDoc.preview_url}
                  alt={selectedDoc.label}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "420px",
                    borderRadius: "8px",
                    objectFit: "contain",
                    border: "1px solid #162c4a"
                  }}
                />
              ) : (
                <div style={{
                  padding: "40px 20px",
                  textAlign: "center",
                  background: "#071426",
                  border: "1px solid #172f52",
                  borderRadius: "8px",
                  width: "100%"
                }}>
                  <FileText size={64} color="#38bdf8" style={{ margin: "0 auto 12px" }} />
                  <h4 style={{ color: "#e2ecff", marginBottom: "6px" }}>{selectedDoc.label}</h4>
                  <p style={{ color: "#94a3b8", fontSize: "13px" }}>
                    Verified Document Archive stored on Secure Cloud Storage.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: "14px 20px",
              background: "#050e1c",
              borderTop: "1px solid #162c4a",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <span style={{ fontSize: "12px", color: "#38bdf8", display: "flex", alignItems: "center", gap: "6px" }}>
                <Shield size={14} /> Aadhaar & PAN Privacy Masking Active
              </span>
              <button
                className="btn-cancel"
                onClick={() => setSelectedDoc(null)}
                style={{ padding: "8px 16px" }}
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
