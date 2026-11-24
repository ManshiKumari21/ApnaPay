import React, { useState } from "react";
import {
  Layers,
  Search,
  CheckCircle2,
  Calendar,
  Wifi,
  PhoneCall,
  MessageSquare,
  Sparkles,
  Info,
  Zap,
  Tag
} from "lucide-react";

export default function RechargePlansCatalog({ plans = [], loading = false }) {
  const [selectedOperator, setSelectedOperator] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const formatINR = (val) => {
    const num = Number(val) || 0;
    return (
      "₹" +
      num.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
    );
  };

  const operators = Array.from(new Set(plans.map((p) => p.operator_name))).filter(Boolean);

  const filteredPlans = plans.filter((p) => {
    if (selectedOperator !== "all" && p.operator_name !== selectedOperator) {
      return false;
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        p.plan_name.toLowerCase().includes(q) ||
        p.operator_name.toLowerCase().includes(q) ||
        String(p.amount).includes(q)
      );
    }
    return true;
  });

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
              background: "rgba(168, 85, 247, 0.15)",
              border: "1px solid rgba(168, 85, 247, 0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <Layers size={16} color="#A855F7" />
          </div>
          <div>
            <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#FFFFFF", margin: 0 }}>
              Recharge Plan Catalog Management
            </h3>
            <p style={{ fontSize: "11.5px", color: "#8BA2C1", margin: "2px 0 0 0" }}>
              Operator tariff plans, validity periods, data allowances and calling quota
            </p>
          </div>
        </div>

        {/* Search Input in Header */}
        <div style={{ position: "relative", minWidth: "220px" }}>
          <input
            type="text"
            placeholder="Search plans by amount or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              background: "#071426",
              border: "1px solid #16365C",
              borderRadius: "8px",
              color: "#FFFFFF",
              fontSize: "12px",
              padding: "7px 12px 7px 30px",
              outline: "none"
            }}
          />
          <Search
            size={13}
            color="#8BA2C1"
            style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }}
          />
        </div>
      </div>

      {/* Operator Filter Tabs */}
      <div
        style={{
          padding: "10px 20px",
          background: "#050D1B",
          borderBottom: "1px solid #16365C",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          overflowX: "auto"
        }}
      >
        <span style={{ fontSize: "11px", color: "#8BA2C1", fontWeight: "700", textTransform: "uppercase", marginRight: "4px" }}>
          Filter Operator:
        </span>

        <button
          onClick={() => setSelectedOperator("all")}
          style={{
            padding: "4px 10px",
            borderRadius: "6px",
            background: selectedOperator === "all" ? "#087BFF" : "#071426",
            border: selectedOperator === "all" ? "1px solid #00D5FF" : "1px solid #16365C",
            color: selectedOperator === "all" ? "#FFFFFF" : "#8BA2C1",
            fontSize: "11.5px",
            fontWeight: "600",
            cursor: "pointer",
            whiteSpace: "nowrap"
          }}
        >
          All Operators ({plans.length})
        </button>

        {operators.map((opName) => {
          const count = plans.filter((p) => p.operator_name === opName).length;
          return (
            <button
              key={opName}
              onClick={() => setSelectedOperator(opName)}
              style={{
                padding: "4px 10px",
                borderRadius: "6px",
                background: selectedOperator === opName ? "#087BFF" : "#071426",
                border: selectedOperator === opName ? "1px solid #00D5FF" : "1px solid #16365C",
                color: selectedOperator === opName ? "#FFFFFF" : "#8BA2C1",
                fontSize: "11.5px",
                fontWeight: "600",
                cursor: "pointer",
                whiteSpace: "nowrap"
              }}
            >
              {opName} ({count})
            </button>
          );
        })}
      </div>

      {/* Plans Grid */}
      <div
        style={{
          padding: "18px 20px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "16px"
        }}
      >
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              style={{
                height: "160px",
                borderRadius: "10px",
                background: "linear-gradient(90deg, #0B1D35 25%, #16365C 50%, #0B1D35 75%)",
                backgroundSize: "200% 100%"
              }}
              className="skeleton-pulse"
            />
          ))
        ) : filteredPlans.length === 0 ? (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "35px 20px", color: "#8BA2C1" }}>
            <Info size={24} color="#087BFF" style={{ marginBottom: "6px" }} />
            <div style={{ color: "#FFFFFF", fontWeight: "600", fontSize: "14px" }}>
              No plans found matching selected operator or search
            </div>
          </div>
        ) : (
          filteredPlans.map((plan) => (
            <div
              key={plan.id}
              style={{
                background: "#0B1D35",
                border: "1px solid #16365C",
                borderRadius: "12px",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: "12px",
                transition: "border-color 0.15s ease, transform 0.15s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#00D5FF";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#16365C";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              {/* Plan Header */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                  <div>
                    <span
                      style={{
                        fontSize: "10.5px",
                        fontWeight: "700",
                        color: "#087BFF",
                        background: "rgba(8, 123, 255, 0.12)",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        textTransform: "uppercase"
                      }}
                    >
                      {plan.operator_name}
                    </span>
                    <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#FFFFFF", margin: "6px 0 2px 0" }}>
                      {plan.plan_name}
                    </h4>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "19px", fontWeight: "800", color: "#00D5FF" }}>
                      {formatINR(plan.amount)}
                    </div>
                    <span style={{ fontSize: "10px", color: "#00E599", fontWeight: "700", textTransform: "uppercase" }}>
                      {plan.status || "ACTIVE"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Plan Benefits */}
              <div
                style={{
                  background: "#071426",
                  border: "1px solid #16365C",
                  borderRadius: "8px",
                  padding: "10px 12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  fontSize: "11.5px"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#8BA2C1", display: "flex", alignItems: "center", gap: "5px" }}>
                    <Calendar size={12} color="#087BFF" /> Validity:
                  </span>
                  <span style={{ color: "#FFFFFF", fontWeight: "600" }}>{plan.validity_days}</span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#8BA2C1", display: "flex", alignItems: "center", gap: "5px" }}>
                    <Wifi size={12} color="#00D5FF" /> Data Quota:
                  </span>
                  <span style={{ color: "#00D5FF", fontWeight: "600" }}>{plan.data_benefit}</span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#8BA2C1", display: "flex", alignItems: "center", gap: "5px" }}>
                    <PhoneCall size={12} color="#00E599" /> Voice Calling:
                  </span>
                  <span style={{ color: "#00E599", fontWeight: "600" }}>{plan.calling_benefit}</span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#8BA2C1", display: "flex", alignItems: "center", gap: "5px" }}>
                    <MessageSquare size={12} color="#FFB020" /> SMS Benefits:
                  </span>
                  <span style={{ color: "#FFFFFF" }}>{plan.sms_benefit}</span>
                </div>
              </div>

              {/* Plan Type Pill */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span
                  style={{
                    fontSize: "10.5px",
                    color: "#8BA2C1",
                    background: "rgba(139, 162, 193, 0.12)",
                    padding: "2px 6px",
                    borderRadius: "4px"
                  }}
                >
                  Type: {plan.plan_type}
                </span>

                <span style={{ fontSize: "11px", color: "#8BA2C1" }}>
                  Plan ID: #{plan.id}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
