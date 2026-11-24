import React, { useState } from "react";
import {
  Signal,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  Power,
  ChevronDown,
  Info,
  Server,
  Zap,
  Activity,
  Layers
} from "lucide-react";

export default function OperatorGatewayTable({
  operators = [],
  loading = false,
  onRefresh,
  onUpdateStatus,
  onViewOperatorPlans
}) {
  const [updatingId, setUpdatingId] = useState(null);

  const renderStatusBadge = (status) => {
    const s = String(status || "ONLINE").toUpperCase();

    if (s === "ONLINE" || s === "ACTIVE") {
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            padding: "3px 9px",
            borderRadius: "12px",
            fontSize: "11px",
            fontWeight: "700",
            color: "#00E599",
            background: "rgba(0, 229, 153, 0.12)",
            border: "1px solid rgba(0, 229, 153, 0.3)"
          }}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              backgroundColor: "#00E599",
              boxShadow: "0 0 6px #00E599"
            }}
          />
          ONLINE
        </span>
      );
    }

    if (s === "DEGRADED") {
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            padding: "3px 9px",
            borderRadius: "12px",
            fontSize: "11px",
            fontWeight: "700",
            color: "#FFB020",
            background: "rgba(255, 176, 32, 0.12)",
            border: "1px solid rgba(255, 176, 32, 0.3)"
          }}
        >
          <AlertTriangle size={11} />
          DEGRADED
        </span>
      );
    }

    if (s === "MAINTENANCE") {
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            padding: "3px 9px",
            borderRadius: "12px",
            fontSize: "11px",
            fontWeight: "700",
            color: "#A855F7",
            background: "rgba(168, 85, 247, 0.12)",
            border: "1px solid rgba(168, 85, 247, 0.3)"
          }}
        >
          <Clock size={11} />
          MAINTENANCE
        </span>
      );
    }

    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "5px",
          padding: "3px 9px",
          borderRadius: "12px",
          fontSize: "11px",
          fontWeight: "700",
          color: "#FF4D4D",
          background: "rgba(255, 77, 77, 0.12)",
          border: "1px solid rgba(255, 77, 77, 0.3)"
        }}
      >
        <XCircle size={11} />
        OFFLINE
      </span>
    );
  };

  const handleStatusChange = async (op, newStatus) => {
    if (!onUpdateStatus) return;
    setUpdatingId(op.id);
    try {
      await onUpdateStatus(op, newStatus);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div
      style={{
        background: "#071426",
        border: "1px solid #16365C",
        borderRadius: "14px",
        overflow: "hidden",
        boxShadow: "0 6px 24px rgba(0, 0, 0, 0.35)",
        marginBottom: "24px"
      }}
    >
      {/* Header Bar */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid #16365C",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          background: "#0B1D35"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: "rgba(8, 123, 255, 0.15)",
              border: "1px solid rgba(8, 123, 255, 0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <Signal size={16} color="#00D5FF" />
          </div>
          <div>
            <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#FFFFFF", margin: 0 }}>
              Telecom & DTH Operator Gateway Status
            </h3>
            <p style={{ fontSize: "11.5px", color: "#8BA2C1", margin: "2px 0 0 0" }}>
              Live telemetry monitoring across telecom circles and BBPS interconnects
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span
            style={{
              fontSize: "11px",
              color: "#00E599",
              background: "rgba(0, 229, 153, 0.1)",
              padding: "3px 10px",
              borderRadius: "12px",
              border: "1px solid rgba(0, 229, 153, 0.3)",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "5px"
            }}
          >
            <Activity size={12} />
            {operators.filter((o) => o.gateway_status === "ONLINE").length}/{operators.length} Gateways Operational
          </span>

          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                background: "#071426",
                border: "1px solid #16365C",
                color: "#00D5FF",
                padding: "6px 12px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: "600",
                cursor: "pointer"
              }}
              title="Ping and refresh operator status"
            >
              <RefreshCw size={13} className={loading ? "spin" : ""} />
              <span>Refresh</span>
            </button>
          )}
        </div>
      </div>

      {/* Table Wrapper */}
      <div style={{ overflowX: "auto", width: "100%" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "12.5px",
            textAlign: "left"
          }}
        >
          <thead>
            <tr
              style={{
                background: "#050D1B",
                borderBottom: "1px solid #16365C",
                color: "#8BA2C1",
                textTransform: "uppercase",
                fontSize: "11px",
                letterSpacing: "0.5px"
              }}
            >
              <th style={{ padding: "12px 14px", fontWeight: "700" }}>Operator</th>
              <th style={{ padding: "12px 14px", fontWeight: "700" }}>Code</th>
              <th style={{ padding: "12px 14px", fontWeight: "700" }}>Service</th>
              <th style={{ padding: "12px 14px", fontWeight: "700" }}>Provider Name</th>
              <th style={{ padding: "12px 14px", fontWeight: "700" }}>Gateway Status</th>
              <th style={{ padding: "12px 14px", fontWeight: "700" }}>Requests</th>
              <th style={{ padding: "12px 14px", fontWeight: "700" }}>Success</th>
              <th style={{ padding: "12px 14px", fontWeight: "700" }}>Failed</th>
              <th style={{ padding: "12px 14px", fontWeight: "700" }}>Success Rate</th>
              <th style={{ padding: "12px 14px", fontWeight: "700" }}>Avg Latency</th>
              <th style={{ padding: "12px 14px", fontWeight: "700" }}>Last Checked</th>
              <th style={{ padding: "12px 14px", fontWeight: "700", textAlign: "right" }}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #0F2542" }}>
                  <td colSpan={12} style={{ padding: "16px 20px" }}>
                    <div
                      style={{
                        height: "18px",
                        background: "linear-gradient(90deg, #0B1D35 25%, #16365C 50%, #0B1D35 75%)",
                        backgroundSize: "200% 100%",
                        borderRadius: "4px"
                      }}
                      className="skeleton-pulse"
                    />
                  </td>
                </tr>
              ))
            ) : operators.length === 0 ? (
              <tr>
                <td colSpan={12} style={{ padding: "35px 20px", textAlign: "center", color: "#8BA2C1" }}>
                  <Info size={24} color="#087BFF" style={{ marginBottom: "6px" }} />
                  <div style={{ color: "#FFFFFF", fontWeight: "600", fontSize: "14px" }}>
                    No operator gateways configured
                  </div>
                </td>
              </tr>
            ) : (
              operators.map((op) => {
                const isOnline = op.gateway_status === "ONLINE";
                return (
                  <tr
                    key={op.id}
                    style={{
                      borderBottom: "1px solid #0F2542",
                      transition: "background-color 0.15s ease"
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#0B1D35")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    {/* 1. Operator Name */}
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ color: "#FFFFFF", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px" }}>
                        <Zap size={13} color={isOnline ? "#00D5FF" : "#8BA2C1"} />
                        <span>{op.operator_name}</span>
                      </div>
                    </td>

                    {/* 2. Operator Code */}
                    <td style={{ padding: "12px 14px" }}>
                      <code
                        style={{
                          background: "#050D1B",
                          color: "#00D5FF",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          fontSize: "11px",
                          border: "1px solid #16365C"
                        }}
                      >
                        {op.operator_code}
                      </code>
                    </td>

                    {/* 3. Service Type */}
                    <td style={{ padding: "12px 14px" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "2px 7px",
                          borderRadius: "4px",
                          fontSize: "11px",
                          fontWeight: "700",
                          color: op.service_type === "DTH" ? "#A855F7" : "#087BFF",
                          background: op.service_type === "DTH" ? "rgba(168, 85, 247, 0.12)" : "rgba(8, 123, 255, 0.12)",
                          border: `1px solid ${op.service_type === "DTH" ? "rgba(168, 85, 247, 0.3)" : "rgba(8, 123, 255, 0.3)"}`
                        }}
                      >
                        {op.service_type}
                      </span>
                    </td>

                    {/* 4. Provider Name */}
                    <td style={{ padding: "12px 14px", color: "#8BA2C1", fontSize: "11.5px" }}>
                      {op.provider_name}
                    </td>

                    {/* 5. Gateway Status */}
                    <td style={{ padding: "12px 14px" }}>
                      {renderStatusBadge(op.gateway_status)}
                    </td>

                    {/* 6. Total Requests */}
                    <td style={{ padding: "12px 14px", color: "#FFFFFF", fontWeight: "600" }}>
                      {op.total_requests || 0}
                    </td>

                    {/* 7. Successful Requests */}
                    <td style={{ padding: "12px 14px", color: "#00E599", fontWeight: "600" }}>
                      {op.successful_requests || 0}
                    </td>

                    {/* 8. Failed Requests */}
                    <td style={{ padding: "12px 14px", color: op.failed_requests > 0 ? "#FF4D4D" : "#8BA2C1", fontWeight: "600" }}>
                      {op.failed_requests || 0}
                    </td>

                    {/* 9. Success Rate */}
                    <td style={{ padding: "12px 14px" }}>
                      <span
                        style={{
                          fontWeight: "700",
                          color: isOnline ? "#00E599" : "#FFB020"
                        }}
                      >
                        {op.success_rate}
                      </span>
                    </td>

                    {/* 10. Avg Latency */}
                    <td style={{ padding: "12px 14px", color: "#8BA2C1", fontFamily: "monospace", fontSize: "11.5px" }}>
                      {op.avg_response_time}
                    </td>

                    {/* 11. Last Checked */}
                    <td style={{ padding: "12px 14px", color: "#8BA2C1", fontSize: "11px" }}>
                      {op.last_checked}
                    </td>

                    {/* 12. Actions */}
                    <td style={{ padding: "12px 14px", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                        {/* View Plans */}
                        {onViewOperatorPlans && (
                          <button
                            onClick={() => onViewOperatorPlans(op)}
                            style={{
                              background: "rgba(8, 123, 255, 0.12)",
                              border: "1px solid rgba(8, 123, 255, 0.3)",
                              color: "#00D5FF",
                              padding: "4px 8px",
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontSize: "11px",
                              display: "flex",
                              alignItems: "center",
                              gap: "3px"
                            }}
                            title="View tariff plans for this operator"
                          >
                            <Layers size={11} /> Plans
                          </button>
                        )}

                        {/* Status Switcher Select */}
                        <select
                          value={op.gateway_status}
                          disabled={updatingId === op.id}
                          onChange={(e) => handleStatusChange(op, e.target.value)}
                          style={{
                            background: "#050D1B",
                            border: "1px solid #16365C",
                            borderRadius: "6px",
                            color: isOnline ? "#00E599" : "#FFB020",
                            fontSize: "11px",
                            padding: "4px 6px",
                            cursor: "pointer",
                            outline: "none"
                          }}
                          title="Change operator gateway status"
                        >
                          <option value="ONLINE">Online</option>
                          <option value="DEGRADED">Degraded</option>
                          <option value="MAINTENANCE">Maintenance</option>
                          <option value="OFFLINE">Offline</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
