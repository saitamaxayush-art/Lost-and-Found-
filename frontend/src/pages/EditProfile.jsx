import React, { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import Nav from "../components/landing/Nav";
import Avatar from "../components/common/Avatar";
import LoginModal from "../components/landing/LoginModal";
import HeroStars from "../components/profile/HeroStars";
import ProgressRing from "../components/profile/ProgressRing";
import { useTilt } from "../hooks/useTilt";
import { sound } from "../utils/sound";
import "../styles/landing.css";
import "../styles/profile.css";
import "../styles/editProfile.css";

const DEPARTMENT_OPTIONS = [
  "Computer Science & Engineering",
  "Information Technology",
  "Electronics & Communication",
  "Mechanical Engineering",
  "Design & Architecture",
  "Management Studies",
  "Biotechnology",
  "Civil Engineering",
  "Electrical & Electronics Engineering",
  "Mathematics & Computing",
  "Chemical Engineering",
  "Physics & Applied Sciences",
  "Other / Specialized Course",
];

const CAMPUS_OPTIONS = [
  "North Campus, Engineering Block",
  "South Campus, Science Block",
  "Main Campus, Central Wing",
  "East Campus, Technology Park",
  "West Campus, Medical Sciences",
  "Central Campus",
  "Off-Campus / Satellite Facility",
];

const HOSTEL_OPTIONS = [
  "Boys Hostel Block B, Room 304",
  "Boys Hostel Block A",
  "Boys Hostel Block C",
  "Girls Hostel Block A, Room 210",
  "Girls Hostel Block B",
  "Aryabhata Hall H-102",
  "PG & Research Scholars Hostel",
  "Day Scholar (Off-Campus Residence)",
];

export default function EditProfile() {
  const navigate = useNavigate();
  const { user, updateUser, userPoints = 120, login } = useApp();
  const fileInputRef = useRef(null);
  const heroCardRef = useTilt({ maxTilt: 3.2, perspective: 1100, damping: 0.08 });

  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form Fields
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [whatsapp, setWhatsapp] = useState(user?.whatsapp || "");
  const [avatar, setAvatar] = useState(user?.avatar || "");
  const [campus, setCampus] = useState(user?.campus || user?.department || "North Campus, Engineering Block");
  const [department, setDepartment] = useState(user?.department || "Computer Science & Engineering");
  const [rollNo, setRollNo] = useState(user?.rollNo || "22BCS10482");
  const [year, setYear] = useState(user?.year || "3rd Year");
  const [semester, setSemester] = useState(user?.semester || "Semester 6");
  const [hostel, setHostel] = useState(user?.hostel || "Boys Hostel Block B, Room 304");
  const [bio, setBio] = useState(user?.bio || "Campus helper · Lost & Found regular");

  useEffect(() => {
    document.title = "Edit Student Profile — FindBack";
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setWhatsapp(user.whatsapp || "");
      setAvatar(user.avatar || "");
      setCampus(user.campus || user.department || "North Campus, Engineering Block");
      setDepartment(user.department || "Computer Science & Engineering");
      setRollNo(user.rollNo || "22BCS10482");
      setYear(user.year || "3rd Year");
      setSemester(user.semester || "Semester 6");
      setHostel(user.hostel || "Boys Hostel Block B, Room 304");
      setBio(user.bio || "Campus helper · Lost & Found regular");
    }
  }, [user]);

  // Compute live profile completion percentage
  const completionPercentage = useMemo(() => {
    let score = 0;
    if (name.trim()) score += 15;
    if (email.trim()) score += 15;
    if (avatar) score += 15;
    if (rollNo.trim()) score += 15;
    if (department.trim()) score += 15;
    if (campus.trim()) score += 10;
    if (hostel.trim()) score += 5;
    if (whatsapp.trim()) score += 5;
    if (bio.trim()) score += 5;
    return Math.min(100, score);
  }, [name, email, avatar, rollNo, department, campus, hostel, whatsapp, bio]);

  // Upload local photo from machine
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file (PNG, JPG, or WEBP).");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAvatar(reader.result);
      sound.playSuccess?.();
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    const updatedProfile = {
      name: name.trim() || user?.name || "Student",
      email: email.trim(),
      whatsapp: whatsapp.trim(),
      avatar: avatar || null,
      campus: campus.trim(),
      department: department.trim(),
      rollNo: rollNo.trim(),
      year: year.trim(),
      semester: semester.trim(),
      hostel: hostel.trim(),
      bio: bio.trim(),
    };

    try {
      await updateUser(updatedProfile);
      sound.playKeyTurn?.();

      setSaveSuccess(true);
      setTimeout(() => {
        navigate("/profile");
      }, 700);
    } catch (err) {
      console.error("Failed to update profile:", err);
    }
  };

  // Logged-out gate
  if (!user) {
    return (
      <div className="pf-page ep-page">
        <Nav goTo={(id) => navigate("/", { state: { scrollTo: id } })} onLogin={() => setLoginModalOpen(true)} />
        <div className="pf-container pf-gate-wrap">
          <div className="pf-gate-card">
            <h1 className="pf-gate-title">Login Required</h1>
            <p className="pf-gate-text">
              Please sign in to edit your campus profile and academic credentials.
            </p>
            <button
              type="button"
              className="pf-gate-btn"
              onClick={() => setLoginModalOpen(true)}
            >
              Sign In
            </button>
            <button
              type="button"
              className="pf-gate-demo-btn"
              onClick={() =>
                login({
                  name: "Demo Student",
                  email: "demo@student.edu",
                  campus: "North Campus, Engineering Block",
                  department: "Computer Science & Engineering",
                  rollNo: "22BCS10482",
                  year: "3rd Year",
                  semester: "Semester 6",
                  hostel: "Boys Hostel Block B, Room 304",
                  bio: "Campus helper · Lost & Found regular",
                  whatsapp: "+91 98765 43210",
                  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
                })
              }
            >
              Instant Demo Sign-In
            </button>
            <button
              type="button"
              className="pf-gate-home-link"
              onClick={() => navigate("/")}
            >
              Back to Home
            </button>
          </div>
        </div>
        <LoginModal
          open={loginModalOpen}
          onClose={() => setLoginModalOpen(false)}
          onSuccess={() => setLoginModalOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="pf-page ep-page">
      <Nav goTo={(id) => navigate("/", { state: { scrollTo: id } })} />

      <main className="ep-container">
        {/* Top Header & Breadcrumb */}
        <div className="ep-top-bar">
          <button
            type="button"
            className="ep-back-btn"
            onClick={() => navigate("/profile")}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            <span>Back to Profile</span>
          </button>

          <div className="ep-header-text">
            <h1 className="ep-page-title">Edit Student Profile</h1>
            <p className="ep-page-subtitle">
              Refine your photo, student credentials, and academic details in real time.
            </p>
          </div>
        </div>

        {/* =========================================================================
            LIVE 3D STUDENT ID CARD SHOWCASE (Like IdentityHero with Stars & Tilt)
           ========================================================================= */}
        <section className="ep-id-showcase-wrap" aria-label="Live Student ID Preview">
          <div className="ep-id-card" ref={heroCardRef}>
            {/* Cosmic constellation stars backdrop */}
            <HeroStars />

            {/* Specular sheen & subtle noise */}
            <div className="ep-id-specular" aria-hidden="true" />
            <div className="ep-id-grain" aria-hidden="true" />

            <div className="ep-id-inner">
              {/* Top Banner on ID Card */}
              <div className="ep-id-topbar">
                <div className="ep-id-institute-tag">
                  <div className="ep-id-logo-mark">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2L2 7l10 5 10-5-10-5z" />
                      <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
                    </svg>
                  </div>
                  <span>{campus || "STUDENT IDENTITY"}</span>
                </div>
              </div>

              {/* Main ID Body */}
              <div className="ep-id-body">
                {/* Left: Avatar with Progress Ring */}
                <div className="ep-id-avatar-box">
                  <ProgressRing points={userPoints} size={98} strokeWidth={3}>
                    <Avatar
                      name={name || "Student"}
                      image={avatar}
                      size={82}
                      className="ep-id-avatar-img"
                    />
                  </ProgressRing>
                  <span className="ep-id-avatar-tier">{year || "Student"}</span>
                </div>

                {/* Center: Live Credentials Details */}
                <div className="ep-id-meta">
                  <div className="ep-id-name-row">
                    <h2 className="ep-id-name">{name || "Your Name"}</h2>
                    <span className="ep-id-roll-badge">{rollNo || "ROLL NO"}</span>
                  </div>

                  <div className="ep-id-dept-line">
                    <span className="ep-id-dept">{department || "Department / Degree Major"}</span>
                  </div>

                  <div className="ep-id-tags-row">
                    <span className="ep-id-tag">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      {campus || "Main Campus"}
                    </span>
                    <span className="ep-id-tag">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      </svg>
                      {hostel || "Residence"}
                    </span>
                    <span className="ep-id-tag ep-id-sem-tag">{semester || "Semester"}</span>
                  </div>
                </div>

                {/* Right: Profile Completeness Meter */}
                <div className="ep-id-completeness-meter">
                  <div className="ep-id-radial-box">
                    <svg className="ep-id-radial-svg" viewBox="0 0 36 36">
                      <path
                        className="ep-id-radial-bg"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="ep-id-radial-fill"
                        strokeDasharray={`${completionPercentage}, 100`}
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <span className="ep-id-radial-number">{completionPercentage}%</span>
                  </div>
                  <span className="ep-id-completeness-lbl">Profile Strength</span>
                </div>
              </div>

              {/* Bottom Simulated Barcode & Card Serial */}
              <div className="ep-id-bottom-row">
                <div className="ep-id-barcode-lines" aria-hidden="true">
                  <span style={{ width: 2 }} /><span style={{ width: 1 }} /><span style={{ width: 3 }} />
                  <span style={{ width: 1 }} /><span style={{ width: 4 }} /><span style={{ width: 2 }} />
                  <span style={{ width: 1 }} /><span style={{ width: 3 }} /><span style={{ width: 2 }} />
                  <span style={{ width: 4 }} /><span style={{ width: 1 }} /><span style={{ width: 2 }} />
                  <span style={{ width: 3 }} /><span style={{ width: 1 }} /><span style={{ width: 2 }} />
                  <span style={{ width: 4 }} /><span style={{ width: 1 }} /><span style={{ width: 3 }} />
                  <span style={{ width: 2 }} /><span style={{ width: 1 }} /><span style={{ width: 4 }} />
                </div>
                <div className="ep-id-serial-code">
                  ID: {rollNo ? `${rollNo}` : "FB-CAMPUS-2026"}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            PROFILE EDITING FORM (Staggered cards with rich micro-interactions)
           ========================================================================= */}
        <form onSubmit={handleSave} className="ep-form">
          {/* SECTION 1: PROFILE PICTURE */}
          <section className="ep-card ep-photo-card ep-stagger-1">
            <div className="ep-card-head">
              <div className="ep-icon-circle">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                  <circle cx="9" cy="9" r="2" />
                  <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                </svg>
              </div>
              <div>
                <h2 className="ep-card-title">Profile Picture &amp; Visual Avatar</h2>
                <p className="ep-card-desc">Upload a photo directly from your device</p>
              </div>
            </div>

            <div className="ep-photo-body">
              <div className="ep-photo-preview-wrap">
                <div className="ep-avatar-interactive-halo">
                  <Avatar name={name || "Student"} image={avatar} size={118} />
                </div>
                {avatar && (
                  <button
                    type="button"
                    className="ep-remove-photo-badge"
                    onClick={() => {
                      setAvatar("");
                      sound.playKeyTurn?.();
                    }}
                    title="Remove custom photo and use monogram initials"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="ep-photo-controls">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  style={{ display: "none" }}
                />

                <div className="ep-photo-buttons">
                  <button
                    type="button"
                    className="ep-btn-upload"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    <span>Upload from Device</span>
                  </button>

                  {avatar && (
                    <button
                      type="button"
                      className="ep-btn-ghost"
                      onClick={() => {
                        setAvatar("");
                        sound.playKeyTurn?.();
                      }}
                    >
                      Use Initial Monogram
                    </button>
                  )}
                </div>
                <span className="ep-field-hint" style={{ marginTop: 10 }}>
                  Supports PNG, JPG, or WEBP. File stays local and previews instantly on your campus card.
                </span>
              </div>
            </div>
          </section>

          {/* SECTION 2: CAMPUS & ACADEMIC CREDENTIALS */}
          <section className="ep-card ep-academic-card ep-stagger-2">
            <div className="ep-card-head">
              <div className="ep-icon-circle">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                  <path d="M6 12v5c3 3 9 3 12 0v-5" />
                </svg>
              </div>
              <div>
                <h2 className="ep-card-title">Campus &amp; Academic Credentials</h2>
                <p className="ep-card-desc">Student identification and campus contact details for verified coordination</p>
              </div>
            </div>

            <div className="ep-fields-grid">
              <div className="ep-field">
                <label className="ep-label">Full Name</label>
                <input
                  type="text"
                  name="name"
                  className="ep-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Aarav Sharma"
                  required
                />
              </div>

              <div className="ep-field">
                <label className="ep-label">Student Roll / ID Number</label>
                <input
                  type="text"
                  name="rollNo"
                  className="ep-input"
                  value={rollNo}
                  onChange={(e) => setRollNo(e.target.value)}
                  placeholder="e.g. 22BCS10482"
                />
                <span className="ep-field-hint">Matches your college student ID card.</span>
              </div>

              <div className="ep-field">
                <label className="ep-label">College Email ID</label>
                <input
                  type="email"
                  name="email"
                  className="ep-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@campus.edu"
                  required
                />
                <span className="ep-field-hint">Official campus student email address.</span>
              </div>

              <div className="ep-field">
                <label className="ep-label">Phone Number / WhatsApp</label>
                <input
                  type="tel"
                  name="whatsapp"
                  className="ep-input"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="+91 98765 43210"
                />
                <span className="ep-field-hint">Direct contact for coordinating item handovers.</span>
              </div>

              <div className="ep-field ep-field-full">
                <label className="ep-label">Department / Degree Major</label>
                <select
                  name="department"
                  className="ep-input ep-select"
                  value={department}
                  onChange={(e) => {
                    setDepartment(e.target.value);
                    sound.playKeyTurn?.();
                  }}
                >
                  {DEPARTMENT_OPTIONS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div className="ep-field ep-field-full">
                <label className="ep-label">Campus / College Branch</label>
                <select
                  name="campus"
                  className="ep-input ep-select"
                  value={campus}
                  onChange={(e) => {
                    setCampus(e.target.value);
                    sound.playKeyTurn?.();
                  }}
                >
                  {CAMPUS_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="ep-field">
                <label className="ep-label">Academic Year</label>
                <select
                  name="year"
                  className="ep-input ep-select"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                >
                  <option value="1st Year">1st Year (Freshman)</option>
                  <option value="2nd Year">2nd Year (Sophomore)</option>
                  <option value="3rd Year">3rd Year (Junior)</option>
                  <option value="4th Year">4th Year (Senior)</option>
                  <option value="Postgraduate / PhD">Postgraduate / PhD</option>
                  <option value="Faculty / Staff">Faculty / Staff</option>
                </select>
              </div>

              <div className="ep-field">
                <label className="ep-label">Semester</label>
                <select
                  name="semester"
                  className="ep-input ep-select"
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                >
                  <option value="Semester 1">Semester 1</option>
                  <option value="Semester 2">Semester 2</option>
                  <option value="Semester 3">Semester 3</option>
                  <option value="Semester 4">Semester 4</option>
                  <option value="Semester 5">Semester 5</option>
                  <option value="Semester 6">Semester 6</option>
                  <option value="Semester 7">Semester 7</option>
                  <option value="Semester 8">Semester 8</option>
                </select>
              </div>

              <div className="ep-field ep-field-full">
                <label className="ep-label">Hostel / Hall of Residence</label>
                <select
                  name="hostel"
                  className="ep-input ep-select"
                  value={hostel}
                  onChange={(e) => {
                    setHostel(e.target.value);
                    sound.playKeyTurn?.();
                  }}
                >
                  {HOSTEL_OPTIONS.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* DARK THEMED SAVE CHANGES BUTTON */}
          <div className="ep-save-btn-row">
            <button
              type="submit"
              className={`ep-btn-save-dark ${saveSuccess ? "is-success" : ""}`}
              disabled={saveSuccess}
            >
              {saveSuccess ? (
                <>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Changes Saved!</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
