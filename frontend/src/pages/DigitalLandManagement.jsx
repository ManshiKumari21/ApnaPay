import React, { useEffect, useState } from "react";
import { Map, LandPlot, Plus, CheckCircle2, Clock, Search, RefreshCw, FileText, Building2 } from "lucide-react";
import api from "../services/api";

export default function DigitalLandManagement() {
  const [data, setData] = useState({ projects: [], holdings: [], orders: [] });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    title: "",
    location: "",
    zone: "Zone A - Commercial",
    plot_size_sqft: 1200,
    price_per_sqft: 4500,
    total_plots: 20
  });
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const fetchLand = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/land");
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLand();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await api.post("/admin/land/projects", form);
      if (res.data.success) {
        setFeedback({ type: "success", text: res.data.message });
        setShowModal(false);
        setForm({
          title: "",
          location: "",
          zone: "Zone A - Commercial",
          plot_size_sqft: 1200,
          price_per_sqft: 4500,
          total_plots: 20
        });
        fetchLand();
      }
    } catch (err) {
      setFeedback({ type: "error", text: err.response?.data?.message || "Failed to list digital land project." });
    } finally {
      setSubmitting(false);
    }
  };

  const totalListings = data.projects?.length || 0;
  const totalHoldings = data.holdings?.length || 0;
  const totalVolume = (data.orders || []).reduce((acc, o) => acc + Number(o.amount || 0), 0);

  return (
    <div className="dashboard-content">
      <div className="page-heading">
        <div>
          <h1>Module 13: Digital Land Management</h1>
          <p>Manage tokenized virtual real estate plots, project land listings, user plot ownership registry, and asset deeds.</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button className="refresh-btn" onClick={fetchLand}>
            <RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh Listings
          </button>
          <button className="btn-save" onClick={() => setShowModal(true)} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Plus size={16} /> List New Land Plot
          </button>
        </div>
      </div>

      {feedback && (
        <div style={{
          padding: "12px 16px",
          borderRadius: "8px",
          marginBottom: "18px",
          background: feedback.type === "success" ? "#0b3d20" : "#3d1010",
          border: `1px solid ${feedback.type === "success" ? "#1b8744" : "#a82424"}`,
          color: feedback.type === "success" ? "#75f0a0" : "#ff9e9e"
        }}>
          {feedback.text}
        </div>
      )}

      {/* KPI Cards */}
      <div className="stats-grid" style={{ marginBottom: "24px" }}>
        <div className="stat-card blue">
          <div className="stat-top">
            <span className="stat-title">Active Land Projects</span>
            <div className="stat-icon"><Map size={20} /></div>
          </div>
          <h2>{totalListings} Townships</h2>
          <small>Verified master planned zones</small>
        </div>

        <div className="stat-card green">
          <div className="stat-top">
            <span className="stat-title">Total Land Transactions</span>
            <div className="stat-icon"><LandPlot size={20} /></div>
          </div>
          <h2>₹{(totalVolume / 100000).toFixed(2)} Lakhs</h2>
          <small>{data.orders?.length || 0} registry orders completed</small>
        </div>

        <div className="stat-card purple">
          <div className="stat-top">
            <span className="stat-title">Registered Plot Owners</span>
            <div className="stat-icon"><Building2 size={20} /></div>
          </div>
          <h2>{totalHoldings} Investors</h2>
          <small>100% digital deed verified</small>
        </div>
      </div>

      {/* Projects Catalog Table */}
      <div className="table-card" style={{ marginBottom: "24px" }}>
        <div className="table-toolbar">
          <h3 style={{ fontSize: "16px", fontWeight: "700" }}>Tokenized Digital Land Plots Catalog</h3>
        </div>

        <div className="table-wrapper">
          <table className="users-table">
            <thead>
              <tr>
                <th>Project Title</th>
                <th>Location</th>
                <th>Zoning</th>
                <th>Plot Size</th>
                <th>Rate / Sq.Ft</th>
                <th>Valuation (INR)</th>
                <th>Inventory</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.projects?.map((p) => (
                <tr key={p.id}>
                  <td><strong>{p.title}</strong></td>
                  <td>{p.location}</td>
                  <td>
                    <span style={{ fontSize: "11px", background: "#132847", padding: "4px 8px", borderRadius: "4px", color: "#60a5fa" }}>
                      {p.zone}
                    </span>
                  </td>
                  <td>{p.plot_size_sqft} sq.ft</td>
                  <td>₹{Number(p.price_per_sqft).toLocaleString()}</td>
                  <td>
                    <strong style={{ color: "#38bdf8", fontSize: "14px" }}>
                      ₹{Number(p.total_price).toLocaleString("en-IN")}
                    </strong>
                  </td>
                  <td>
                    <small style={{ color: "#94a3b8" }}>{p.plots_sold} / {p.total_plots} Sold</small>
                  </td>
                  <td>
                    <span className={`badge-pill ${p.status === "AVAILABLE" ? "active" : "pending"}`}>
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        {/* User Land Holdings Registry */}
        <div className="table-card">
          <div className="table-toolbar">
            <h3 style={{ fontSize: "15px", fontWeight: "700" }}>Plot Ownership Registry</h3>
          </div>
          <div className="table-wrapper">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Investor</th>
                  <th>Plot Number</th>
                  <th>Deed Certificate</th>
                  <th>Valuation</th>
                </tr>
              </thead>
              <tbody>
                {data.holdings?.map((h) => (
                  <tr key={h.id}>
                    <td>
                      <strong>{h.full_name}</strong>
                      <div style={{ fontSize: "11px", color: "#64748b" }}>{h.project_title}</div>
                    </td>
                    <td><code>{h.plot_number}</code></td>
                    <td>
                      <span style={{ fontSize: "11px", color: "#34d399", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <FileText size={12} /> {h.deed_certificate}
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: "#38bdf8" }}>₹{Number(h.invested_amount).toLocaleString("en-IN")}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Land Orders */}
        <div className="table-card">
          <div className="table-toolbar">
            <h3 style={{ fontSize: "15px", fontWeight: "700" }}>Recent Land Bookings</h3>
          </div>
          <div className="table-wrapper">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Investor</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.orders?.map((ord) => (
                  <tr key={ord.id}>
                    <td><strong>#LND-{ord.id}</strong></td>
                    <td>
                      <strong>{ord.user_name}</strong>
                      <div style={{ fontSize: "11px", color: "#64748b" }}>{ord.plot_number}</div>
                    </td>
                    <td>
                      <span style={{ fontSize: "11px", background: "#132847", padding: "4px 8px", borderRadius: "4px", color: "#60a5fa" }}>
                        {ord.order_type}
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: "#38bdf8" }}>₹{Number(ord.amount).toLocaleString("en-IN")}</strong>
                    </td>
                    <td>
                      <span className="badge-pill verified">{ord.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add New Land Plot Modal */}
      {showModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "grid", placeItems: "center", zIndex: 999
        }}>
          <div className="table-card" style={{ width: "100%", maxWidth: "520px", maxHeight: "90vh", overflowY: "auto", padding: "24px", background: "#0b1528", border: "1px solid #1f3557", margin: "16px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Map size={20} color="#087cff" /> List New Digital Land Project
            </h3>

            <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div className="form-group">
                <label>Project Title / Name</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  placeholder="e.g. Smart City Metro Phase 2"
                />
              </div>

              <div className="form-group">
                <label>Location / City Enclave</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  required
                  placeholder="e.g. Sector 128, Expressway, Noida"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="form-group">
                  <label>Zoning Category</label>
                  <select
                    value={form.zone}
                    onChange={(e) => setForm({ ...form, zone: e.target.value })}
                    style={{
                      background: "#08152b",
                      border: "1px solid #1c3257",
                      color: "#e2ecff",
                      padding: "10px",
                      borderRadius: "6px",
                      fontSize: "13px"
                    }}
                  >
                    <option value="Zone A - Commercial">Zone A - Commercial</option>
                    <option value="Zone B - IT Corridor">Zone B - IT Corridor</option>
                    <option value="Zone C - Residential Eco">Zone C - Residential Eco</option>
                    <option value="Zone D - Mixed Tech Park">Zone D - Mixed Tech Park</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Plot Size (Sq. Ft)</label>
                  <input
                    type="number"
                    min="100"
                    value={form.plot_size_sqft}
                    onChange={(e) => setForm({ ...form, plot_size_sqft: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="form-group">
                  <label>Rate Per Sq. Ft (INR)</label>
                  <input
                    type="number"
                    min="100"
                    value={form.price_per_sqft}
                    onChange={(e) => setForm({ ...form, price_per_sqft: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Total Plots Available</label>
                  <input
                    type="number"
                    min="1"
                    value={form.total_plots}
                    onChange={(e) => setForm({ ...form, total_plots: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ background: "#050e1c", padding: "12px", borderRadius: "6px", fontSize: "13px", color: "#38bdf8" }}>
                Estimated Plot Valuation: <strong>₹{(Number(form.plot_size_sqft) * Number(form.price_per_sqft)).toLocaleString("en-IN")}</strong>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-save" disabled={submitting}>
                  {submitting ? "Listing..." : "Create Land Listing"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
