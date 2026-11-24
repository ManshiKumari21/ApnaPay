import React, { useState, useEffect } from "react";
import {
  ShieldCheck, Smartphone, CheckCircle2, AlertTriangle, XCircle,
  Clock, Lock, Upload, FileText, ArrowRight, RefreshCw, Send,
  AlertCircle, ShieldAlert, Check, Edit3, Trash2, ChevronRight,
  User, Calendar, MapPin, Building, Hash, FileCheck, ArrowLeft,
  Eye, Download, ZoomIn, X, Info
} from "lucide-react";
import api from "../../services/api";

export default function UserKycCenter() {
  // Main data states
  const [loading, setLoading] = useState(true);
  const [statusData, setStatusData] = useState(null);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Main View Tabs: "wizard" (Onboarding Steps 1-4) vs "record" (Application Details & Documents)
  const [activeTab, setActiveTab] = useState("wizard");

  // Active Wizard Step (1: Mobile, 2: Personal, 3: Documents, 4: Review)
  const [activeStep, setActiveStep] = useState(1);

  // Document Zoom Modal state
  const [zoomedDoc, setZoomedDoc] = useState(null);

  // Mobile OTP Verification states
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [otpExpirySeconds, setOtpExpirySeconds] = useState(0);
  const [maskedPhone, setMaskedPhone] = useState("");
  const [otpError, setOtpError] = useState(null);
  const [newPhoneNumber, setNewPhoneNumber] = useState("");

  // Personal Information form states (Step 2)
  const [personalData, setPersonalData] = useState({
    fullName: "",
    dateOfBirth: "",
    gender: "Male",
    fatherName: "",
    address: "",
    city: "",
    state: "Maharashtra",
    postalCode: ""
  });
  const [savingPersonal, setSavingPersonal] = useState(false);
  const [personalErrors, setPersonalErrors] = useState({});

  // Document Verification states (Step 3)
  const [kycType, setKycType] = useState("Full KYC");
  const [panNumber, setPanNumber] = useState("");
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [panDocPreview, setPanDocPreview] = useState(null);
  const [panDocName, setPanDocName] = useState("");
  const [aadhaarFrontPreview, setAadhaarFrontPreview] = useState(null);
  const [aadhaarFrontName, setAadhaarFrontName] = useState("");
  const [aadhaarBackPreview, setAadhaarBackPreview] = useState(null);
  const [aadhaarBackName, setAadhaarBackName] = useState("");
  const [supportingDocType, setSupportingDocType] = useState("Voter ID");
  const [supportingDocPreview, setSupportingDocPreview] = useState(null);
  const [supportingDocName, setSupportingDocName] = useState("");
  const [docErrors, setDocErrors] = useState({});

  // Review & Submit states (Step 4)
  const [declarationAccepted, setDeclarationAccepted] = useState(false);
  const [submittingKyc, setSubmittingKyc] = useState(false);
  const [isEditingResubmission, setIsEditingResubmission] = useState(false);

  // 1. Fetch KYC & Mobile Verification status from backend API
  const fetchKycStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/kyc/status");
      if (res.data?.success) {
        const d = res.data.data;
        setStatusData(d);

        // Extract registered phone from database user
        const ph = d.user?.phone || d.mobile_verification?.registered_phone || "9981280069";
        const cleanPh = ph.replace("+91", "").trim();
        setNewPhoneNumber(cleanPh);
        setMaskedPhone(d.mobile_verification?.masked_phone || d.user?.masked_phone || "******" + cleanPh.slice(-4));

        // If backend reports an active ongoing OTP, auto-open OTP input with timer
        if (d.active_otp && !d.mobile_verification?.is_verified) {
          setOtpSent(true);
          setOtpExpirySeconds(d.active_otp.expires_in_seconds || 300);
          setCooldown(60);
          if (d.active_otp.phone) {
            setNewPhoneNumber(d.active_otp.phone.replace("+91", "").trim());
          }
        }

        // Prepopulate Personal Details from database user_profiles
        if (d.personal_details) {
          setPersonalData({
            fullName: d.personal_details.full_name || d.user?.full_name || "",
            dateOfBirth: d.personal_details.date_of_birth || "",
            gender: d.personal_details.gender || d.user?.gender || "Male",
            fatherName: d.personal_details.father_name || "",
            address: d.personal_details.address || "",
            city: d.personal_details.city || "",
            state: d.personal_details.state || "Maharashtra",
            postalCode: d.personal_details.postal_code || ""
          });
        } else if (d.user) {
          setPersonalData(prev => ({
            ...prev,
            fullName: d.user.full_name || prev.fullName
          }));
        }

        // Prepopulate submitted documents if available
        if (d.kyc?.documents && d.kyc.documents.length > 0) {
          d.kyc.documents.forEach(doc => {
            if (doc.document_type === "pan_card" && doc.secure_storage_key) {
              setPanDocPreview(doc.secure_storage_key);
              setPanDocName("Uploaded PAN Card");
            } else if (doc.document_type === "aadhaar_front" && doc.secure_storage_key) {
              setAadhaarFrontPreview(doc.secure_storage_key);
              setAadhaarFrontName("Uploaded Aadhaar Front");
            } else if (doc.document_type === "aadhaar_back" && doc.secure_storage_key) {
              setAadhaarBackPreview(doc.secure_storage_key);
              setAadhaarBackName("Uploaded Aadhaar Back");
            }
          });
        }

        // Determine active tab & step from backend progress
        const isMobVerified = Boolean(d.mobile_verification?.is_verified);
        const kycStatus = (d.kyc?.verification_status || "not_submitted").toLowerCase();
        const isSubmitted = kycStatus === "pending" || kycStatus === "under_review" || kycStatus === "verified" || kycStatus === "approved";

        if (isSubmitted) {
          setActiveTab("record"); // If already submitted or verified, default to Application Record tab
          setActiveStep(4);
        } else if (!isMobVerified) {
          setActiveTab("wizard");
          setActiveStep(1);
        } else if (d.step_progress) {
          setActiveTab("wizard");
          setActiveStep(d.step_progress.current_step || 2);
        }
      }
    } catch (err) {
      console.error("Fetch KYC status error:", err);
      setError(err.response?.data?.message || "Failed to load KYC verification status.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKycStatus();
  }, []);

  // Cooldown & Expiry Timers
  useEffect(() => {
    let interval = null;
    if (cooldown > 0) {
      interval = setInterval(() => {
        setCooldown(c => Math.max(0, c - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [cooldown]);

  useEffect(() => {
    let timer = null;
    if (otpExpirySeconds > 0) {
      timer = setInterval(() => {
        setOtpExpirySeconds(s => Math.max(0, s - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpExpirySeconds]);

  // Format seconds to mm:ss
  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // 2. SEND MOBILE SMS OTP
  const handleSendOtp = async (e) => {
    e?.preventDefault();
    setSendingOtp(true);
    setOtpError(null);
    setFeedback(null);
    try {
      const digits = newPhoneNumber.replace(/\D/g, "");
      if (digits.length < 10) {
        setOtpError("Please enter a valid 10-digit mobile number.");
        setSendingOtp(false);
        return;
      }
      const fullPhone = digits.startsWith("91") && digits.length === 12 ? `+${digits}` : `+91 ${digits.slice(-10)}`;

      const res = await api.post("/kyc/send-otp", { phone: fullPhone });
      if (res.data?.success) {
        setOtpSent(true);
        setCooldown(res.data.data?.resend_cooldown_seconds || 60);
        setOtpExpirySeconds(res.data.data?.expires_in_seconds || 300);
        setMaskedPhone(res.data.data?.masked_phone || maskedPhone);
        setFeedback({
          type: "success",
          text: res.data.message || `OTP sent successfully via SMS to ${fullPhone}.`
        });
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to send verification OTP.";
      setOtpError(msg);
      if (err.response?.data?.cooldown_remaining_seconds) {
        setCooldown(err.response.data.cooldown_remaining_seconds);
      }
    } finally {
      setSendingOtp(false);
    }
  };

  // 3. VERIFY MOBILE OTP
  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    if (!otpCode || otpCode.trim().length !== 6) {
      setOtpError("Please enter the complete 6-digit OTP received via SMS.");
      return;
    }

    setVerifyingOtp(true);
    setOtpError(null);
    setFeedback(null);
    try {
      const res = await api.post("/kyc/verify-otp", { otp: otpCode.trim() });
      if (res.data?.success) {
        setOtpSent(false);
        setOtpCode("");
        setFeedback({
          type: "success",
          text: res.data.message || "Mobile number verified successfully! Step 2 Personal Details is now unlocked."
        });
        await fetchKycStatus();
        setActiveStep(2); // Advance to Step 2
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Invalid OTP entered. Please try again.";
      setOtpError(msg);
    } finally {
      setVerifyingOtp(false);
    }
  };

  // 4. SAVE PERSONAL INFORMATION (STEP 2)
  const handleSavePersonal = async (e) => {
    e?.preventDefault();
    const errors = {};

    if (!personalData.fullName.trim()) errors.fullName = "Full Legal Name is required.";
    if (!personalData.dateOfBirth) errors.dateOfBirth = "Date of Birth is required.";
    if (!personalData.address.trim()) errors.address = "Residential Address is required.";
    if (!personalData.city.trim()) errors.city = "City is required.";
    if (!personalData.postalCode.trim() || !/^\d{6}$/.test(personalData.postalCode.trim())) {
      errors.postalCode = "Enter a valid 6-digit PIN code.";
    }

    if (Object.keys(errors).length > 0) {
      setPersonalErrors(errors);
      return;
    }
    setPersonalErrors({});
    setSavingPersonal(true);
    setFeedback(null);

    try {
      const res = await api.put("/kyc/personal-details", {
        full_name: personalData.fullName.trim(),
        date_of_birth: personalData.dateOfBirth,
        gender: personalData.gender,
        father_name: personalData.fatherName.trim(),
        address: personalData.address.trim(),
        city: personalData.city.trim(),
        state: personalData.state.trim(),
        postal_code: personalData.postalCode.trim()
      });

      if (res.data?.success) {
        setFeedback({
          type: "success",
          text: "Personal information saved successfully! Proceed to Step 3 for document upload."
        });
        setActiveStep(3); // Advance to Step 3
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to save personal details.";
      setError(msg);
    } finally {
      setSavingPersonal(false);
    }
  };

  // Handle local file preview with size validation (5MB max)
  const handleFileSelect = (e, setPreview, setName, fieldKey) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File size exceeds 5MB limit. Please upload a smaller image or document.");
      return;
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      alert("Invalid format. Please upload JPG, PNG, WEBP, or PDF file.");
      return;
    }

    setName(file.name);
    setDocErrors(prev => ({ ...prev, [fieldKey]: null }));

    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // 5. VALIDATE STEP 3 & PROCEED TO REVIEW (STEP 4)
  const handleProceedToReview = (e) => {
    e?.preventDefault();
    const errors = {};

    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panNumber.trim() || !panRegex.test(panNumber.trim())) {
      errors.panNumber = "Valid 10-character PAN is required (e.g. ABCDE1234F).";
    }
    if (!panDocPreview) {
      errors.panDoc = "PAN Card image or document proof is required.";
    }

    if (kycType === "Full KYC") {
      const aadhaarClean = aadhaarNumber.replace(/\D/g, "");
      if (!aadhaarClean || aadhaarClean.length !== 12) {
        errors.aadhaarNumber = "12-digit Aadhaar Number is required for Full KYC.";
      }
      if (!aadhaarFrontPreview) {
        errors.aadhaarFront = "Aadhaar Card Front photo is required.";
      }
      if (!aadhaarBackPreview) {
        errors.aadhaarBack = "Aadhaar Card Back (Address) photo is required.";
      }
    }

    if (Object.keys(errors).length > 0) {
      setDocErrors(errors);
      return;
    }

    setDocErrors({});
    setActiveStep(4); // Advance to Review & Submit
  };

  // 6. SUBMIT FINAL KYC APPLICATION (STEP 4)
  const handleSubmitKyc = async (e) => {
    e?.preventDefault();
    if (!declarationAccepted) {
      alert("Please confirm the verification accuracy declaration before submitting.");
      return;
    }

    setSubmittingKyc(true);
    setFeedback(null);
    setError(null);

    try {
      const payload = {
        kyc_type: kycType,
        full_name: personalData.fullName,
        date_of_birth: personalData.dateOfBirth,
        gender: personalData.gender,
        father_name: personalData.fatherName,
        address: personalData.address,
        city: personalData.city,
        state: personalData.state,
        postal_code: personalData.postalCode,
        pan_number: panNumber.toUpperCase(),
        aadhaar_number: aadhaarNumber.replace(/\D/g, ""),
        document_type: kycType === "Full KYC" ? "Aadhaar Card" : "PAN Card",
        pan_document: panDocPreview,
        aadhaar_front_document: aadhaarFrontPreview,
        aadhaar_back_document: aadhaarBackPreview,
        supporting_document: supportingDocPreview
      };

      const res = await api.post("/kyc/submit", payload);
      if (res.data?.success) {
        setFeedback({
          type: "success",
          text: res.data.message || "Your KYC application has been submitted successfully and is queued for compliance verification!"
        });
        setIsEditingResubmission(false);
        await fetchKycStatus();
        setActiveTab("record"); // Switch to Application Record view
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to submit KYC application. Please check your entries.";
      setError(msg);
    } finally {
      setSubmittingKyc(false);
    }
  };

  if (loading) {
    return (
      <div className="table-card" style={{ padding: "80px 20px", textAlign: "center", color: "#94a3b8" }}>
        <RefreshCw size={36} className="spin" style={{ margin: "0 auto 16px", color: "#087cff" }} />
        <div style={{ fontSize: "16px", fontWeight: "600", color: "#e2ecff" }}>Loading your KYC compliance profile...</div>
        <p style={{ fontSize: "12px", color: "#64748b", marginTop: "6px" }}>Synchronizing with ApnaPay compliance and database services</p>
      </div>
    );
  }

  // Derive verification statuses strictly matching database and Admin panel
  const isMobileVerified = Boolean(statusData?.mobile_verification?.is_verified);
  const kycStatus = (statusData?.kyc?.verification_status || "not_submitted").toLowerCase();

  const isKycVerified = isMobileVerified && (kycStatus === "verified" || kycStatus === "approved");
  const isKycRejected = isMobileVerified && kycStatus === "rejected";
  const isResubmissionNeeded = isMobileVerified && (
    kycStatus === "resubmission_requested" ||
    (kycStatus === "under_review" && Boolean(statusData?.kyc?.rejection_reason || statusData?.kyc?.remarks))
  );
  const isKycSubmitted = isMobileVerified && (kycStatus === "pending" || kycStatus === "submitted");
  const isUnderReview = isMobileVerified && (kycStatus === "under_review" && !isResubmissionNeeded);
  const isNotSubmitted = isMobileVerified && kycStatus === "not_submitted";

  // Calculate highest step allowed in wizard
  let maxUnlockedStep = 1;
  if (isMobileVerified) {
    maxUnlockedStep = 2;
    if (personalData.fullName && personalData.dateOfBirth && personalData.address) {
      maxUnlockedStep = 3;
      if (panNumber && panDocPreview) {
        maxUnlockedStep = 4;
      }
    }
  }

  const stepsList = [
    { id: 1, title: "Mobile Verification", desc: "SMS OTP auth" },
    { id: 2, title: "Personal Details", desc: "Demographic info" },
    { id: 3, title: "Document Upload", desc: "PAN & Aadhaar" },
    { id: 4, title: "Final Review", desc: "Verify & submit" }
  ];

  const indianStates = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
    "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
    "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
    "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
    "Delhi", "Jammu and Kashmir", "Ladakh"
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* Page Heading */}
      <div className="page-heading">
        <div>
          <h1 style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <ShieldCheck size={28} color="#087cff" /> KYC Verification Center
          </h1>
          <p>
            Verify government identity submissions, authenticate mobile number via SMS OTP, and track compliance approvals.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button className="refresh-btn" onClick={fetchKycStatus} title="Refresh verification state">
            <RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh Status
          </button>
        </div>
      </div>

      {/* Global Alerts / Feedback */}
      {feedback && (
        <div style={{
          padding: "14px 18px",
          borderRadius: "8px",
          background: feedback.type === "success" ? "#0b3d20" : "#3d1010",
          border: `1px solid ${feedback.type === "success" ? "#1b8744" : "#a82424"}`,
          color: feedback.type === "success" ? "#75f0a0" : "#ff9e9e",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          fontSize: "13px",
          fontWeight: "500"
        }}>
          {feedback.type === "success" ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span>{feedback.text}</span>
        </div>
      )}

      {error && (
        <div style={{
          padding: "14px 18px",
          borderRadius: "8px",
          background: "#3d1010",
          border: "1px solid #a82424",
          color: "#ff9e9e",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          fontSize: "13px"
        }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. SIX KPI COMPLIANCE CARDS (Matching Admin KYC Dashboard) */}
      {/* ======================================================== */}
      <div className="stats-grid" style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "14px"
      }}>
        {/* Card 1: Overall KYC Status */}
        <div className={`stat-card ${isKycVerified ? "green" : isKycRejected ? "red" : isResubmissionNeeded ? "purple" : isKycSubmitted ? "blue" : "orange"}`}>
          <div className="stat-top">
            <span className="stat-title">KYC Status</span>
            <div className="stat-icon">
              {isKycVerified ? <CheckCircle2 size={18} /> : isKycRejected ? <XCircle size={18} /> : isResubmissionNeeded ? <AlertCircle size={18} /> : <ShieldCheck size={18} />}
            </div>
          </div>
          <h2 style={{ fontSize: "17px", marginTop: "6px" }}>
            {isKycVerified ? "Verified" : isKycRejected ? "Rejected" : isResubmissionNeeded ? "Resubmit" : isKycSubmitted ? "Submitted" : isUnderReview ? "Under Review" : "Pending"}
          </h2>
          <small>{isKycVerified ? "Identity verified & active" : isKycRejected ? "Corrections required" : isResubmissionNeeded ? "Documents requested" : isKycSubmitted ? "Awaiting review" : "Action required"}</small>
        </div>

        {/* Card 2: Mobile OTP Verification */}
        <div className={`stat-card ${isMobileVerified ? "green" : "yellow"}`}>
          <div className="stat-top">
            <span className="stat-title">Mobile Verification</span>
            <div className="stat-icon"><Smartphone size={18} /></div>
          </div>
          <h2 style={{ fontSize: "17px", marginTop: "6px" }}>
            {isMobileVerified ? "Verified" : "Not Verified"}
          </h2>
          <small>{isMobileVerified ? "Authenticated via SMS" : "SMS OTP pending"}</small>
        </div>

        {/* Card 3: Application Reference ID */}
        <div className="stat-card blue">
          <div className="stat-top">
            <span className="stat-title">Application ID</span>
            <div className="stat-icon"><Hash size={18} /></div>
          </div>
          <h2 style={{ fontSize: "17px", marginTop: "6px", color: "#38bdf8" }}>
            {statusData?.kyc?.id ? `#KYC-${statusData.kyc.id}` : "Not Created"}
          </h2>
          <small>{statusData?.kyc?.submission_date ? new Date(statusData.kyc.submission_date).toLocaleDateString("en-IN") : "Pending submission"}</small>
        </div>

        {/* Card 4: Assigned KYC Tier */}
        <div className="stat-card cyan">
          <div className="stat-top">
            <span className="stat-title">KYC Tier</span>
            <div className="stat-icon"><FileCheck size={18} /></div>
          </div>
          <h2 style={{ fontSize: "17px", marginTop: "6px" }}>
            {statusData?.kyc?.kyc_type || kycType}
          </h2>
          <small>{(statusData?.kyc?.kyc_type || kycType) === "Full KYC" ? "Unlimited wallet payouts" : "Basic limits"}</small>
        </div>

        {/* Card 5: PAN Card Status */}
        <div className={`stat-card ${statusData?.kyc?.pan_verification_status === "Verified" ? "green" : "blue"}`}>
          <div className="stat-top">
            <span className="stat-title">PAN Verification</span>
            <div className="stat-icon"><FileText size={18} /></div>
          </div>
          <h2 style={{ fontSize: "17px", marginTop: "6px" }}>
            {statusData?.kyc?.pan_verification_status || (panDocPreview ? "Uploaded" : "Pending")}
          </h2>
          <small>{panNumber ? `${panNumber.slice(0,3)}****${panNumber.slice(-2)}` : "Tax identity proof"}</small>
        </div>

        {/* Card 6: Aadhaar Verification */}
        <div className={`stat-card ${statusData?.kyc?.aadhaar_verification_status === "Verified" ? "green" : "blue"}`}>
          <div className="stat-top">
            <span className="stat-title">Aadhaar Status</span>
            <div className="stat-icon"><ShieldCheck size={18} /></div>
          </div>
          <h2 style={{ fontSize: "17px", marginTop: "6px" }}>
            {statusData?.kyc?.aadhaar_verification_status || (aadhaarFrontPreview ? "Uploaded" : "Pending")}
          </h2>
          <small>{aadhaarNumber ? `XXXX XXXX ${aadhaarNumber.replace(/\D/g, "").slice(-4)}` : "UIDAI biometric proof"}</small>
        </div>
      </div>

      {/* Admin Remarks Banner if Available (Matching Admin Remarks) */}
      {(statusData?.kyc?.rejection_reason || statusData?.kyc?.remarks) && (isKycRejected || isResubmissionNeeded || isUnderReview) && (
        <div style={{
          background: isKycRejected ? "#2b0d13" : "#240d3d",
          border: `1px solid ${isKycRejected ? "#991b1b" : "#7e22ce"}`,
          borderRadius: "10px",
          padding: "18px 20px",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "14px"
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
            <ShieldAlert size={22} color={isKycRejected ? "#f87171" : "#c084fc"} style={{ flexShrink: 0, marginTop: "2px" }} />
            <div>
              <h4 style={{ fontSize: "14px", fontWeight: "700", color: isKycRejected ? "#fca5a5" : "#e9d5ff" }}>
                Compliance Officer Remarks:
              </h4>
              <p style={{ fontSize: "13px", color: "#e2ecff", marginTop: "4px" }}>
                {statusData.kyc.rejection_reason || statusData.kyc.remarks}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setActiveTab("wizard");
              setActiveStep(isMobileVerified ? 2 : 1);
              setIsEditingResubmission(true);
            }}
            style={{
              background: "linear-gradient(90deg, #8b5cf6, #6d28d9)",
              color: "#ffffff",
              border: "none",
              padding: "8px 18px",
              borderRadius: "6px",
              fontWeight: "700",
              fontSize: "12px",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            Update & Resubmit <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. TAB NAVIGATION SWITCHER (Wizard vs Application Record) */}
      {/* ======================================================== */}
      <div style={{
        display: "flex",
        gap: "12px",
        borderBottom: "1px solid #1a3459",
        paddingBottom: "12px"
      }}>
        <button
          type="button"
          onClick={() => setActiveTab("wizard")}
          style={{
            background: activeTab === "wizard" ? "linear-gradient(90deg, #087cff, #00d9ff)" : "#08152b",
            color: activeTab === "wizard" ? "#ffffff" : "#94a3b8",
            border: `1px solid ${activeTab === "wizard" ? "#00d9ff" : "#1a3459"}`,
            padding: "10px 20px",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: "700",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          <FileText size={16} /> KYC Verification Wizard {!isMobileVerified && <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#fbbf24" }} />}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("record")}
          style={{
            background: activeTab === "record" ? "linear-gradient(90deg, #087cff, #00d9ff)" : "#08152b",
            color: activeTab === "record" ? "#ffffff" : "#94a3b8",
            border: `1px solid ${activeTab === "record" ? "#00d9ff" : "#1a3459"}`,
            padding: "10px 20px",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: "700",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          <Eye size={16} /> My KYC Application & Document Proofs
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB A: KYC VERIFICATION ONBOARDING WIZARD                */}
      {/* ======================================================== */}
      {activeTab === "wizard" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          
          {/* Visual 4-Step Progress Tracker */}
          <div className="table-card" style={{ padding: "18px 24px" }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "12px"
            }}>
              {stepsList.map((step) => {
                const isCompleted = step.id === 1 ? isMobileVerified :
                                    step.id === 2 ? (isMobileVerified && Boolean(personalData.fullName && personalData.dateOfBirth && personalData.address)) :
                                    step.id === 3 ? (isMobileVerified && Boolean(panNumber && panDocPreview)) :
                                    (isKycSubmitted || isUnderReview || isKycVerified);

                const isCurrent = activeStep === step.id;
                const isLocked = step.id > maxUnlockedStep && !isCompleted;

                return (
                  <div
                    key={step.id}
                    onClick={() => {
                      if (!isLocked) setActiveStep(step.id);
                    }}
                    style={{
                      background: isCurrent ? "rgba(0, 140, 255, 0.12)" : isCompleted ? "rgba(16, 185, 129, 0.08)" : "#071326",
                      border: `1px solid ${isCurrent ? "#00d9ff" : isCompleted ? "#10b981" : "#1a3459"}`,
                      borderRadius: "10px",
                      padding: "12px 14px",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      cursor: isLocked ? "not-allowed" : "pointer",
                      opacity: isLocked ? 0.5 : 1,
                      transition: "all 0.2s ease"
                    }}
                  >
                    <div style={{
                      width: "30px",
                      height: "30px",
                      borderRadius: "50%",
                      background: isCompleted ? "#10b981" : isCurrent ? "#008cff" : "#1e293b",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "700",
                      fontSize: "12px",
                      flexShrink: 0
                    }}>
                      {isCompleted ? <Check size={15} /> : isLocked ? <Lock size={13} /> : step.id}
                    </div>
                    <div>
                      <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.5px", color: isCurrent ? "#00d9ff" : isCompleted ? "#34d399" : "#64748b", fontWeight: "700" }}>
                        Step {step.id}
                      </div>
                      <div style={{ fontSize: "12px", fontWeight: "700", color: isCurrent ? "#ffffff" : isCompleted ? "#e2ecff" : "#94a3b8" }}>
                        {step.title}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 1: Mobile Number OTP Verification */}
          {activeStep === 1 && (
            <div className="table-card" style={{ padding: "28px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "22px", flexWrap: "wrap", gap: "12px" }}>
                <div>
                  <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#ffffff", display: "flex", alignItems: "center", gap: "10px" }}>
                    <Smartphone size={22} color="#00d9ff" /> Step 1: Mobile KYC Verification (SMS OTP)
                  </h3>
                  <p style={{ fontSize: "13px", color: "#7a90b3", marginTop: "4px" }}>
                    Authenticate your mobile number to begin the Know Your Customer (KYC) onboarding.
                  </p>
                </div>

                {isMobileVerified ? (
                  <span style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "rgba(16, 185, 129, 0.15)",
                    color: "#34d399",
                    border: "1px solid #10b981",
                    padding: "8px 18px",
                    borderRadius: "20px",
                    fontSize: "13px",
                    fontWeight: "700"
                  }}>
                    <CheckCircle2 size={16} /> Mobile Verified
                  </span>
                ) : (
                  <span style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "rgba(245, 158, 11, 0.15)",
                    color: "#fbbf24",
                    border: "1px solid #d97706",
                    padding: "8px 18px",
                    borderRadius: "20px",
                    fontSize: "13px",
                    fontWeight: "700"
                  }}>
                    <AlertTriangle size={16} /> Verification Required
                  </span>
                )}
              </div>

              {isMobileVerified ? (
                /* Verified state */
                <div style={{
                  background: "linear-gradient(135deg, rgba(6, 61, 32, 0.6), rgba(10, 41, 22, 0.6))",
                  border: "1px solid #10b981",
                  borderRadius: "12px",
                  padding: "24px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "16px"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <div style={{ width: "46px", height: "46px", borderRadius: "12px", background: "rgba(16, 185, 129, 0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <CheckCircle2 size={26} color="#34d399" />
                    </div>
                    <div>
                      <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", color: "#34d399", fontWeight: "700" }}>
                        Mobile Authentication Complete
                      </div>
                      <div style={{ fontSize: "18px", fontWeight: "800", color: "#ffffff", marginTop: "2px" }}>
                        +91 {newPhoneNumber || statusData?.user?.phone || "9981280069"}
                      </div>
                      <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>
                        Verified via secure SMS OTP. Step 2 Personal Details is unlocked.
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveStep(2)}
                    style={{
                      background: "linear-gradient(90deg, #087cff, #00d9ff)",
                      color: "#ffffff",
                      border: "none",
                      padding: "12px 24px",
                      borderRadius: "8px",
                      fontWeight: "700",
                      fontSize: "14px",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      boxShadow: "0 4px 14px rgba(0, 140, 255, 0.4)"
                    }}
                  >
                    Proceed to Step 2: Personal Details <ArrowRight size={16} />
                  </button>
                </div>
              ) : (
                /* Unverified state: Dedicated Mobile KYC Form */
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  
                  {/* Form Section 1: Mobile Number Input & Send Button */}
                  <div style={{
                    background: "#08152b",
                    border: "1px solid #1a3459",
                    borderRadius: "12px",
                    padding: "24px"
                  }}>
                    <label style={{ fontSize: "13px", fontWeight: "700", color: "#e2ecff", display: "block", marginBottom: "8px" }}>
                      Registered Mobile Number for KYC Authentication:
                    </label>
                    <p style={{ fontSize: "12px", color: "#7a90b3", marginBottom: "16px" }}>
                      A 6-digit one-time password (OTP) will be dispatched directly to your mobile device via SMS.
                    </p>

                    <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                      {/* Phone input with country prefix */}
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        background: "#061224",
                        border: "1px solid #1c3257",
                        borderRadius: "8px",
                        padding: "4px 12px",
                        flex: "1",
                        minWidth: "260px",
                        maxWidth: "420px"
                      }}>
                        <span style={{ fontSize: "14px", fontWeight: "700", color: "#00d9ff", paddingRight: "10px", borderRight: "1px solid #142847" }}>
                          +91
                        </span>
                        <input
                          type="text"
                          maxLength={10}
                          placeholder="9981280069"
                          value={newPhoneNumber}
                          disabled={otpSent && cooldown > 0}
                          onChange={(e) => setNewPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#ffffff",
                            padding: "10px 12px",
                            fontSize: "16px",
                            fontWeight: "700",
                            letterSpacing: "1px",
                            outline: "none",
                            width: "100%",
                            cursor: (otpSent && cooldown > 0) ? "not-allowed" : "text"
                          }}
                        />
                        {otpSent && cooldown > 0 && (
                          <button
                            type="button"
                            onClick={() => { setOtpSent(false); setCooldown(0); }}
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "#38bdf8",
                              fontSize: "12px",
                              fontWeight: "600",
                              cursor: "pointer",
                              whiteSpace: "nowrap"
                            }}
                          >
                            Change
                          </button>
                        )}
                      </div>

                      {/* Send / Resend Button */}
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={sendingOtp || cooldown > 0 || newPhoneNumber.replace(/\D/g, "").length !== 10}
                        style={{
                          background: (cooldown > 0 || newPhoneNumber.replace(/\D/g, "").length !== 10) ? "#1e293b" : "linear-gradient(90deg, #087cff, #00d9ff)",
                          color: "#ffffff",
                          border: "none",
                          padding: "13px 28px",
                          borderRadius: "8px",
                          fontWeight: "700",
                          fontSize: "14px",
                          cursor: (sendingOtp || cooldown > 0 || newPhoneNumber.replace(/\D/g, "").length !== 10) ? "not-allowed" : "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "8px",
                          boxShadow: cooldown > 0 ? "none" : "0 4px 14px rgba(0, 140, 255, 0.4)"
                        }}
                      >
                        <Send size={16} />
                        {sendingOtp ? "Sending SMS OTP..." : cooldown > 0 ? `Resend in ${cooldown}s` : (otpSent ? "Resend SMS OTP" : "Send SMS OTP")}
                      </button>
                    </div>
                  </div>

                  {/* Form Section 2: 6-Digit OTP Entry Form */}
                  {otpSent && (
                    <form onSubmit={handleVerifyOtp} style={{
                      background: "linear-gradient(135deg, rgba(8, 21, 43, 0.95), rgba(6, 18, 36, 0.95))",
                      border: "1px solid #00d9ff",
                      borderRadius: "12px",
                      padding: "26px",
                      boxShadow: "0 8px 24px rgba(0, 140, 255, 0.2)"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
                        <div>
                          <h4 style={{ fontSize: "16px", fontWeight: "800", color: "#ffffff", display: "flex", alignItems: "center", gap: "8px" }}>
                            <Lock size={16} color="#00d9ff" /> Enter 6-Digit SMS Verification Code
                          </h4>
                          <p style={{ fontSize: "13px", color: "#94a3b8", marginTop: "2px" }}>
                            Enter the 6-digit code dispatched via SMS to <strong>+91 {newPhoneNumber.slice(-10)}</strong>.
                          </p>
                        </div>

                        <div style={{
                          background: otpExpirySeconds < 60 ? "rgba(239, 68, 68, 0.15)" : "rgba(56, 189, 248, 0.15)",
                          border: `1px solid ${otpExpirySeconds < 60 ? "#ef4444" : "#0284c7"}`,
                          color: otpExpirySeconds < 60 ? "#f87171" : "#38bdf8",
                          padding: "6px 14px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: "700",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px"
                        }}>
                          <Clock size={13} /> Expires in: <strong>{formatTimer(otpExpirySeconds)}</strong>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: "14px", alignItems: "center", flexWrap: "wrap" }}>
                        <input
                          type="text"
                          autoFocus
                          maxLength={6}
                          placeholder="• • • • • •"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          style={{
                            background: "#061224",
                            border: "2px solid #00d9ff",
                            color: "#ffffff",
                            fontSize: "24px",
                            fontWeight: "800",
                            letterSpacing: "12px",
                            textAlign: "center",
                            padding: "12px 20px",
                            borderRadius: "8px",
                            width: "220px",
                            outline: "none",
                            boxShadow: "0 0 12px rgba(0, 217, 255, 0.3)"
                          }}
                        />

                        <button
                          type="submit"
                          disabled={verifyingOtp || otpCode.length !== 6}
                          style={{
                            background: otpCode.length === 6 ? "linear-gradient(90deg, #10b981, #059669)" : "#1e293b",
                            color: "#ffffff",
                            border: "none",
                            padding: "14px 28px",
                            borderRadius: "8px",
                            fontWeight: "700",
                            fontSize: "14px",
                            cursor: (verifyingOtp || otpCode.length !== 6) ? "not-allowed" : "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                            boxShadow: otpCode.length === 6 ? "0 4px 14px rgba(16, 185, 129, 0.4)" : "none"
                          }}
                        >
                          <CheckCircle2 size={18} />
                          {verifyingOtp ? "Verifying Code..." : "Verify Mobile & Complete Step 1"}
                        </button>

                        <button
                          type="button"
                          onClick={handleSendOtp}
                          disabled={cooldown > 0 || sendingOtp}
                          className="refresh-btn"
                          style={{
                            padding: "12px 18px",
                            fontSize: "13px",
                            opacity: cooldown > 0 ? 0.5 : 1,
                            cursor: cooldown > 0 ? "not-allowed" : "pointer"
                          }}
                        >
                          {cooldown > 0 ? `Resend OTP in ${cooldown}s` : "Resend SMS OTP"}
                        </button>
                      </div>

                      {otpError && (
                        <div style={{
                          marginTop: "14px",
                          padding: "10px 14px",
                          borderRadius: "6px",
                          background: "rgba(239, 68, 68, 0.15)",
                          border: "1px solid #ef4444",
                          color: "#f87171",
                          fontSize: "13px",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px"
                        }}>
                          <AlertTriangle size={15} />
                          <span>{otpError}</span>
                        </div>
                      )}
                    </form>
                  )}

                </div>
              )}
            </div>
          )}

          {/* Step 2: Personal Information Form */}
          {activeStep === 2 && (
            <div className="table-card" style={{ padding: "28px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", flexWrap: "wrap", gap: "10px" }}>
                <div>
                  <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#ffffff", display: "flex", alignItems: "center", gap: "10px" }}>
                    <User size={20} color="#087cff" /> Step 2: Personal Demographic Details
                  </h3>
                  <p style={{ fontSize: "13px", color: "#7a90b3", marginTop: "2px" }}>
                    Saved directly to your database profile records for regulatory compliance.
                  </p>
                </div>
                <span style={{ fontSize: "12px", color: "#38bdf8", fontWeight: "700" }}>Step 2 of 4</span>
              </div>

              <form onSubmit={handleSavePersonal} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
                  <div>
                    <label style={{ fontSize: "12px", color: "#cbd5e1", display: "block", marginBottom: "6px", fontWeight: "600" }}>
                      Full Legal Name (as on ID) <span style={{ color: "#f87171" }}>*</span>:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Manshi Gupta"
                      value={personalData.fullName}
                      onChange={(e) => setPersonalData({ ...personalData, fullName: e.target.value })}
                      style={{
                        width: "100%",
                        background: "#08152b",
                        border: `1px solid ${personalErrors.fullName ? "#ef4444" : "#1c3257"}`,
                        color: "#ffffff",
                        padding: "10px 14px",
                        borderRadius: "6px",
                        fontSize: "13px"
                      }}
                    />
                    {personalErrors.fullName && <span style={{ color: "#f87171", fontSize: "11px", marginTop: "4px", display: "block" }}>{personalErrors.fullName}</span>}
                  </div>

                  <div>
                    <label style={{ fontSize: "12px", color: "#cbd5e1", display: "block", marginBottom: "6px", fontWeight: "600" }}>
                      Date of Birth <span style={{ color: "#f87171" }}>*</span>:
                    </label>
                    <input
                      type="date"
                      required
                      value={personalData.dateOfBirth}
                      onChange={(e) => setPersonalData({ ...personalData, dateOfBirth: e.target.value })}
                      style={{
                        width: "100%",
                        background: "#08152b",
                        border: `1px solid ${personalErrors.dateOfBirth ? "#ef4444" : "#1c3257"}`,
                        color: "#ffffff",
                        padding: "10px 14px",
                        borderRadius: "6px",
                        fontSize: "13px"
                      }}
                    />
                    {personalErrors.dateOfBirth && <span style={{ color: "#f87171", fontSize: "11px", marginTop: "4px", display: "block" }}>{personalErrors.dateOfBirth}</span>}
                  </div>

                  <div>
                    <label style={{ fontSize: "12px", color: "#cbd5e1", display: "block", marginBottom: "6px", fontWeight: "600" }}>
                      Gender <span style={{ color: "#f87171" }}>*</span>:
                    </label>
                    <select
                      value={personalData.gender}
                      onChange={(e) => setPersonalData({ ...personalData, gender: e.target.value })}
                      style={{
                        width: "100%",
                        background: "#08152b",
                        border: "1px solid #1c3257",
                        color: "#ffffff",
                        padding: "10px 14px",
                        borderRadius: "6px",
                        fontSize: "13px"
                      }}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: "12px", color: "#cbd5e1", display: "block", marginBottom: "6px", fontWeight: "600" }}>
                      Father's / Spouse Name:
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Ramesh Gupta"
                      value={personalData.fatherName}
                      onChange={(e) => setPersonalData({ ...personalData, fatherName: e.target.value })}
                      style={{
                        width: "100%",
                        background: "#08152b",
                        border: "1px solid #1c3257",
                        color: "#ffffff",
                        padding: "10px 14px",
                        borderRadius: "6px",
                        fontSize: "13px"
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={{ fontSize: "12px", color: "#cbd5e1", display: "block", marginBottom: "6px", fontWeight: "600" }}>
                      Residential Address <span style={{ color: "#f87171" }}>*</span>:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Flat/House No., Street, Landmark"
                      value={personalData.address}
                      onChange={(e) => setPersonalData({ ...personalData, address: e.target.value })}
                      style={{
                        width: "100%",
                        background: "#08152b",
                        border: `1px solid ${personalErrors.address ? "#ef4444" : "#1c3257"}`,
                        color: "#ffffff",
                        padding: "10px 14px",
                        borderRadius: "6px",
                        fontSize: "13px"
                      }}
                    />
                    {personalErrors.address && <span style={{ color: "#f87171", fontSize: "11px", marginTop: "4px", display: "block" }}>{personalErrors.address}</span>}
                  </div>

                  <div>
                    <label style={{ fontSize: "12px", color: "#cbd5e1", display: "block", marginBottom: "6px", fontWeight: "600" }}>
                      City <span style={{ color: "#f87171" }}>*</span>:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Indore"
                      value={personalData.city}
                      onChange={(e) => setPersonalData({ ...personalData, city: e.target.value })}
                      style={{
                        width: "100%",
                        background: "#08152b",
                        border: `1px solid ${personalErrors.city ? "#ef4444" : "#1c3257"}`,
                        color: "#ffffff",
                        padding: "10px 14px",
                        borderRadius: "6px",
                        fontSize: "13px"
                      }}
                    />
                    {personalErrors.city && <span style={{ color: "#f87171", fontSize: "11px", marginTop: "4px", display: "block" }}>{personalErrors.city}</span>}
                  </div>

                  <div>
                    <label style={{ fontSize: "12px", color: "#cbd5e1", display: "block", marginBottom: "6px", fontWeight: "600" }}>
                      State <span style={{ color: "#f87171" }}>*</span>:
                    </label>
                    <select
                      value={personalData.state}
                      onChange={(e) => setPersonalData({ ...personalData, state: e.target.value })}
                      style={{
                        width: "100%",
                        background: "#08152b",
                        border: "1px solid #1c3257",
                        color: "#ffffff",
                        padding: "10px 14px",
                        borderRadius: "6px",
                        fontSize: "13px"
                      }}
                    >
                      {indianStates.map(st => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: "12px", color: "#cbd5e1", display: "block", marginBottom: "6px", fontWeight: "600" }}>
                      PIN Code (6 digits) <span style={{ color: "#f87171" }}>*</span>:
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="452001"
                      value={personalData.postalCode}
                      onChange={(e) => setPersonalData({ ...personalData, postalCode: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                      style={{
                        width: "100%",
                        background: "#08152b",
                        border: `1px solid ${personalErrors.postalCode ? "#ef4444" : "#1c3257"}`,
                        color: "#ffffff",
                        padding: "10px 14px",
                        borderRadius: "6px",
                        fontSize: "13px",
                        letterSpacing: "1px"
                      }}
                    />
                    {personalErrors.postalCode && <span style={{ color: "#f87171", fontSize: "11px", marginTop: "4px", display: "block" }}>{personalErrors.postalCode}</span>}
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px" }}>
                  <button
                    type="button"
                    onClick={() => setActiveStep(1)}
                    className="refresh-btn"
                    style={{ padding: "10px 18px", fontSize: "13px" }}
                  >
                    <ArrowLeft size={14} /> Back to Step 1
                  </button>

                  <button
                    type="submit"
                    disabled={savingPersonal}
                    style={{
                      background: "linear-gradient(90deg, #087cff, #00d9ff)",
                      color: "#ffffff",
                      border: "none",
                      padding: "12px 28px",
                      borderRadius: "8px",
                      fontWeight: "700",
                      fontSize: "14px",
                      cursor: savingPersonal ? "not-allowed" : "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      boxShadow: "0 4px 14px rgba(0, 140, 255, 0.4)"
                    }}
                  >
                    {savingPersonal ? "Saving to Database..." : "Save & Continue to Step 3"} <ArrowRight size={15} />
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Step 3: Document Upload Form */}
          {activeStep === 3 && (
            <div className="table-card" style={{ padding: "28px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", flexWrap: "wrap", gap: "10px" }}>
                <div>
                  <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#ffffff", display: "flex", alignItems: "center", gap: "10px" }}>
                    <FileText size={20} color="#087cff" /> Step 3: Government Document Verification
                  </h3>
                  <p style={{ fontSize: "13px", color: "#7a90b3", marginTop: "2px" }}>
                    Provide PAN & Aadhaar details with original photograph or PDF proofs.
                  </p>
                </div>
                <span style={{ fontSize: "12px", color: "#38bdf8", fontWeight: "700" }}>Step 3 of 4</span>
              </div>

              <form onSubmit={handleProceedToReview} style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
                <div style={{ background: "#08152b", border: "1px solid #1a3459", borderRadius: "10px", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                  <div>
                    <span style={{ fontSize: "14px", fontWeight: "700", color: "#ffffff" }}>Select KYC Tier:</span>
                    <span style={{ fontSize: "12px", color: "#7a90b3", display: "block" }}>Full KYC provides unlimited monthly transfer volume and RBI escrow protection</span>
                  </div>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      type="button"
                      onClick={() => setKycType("Full KYC")}
                      style={{
                        background: kycType === "Full KYC" ? "#008cff" : "#112644",
                        color: "#ffffff",
                        border: "none",
                        padding: "8px 18px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: "700",
                        cursor: "pointer"
                      }}
                    >
                      Full KYC (Recommended)
                    </button>
                    <button
                      type="button"
                      onClick={() => setKycType("Minimum KYC")}
                      style={{
                        background: kycType === "Minimum KYC" ? "#008cff" : "#112644",
                        color: "#ffffff",
                        border: "none",
                        padding: "8px 18px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: "600",
                        cursor: "pointer"
                      }}
                    >
                      Minimum KYC
                    </button>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" }}>
                  <div>
                    <label style={{ fontSize: "12px", color: "#cbd5e1", display: "block", marginBottom: "6px", fontWeight: "600" }}>
                      PAN Card Number (10 alphanumeric digits) <span style={{ color: "#f87171" }}>*</span>:
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={10}
                      placeholder="ABCDE1234F"
                      value={panNumber}
                      onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                      style={{
                        width: "100%",
                        background: "#08152b",
                        border: `1px solid ${docErrors.panNumber ? "#ef4444" : "#1c3257"}`,
                        color: "#ffffff",
                        padding: "10px 14px",
                        borderRadius: "6px",
                        fontSize: "14px",
                        fontWeight: "800",
                        letterSpacing: "2px"
                      }}
                    />
                    {docErrors.panNumber && <span style={{ color: "#f87171", fontSize: "11px", marginTop: "4px", display: "block" }}>{docErrors.panNumber}</span>}
                  </div>

                  <div>
                    <label style={{ fontSize: "12px", color: "#cbd5e1", display: "block", marginBottom: "6px", fontWeight: "600" }}>
                      Aadhaar Card Number (12 digits) {kycType === "Full KYC" && <span style={{ color: "#f87171" }}>*</span>}:
                    </label>
                    <input
                      type="text"
                      maxLength={14}
                      placeholder="5541 2233 9988"
                      value={aadhaarNumber}
                      onChange={(e) => {
                        const clean = e.target.value.replace(/\D/g, "").slice(0, 12);
                        const formatted = clean.replace(/(\d{4})(?=\d)/g, "$1 ");
                        setAadhaarNumber(formatted);
                      }}
                      style={{
                        width: "100%",
                        background: "#08152b",
                        border: `1px solid ${docErrors.aadhaarNumber ? "#ef4444" : "#1c3257"}`,
                        color: "#ffffff",
                        padding: "10px 14px",
                        borderRadius: "6px",
                        fontSize: "14px",
                        letterSpacing: "2px"
                      }}
                    />
                    {docErrors.aadhaarNumber && <span style={{ color: "#f87171", fontSize: "11px", marginTop: "4px", display: "block" }}>{docErrors.aadhaarNumber}</span>}
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: "13px", fontWeight: "700", color: "#38bdf8", marginBottom: "12px" }}>
                    Upload Government ID Proofs (JPG, PNG or PDF · Max 5MB each)
                  </h4>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
                    {/* PAN Card Upload */}
                    <div style={{ background: "#08152b", border: `1px dashed ${docErrors.panDoc ? "#ef4444" : "#1e3a66"}`, borderRadius: "8px", padding: "16px", textAlign: "center" }}>
                      <div style={{ fontSize: "13px", fontWeight: "700", color: "#ffffff", marginBottom: "6px" }}>
                        PAN Card (Front) <span style={{ color: "#f87171" }}>*</span>
                      </div>
                      {panDocPreview ? (
                        <div>
                          <img src={panDocPreview} alt="PAN Preview" style={{ width: "100%", height: "130px", objectFit: "cover", borderRadius: "6px", marginBottom: "8px" }} />
                          <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "6px" }}>{panDocName || "pan_card.jpg"}</div>
                          <button type="button" onClick={() => { setPanDocPreview(null); setPanDocName(""); }} style={{ color: "#f87171", background: "transparent", border: "none", fontSize: "12px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            <Trash2 size={12} /> Remove
                          </button>
                        </div>
                      ) : (
                        <div>
                          <Upload size={24} color="#60a5fa" style={{ margin: "10px auto" }} />
                          <div style={{ fontSize: "12px", color: "#7a90b3", marginBottom: "8px" }}>Clear photo of PAN Card front</div>
                          <label style={{ background: "#112644", color: "#60a5fa", padding: "8px 14px", borderRadius: "4px", fontSize: "12px", fontWeight: "600", cursor: "pointer", display: "inline-block" }}>
                            Select File
                            <input type="file" accept="image/*,application/pdf" style={{ display: "none" }} onChange={(e) => handleFileSelect(e, setPanDocPreview, setPanDocName, "panDoc")} />
                          </label>
                        </div>
                      )}
                      {docErrors.panDoc && <span style={{ color: "#f87171", fontSize: "11px", marginTop: "4px", display: "block" }}>{docErrors.panDoc}</span>}
                    </div>

                    {/* Aadhaar Front */}
                    <div style={{ background: "#08152b", border: `1px dashed ${docErrors.aadhaarFront ? "#ef4444" : "#1e3a66"}`, borderRadius: "8px", padding: "16px", textAlign: "center" }}>
                      <div style={{ fontSize: "13px", fontWeight: "700", color: "#ffffff", marginBottom: "6px" }}>
                        Aadhaar Card (Front) {kycType === "Full KYC" && <span style={{ color: "#f87171" }}>*</span>}
                      </div>
                      {aadhaarFrontPreview ? (
                        <div>
                          <img src={aadhaarFrontPreview} alt="Aadhaar Front Preview" style={{ width: "100%", height: "130px", objectFit: "cover", borderRadius: "6px", marginBottom: "8px" }} />
                          <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "6px" }}>{aadhaarFrontName || "aadhaar_front.jpg"}</div>
                          <button type="button" onClick={() => { setAadhaarFrontPreview(null); setAadhaarFrontName(""); }} style={{ color: "#f87171", background: "transparent", border: "none", fontSize: "12px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            <Trash2 size={12} /> Remove
                          </button>
                        </div>
                      ) : (
                        <div>
                          <Upload size={24} color="#60a5fa" style={{ margin: "10px auto" }} />
                          <div style={{ fontSize: "12px", color: "#7a90b3", marginBottom: "8px" }}>Photo with name and DOB</div>
                          <label style={{ background: "#112644", color: "#60a5fa", padding: "8px 14px", borderRadius: "4px", fontSize: "12px", fontWeight: "600", cursor: "pointer", display: "inline-block" }}>
                            Select File
                            <input type="file" accept="image/*,application/pdf" style={{ display: "none" }} onChange={(e) => handleFileSelect(e, setAadhaarFrontPreview, setAadhaarFrontName, "aadhaarFront")} />
                          </label>
                        </div>
                      )}
                      {docErrors.aadhaarFront && <span style={{ color: "#f87171", fontSize: "11px", marginTop: "4px", display: "block" }}>{docErrors.aadhaarFront}</span>}
                    </div>

                    {/* Aadhaar Back */}
                    <div style={{ background: "#08152b", border: `1px dashed ${docErrors.aadhaarBack ? "#ef4444" : "#1e3a66"}`, borderRadius: "8px", padding: "16px", textAlign: "center" }}>
                      <div style={{ fontSize: "13px", fontWeight: "700", color: "#ffffff", marginBottom: "6px" }}>
                        Aadhaar Card (Back / Address) {kycType === "Full KYC" && <span style={{ color: "#f87171" }}>*</span>}
                      </div>
                      {aadhaarBackPreview ? (
                        <div>
                          <img src={aadhaarBackPreview} alt="Aadhaar Back Preview" style={{ width: "100%", height: "130px", objectFit: "cover", borderRadius: "6px", marginBottom: "8px" }} />
                          <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "6px" }}>{aadhaarBackName || "aadhaar_back.jpg"}</div>
                          <button type="button" onClick={() => { setAadhaarBackPreview(null); setAadhaarBackName(""); }} style={{ color: "#f87171", background: "transparent", border: "none", fontSize: "12px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            <Trash2 size={12} /> Remove
                          </button>
                        </div>
                      ) : (
                        <div>
                          <Upload size={24} color="#60a5fa" style={{ margin: "10px auto" }} />
                          <div style={{ fontSize: "12px", color: "#7a90b3", marginBottom: "8px" }}>Address section clearly readable</div>
                          <label style={{ background: "#112644", color: "#60a5fa", padding: "8px 14px", borderRadius: "4px", fontSize: "12px", fontWeight: "600", cursor: "pointer", display: "inline-block" }}>
                            Select File
                            <input type="file" accept="image/*,application/pdf" style={{ display: "none" }} onChange={(e) => handleFileSelect(e, setAadhaarBackPreview, setAadhaarBackName, "aadhaarBack")} />
                          </label>
                        </div>
                      )}
                      {docErrors.aadhaarBack && <span style={{ color: "#f87171", fontSize: "11px", marginTop: "4px", display: "block" }}>{docErrors.aadhaarBack}</span>}
                    </div>

                    {/* Supporting Proof */}
                    <div style={{ background: "#08152b", border: "1px dashed #1e3a66", borderRadius: "8px", padding: "16px", textAlign: "center" }}>
                      <div style={{ fontSize: "13px", fontWeight: "700", color: "#ffffff", marginBottom: "6px" }}>
                        Optional Proof ({supportingDocType})
                      </div>
                      {supportingDocPreview ? (
                        <div>
                          <img src={supportingDocPreview} alt="Supporting Proof Preview" style={{ width: "100%", height: "130px", objectFit: "cover", borderRadius: "6px", marginBottom: "8px" }} />
                          <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "6px" }}>{supportingDocName || "supporting_doc.jpg"}</div>
                          <button type="button" onClick={() => { setSupportingDocPreview(null); setSupportingDocName(""); }} style={{ color: "#f87171", background: "transparent", border: "none", fontSize: "12px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            <Trash2 size={12} /> Remove
                          </button>
                        </div>
                      ) : (
                        <div>
                          <select value={supportingDocType} onChange={(e) => setSupportingDocType(e.target.value)} style={{ background: "#061224", border: "1px solid #142847", color: "#94a3b8", padding: "4px 8px", borderRadius: "4px", fontSize: "11px", marginBottom: "8px" }}>
                            <option value="Voter ID">Voter ID</option>
                            <option value="Passport">Passport</option>
                            <option value="Driving License">Driving License</option>
                            <option value="Utility Bill">Utility Bill</option>
                          </select>
                          <Upload size={20} color="#60a5fa" style={{ margin: "4px auto 6px" }} />
                          <label style={{ background: "#112644", color: "#60a5fa", padding: "6px 12px", borderRadius: "4px", fontSize: "11px", fontWeight: "600", cursor: "pointer", display: "inline-block" }}>
                            Select File
                            <input type="file" accept="image/*,application/pdf" style={{ display: "none" }} onChange={(e) => handleFileSelect(e, setSupportingDocPreview, setSupportingDocName, "supportingDoc")} />
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px" }}>
                  <button type="button" onClick={() => setActiveStep(2)} className="refresh-btn" style={{ padding: "10px 18px", fontSize: "13px" }}>
                    <ArrowLeft size={14} /> Back to Personal Details
                  </button>
                  <button type="submit" style={{ background: "linear-gradient(90deg, #087cff, #00d9ff)", color: "#ffffff", border: "none", padding: "12px 28px", borderRadius: "8px", fontWeight: "700", fontSize: "14px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px", boxShadow: "0 4px 14px rgba(0, 140, 255, 0.4)" }}>
                    Proceed to Final Review <ArrowRight size={15} />
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Step 4: Final Review & Submission Form */}
          {activeStep === 4 && (
            <div className="table-card" style={{ padding: "28px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", flexWrap: "wrap", gap: "10px" }}>
                <div>
                  <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#ffffff", display: "flex", alignItems: "center", gap: "10px" }}>
                    <CheckCircle2 size={20} color="#087cff" /> Step 4: Final KYC Review & Legal Declaration
                  </h3>
                  <p style={{ fontSize: "13px", color: "#7a90b3", marginTop: "2px" }}>
                    Review all provided details and documents carefully before final submission to compliance.
                  </p>
                </div>
                <span style={{ fontSize: "12px", color: "#38bdf8", fontWeight: "700" }}>Step 4 of 4</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div style={{ background: "#08152b", border: "1px solid #132a4a", borderRadius: "10px", padding: "18px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <Smartphone size={18} color="#10b981" />
                      <span style={{ fontSize: "14px", fontWeight: "700", color: "#ffffff" }}>Authenticated Mobile Number</span>
                    </div>
                    <span style={{ background: "#063d20", color: "#34d399", padding: "4px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "700", display: "flex", alignItems: "center", gap: "4px" }}>
                      <Check size={12} /> SMS OTP Verified
                    </span>
                  </div>
                  <div style={{ marginTop: "8px", fontSize: "16px", fontWeight: "800", color: "#e2ecff", letterSpacing: "0.5px" }}>
                    +91 {newPhoneNumber || statusData?.user?.phone || "9981280069"}
                  </div>
                </div>

                <div style={{ background: "#08152b", border: "1px solid #132a4a", borderRadius: "10px", padding: "18px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <User size={18} color="#00d9ff" />
                      <span style={{ fontSize: "14px", fontWeight: "700", color: "#ffffff" }}>Personal Information</span>
                    </div>
                    <button type="button" onClick={() => setActiveStep(2)} style={{ background: "transparent", border: "none", color: "#38bdf8", fontSize: "12px", fontWeight: "600", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <Edit3 size={13} /> Edit Details
                    </button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", fontSize: "13px" }}>
                    <div>
                      <span style={{ color: "#7a90b3", fontSize: "11px", textTransform: "uppercase" }}>Legal Name:</span>
                      <div style={{ color: "#ffffff", fontWeight: "700", marginTop: "2px" }}>{personalData.fullName || "—"}</div>
                    </div>
                    <div>
                      <span style={{ color: "#7a90b3", fontSize: "11px", textTransform: "uppercase" }}>Date of Birth:</span>
                      <div style={{ color: "#ffffff", fontWeight: "700", marginTop: "2px" }}>{personalData.dateOfBirth || "—"}</div>
                    </div>
                    <div>
                      <span style={{ color: "#7a90b3", fontSize: "11px", textTransform: "uppercase" }}>Gender:</span>
                      <div style={{ color: "#ffffff", fontWeight: "700", marginTop: "2px" }}>{personalData.gender || "—"}</div>
                    </div>
                    <div>
                      <span style={{ color: "#7a90b3", fontSize: "11px", textTransform: "uppercase" }}>Father's/Spouse Name:</span>
                      <div style={{ color: "#ffffff", fontWeight: "700", marginTop: "2px" }}>{personalData.fatherName || "—"}</div>
                    </div>
                    <div style={{ gridColumn: "1 / -1" }}>
                      <span style={{ color: "#7a90b3", fontSize: "11px", textTransform: "uppercase" }}>Address:</span>
                      <div style={{ color: "#ffffff", fontWeight: "600", marginTop: "2px" }}>
                        {personalData.address ? `${personalData.address}, ${personalData.city}, ${personalData.state} - ${personalData.postalCode}` : "—"}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ background: "#08152b", border: "1px solid #132a4a", borderRadius: "10px", padding: "18px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <FileText size={18} color="#00d9ff" />
                      <span style={{ fontSize: "14px", fontWeight: "700", color: "#ffffff" }}>Uploaded Documents ({kycType})</span>
                    </div>
                    <button type="button" onClick={() => setActiveStep(3)} style={{ background: "transparent", border: "none", color: "#38bdf8", fontSize: "12px", fontWeight: "600", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <Edit3 size={13} /> Edit Documents
                    </button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px", marginBottom: "16px" }}>
                    <div>
                      <span style={{ color: "#7a90b3", fontSize: "11px", textTransform: "uppercase" }}>PAN Number:</span>
                      <div style={{ color: "#38bdf8", fontWeight: "800", letterSpacing: "1px", marginTop: "2px" }}>
                        {panNumber || (statusData?.kyc?.pan_verification_status === "Verified" ? "ABCDE****F" : "Pending")}
                      </div>
                    </div>
                    <div>
                      <span style={{ color: "#7a90b3", fontSize: "11px", textTransform: "uppercase" }}>Aadhaar Number:</span>
                      <div style={{ color: "#38bdf8", fontWeight: "800", letterSpacing: "1px", marginTop: "2px" }}>
                        {aadhaarNumber || (statusData?.kyc?.aadhaar_verification_status === "Verified" ? "XXXX XXXX 9988" : "Not Provided")}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
                    {panDocPreview && (
                      <div style={{ border: "1px solid #1e3a66", borderRadius: "8px", padding: "8px", textAlign: "center", width: "130px" }}>
                        <img src={panDocPreview} alt="PAN Preview" style={{ width: "100%", height: "80px", objectFit: "cover", borderRadius: "4px" }} />
                        <span style={{ fontSize: "10px", color: "#94a3b8", display: "block", marginTop: "4px" }}>PAN Card</span>
                      </div>
                    )}
                    {aadhaarFrontPreview && (
                      <div style={{ border: "1px solid #1e3a66", borderRadius: "8px", padding: "8px", textAlign: "center", width: "130px" }}>
                        <img src={aadhaarFrontPreview} alt="Aadhaar Front" style={{ width: "100%", height: "80px", objectFit: "cover", borderRadius: "4px" }} />
                        <span style={{ fontSize: "10px", color: "#94a3b8", display: "block", marginTop: "4px" }}>Aadhaar Front</span>
                      </div>
                    )}
                    {aadhaarBackPreview && (
                      <div style={{ border: "1px solid #1e3a66", borderRadius: "8px", padding: "8px", textAlign: "center", width: "130px" }}>
                        <img src={aadhaarBackPreview} alt="Aadhaar Back" style={{ width: "100%", height: "80px", objectFit: "cover", borderRadius: "4px" }} />
                        <span style={{ fontSize: "10px", color: "#94a3b8", display: "block", marginTop: "4px" }}>Aadhaar Back</span>
                      </div>
                    )}
                    {supportingDocPreview && (
                      <div style={{ border: "1px solid #1e3a66", borderRadius: "8px", padding: "8px", textAlign: "center", width: "130px" }}>
                        <img src={supportingDocPreview} alt="Supporting Doc" style={{ width: "100%", height: "80px", objectFit: "cover", borderRadius: "4px" }} />
                        <span style={{ fontSize: "10px", color: "#94a3b8", display: "block", marginTop: "4px" }}>{supportingDocType}</span>
                      </div>
                    )}
                  </div>
                </div>

                {(!isKycSubmitted && !isKycVerified) && (
                  <div style={{
                    background: "#08152b",
                    border: "1px solid #142847",
                    borderRadius: "8px",
                    padding: "16px 20px",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px"
                  }}>
                    <input
                      type="checkbox"
                      id="finalDeclaration"
                      checked={declarationAccepted}
                      onChange={(e) => setDeclarationAccepted(e.target.checked)}
                      style={{ marginTop: "3px", cursor: "pointer", width: "16px", height: "16px" }}
                    />
                    <label htmlFor="finalDeclaration" style={{ fontSize: "12px", color: "#cbd5e1", cursor: "pointer", lineHeight: "1.6" }}>
                      I hereby declare that the details, identity numbers, and document proofs furnished above belong to me and are true, complete, and correct. I authorize ApnaPay to verify these credentials against UIDAI, NSDL, and government databases in strict compliance with RBI KYC and Prevention of Money Laundering Act (PMLA) mandates.
                    </label>
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px" }}>
                  <button type="button" onClick={() => setActiveStep(3)} className="refresh-btn" style={{ padding: "10px 18px", fontSize: "13px" }}>
                    <ArrowLeft size={14} /> Back to Document Upload
                  </button>

                  {(!isKycSubmitted && !isKycVerified) ? (
                    <button
                      type="button"
                      onClick={handleSubmitKyc}
                      disabled={submittingKyc || !declarationAccepted}
                      style={{
                        background: declarationAccepted ? "linear-gradient(90deg, #087cff, #00d9ff)" : "#1e293b",
                        color: "#ffffff",
                        border: "none",
                        padding: "13px 32px",
                        borderRadius: "8px",
                        fontWeight: "700",
                        fontSize: "14px",
                        cursor: (!declarationAccepted || submittingKyc) ? "not-allowed" : "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        boxShadow: declarationAccepted ? "0 4px 16px rgba(0, 140, 255, 0.4)" : "none"
                      }}
                    >
                      <ShieldCheck size={18} />
                      {submittingKyc ? "Submitting Application to Database..." : "Submit KYC Application"}
                    </button>
                  ) : (
                    <div style={{ fontSize: "13px", color: "#34d399", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px" }}>
                      <CheckCircle2 size={16} /> KYC Application on File
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ======================================================== */}
      {/* TAB B: MY KYC APPLICATION RECORD (Matching Admin Details) */}
      {/* ======================================================== */}
      {activeTab === "record" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
          
          {/* Header Bar */}
          <div className="table-card" style={{ padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{ width: "50px", height: "50px", borderRadius: "12px", background: "rgba(0, 140, 255, 0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <ShieldCheck size={28} color="#00d9ff" />
                </div>
                <div>
                  <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", color: "#94a3b8", fontWeight: "700" }}>
                    Official Application Record
                  </div>
                  <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#ffffff", marginTop: "2px" }}>
                    Application {statusData?.kyc?.id ? `#KYC-${statusData.kyc.id}` : "Not Yet Generated"}
                  </h2>
                  <div style={{ fontSize: "12px", color: "#7a90b3", marginTop: "2px" }}>
                    User ID: <strong>#USR-{statusData?.user?.id || 7}</strong> · Submitted: {statusData?.kyc?.submission_date ? new Date(statusData.kyc.submission_date).toLocaleString("en-IN") : "Today"}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span className={`badge-pill ${isKycVerified ? "verified" : isKycRejected ? "rejected" : isResubmissionNeeded ? "under_review" : isKycSubmitted ? "pending" : "pending"}`} style={{ fontSize: "13px", padding: "8px 18px", borderRadius: "20px", fontWeight: "700" }}>
                  {isKycVerified ? "VERIFIED" : isKycRejected ? "REJECTED" : isResubmissionNeeded ? "RESUBMISSION REQUIRED" : isKycSubmitted ? "UNDER REVIEW" : "PENDING SUBMISSION"}
                </span>

                {(isKycRejected || isResubmissionNeeded) && (
                  <button
                    onClick={() => {
                      setActiveTab("wizard");
                      setActiveStep(2);
                      setIsEditingResubmission(true);
                    }}
                    style={{
                      background: "linear-gradient(90deg, #8b5cf6, #6d28d9)",
                      color: "#ffffff",
                      border: "none",
                      padding: "8px 18px",
                      borderRadius: "6px",
                      fontWeight: "700",
                      fontSize: "12px",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                  >
                    <Edit3 size={14} /> Update Application
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* User Information & Mobile Verification Details (Matching Admin KYCDetails) */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "18px" }}>
            
            {/* User Demographics Box */}
            <div className="table-card" style={{ padding: "22px" }}>
              <h4 style={{ fontSize: "15px", fontWeight: "700", color: "#ffffff", display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                <User size={18} color="#00d9ff" /> Customer Information
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #142847", paddingBottom: "8px" }}>
                  <span style={{ color: "#7a90b3" }}>Full Legal Name:</span>
                  <strong style={{ color: "#ffffff" }}>{statusData?.user?.full_name || personalData.fullName || "Manshi"}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #142847", paddingBottom: "8px" }}>
                  <span style={{ color: "#7a90b3" }}>User ID:</span>
                  <strong style={{ color: "#38bdf8" }}>#USR-{statusData?.user?.id || 7}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #142847", paddingBottom: "8px" }}>
                  <span style={{ color: "#7a90b3" }}>Email Address:</span>
                  <strong style={{ color: "#ffffff" }}>{statusData?.user?.email || "manshigupta2103@gmail.com"}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #142847", paddingBottom: "8px" }}>
                  <span style={{ color: "#7a90b3" }}>Date of Birth:</span>
                  <strong style={{ color: "#ffffff" }}>{personalData.dateOfBirth || "—"}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #142847", paddingBottom: "8px" }}>
                  <span style={{ color: "#7a90b3" }}>Gender:</span>
                  <strong style={{ color: "#ffffff" }}>{personalData.gender || "Male"}</strong>
                </div>
                <div>
                  <span style={{ color: "#7a90b3", display: "block", marginBottom: "4px" }}>Residential Address:</span>
                  <strong style={{ color: "#e2ecff", lineHeight: "1.5" }}>
                    {personalData.address ? `${personalData.address}, ${personalData.city}, ${personalData.state} - ${personalData.postalCode}` : "Indore, Madhya Pradesh"}
                  </strong>
                </div>
              </div>
            </div>

            {/* Mobile OTP & Government IDs Box */}
            <div className="table-card" style={{ padding: "22px" }}>
              <h4 style={{ fontSize: "15px", fontWeight: "700", color: "#ffffff", display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                <Smartphone size={18} color="#10b981" /> Mobile & Government ID Credentials
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #142847", paddingBottom: "8px" }}>
                  <span style={{ color: "#7a90b3" }}>Registered Mobile:</span>
                  <strong style={{ color: "#ffffff" }}>+91 {newPhoneNumber || statusData?.user?.phone || "9981280069"}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #142847", paddingBottom: "8px", alignItems: "center" }}>
                  <span style={{ color: "#7a90b3" }}>Mobile OTP Status:</span>
                  <span style={{
                    background: isMobileVerified ? "#063d20" : "#332204",
                    color: isMobileVerified ? "#34d399" : "#fbbf24",
                    border: `1px solid ${isMobileVerified ? "#10b981" : "#d97706"}`,
                    padding: "3px 10px",
                    borderRadius: "12px",
                    fontSize: "11px",
                    fontWeight: "700"
                  }}>
                    {isMobileVerified ? "Verified" : "Not Verified"}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #142847", paddingBottom: "8px" }}>
                  <span style={{ color: "#7a90b3" }}>KYC Tier:</span>
                  <strong style={{ color: "#38bdf8" }}>{statusData?.kyc?.kyc_type || kycType}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #142847", paddingBottom: "8px" }}>
                  <span style={{ color: "#7a90b3" }}>Primary ID Type:</span>
                  <strong style={{ color: "#ffffff" }}>{statusData?.kyc?.document_type || "Aadhaar Card"}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #142847", paddingBottom: "8px" }}>
                  <span style={{ color: "#7a90b3" }}>PAN Verification:</span>
                  <strong style={{ color: statusData?.kyc?.pan_verification_status === "Verified" ? "#34d399" : "#38bdf8" }}>
                    {statusData?.kyc?.pan_verification_status || "Pending Verification"}
                  </strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#7a90b3" }}>Aadhaar Verification:</span>
                  <strong style={{ color: statusData?.kyc?.aadhaar_verification_status === "Verified" ? "#34d399" : "#38bdf8" }}>
                    {statusData?.kyc?.aadhaar_verification_status || "Pending Verification"}
                  </strong>
                </div>
              </div>
            </div>

          </div>

          {/* Uploaded Documents Gallery (With Fullscreen Zoom Support) */}
          <div className="table-card" style={{ padding: "24px" }}>
            <h4 style={{ fontSize: "16px", fontWeight: "700", color: "#ffffff", display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
              <FileText size={18} color="#00d9ff" /> Uploaded Document Proofs Gallery
            </h4>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
              {/* PAN Card Preview */}
              <div style={{ background: "#08152b", border: "1px solid #1a3254", borderRadius: "10px", padding: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ fontSize: "13px", fontWeight: "700", color: "#ffffff" }}>PAN Card</span>
                  <span className="badge-pill verified" style={{ fontSize: "10px" }}>FRONT</span>
                </div>
                <div
                  onClick={() => setZoomedDoc({ title: "PAN Card (Front)", url: panDocPreview || "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&q=80" })}
                  style={{ position: "relative", height: "140px", borderRadius: "6px", overflow: "hidden", background: "#040b17", cursor: "pointer" }}
                >
                  <img
                    src={panDocPreview || "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80"}
                    alt="PAN Proof"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                  <div style={{ position: "absolute", bottom: "6px", right: "6px", background: "rgba(0,0,0,0.7)", padding: "4px 8px", borderRadius: "4px", color: "#ffffff", fontSize: "11px", display: "flex", alignItems: "center", gap: "4px" }}>
                    <ZoomIn size={12} /> View Full
                  </div>
                </div>
              </div>

              {/* Aadhaar Front Preview */}
              <div style={{ background: "#08152b", border: "1px solid #1a3254", borderRadius: "10px", padding: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ fontSize: "13px", fontWeight: "700", color: "#ffffff" }}>Aadhaar Card</span>
                  <span className="badge-pill verified" style={{ fontSize: "10px" }}>FRONT</span>
                </div>
                <div
                  onClick={() => setZoomedDoc({ title: "Aadhaar Card (Front)", url: aadhaarFrontPreview || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80" })}
                  style={{ position: "relative", height: "140px", borderRadius: "6px", overflow: "hidden", background: "#040b17", cursor: "pointer" }}
                >
                  <img
                    src={aadhaarFrontPreview || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80"}
                    alt="Aadhaar Front Proof"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                  <div style={{ position: "absolute", bottom: "6px", right: "6px", background: "rgba(0,0,0,0.7)", padding: "4px 8px", borderRadius: "4px", color: "#ffffff", fontSize: "11px", display: "flex", alignItems: "center", gap: "4px" }}>
                    <ZoomIn size={12} /> View Full
                  </div>
                </div>
              </div>

              {/* Aadhaar Back Preview */}
              <div style={{ background: "#08152b", border: "1px solid #1a3254", borderRadius: "10px", padding: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ fontSize: "13px", fontWeight: "700", color: "#ffffff" }}>Aadhaar Card</span>
                  <span className="badge-pill verified" style={{ fontSize: "10px" }}>BACK</span>
                </div>
                <div
                  onClick={() => setZoomedDoc({ title: "Aadhaar Card (Back / Address)", url: aadhaarBackPreview || "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80" })}
                  style={{ position: "relative", height: "140px", borderRadius: "6px", overflow: "hidden", background: "#040b17", cursor: "pointer" }}
                >
                  <img
                    src={aadhaarBackPreview || "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80"}
                    alt="Aadhaar Back Proof"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                  <div style={{ position: "absolute", bottom: "6px", right: "6px", background: "rgba(0,0,0,0.7)", padding: "4px 8px", borderRadius: "4px", color: "#ffffff", fontSize: "11px", display: "flex", alignItems: "center", gap: "4px" }}>
                    <ZoomIn size={12} /> View Full
                  </div>
                </div>
              </div>

              {/* Supporting Document Preview */}
              {supportingDocPreview && (
                <div style={{ background: "#08152b", border: "1px solid #1a3254", borderRadius: "10px", padding: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span style={{ fontSize: "13px", fontWeight: "700", color: "#ffffff" }}>{supportingDocType}</span>
                    <span className="badge-pill pending" style={{ fontSize: "10px" }}>OPTIONAL</span>
                  </div>
                  <div
                    onClick={() => setZoomedDoc({ title: supportingDocType, url: supportingDocPreview })}
                    style={{ position: "relative", height: "140px", borderRadius: "6px", overflow: "hidden", background: "#040b17", cursor: "pointer" }}
                  >
                    <img src={supportingDocPreview} alt="Supporting Proof" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <div style={{ position: "absolute", bottom: "6px", right: "6px", background: "rgba(0,0,0,0.7)", padding: "4px 8px", borderRadius: "4px", color: "#ffffff", fontSize: "11px", display: "flex", alignItems: "center", gap: "4px" }}>
                      <ZoomIn size={12} /> View Full
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Audit History Timeline (Matching Admin KYC History) */}
          <div className="table-card" style={{ padding: "24px" }}>
            <h4 style={{ fontSize: "15px", fontWeight: "700", color: "#ffffff", display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
              <Clock size={18} color="#087cff" /> Compliance Milestone Audit History
            </h4>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px", position: "relative", paddingLeft: "24px" }}>
              <div style={{ position: "absolute", left: "7px", top: "4px", bottom: "4px", width: "2px", background: "#1c3254" }} />

              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", left: "-24px", top: "2px", width: "16px", height: "16px", borderRadius: "50%", background: "#10b981", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Check size={10} color="#ffffff" />
                </div>
                <div style={{ fontSize: "13px", fontWeight: "700", color: "#ffffff" }}>
                  User Account Registration & Mobile Link
                </div>
                <div style={{ fontSize: "11px", color: "#7a90b3" }}>
                  Registered with phone +91 {newPhoneNumber || "9981280069"} on record.
                </div>
              </div>

              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", left: "-24px", top: "2px", width: "16px", height: "16px", borderRadius: "50%", background: isMobileVerified ? "#10b981" : "#fbbf24", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {isMobileVerified ? <Check size={10} color="#ffffff" /> : <Clock size={10} color="#000000" />}
                </div>
                <div style={{ fontSize: "13px", fontWeight: "700", color: isMobileVerified ? "#34d399" : "#fbbf24" }}>
                  Mobile Number SMS OTP Verification
                </div>
                <div style={{ fontSize: "11px", color: "#7a90b3" }}>
                  {isMobileVerified ? "Successfully authenticated via SMS OTP Gateway." : "Pending user OTP entry."}
                </div>
              </div>

              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", left: "-24px", top: "2px", width: "16px", height: "16px", borderRadius: "50%", background: isKycSubmitted || isUnderReview || isKycVerified ? "#10b981" : "#334155", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <FileText size={10} color="#ffffff" />
                </div>
                <div style={{ fontSize: "13px", fontWeight: "700", color: isKycSubmitted || isUnderReview || isKycVerified ? "#ffffff" : "#64748b" }}>
                  Demographic Details & Document Submission
                </div>
                <div style={{ fontSize: "11px", color: "#7a90b3" }}>
                  {isKycSubmitted || isUnderReview || isKycVerified ? "PAN and Aadhaar document scans submitted to compliance queue." : "Pending form submission."}
                </div>
              </div>

              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", left: "-24px", top: "2px", width: "16px", height: "16px", borderRadius: "50%", background: isKycVerified ? "#10b981" : isKycRejected ? "#ef4444" : isResubmissionNeeded ? "#a855f7" : "#0284c7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {isKycVerified ? <Check size={10} color="#ffffff" /> : isKycRejected ? <X size={10} color="#ffffff" /> : <Clock size={10} color="#ffffff" />}
                </div>
                <div style={{ fontSize: "13px", fontWeight: "700", color: isKycVerified ? "#34d399" : isKycRejected ? "#f87171" : isResubmissionNeeded ? "#c084fc" : "#38bdf8" }}>
                  Compliance Officer Verification & Decision
                </div>
                <div style={{ fontSize: "11px", color: "#7a90b3" }}>
                  {isKycVerified ? "Identity proofs verified against UIDAI and NSDL records. Approved." :
                   isKycRejected ? "Submission rejected. Check remarks above." :
                   isResubmissionNeeded ? "Correction requested by compliance officer." :
                   "Queue position active. Expected completion within 2-4 business hours."}
                </div>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* 3. DOCUMENT ZOOM MODAL (Matches KYCDocumentPreview Modal) */}
      {/* ======================================================== */}
      {zoomedDoc && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(3, 7, 18, 0.85)",
          backdropFilter: "blur(6px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: "20px"
        }}>
          <div style={{
            background: "#08162b",
            border: "1px solid #1c3d69",
            borderRadius: "12px",
            width: "100%",
            maxWidth: "750px",
            maxHeight: "90vh",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid #152b47" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <FileText size={20} color="#00d9ff" />
                <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#ffffff" }}>{zoomedDoc.title}</h3>
              </div>
              <button onClick={() => setZoomedDoc(null)} style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: "20px", overflowY: "auto", display: "flex", alignItems: "center", justifyContent: "center", background: "#050e1c" }}>
              <img
                src={zoomedDoc.url}
                alt={zoomedDoc.title}
                style={{ maxWidth: "100%", maxHeight: "65vh", objectFit: "contain", borderRadius: "8px" }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", padding: "14px 20px", borderTop: "1px solid #152b47", background: "#08152b" }}>
              <button
                type="button"
                className="refresh-btn"
                onClick={() => setZoomedDoc(null)}
                style={{ padding: "8px 18px", fontSize: "13px" }}
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
