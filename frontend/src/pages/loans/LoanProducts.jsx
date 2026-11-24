import React, { useState, useEffect } from "react";
import {
  Layers,
  Search,
  Filter,
  RefreshCw,
  Building2,
  DollarSign,
  Calendar,
  CheckCircle,
  Eye,
  Percent,
  X
} from "lucide-react";
import wealthService from "../../services/wealthService";

export default function LoanProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await wealthService.getLoanProducts();
      if (res?.success) {
        setProducts(res.products || []);
      } else {
        setError(res?.message || "Failed to load loan products");
      }
    } catch (err) {
      setError(err?.message || "Error connecting to loan catalog");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <div className="dashboard-content">
      {/* Page Heading */}
      <div className="page-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: "800", color: "#FFFFFF", letterSpacing: "-0.5px" }}>
            Loan Products Catalog
          </h1>
          <p style={{ color: "var(--secondary-text)", fontSize: "13.5px", marginTop: "4px" }}>
            Configured credit lines, partner bank lending terms, interest slabs, and eligibility matrices.
          </p>
        </div>
        <button
          type="button"
          className="refresh-btn"
          onClick={fetchProducts}
          disabled={loading}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(8, 123, 255, 0.15)",
            border: "1px solid var(--border-color)",
            color: "var(--cyan-highlight)",
            padding: "8px 16px",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: "600",
            cursor: "pointer"
          }}
        >
          <RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh Catalog
        </button>
      </div>

      {error && (
        <div style={{ background: "rgba(255, 77, 77, 0.12)", border: "1px solid rgba(255, 77, 77, 0.3)", padding: "14px 18px", borderRadius: "10px", color: "#FF6B6B", marginBottom: "20px" }}>
          {error}
        </div>
      )}

      {/* Products Table Card */}
      <div style={{ background: "#0B1B32", border: "1px solid var(--border-color)", borderRadius: "14px", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "#071426", borderBottom: "1px solid var(--border-color)", color: "var(--secondary-text)" }}>
                <th style={{ padding: "12px 16px" }}>Product ID</th>
                <th style={{ padding: "12px 16px" }}>Loan Scheme</th>
                <th style={{ padding: "12px 16px" }}>Loan Type</th>
                <th style={{ padding: "12px 16px" }}>Lender Bank/NBFC</th>
                <th style={{ padding: "12px 16px" }}>Amount Range</th>
                <th style={{ padding: "12px 16px" }}>Interest Rate Range</th>
                <th style={{ padding: "12px 16px" }}>Max Tenure</th>
                <th style={{ padding: "12px 16px" }}>Status</th>
                <th style={{ padding: "12px 16px", textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ padding: "40px", textAlign: "center", color: "var(--secondary-text)" }}>
                    <RefreshCw size={20} className="spin" style={{ margin: "0 auto 10px" }} />
                    Loading loan products...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: "40px", textAlign: "center", color: "var(--secondary-text)" }}>
                    No loan products currently active in catalog.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} style={{ borderBottom: "1px solid rgba(23, 56, 93, 0.5)" }}>
                    <td style={{ padding: "14px 16px", color: "var(--cyan-highlight)", fontWeight: "700" }}>
                      {p.product_code || `#LN-${p.id}`}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontWeight: "700", color: "#FFFFFF" }}>{p.loan_name}</div>
                      <div style={{ fontSize: "11px", color: "var(--secondary-text)" }}>Processing Fee: {p.processing_fee_pct}%</div>
                    </td>
                    <td style={{ padding: "14px 16px", color: "#00D5FF" }}>
                      {p.loan_type}
                    </td>
                    <td style={{ padding: "14px 16px", color: "#FFFFFF" }}>
                      {p.lender_name}
                    </td>
                    <td style={{ padding: "14px 16px", fontWeight: "700", color: "#FFFFFF" }}>
                      ₹{(p.min_amount / 1000).toFixed(0)}k - ₹{(p.max_amount / 100000).toFixed(1)}L
                    </td>
                    <td style={{ padding: "14px 16px", fontWeight: "700", color: "#00E599" }}>
                      {p.interest_rate_min}% - {p.interest_rate_max}% p.a.
                    </td>
                    <td style={{ padding: "14px 16px", color: "var(--secondary-text)" }}>
                      {p.max_tenure_months} Months ({Math.round(p.max_tenure_months / 12)} Yrs)
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: "700",
                          padding: "3px 8px",
                          borderRadius: "999px",
                          background: p.status === "active" ? "rgba(0, 229, 153, 0.15)" : "rgba(107, 135, 168, 0.15)",
                          color: p.status === "active" ? "#00E599" : "#6B87A8",
                          textTransform: "uppercase"
                        }}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "center" }}>
                      <button
                        type="button"
                        onClick={() => setSelectedProduct(p)}
                        style={{
                          background: "rgba(8, 123, 255, 0.15)",
                          border: "1px solid var(--border-color)",
                          color: "#00D5FF",
                          padding: "5px 10px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: "600",
                          cursor: "pointer"
                        }}
                      >
                        Eligibility & Terms
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Details Modal */}
      {selectedProduct && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(5, 13, 27, 0.8)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ background: "#0B1B32", border: "1px solid var(--border-color)", borderRadius: "16px", maxWidth: "560px", width: "100%", padding: "24px", boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "18px" }}>
              <div>
                <span style={{ fontSize: "11px", color: "var(--cyan-highlight)", fontWeight: "700" }}>{selectedProduct.product_code}</span>
                <h2 style={{ fontSize: "18px", color: "#FFFFFF", marginTop: "2px" }}>{selectedProduct.loan_name}</h2>
                <div style={{ fontSize: "12px", color: "var(--secondary-text)" }}>Offered by: {selectedProduct.lender_name}</div>
              </div>
              <button type="button" onClick={() => setSelectedProduct(null)} style={{ background: "transparent", border: "none", color: "#A9BDD7", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ background: "#071426", padding: "16px", borderRadius: "10px", marginBottom: "16px" }}>
              <div style={{ fontSize: "12px", color: "var(--secondary-text)", textTransform: "uppercase", fontWeight: "700", marginBottom: "8px" }}>Eligibility Criteria</div>
              <p style={{ fontSize: "13.5px", color: "#FFFFFF", lineHeight: 1.5 }}>{selectedProduct.eligibility_criteria}</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "20px" }}>
              <div style={{ background: "#071426", padding: "12px", borderRadius: "8px" }}>
                <div style={{ fontSize: "11px", color: "var(--secondary-text)" }}>Sanction Range</div>
                <div style={{ fontSize: "14px", fontWeight: "700", color: "#FFFFFF" }}>₹{Number(selectedProduct.min_amount).toLocaleString()} - ₹{Number(selectedProduct.max_amount).toLocaleString()}</div>
              </div>
              <div style={{ background: "#071426", padding: "12px", borderRadius: "8px" }}>
                <div style={{ fontSize: "11px", color: "var(--secondary-text)" }}>Interest Slab</div>
                <div style={{ fontSize: "14px", fontWeight: "700", color: "#00E599" }}>{selectedProduct.interest_rate_min}% - {selectedProduct.interest_rate_max}% p.a.</div>
              </div>
              <div style={{ background: "#071426", padding: "12px", borderRadius: "8px" }}>
                <div style={{ fontSize: "11px", color: "var(--secondary-text)" }}>Max Repayment Period</div>
                <div style={{ fontSize: "14px", fontWeight: "700", color: "#00D5FF" }}>{selectedProduct.max_tenure_months} Months</div>
              </div>
              <div style={{ background: "#071426", padding: "12px", borderRadius: "8px" }}>
                <div style={{ fontSize: "11px", color: "var(--secondary-text)" }}>Origination / Processing</div>
                <div style={{ fontSize: "14px", fontWeight: "700", color: "#F59E0B" }}>{selectedProduct.processing_fee_pct}% of loan value</div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedProduct(null)}
              style={{ width: "100%", background: "#087BFF", border: "none", color: "#FFFFFF", padding: "10px", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
