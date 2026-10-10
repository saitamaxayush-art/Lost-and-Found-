import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import Nav from "../components/landing/Nav";
import Avatar from "../components/common/Avatar";
import LoginModal from "../components/landing/LoginModal";
import { sound } from "../utils/sound";
import "../styles/landing.css";
import "../styles/profile.css";
import "../styles/editProfile.css";

const PRESET_AVATARS = [
  {
    id: "preset-1",
    label: "Student 1",
    url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "preset-2",
    label: "Student 2",
    url: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "preset-3",
    label: "Student 3",
    url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "preset-4",
    label: "Student 4",
    url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "preset-5",
    label: "Student 5",
    url: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "preset-6",
    label: "Student 6",
    url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
  },
];

export default function EditProfile() {
  const navigate = useNavigate();
  const { user, updateUser, login } = useApp();
  const fileInputRef = useRef(null);

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

  const handleSave = (e) => {
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

    updateUser(updatedProfile);
    sound.playKeyTurn?.();

    setSaveSuccess(true);
    setTimeout(() => {
      navigate("/profile");
    }, 700);
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
              Update your photo, campus information, and academic department details.
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="ep-form">
          {/* SECTION 1: PROFILE PICTURE */}
          <section className="ep-card ep-photo-card">
            <div className="ep-card-head">
              <div className="ep-icon-circle">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                  <circle cx="9" cy="9" r="2" />
                  <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                </svg>
              </div>
              <div>
                <h2 className="ep-card-title">Profile Picture</h2>
                <p className="ep-card-desc">Choose a photo from your files or select a campus preset</p>
              </div>
            </div>

            <div className="ep-photo-body">
              <div className="ep-photo-preview-wrap">
                <Avatar name={name || "Student"} image={avatar} size={118} />
                {avatar && (
                  <button
                    type="button"
                    className="ep-remove-photo-badge"
                    onClick={() => setAvatar("")}
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
                      onClick={() => setAvatar("")}
                    >
                      Use Initial Monogram
                    </button>
                  )}
                </div>

                <div className="ep-presets-block">
                  <span className="ep-presets-label">Preset Student Avatars:</span>
                  <div className="ep-presets-grid">
                    {PRESET_AVATARS.map((p) => {
                      const isSelected = avatar === p.url;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          className={`ep-preset-tile ${isSelected ? "is-selected" : ""}`}
                          onClick={() => {
                            setAvatar(p.url);
                            sound.playKeyTurn?.();
                          }}
                        >
                          <img src={p.url} alt={p.label} className="ep-preset-img" />
                          {isSelected && <span className="ep-preset-check">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="ep-field ep-url-field">
                  <label className="ep-label">Or Image Web URL</label>
                  <input
                    type="url"
                    className="ep-input"
                    value={avatar?.startsWith("data:") ? "" : avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    placeholder="https://example.com/photo.jpg"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 2: CAMPUS & ACADEMICS */}
          <section className="ep-card ep-academic-card">
            <div className="ep-card-head">
              <div className="ep-icon-circle">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                  <path d="M6 12v5c3 3 9 3 12 0v-5" />
                </svg>
              </div>
              <div>
                <h2 className="ep-card-title">Campus &amp; Academic Credentials</h2>
                <p className="ep-card-desc">Helps verify student identity for safe item returns</p>
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
                <label className="ep-label">Department / Degree Major</label>
                <input
                  type="text"
                  name="department"
                  className="ep-input"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Computer Science & Engineering"
                />
              </div>

              <div className="ep-field">
                <label className="ep-label">Campus / College Branch</label>
                <input
                  type="text"
                  name="campus"
                  className="ep-input"
                  value={campus}
                  onChange={(e) => setCampus(e.target.value)}
                  placeholder="e.g. North Campus, Engineering Block"
                />
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
                <input
                  type="text"
                  name="hostel"
                  className="ep-input"
                  value={hostel}
                  onChange={(e) => setHostel(e.target.value)}
                  placeholder="e.g. Boys Hostel Block B, Room 304 or Day Scholar"
                />
                <span className="ep-field-hint">Helps with convenient campus pickup coordination.</span>
              </div>
            </div>
          </section>

          {/* SECTION 3: CONTACT & BIO */}
          <section className="ep-card ep-contact-card">
            <div className="ep-card-head">
              <div className="ep-icon-circle">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </div>
              <div>
                <h2 className="ep-card-title">Contact &amp; Campus Bio</h2>
                <p className="ep-card-desc">Reachability for matched items</p>
              </div>
            </div>

            <div className="ep-fields-grid">
              <div className="ep-field">
                <label className="ep-label">Student Email</label>
                <input
                  type="email"
                  name="email"
                  className="ep-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@campus.edu"
                  required
                />
                <span className="ep-field-hint">Used for official lost &amp; found match updates.</span>
              </div>

              <div className="ep-field">
                <label className="ep-label">WhatsApp / Contact Phone</label>
                <input
                  type="tel"
                  name="whatsapp"
                  className="ep-input"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="+91 98765 43210"
                />
                <span className="ep-field-hint">Shared with verified finder/owner upon mutual confirmation.</span>
              </div>

              <div className="ep-field ep-field-full">
                <label className="ep-label">Campus Bio / Status Note</label>
                <textarea
                  name="bio"
                  className="ep-input ep-textarea"
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="e.g. Usually in CS Lab 301 or Central Library. Fast respondent."
                />
              </div>
            </div>
          </section>

          {/* Sticky Form Action Bar */}
          <div className="ep-action-bar">
            <button
              type="button"
              className="ep-btn-cancel"
              onClick={() => navigate("/profile")}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="ep-btn-save"
              disabled={saveSuccess}
            >
              {saveSuccess ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Changes Saved!</span>
                </>
              ) : (
                <span>Save Profile Changes</span>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
