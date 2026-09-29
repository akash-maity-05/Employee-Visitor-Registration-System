import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpRight,
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  DoorOpen,
  Download,
  Ellipsis,
  FileText,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from "lucide-react";

const blank = { name: "", mobile: "", company: "", person: "", purpose: "" };
const api = async (path, options = {}) => {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || `Request failed (${response.status})`);
  return result;
};
const dateLabel = (value) =>
  new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
const timeLabel = (value) =>
  new Date(value).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
const isToday = (value) =>
  new Date(value).toDateString() === new Date().toDateString();
const initials = (name) =>
  name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

export default function App() {
  const [visitors, setVisitors] = useState([]);
  const [profile, setProfile] = useState({ name: "", role: "Receptionist" });
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All visitors");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const [toast, setToast] = useState("");
  const [menu, setMenu] = useState(null);
  const [profileModal, setProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState(profile);

  const refreshData = async () => {
    const [visitorData, profileData] = await Promise.all([api("/visitors"), api("/profile")]);
    setVisitors(visitorData);
    setProfile(profileData);
    setConnectionError("");
  };
  useEffect(() => {
    refreshData().catch((error) => setConnectionError(error.message)).finally(() => setLoading(false));
  }, []);
  const todayCount = visitors.filter((v) => isToday(v.date)).length;
  const filtered = useMemo(
    () =>
      visitors.filter((v) => {
        const matchesQuery = `${v.name} ${v.mobile}`
          .toLowerCase()
          .includes(query.toLowerCase());
        return matchesQuery && (filter === "All visitors" || isToday(v.date));
      }),
    [visitors, query, filter],
  );
  const notify = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  };
  const saveProfile = async (event) => {
    event.preventDefault();
    const next = {
      name: profileForm.name.trim(),
      role: profileForm.role.trim() || "Receptionist",
    };
    try {
      setProfile(await api("/profile", { method: "PUT", body: JSON.stringify(next) }));
      setProfileModal(false);
      notify("Profile details saved");
    } catch (error) { notify(error.message); }
  };
  const openNew = () => {
    setEditing(null);
    setForm(blank);
    setModal(true);
  };
  const openEdit = (visitor) => {
    setEditing(visitor);
    setForm({
      name: visitor.name,
      mobile: visitor.mobile,
      company: visitor.company,
      person: visitor.person,
      purpose: visitor.purpose,
    });
    setMenu(null);
    setModal(true);
  };
  const saveVisitor = async (event) => {
    event.preventDefault();
    try {
      const result = await api(editing ? `/visitors/${encodeURIComponent(editing.id)}` : "/visitors", {
        method: editing ? "PUT" : "POST",
        body: JSON.stringify(form),
      });
      setVisitors((current) => editing
        ? current.map((visitor) => visitor.id === result.id ? result : visitor)
        : [result, ...current]);
      setModal(false);
      notify(editing ? "Visitor details updated" : "Visitor checked in successfully");
    } catch (error) { notify(error.message); }
  };
  const removeVisitor = async (id) => {
    try {
      await api(`/visitors/${encodeURIComponent(id)}`, { method: "DELETE" });
      setVisitors((current) => current.filter((visitor) => visitor.id !== id));
      setMenu(null);
      notify("Visitor record deleted");
    } catch (error) { notify(error.message); }
  };
  const exportCsv = () => {
    const rows = [
      [
        "Visitor ID",
        "Name",
        "Mobile Number",
        "Company/College",
        "Person to Meet",
        "Purpose",
        "Date",
        "Time",
      ],
      ...filtered.map((v) => [
        v.id,
        v.name,
        v.mobile,
        v.company,
        v.person,
        v.purpose,
        `Date: ${dateLabel(v.date)}`,
        timeLabel(v.date),
      ]),
    ];
    const csv = rows
      .map((row) =>
        row
          .map((field) => `"${String(field).replaceAll('"', '""')}"`)
          .join(","),
      )
      .join("\r\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "visitor-register.csv";
    link.click();
    URL.revokeObjectURL(url);
    notify("Visitor list exported");
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#home">
          <span className="brand-mark">
            <DoorOpen size={20} strokeWidth={2.2} />
          </span>
          <span>
            frontdesk<span className="brand-dot">.</span>
          </span>
        </a>
        <div className="workspace-label">WORKSPACE</div>
        <button className="nav-item active">
          <span className="nav-icon">
            <Users size={18} />
          </span>
          <span>Visitor register</span>
          <span className="nav-count">{visitors.length}</span>
        </button>
        <div className="sidebar-divider" />
        <div className="sidebar-note">
          <div className="note-icon">
            <ShieldCheck size={17} />
          </div>
          <div>
            <strong>All caught up</strong>
            <span>Your visitor log is up to date.</span>
          </div>
          <Check className="note-check" size={16} />
        </div>
        <div className="sidebar-bottom">
          <button
            className="user-card"
            onClick={() => {
              setProfileForm(profile);
              setProfileModal(true);
            }}
            aria-label="Edit profile"
          >
            <div className="user-avatar">{initials(profile.name || "Y")}</div>
            <div className="user-details">
              <strong>{profile.name || "Set up your profile"}</strong>
              <span>{profile.role}</span>
            </div>
            <ChevronDown size={15} className="user-chevron" />
          </button>
        </div>
      </aside>

      <main className="main-content" id="home">
        <header className="topbar">
          <div className="breadcrumb">
            <span>Workspace</span>
            <span className="crumb-slash">/</span>
            <strong>Visitor register</strong>
          </div>
          <div className="topbar-right">
            <div className="live-indicator">
              <span /> Front desk open
            </div>
            <div className="topbar-date">
              <CalendarDays size={15} />
              {new Date().toLocaleDateString("en-IN", {
                weekday: "short",
                day: "numeric",
                month: "short",
              })}
            </div>
            <button
              className="topbar-avatar"
              onClick={() => {
                setProfileForm(profile);
                setProfileModal(true);
              }}
              aria-label="Edit profile"
            >
              {initials(profile.name || "Y")}
            </button>
          </div>
        </header>
        <div className="page-content">
          {connectionError && <div className="connection-error">Could not load data from the server: {connectionError}. Start the backend and confirm its MongoDB connection.</div>}
          <section className="welcome-row">
            <div>
              <div className="eyebrow">
                <span className="eyebrow-line" /> YOUR FRONT DESK, AT A GLANCE
              </div>
              <h1>
                {profile.name
                  ? `Welcome back, ${profile.name.split(" ")[0]}`
                  : "Welcome to your front desk"}{" "}
                <span className="wave"></span>
              </h1>
              <p className="welcome-copy">
                A clear view of everyone who’s walked through the door.
              </p>
            </div>
            <button className="primary-button" onClick={openNew}>
              <span className="plus">+</span> Register a visitor
            </button>
          </section>

          <section className="stats-grid" aria-label="Visitor statistics">
            <article className="stat-card stat-primary">
              <div className="stat-top">
                <span className="stat-label">Visitors today</span>
                <span className="stat-icon blue">
                  <Users size={17} />
                </span>
              </div>
              <div className="stat-value">
                {String(todayCount).padStart(2, "0")}
                <span className="stat-trend">
                  <ArrowUpRight size={14} /> Today
                </span>
              </div>
              <div className="stat-foot">Registered since midnight</div>
              <div className="stat-spark">
                <span style={{ height: "27%" }} />
                <span style={{ height: "42%" }} />
                <span style={{ height: "33%" }} />
                <span style={{ height: "53%" }} />
                <span style={{ height: "39%" }} />
                <span style={{ height: "65%" }} />
                <span style={{ height: "49%" }} />
                <span style={{ height: "75%" }} />
                <span style={{ height: "58%" }} />
                <span style={{ height: "90%" }} />
                <span style={{ height: "72%" }} />
                <span style={{ height: "100%" }} />
              </div>
            </article>
            <article className="stat-card">
              <div className="stat-top">
                <span className="stat-label">Total check-ins</span>
                <span className="stat-icon sage">
                  <DoorOpen size={17} />
                </span>
              </div>
              <div className="stat-value">
                {String(visitors.length).padStart(2, "0")}
                <span className="stat-trend neutral">
                  <span className="trend-dot" /> All time
                </span>
              </div>
              <div className="stat-foot">Visitors in your register</div>
              <div className="stat-watermark">
                <Users size={62} strokeWidth={1} />
              </div>
            </article>
            <article className="stat-card">
              <div className="stat-top">
                <span className="stat-label">Person to meet</span>
                <span className="stat-icon peach">
                  <Building2 size={17} />
                </span>
              </div>
              <div className="stat-value stat-name">
                {visitors.length
                  ? Object.entries(
                      visitors.reduce(
                        (counts, v) => ({
                          ...counts,
                          [v.person]: (counts[v.person] || 0) + 1,
                        }),
                        {},
                      ),
                    ).sort((a, b) => b[1] - a[1])[0]?.[0] || "—"
                  : "—"}
              </div>
              <div className="stat-foot">Most requested in your register</div>
              <div className="stat-watermark orange">
                <Sparkles size={55} strokeWidth={1} />
              </div>
            </article>
          </section>

          <section className="register-section">
            <div className="section-heading">
              <div>
                <div className="section-eyebrow">THE FRONT DESK</div>
                <h2>
                  Visitor register{" "}
                  <span className="record-count">{visitors.length}</span>
                </h2>
              </div>
              <button className="export-button" onClick={exportCsv}>
                <ArrowDownToLine size={16} /> Export CSV
              </button>
            </div>
            <div className="table-toolbar">
              <div className="tabs">
                <button
                  className={
                    filter === "All visitors" ? "tab active-tab" : "tab"
                  }
                  onClick={() => setFilter("All visitors")}
                >
                  All visitors <span>{visitors.length}</span>
                </button>
                <button
                  className={filter === "Today" ? "tab active-tab" : "tab"}
                  onClick={() => setFilter("Today")}
                >
                  Today <span>{todayCount}</span>
                </button>
              </div>
              <label className="search-box">
                <Search size={16} />
                <input
                  placeholder="Search name or mobile..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <kbd>⌘ K</kbd>
              </label>
              <button
                className="filter-button"
                onClick={() =>
                  setFilter(filter === "Today" ? "All visitors" : "Today")
                }
              >
                <CalendarDays size={15} />
                {filter === "Today" ? "Today" : "Any date"}
                <ChevronDown size={14} />
              </button>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>VISITOR</th>
                    <th>COMPANY / COLLEGE</th>
                    <th>PERSON TO MEET</th>
                    <th>PURPOSE</th>
                    <th>CHECKED IN</th>
                    <th aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="6">Loading visitor register…</td></tr>
                  ) : filtered.map((visitor, index) => (
                    <tr
                      key={visitor.id}
                      style={{ animationDelay: `${index * 40}ms` }}
                    >
                      <td>
                        <div className="visitor-cell">
                          <div className={`visitor-avatar avatar-${index % 5}`}>
                            {initials(visitor.name)}
                          </div>
                          <div className="visitor-meta">
                            <strong>{visitor.name}</strong>
                            <span>{visitor.mobile}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="company-cell">
                          <span className="company-logo">
                            <Building2 size={14} />
                          </span>
                          <span>{visitor.company}</span>
                        </div>
                      </td>
                      <td>
                        <div className="person-cell">
                          <span className="person-avatar">
                            {initials(visitor.person)}
                          </span>
                          {visitor.person}
                        </div>
                      </td>
                      <td>
                        <span
                          className={`purpose-tag purpose-${visitor.purpose.toLowerCase().split(" ")[0]}`}
                        >
                          {visitor.purpose}
                        </span>
                      </td>
                      <td>
                        <div className="time-cell">
                          <strong>{timeLabel(visitor.date)}</strong>
                          <span>{dateLabel(visitor.date)}</span>
                        </div>
                      </td>
                      <td className="action-cell">
                        <button
                          className="more-button"
                          aria-label={`Actions for ${visitor.name}`}
                          onClick={() =>
                            setMenu(menu === visitor.id ? null : visitor.id)
                          }
                        >
                          <Ellipsis size={19} />
                        </button>
                        {menu === visitor.id && (
                          <div className="row-menu">
                            <button onClick={() => openEdit(visitor)}>
                              Edit details
                            </button>
                            <button
                              className="delete-option"
                              onClick={() => removeVisitor(visitor.id)}
                            >
                              Delete record
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {!loading && filtered.length === 0 && (
                    <tr>
                      <td colSpan="6">
                        <div className="empty-state">
                          <div className="empty-icon">
                            <Search size={20} />
                          </div>
                          <strong>No visitors found</strong>
                          <span>
                            Try a different search or register a new visitor.
                          </span>
                          <button onClick={openNew}>Register a visitor</button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <footer className="table-footer">
              <span>
                Showing{" "}
                <strong>
                  {filtered.length ? 1 : 0}–{filtered.length}
                </strong>{" "}
                of <strong>{visitors.length}</strong> visitors
              </span>
              <div className="footer-status">
                <span className="footer-live" /> Data saved to MongoDB
              </div>
              <div className="pagination">
                <button disabled>‹</button>
                <button className="page-current">1</button>
                <button disabled>›</button>
              </div>
            </footer>
          </section>
          <footer className="page-footer">
            <span></span>
            <span>
              <Clock3 size={13} /> Last synced just now
            </span>
          </footer>
        </div>
      </main>

      {modal && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setModal(false);
          }}
        >
          <form className="visitor-modal" onSubmit={saveVisitor}>
            <div className="modal-head">
              <div>
                <span className="modal-kicker">VISITOR CHECK-IN</span>
                <h2>
                  {editing ? "Edit visitor details" : "Register a visitor"}
                </h2>
                <p>
                  {editing
                    ? "Update this visitor’s information."
                    : "Add a few details to get your guest checked in."}
                </p>
              </div>
              <button
                className="modal-close"
                type="button"
                onClick={() => setModal(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className="form-grid">
              <label className="form-field full-field">
                <span>
                  Visitor name <i>*</i>
                </span>
                <input
                  required
                  autoFocus
                  placeholder="e.g. Aarav Mehta"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </label>
              <label className="form-field">
                <span>
                  Mobile number <i>*</i>
                </span>
                <input
                  required
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={form.mobile}
                  onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                />
              </label>
              <label className="form-field">
                <span>Company / college <i>*</i></span>
                <input
                  required
                  placeholder="Organization name"
                  value={form.company}
                  onChange={(e) =>
                    setForm({ ...form, company: e.target.value })
                  }
                />
              </label>
              <label className="form-field">
                <span>
                  Person to meet <i>*</i>
                </span>
                <input
                  required
                  placeholder="Employee name"
                  value={form.person}
                  onChange={(e) => setForm({ ...form, person: e.target.value })}
                />
              </label>
              <label className="form-field">
                <span>Purpose of visit <i>*</i></span>
                <select
                  required
                  value={form.purpose}
                  onChange={(e) =>
                    setForm({ ...form, purpose: e.target.value })
                  }
                >
                  <option value="">Select a purpose</option>
                  {[
                    "Meeting",
                    "Interview",
                    "Project discussion",
                    "Vendor meeting",
                    "Delivery",
                    "Other",
                  ].map((purpose) => (
                    <option key={purpose}>{purpose}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="auto-time">
              <span className="auto-time-icon">
                <Clock3 size={15} />
              </span>
              <span>Check-in time</span>
              <strong>
                {editing
                  ? `${dateLabel(editing.date)} · ${timeLabel(editing.date)}`
                  : `Automatically set to ${timeLabel(new Date())}`}
              </strong>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="cancel-button"
                onClick={() => setModal(false)}
              >
                Cancel
              </button>
              <button type="submit" className="primary-button">
                <Check size={16} />
                {editing ? "Save changes" : "Check in visitor"}
              </button>
            </div>
          </form>
        </div>
      )}
      {profileModal && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setProfileModal(false);
          }}
        >
          <form className="visitor-modal profile-modal" onSubmit={saveProfile}>
            <div className="modal-head">
              <div>
                <span className="modal-kicker">YOUR ACCOUNT</span>
                <h2>Edit your profile</h2>
                <p>These details personalize the front desk.</p>
              </div>
              <button
                className="modal-close"
                type="button"
                onClick={() => setProfileModal(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className="form-grid">
              <label className="form-field full-field">
                <span>Your name</span>
                <input
                  autoFocus
                  placeholder="Enter your name"
                  value={profileForm.name}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, name: e.target.value })
                  }
                />
              </label>
              <label className="form-field full-field">
                <span>Your role</span>
                <input
                  placeholder="Receptionist"
                  value={profileForm.role}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, role: e.target.value })
                  }
                />
              </label>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="cancel-button"
                onClick={() => setProfileModal(false)}
              >
                Cancel
              </button>
              <button type="submit" className="primary-button">
                <Check size={16} />
                Save profile
              </button>
            </div>
          </form>
        </div>
      )}
      {toast && (
        <div className="toast">
          <span>
            <Check size={15} />
          </span>
          {toast}
        </div>
      )}
    </div>
  );
}
