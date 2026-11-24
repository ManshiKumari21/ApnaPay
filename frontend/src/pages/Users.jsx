import React, { useEffect, useState } from "react";
import {
  Users as UsersIcon, User, Mail, Phone, Calendar, MapPin,
  CheckCircle2, XCircle, ShieldCheck, Search, Filter,
  Edit2, Save, RotateCcw, AlertCircle, Lock, Unlock,
  Camera, ExternalLink, RefreshCw
} from "lucide-react";
import api from "../services/api";

export default function Users() {
  const [activeTab, setActiveTab] = useState("directory"); // "directory" | "profile"
  
  // Directory state
  const [usersList, setUsersList] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Profile form state (Demo User ID: 1)
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    date_of_birth: "",
    address: "",
    city: "",
    state: "",
    postal_code: "",
    profile_image_url: ""
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  // 1. Fetch Users Directory
  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const res = await api.get("/users");
      const list = res.data.users || [];
      setUsersList(list);
      setFilteredUsers(list);
    } catch (err) {
      console.error("Fetch users error:", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  // 2. Fetch User Profile
  const fetchProfile = async () => {
    try {
      const res = await api.get("/users/profile");
      if (res.data.success && res.data.user) {
        const u = res.data.user;
        setProfile(u);
        setFormData({
          full_name: u.full_name || "",
          email: u.email || "",
          phone: u.phone || "",
          date_of_birth: u.date_of_birth ? u.date_of_birth.split("T")[0] : "",
          address: u.address || "",
          city: u.city || "",
          state: u.state || "",
          postal_code: u.postal_code || "",
          profile_image_url: u.profile_image_url || ""
        });
      }
    } catch (err) {
      console.error("Fetch profile error:", err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchProfile();
  }, []);

  // Filter users based on search & status
  useEffect(() => {
    let result = [...usersList];

    if (statusFilter !== "all") {
      result = result.filter(u => u.status === statusFilter);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        u =>
          (u.full_name && u.full_name.toLowerCase().includes(q)) ||
          (u.email && u.email.toLowerCase().includes(q)) ||
          (u.phone && u.phone.includes(q))
      );
    }

    setFilteredUsers(result);
  }, [searchTerm, statusFilter, usersList]);

  // Handle form change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle Profile Update (PUT /users/profile)
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setFeedback({ type: "", message: "" });

    try {
      // Clean empty strings for optional fields
      const payload = {
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        date_of_birth: formData.date_of_birth || null,
        address: formData.address.trim() || null,
        city: formData.city.trim() || null,
        state: formData.state.trim() || null,
        postal_code: formData.postal_code.trim() || null,
        profile_image_url: formData.profile_image_url.trim() || null
      };

      const res = await api.put("/users/profile", payload);

      if (res.data.success) {
        setProfile(res.data.user);
        setFeedback({
          type: "success",
          message: "Profile updated successfully! Live changes saved."
        });
        fetchUsers(); // Refresh list too
      }
    } catch (err) {
      setFeedback({
        type: "error",
        message:
          err.response?.data?.message ||
          "Failed to update profile. Please verify all fields."
      });
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle User Status Toggle (Block/Activate)
  const handleToggleStatus = async (user) => {
    const newStatus = user.status === "active" ? "blocked" : "active";
    const confirmMsg = `Are you sure you want to ${newStatus === "blocked" ? "block" : "activate"} ${user.full_name}?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await api.put(`/users/${user.id}/status`, { status: newStatus });
      fetchUsers();
      if (profile && profile.id === user.id) {
        fetchProfile();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update status");
    }
  };

  // Quick stats
  const totalUsers = usersList.length;
  const activeCount = usersList.filter(u => u.status === "active").length;
  const blockedCount = usersList.filter(u => u.status === "blocked").length;

  return (
    <div className="dashboard-content">
      {/* Page Header */}
      <div className="page-heading">
        <div>
          <h1>User Management & Profile</h1>
          <p>Manage system users, access roles, and edit verified profile credentials.</p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="user-tabs-pill">
          <button
            className={`tab-pill-btn ${activeTab === "directory" ? "active" : ""}`}
            onClick={() => setActiveTab("directory")}
          >
            <UsersIcon size={16} /> User Directory ({totalUsers})
          </button>
          <button
            className={`tab-pill-btn ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            <User size={16} /> Edit Profile (User #{profile?.id || 1})
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: USERS DIRECTORY VIEW */}
      {/* ============================================================== */}
      {activeTab === "directory" && (
        <>
          {/* Quick Stats Grid */}
          <div className="stats-grid" style={{ marginBottom: "24px" }}>
            <div className="stat-card blue">
              <div className="stat-top">
                <span>Total Registered</span>
                <div className="stat-icon"><UsersIcon size={19} /></div>
              </div>
              <h2>{totalUsers}</h2>
              <small>All system users</small>
            </div>

            <div className="stat-card green">
              <div className="stat-top">
                <span>Active Users</span>
                <div className="stat-icon"><CheckCircle2 size={19} /></div>
              </div>
              <h2>{activeCount}</h2>
              <small>Can process transactions</small>
            </div>

            <div className="stat-card red">
              <div className="stat-top">
                <span>Blocked / Suspended</span>
                <div className="stat-icon"><XCircle size={19} /></div>
              </div>
              <h2>{blockedCount}</h2>
              <small>Restricted access</small>
            </div>

            <div className="stat-card purple">
              <div className="stat-top">
                <span>Active Profile</span>
                <div className="stat-icon"><ShieldCheck size={19} /></div>
              </div>
              <h2 style={{ fontSize: "18px", marginTop: "14px", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                {profile?.full_name || "Rahul Sharma"}
              </h2>
              <small>Demo Primary ID #1</small>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="table-toolbar">
            <div className="search-box" style={{ maxWidth: "340px" }}>
              <Search size={17} />
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="filter-group">
              <span className="filter-label"><Filter size={15} /> Status:</span>
              <button
                className={`filter-chip ${statusFilter === "all" ? "active" : ""}`}
                onClick={() => setStatusFilter("all")}
              >
                All ({totalUsers})
              </button>
              <button
                className={`filter-chip ${statusFilter === "active" ? "active" : ""}`}
                onClick={() => setStatusFilter("active")}
              >
                Active ({activeCount})
              </button>
              <button
                className={`filter-chip ${statusFilter === "blocked" ? "active" : ""}`}
                onClick={() => setStatusFilter("blocked")}
              >
                Blocked ({blockedCount})
              </button>

              <button
                className="refresh-btn"
                onClick={fetchUsers}
                title="Refresh user list"
              >
                <RefreshCw size={15} className={loadingUsers ? "spin" : ""} /> Refresh
              </button>
            </div>
          </div>

          {/* Users Table */}
          <div className="table-card">
            <div className="table-wrapper">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>User ID</th>
                    <th>User Info</th>
                    <th>Contact Details</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Joined Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingUsers ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: "center", padding: "40px" }}>
                        <div className="loading" style={{ margin: "0 auto" }}>Loading users...</div>
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: "center", padding: "40px", color: "#8498ba" }}>
                        <UsersIcon size={32} style={{ margin: "0 auto 10px", opacity: 0.5, display: "block" }} />
                        No users found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const avatarText = u.full_name
                        ? u.full_name.charAt(0).toUpperCase()
                        : "U";

                      return (
                        <tr key={u.id}>
                          <td style={{ fontWeight: 600, color: "#6ba6ff" }}>#{u.id}</td>
                          <td>
                            <div className="user-cell">
                              {u.profile_image_url ? (
                                <img
                                  src={u.profile_image_url}
                                  alt={u.full_name}
                                  className="user-avatar-img"
                                  onError={(e) => { e.target.style.display = 'none'; }}
                                />
                              ) : (
                                <div className="user-avatar-text">{avatarText}</div>
                              )}
                              <div>
                                <div className="user-name">{u.full_name}</div>
                                <div className="user-sub">
                                  {u.id === 1 ? "Primary User (Profile API)" : "Registered User"}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div style={{ fontSize: "13px" }}>{u.email}</div>
                            <div style={{ fontSize: "12px", color: "#8498ba" }}>{u.phone}</div>
                          </td>
                          <td style={{ fontSize: "13px", color: "#c6d8f5" }}>
                            {u.city ? `${u.city}${u.state ? ", " + u.state : ""}` : "Not specified"}
                          </td>
                          <td>
                            <span className={`status-badge ${u.status === "active" ? "active" : "blocked"}`}>
                              {u.status === "active" ? (
                                <><CheckCircle2 size={12} /> Active</>
                              ) : (
                                <><XCircle size={12} /> Blocked</>
                              )}
                            </span>
                          </td>
                          <td style={{ fontSize: "12px", color: "#8498ba" }}>
                            {u.created_at ? new Date(u.created_at).toLocaleDateString("en-IN") : "Recent"}
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button
                                className="action-btn edit"
                                title="Edit Profile Details"
                                onClick={() => setActiveTab("profile")}
                              >
                                <Edit2 size={14} /> Edit
                              </button>
                              <button
                                className={`action-btn ${u.status === "active" ? "block" : "activate"}`}
                                title={u.status === "active" ? "Block User" : "Activate User"}
                                onClick={() => handleToggleStatus(u)}
                              >
                                {u.status === "active" ? (
                                  <><Lock size={14} /> Block</>
                                ) : (
                                  <><Unlock size={14} /> Activate</>
                                )}
                              </button>
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
        </>
      )}

      {/* ============================================================== */}
      {/* TAB 2: EDIT USER PROFILE VIEW (PUT /users/profile) */}
      {/* ============================================================== */}
      {activeTab === "profile" && (
        <div className="profile-layout">
          {/* Left Column: Profile Card Summary */}
          <div className="profile-sidebar-card">
            <div className="profile-avatar-wrap">
              {formData.profile_image_url ? (
                <img
                  src={formData.profile_image_url}
                  alt={formData.full_name}
                  className="profile-avatar-large"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
                <div className="profile-avatar-large text-fallback">
                  {formData.full_name ? formData.full_name.charAt(0).toUpperCase() : "A"}
                </div>
              )}
              <span className={`avatar-status-dot ${profile?.status === "active" ? "green" : "red"}`}></span>
            </div>

            <h2 className="profile-name">{formData.full_name || "User Name"}</h2>
            <p className="profile-role">User ID: #{profile?.id || 1} · {profile?.status?.toUpperCase() || "ACTIVE"}</p>

            <div className="profile-badges-row">
              <span className="badge-pill verified">
                <ShieldCheck size={13} /> Verified
              </span>
              <span className="badge-pill active">
                <CheckCircle2 size={13} /> Active
              </span>
            </div>

            <hr className="profile-divider" />

            <div className="profile-detail-item">
              <Mail size={16} />
              <div>
                <small>Email Address</small>
                <span>{formData.email || "Not provided"}</span>
              </div>
            </div>

            <div className="profile-detail-item">
              <Phone size={16} />
              <div>
                <small>Mobile Phone</small>
                <span>{formData.phone || "Not provided"}</span>
              </div>
            </div>

            <div className="profile-detail-item">
              <Calendar size={16} />
              <div>
                <small>Date of Birth</small>
                <span>{formData.date_of_birth || "YYYY-MM-DD"}</span>
              </div>
            </div>

            <div className="profile-detail-item">
              <MapPin size={16} />
              <div>
                <small>City & State</small>
                <span>
                  {formData.city || formData.state
                    ? `${formData.city || ""}${formData.city && formData.state ? ", " : ""}${formData.state || ""}`
                    : "Not specified"}
                </span>
              </div>
            </div>

            <button
              className="refresh-btn"
              onClick={fetchProfile}
              style={{ width: "100%", justifyContent: "center", marginTop: "18px" }}
            >
              <RotateCcw size={15} /> Reload Saved Data
            </button>
          </div>

          {/* Right Column: Editable Form */}
          <div className="profile-form-card">
            <div className="form-card-header">
              <div>
                <h3>Edit Profile Credentials</h3>
                <p>Changes will update the `users` and `user_profiles` MySQL tables via `PUT /users/profile`.</p>
              </div>
              <span className="api-tag">API: PUT /users/profile</span>
            </div>

            {/* Feedback Notifications */}
            {feedback.message && (
              <div className={`feedback-alert ${feedback.type}`}>
                {feedback.type === "success" ? (
                  <CheckCircle2 size={18} />
                ) : (
                  <AlertCircle size={18} />
                )}
                <span>{feedback.message}</span>
              </div>
            )}

            <form onSubmit={handleProfileSubmit}>
              {/* Section 1: Basic Information */}
              <h4 className="form-section-heading">
                <User size={16} /> 1. Personal & Contact Information
              </h4>

              <div className="form-row two-col">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    name="full_name"
                    required
                    minLength={2}
                    placeholder="Enter full name"
                    value={formData.full_name}
                    onChange={handleChange}
                  />
                  <span className="field-hint">Must contain at least 2 characters.</span>
                </div>

                <div className="form-group">
                  <label>Date of Birth (YYYY-MM-DD)</label>
                  <input
                    type="date"
                    name="date_of_birth"
                    placeholder="YYYY-MM-DD"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                  />
                  <span className="field-hint">Format: YYYY-MM-DD (e.g., 1995-08-15)</span>
                </div>
              </div>

              <div className="form-row two-col">
                <div className="form-group">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="user@apnapay.com"
                    value={formData.email}
                    onChange={handleChange}
                  />
                  <span className="field-hint">Unique email used for security notifications.</span>
                </div>

                <div className="form-group">
                  <label>Phone Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    placeholder="9876543210"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                  <span className="field-hint">10 to 15 digit mobile number.</span>
                </div>
              </div>

              {/* Section 2: Address Information */}
              <h4 className="form-section-heading" style={{ marginTop: "24px" }}>
                <MapPin size={16} /> 2. Address & Residence Details
              </h4>

              <div className="form-group">
                <label>Street Address</label>
                <input
                  type="text"
                  name="address"
                  placeholder="Flat / House no, Building name, Street"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>

              <div className="form-row three-col">
                <div className="form-group">
                  <label>City</label>
                  <input
                    type="text"
                    name="city"
                    placeholder="e.g. Mumbai"
                    value={formData.city}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>State</label>
                  <input
                    type="text"
                    name="state"
                    placeholder="e.g. Maharashtra"
                    value={formData.state}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Postal / PIN Code</label>
                  <input
                    type="text"
                    name="postal_code"
                    placeholder="e.g. 400001"
                    value={formData.postal_code}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Section 3: Profile Avatar URL */}
              <h4 className="form-section-heading" style={{ marginTop: "24px" }}>
                <Camera size={16} /> 3. Avatar Image URL
              </h4>

              <div className="form-group">
                <label>Profile Image URL</label>
                <input
                  type="url"
                  name="profile_image_url"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={formData.profile_image_url}
                  onChange={handleChange}
                />
                <span className="field-hint">Must start with http:// or https://</span>
              </div>

              {/* Form Action Buttons */}
              <div className="form-footer-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={fetchProfile}
                  disabled={savingProfile}
                >
                  <RotateCcw size={16} /> Reset
                </button>

                <button
                  type="submit"
                  className="btn-save"
                  disabled={savingProfile}
                >
                  <Save size={16} />
                  {savingProfile ? "Saving to Database..." : "Save Profile Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

