import { useState, useEffect, useRef } from "react";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Sunday"];
const ALL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const displayShort = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const SCHEDULE = {
  Monday:    { tasks: ["Floors", "Bathrooms", "Mirrors"], shift: "7–10 PM", type: "general" },
  Tuesday:   { tasks: ["Floors", "Bathrooms"], shift: "7–10 PM", type: "general" },
  Wednesday: { tasks: ["Floors", "Bathrooms"], shift: "7–10 PM", type: "general" },
  Thursday:  { tasks: ["Floors", "Bathrooms", "Mirrors"], shift: "7–10 PM", type: "general" },
  Friday:    { tasks: [], shift: "Off", type: "off" },
  Sunday:    { tasks: ["Floors", "Bathrooms", "Gym Equipment", "Exterior Weeds", "Nooks & Crannies", "Scrubbing / Detail Work"], shift: "Deep Clean", type: "deep" },
};

const today = () => {
  const d = new Date().toLocaleDateString("en-US", { weekday: "long" });
  return ALL_DAYS.includes(d) ? d : "Monday";
};

const makeChecks = (day) =>
  Object.fromEntries((SCHEDULE[day]?.tasks || []).map((t) => [t, false]));

const STORAGE_KEY = "evolv-clean-data";
const SUPPLIES_KEY = "evolv-supplies-data";
const PROJECTS_KEY = "evolv-projects-data";

const typeColor = { general: "#2dd4bf", deep: "#e85d4a", off: "#666" };
const typeLabel = { general: "General Clean", deep: "Deep Clean", off: "Day Off" };

// ── Supplies Tab ────────────────────────────────────────────────────────────
function SuppliesTab() {
  const [supplies, setSupplies] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [savingLocal, setSavingLocal] = useState(false);
  const saveTimer = useRef(null);
  const needRef = useRef(null);
  const soonRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const result = await window.storage.get(SUPPLIES_KEY);
        if (result && result.value) {
          setSupplies(JSON.parse(result.value));
        } else {
          setSupplies({ need: [], soon: [] });
        }
      } catch {
        setSupplies({ need: [], soon: [] });
      }
      setLoaded(true);
    };
    load();
  }, []);

  const save = async (data) => {
    setSavingLocal(true);
    try {
      await window.storage.set(SUPPLIES_KEY, JSON.stringify(data));
    } catch (e) { console.error(e); }
    setTimeout(() => setSavingLocal(false), 800);
  };

  const debSave = (data) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => save(data), 500);
  };

  const addItem = (bucket) => {
    const ref = bucket === "need" ? needRef : soonRef;
    const text = ref.current?.value?.trim();
    if (!text) return;
    const updated = { ...supplies, [bucket]: [...supplies[bucket], { id: Date.now(), text, done: false }] };
    setSupplies(updated);
    if (ref.current) ref.current.value = "";
    debSave(updated);
  };

  const toggleItem = (bucket, id) => {
    const updated = { ...supplies, [bucket]: supplies[bucket].map(i => i.id === id ? { ...i, done: !i.done } : i) };
    setSupplies(updated);
    debSave(updated);
  };

  const removeItem = (bucket, id) => {
    const updated = { ...supplies, [bucket]: supplies[bucket].filter(i => i.id !== id) };
    setSupplies(updated);
    debSave(updated);
  };

  const moveTo = (fromBucket, id) => {
    const toBucket = fromBucket === "need" ? "soon" : "need";
    const item = supplies[fromBucket].find(i => i.id === id);
    if (!item) return;
    const updated = {
      ...supplies,
      [fromBucket]: supplies[fromBucket].filter(i => i.id !== id),
      [toBucket]: [...supplies[toBucket], { ...item, done: false }],
    };
    setSupplies(updated);
    debSave(updated);
  };

  if (!loaded || !supplies) return (
    <div style={{ padding: 32, textAlign: "center", color: "#2dd4bf" }}>Loading...</div>
  );

  const Section = ({ bucket, label, color, placeholder, inputRef }) => (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: color }} />
        <div style={{ fontSize: 13, fontWeight: 700, color, letterSpacing: 1 }}>{label}</div>
        <div style={{ fontSize: 11, color: "#555", marginLeft: "auto" }}>{supplies[bucket].length} item{supplies[bucket].length !== 1 ? "s" : ""}</div>
      </div>

      {/* Add input — uncontrolled to prevent keyboard dismiss */}
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <input
          ref={inputRef}
          defaultValue=""
          onKeyDown={(e) => e.key === "Enter" && addItem(bucket)}
          placeholder={placeholder}
          style={{
            flex: 1, background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8,
            color: "#f0f0f0", padding: "10px 12px", fontSize: 13, outline: "none",
            fontFamily: "inherit",
          }}
        />
        <button onClick={() => addItem(bucket)} style={{
          background: color, border: "none", borderRadius: 8, padding: "10px 14px",
          color: "#111", fontWeight: 700, fontSize: 16, cursor: "pointer",
        }}>+</button>
      </div>

      {/* Items */}
      {supplies[bucket].length === 0 ? (
        <div style={{ background: "#1a1a1a", borderRadius: 10, padding: 16, textAlign: "center", color: "#444", fontSize: 12, border: "1px dashed #2a2a2a" }}>
          No items yet
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {supplies[bucket].map((item) => (
            <div key={item.id} style={{
              display: "flex", alignItems: "center", gap: 10,
              background: item.done ? "#1a2a1a" : "#1a1a1a",
              border: `1px solid ${item.done ? color + "33" : "#2a2a2a"}`,
              borderRadius: 10, padding: "11px 12px",
            }}>
              <button onClick={() => toggleItem(bucket, item.id)} style={{
                width: 22, height: 22, borderRadius: 5, flexShrink: 0, cursor: "pointer",
                background: item.done ? color : "transparent",
                border: `2px solid ${item.done ? color : "#444"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {item.done && <span style={{ color: "#111", fontSize: 12, fontWeight: 900 }}>✓</span>}
              </button>
              <span style={{ flex: 1, fontSize: 14, color: item.done ? "#555" : "#f0f0f0", textDecoration: item.done ? "line-through" : "none" }}>
                {item.text}
              </span>
              <button onClick={() => moveTo(bucket, item.id)} title={bucket === "need" ? "Move to Will Need Soon" : "Move to Need Now"} style={{
                background: "transparent", border: "1px solid #333", borderRadius: 5,
                color: "#666", fontSize: 10, padding: "3px 6px", cursor: "pointer",
              }}>
                {bucket === "need" ? "→ Soon" : "→ Need"}
              </button>
              <button onClick={() => removeItem(bucket, item.id)} style={{
                background: "transparent", border: "none", color: "#444",
                fontSize: 16, cursor: "pointer", padding: "0 4px", lineHeight: 1,
              }}>×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div style={{ padding: 16, maxWidth: 480, margin: "0 auto" }}>
      <div style={{ fontSize: 10, color: savingLocal ? "#2dd4bf" : "#444", textAlign: "right", marginBottom: 8, transition: "color 0.3s" }}>
        {savingLocal ? "💾 Saving..." : "✓ Saved"}
      </div>
      <Section bucket="need" label="NEED NOW" color="#e85d4a" placeholder="e.g. Mop heads, Windex..." inputRef={needRef} />
      <div style={{ height: 1, background: "#2a2a2a", marginBottom: 24 }} />
      <Section bucket="soon" label="WILL NEED SOON" color="#f5a623" placeholder="e.g. Trash bags, Gloves..." inputRef={soonRef} />
    </div>
  );
}

// ── Projects Tab ────────────────────────────────────────────────────────────
function ProjectsTab() {
  const [projects, setProjects] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [savingLocal, setSavingLocal] = useState(false);
  const [filter, setFilter] = useState("all"); // "all" | "active" | "done"
  const saveTimer = useRef(null);
  const inputRef = useRef(null);
  const notesRef = useRef({});

  useEffect(() => {
    const load = async () => {
      try {
        const result = await window.storage.get(PROJECTS_KEY);
        if (result && result.value) {
          setProjects(JSON.parse(result.value));
        } else {
          setProjects([]);
        }
      } catch {
        setProjects([]);
      }
      setLoaded(true);
    };
    load();
  }, []);

  const save = async (data) => {
    setSavingLocal(true);
    try {
      await window.storage.set(PROJECTS_KEY, JSON.stringify(data));
    } catch (e) { console.error(e); }
    setTimeout(() => setSavingLocal(false), 800);
  };

  const debSave = (data) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => save(data), 500);
  };

  const addProject = () => {
    const text = inputRef.current?.value?.trim();
    if (!text) return;
    const updated = [...projects, { id: Date.now(), text, done: false, notes: "" }];
    setProjects(updated);
    if (inputRef.current) inputRef.current.value = "";
    debSave(updated);
  };

  const toggleProject = (id) => {
    const updated = projects.map(p => p.id === id ? { ...p, done: !p.done } : p);
    setProjects(updated);
    debSave(updated);
  };

  const removeProject = (id) => {
    const updated = projects.filter(p => p.id !== id);
    setProjects(updated);
    debSave(updated);
  };

  const updateNotes = (id, val) => {
    const updated = projects.map(p => p.id === id ? { ...p, notes: val } : p);
    setProjects(updated);
    debSave(updated);
  };

  if (!loaded || !projects) return (
    <div style={{ padding: 32, textAlign: "center", color: "#2dd4bf" }}>Loading...</div>
  );

  const filtered = projects.filter(p => {
    if (filter === "active") return !p.done;
    if (filter === "done") return p.done;
    return true;
  });

  const activeCount = projects.filter(p => !p.done).length;
  const doneCount = projects.filter(p => p.done).length;

  return (
    <div style={{ padding: 16, maxWidth: 480, margin: "0 auto" }}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ fontSize: 10, color: savingLocal ? "#2dd4bf" : "#444", transition: "color 0.3s" }}>
          {savingLocal ? "💾 Saving..." : "✓ Saved"}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {["all", "active", "done"].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: "4px 10px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 10,
              fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5,
              background: filter === f ? "#2dd4bf" : "#1e1e1e",
              color: filter === f ? "#111" : "#666",
              outline: filter === f ? "none" : "1px solid #2a2a2a",
            }}>{f}</button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <div style={{ flex: 1, background: "#1a1a1a", borderRadius: 10, padding: "10px 14px", border: "1px solid #2a2a2a", textAlign: "center" }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#f5a623" }}>{activeCount}</div>
          <div style={{ fontSize: 10, color: "#666", marginTop: 2 }}>IN PROGRESS</div>
        </div>
        <div style={{ flex: 1, background: "#1a1a1a", borderRadius: 10, padding: "10px 14px", border: "1px solid #2a2a2a", textAlign: "center" }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#2dd4bf" }}>{doneCount}</div>
          <div style={{ fontSize: 10, color: "#666", marginTop: 2 }}>COMPLETED</div>
        </div>
      </div>

      {/* Add input */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          ref={inputRef}
          defaultValue=""
          onKeyDown={(e) => e.key === "Enter" && addProject()}
          placeholder="Add a project... (e.g. Scrub staircase)"
          style={{
            flex: 1, background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8,
            color: "#f0f0f0", padding: "10px 12px", fontSize: 13, outline: "none",
            fontFamily: "inherit",
          }}
        />
        <button onClick={addProject} style={{
          background: "#2dd4bf", border: "none", borderRadius: 8, padding: "10px 14px",
          color: "#111", fontWeight: 700, fontSize: 16, cursor: "pointer",
        }}>+</button>
      </div>

      {/* Project list */}
      {filtered.length === 0 ? (
        <div style={{ background: "#1a1a1a", borderRadius: 12, padding: 24, textAlign: "center", color: "#444", fontSize: 12, border: "1px dashed #2a2a2a" }}>
          {filter === "done" ? "No completed projects yet" : filter === "active" ? "No active projects" : "No projects yet — add one above"}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map((project) => (
            <div key={project.id} style={{
              background: project.done ? "#1a2a1a" : "#1a1a1a",
              border: `1px solid ${project.done ? "#2dd4bf33" : "#2a2a2a"}`,
              borderRadius: 12, overflow: "hidden",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 14px" }}>
                <button onClick={() => toggleProject(project.id)} style={{
                  width: 24, height: 24, borderRadius: 6, flexShrink: 0, cursor: "pointer",
                  background: project.done ? "#2dd4bf" : "transparent",
                  border: `2px solid ${project.done ? "#2dd4bf" : "#444"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {project.done && <span style={{ color: "#111", fontSize: 13, fontWeight: 900 }}>✓</span>}
                </button>
                <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: project.done ? "#666" : "#f0f0f0", textDecoration: project.done ? "line-through" : "none" }}>
                  {project.text}
                </span>
                {project.done && <span style={{ fontSize: 10, color: "#2dd4bf", marginRight: 4 }}>Done</span>}
                <button onClick={() => removeProject(project.id)} style={{
                  background: "transparent", border: "none", color: "#444",
                  fontSize: 18, cursor: "pointer", padding: "0 4px", lineHeight: 1,
                }}>×</button>
              </div>
              {/* Notes field per project */}
              <div style={{ borderTop: "1px solid #222", padding: "8px 14px 10px" }}>
                <textarea
                  defaultValue={project.notes || ""}
                  ref={el => notesRef.current[project.id] = el}
                  onChange={(e) => updateNotes(project.id, e.target.value)}
                  placeholder="Project notes..."
                  style={{
                    width: "100%", background: "transparent", border: "none",
                    color: "#888", fontSize: 12, resize: "none", outline: "none",
                    fontFamily: "inherit", minHeight: 36, boxSizing: "border-box",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main App ────────────────────────────────────────────────────────────────
export default function App() {
  const [activeDay, setActiveDay] = useState(today());
  const [checks, setChecks] = useState(null);
  const [notes, setNotes] = useState(null);
  const [view, setView] = useState("checklist");
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const saveTimer = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const result = await window.storage.get(STORAGE_KEY);
        if (result && result.value) {
          const saved = JSON.parse(result.value);
          setChecks(saved.checks || buildDefaultChecks());
          setNotes(saved.notes || buildDefaultNotes());
        } else {
          setChecks(buildDefaultChecks());
          setNotes(buildDefaultNotes());
        }
      } catch {
        setChecks(buildDefaultChecks());
        setNotes(buildDefaultNotes());
      }
      setLoaded(true);
    };
    load();
  }, []);

  const buildDefaultChecks = () => {
    const init = {};
    ALL_DAYS.forEach((d) => { init[d] = makeChecks(d); });
    return init;
  };

  const buildDefaultNotes = () => {
    const init = {};
    ALL_DAYS.forEach((d) => { init[d] = ""; });
    return init;
  };

  const saveData = async (newChecks, newNotes) => {
    if (!loaded) return;
    setSaving(true);
    try {
      await window.storage.set(STORAGE_KEY, JSON.stringify({ checks: newChecks, notes: newNotes }));
    } catch (e) { console.error(e); }
    setTimeout(() => setSaving(false), 800);
  };

  const debouncedSave = (newChecks, newNotes) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveData(newChecks, newNotes), 600);
  };

  const toggle = (task) => {
    const newChecks = { ...checks, [activeDay]: { ...checks[activeDay], [task]: !checks[activeDay][task] } };
    setChecks(newChecks);
    debouncedSave(newChecks, notes);
  };

  const updateNote = (val) => {
    const newNotes = { ...notes, [activeDay]: val };
    setNotes(newNotes);
    debouncedSave(checks, newNotes);
  };

  const resetDay = (day) => {
    const newChecks = { ...checks, [day]: makeChecks(day) };
    const newNotes = { ...notes, [day]: "" };
    setChecks(newChecks);
    setNotes(newNotes);
    saveData(newChecks, newNotes);
  };

  if (!loaded || !checks || !notes) {
    return (
      <div style={{ minHeight: "100vh", background: "#111", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#2dd4bf", fontSize: 14 }}>Loading...</div>
      </div>
    );
  }

  const dayData = SCHEDULE[activeDay] || { tasks: [], shift: "Off", type: "off" };
  const dayChecks = checks[activeDay] || {};
  const total = Object.keys(dayChecks).length;
  const done = Object.values(dayChecks).filter(Boolean).length;
  const pct = total === 0 ? 100 : Math.round((done / total) * 100);

  const tabs = [
    { id: "checklist", label: "📋 Checklist" },
    { id: "schedule",  label: "📅 Schedule" },
    { id: "supplies",  label: "🧴 Supplies" },
    { id: "projects",  label: "🔧 Projects" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#111", color: "#f0f0f0", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ background: "#1a1a1a", borderBottom: "2px solid #2dd4bf", padding: "16px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, flexShrink: 0 }}>
              <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
                <defs>
                  <linearGradient id="orangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ff6a00"/>
                    <stop offset="100%" stopColor="#ff9d00"/>
                  </linearGradient>
                  <linearGradient id="greyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#999"/>
                    <stop offset="100%" stopColor="#ccc"/>
                  </linearGradient>
                </defs>
                {/* Outer orange ring */}
                <circle cx="50" cy="50" r="44" fill="none" stroke="url(#orangeGrad)" strokeWidth="6" strokeDasharray="240 36" strokeLinecap="round"/>
                {/* Grey inner swoosh */}
                <circle cx="50" cy="50" r="34" fill="none" stroke="url(#greyGrad)" strokeWidth="10" strokeDasharray="140 74" strokeDashoffset="30" strokeLinecap="round"/>
                {/* Phoenix body */}
                <ellipse cx="52" cy="54" rx="14" ry="10" fill="url(#orangeGrad)" transform="rotate(-20 52 54)"/>
                {/* Wing left */}
                <ellipse cx="38" cy="58" rx="10" ry="5" fill="url(#greyGrad)" transform="rotate(-40 38 58)"/>
                {/* Wing right */}
                <ellipse cx="64" cy="58" rx="10" ry="5" fill="url(#greyGrad)" transform="rotate(40 64 58)"/>
                {/* Neck */}
                <ellipse cx="50" cy="44" rx="6" ry="8" fill="url(#orangeGrad)" transform="rotate(-10 50 44)"/>
                {/* Head */}
                <ellipse cx="48" cy="37" rx="5" ry="4" fill="url(#orangeGrad)"/>
                {/* Beak */}
                <polygon points="43,35 38,33 44,37" fill="#ff6a00"/>
                {/* Eye */}
                <circle cx="46" cy="36" r="1.2" fill="#1a1a1a"/>
              </svg>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: 1, color: "#fff" }}>EVOLV STRONG</div>
              <div style={{ fontSize: 11, color: "#2dd4bf", letterSpacing: 2 }}>CLEANING TRACKER</div>
            </div>
          </div>
          <div style={{ fontSize: 10, color: saving ? "#2dd4bf" : "#444", transition: "color 0.3s" }}>
            {saving ? "💾 Saving..." : "✓ Saved"}
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{ display: "flex", background: "#1a1a1a", borderBottom: "1px solid #2a2a2a" }}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setView(t.id)} style={{
            flex: 1, padding: "12px 0", border: "none", cursor: "pointer",
            background: view === t.id ? "#2dd4bf" : "transparent",
            color: view === t.id ? "#111" : "#888",
            fontWeight: 700, fontSize: 11, letterSpacing: 0.5,
            textTransform: "uppercase", transition: "all 0.2s",
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Supplies Tab */}
      {view === "supplies" && <SuppliesTab />}

      {/* Projects Tab */}
      {view === "projects" && <ProjectsTab />}

      {/* Checklist Tab */}
      {view === "checklist" && (
        <div style={{ padding: 16, maxWidth: 480, margin: "0 auto" }}>
          {/* Day Selector */}
          <div style={{ display: "flex", gap: 6, marginBottom: 16, overflowX: "auto", paddingBottom: 4 }}>
            {ALL_DAYS.map((d, i) => {
              const dc = checks[d] || {};
              const dt = Object.keys(dc).length;
              const dd = Object.values(dc).filter(Boolean).length;
              const type = SCHEDULE[d]?.type || "off";
              const isOff = type === "off";
              return (
                <button key={d} onClick={() => setActiveDay(d)} style={{
                  minWidth: 48, padding: "8px 6px", borderRadius: 8, border: "none", cursor: "pointer",
                  background: activeDay === d ? typeColor[type] : "#1e1e1e",
                  color: activeDay === d ? "#111" : "#aaa",
                  fontWeight: activeDay === d ? 700 : 400,
                  fontSize: 11, textAlign: "center", transition: "all 0.2s",
                  outline: activeDay === d ? "none" : "1px solid #2a2a2a",
                }}>
                  <div>{displayShort[i]}</div>
                  {!isOff && dt > 0 ? (
                    <div style={{ fontSize: 9, marginTop: 2, color: activeDay === d ? "#111" : (dd === dt ? "#2dd4bf" : "#666") }}>{dd}/{dt}</div>
                  ) : <div style={{ fontSize: 9, marginTop: 2 }}>—</div>}
                </button>
              );
            })}
          </div>

          {/* Day Header */}
          <div style={{ background: "#1a1a1a", borderRadius: 12, padding: 16, marginBottom: 12, border: `1px solid ${typeColor[dayData.type]}22` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#fff" }}>{activeDay}</div>
                <div style={{ fontSize: 12, color: typeColor[dayData.type], fontWeight: 600, marginTop: 2 }}>
                  {typeLabel[dayData.type]} · {dayData.shift}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                {dayData.type !== "off" && total > 0 && (
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: pct === 100 ? "#2dd4bf" : "#fff" }}>{pct}%</div>
                    <div style={{ fontSize: 10, color: "#666" }}>{done}/{total} done</div>
                  </div>
                )}
                <button onClick={() => resetDay(activeDay)} style={{
                  fontSize: 10, padding: "4px 8px", borderRadius: 6, border: "1px solid #333",
                  background: "transparent", color: "#666", cursor: "pointer",
                }}>↺ Reset Day</button>
              </div>
            </div>
            {total > 0 && (
              <div style={{ marginTop: 12, height: 4, background: "#2a2a2a", borderRadius: 2 }}>
                <div style={{ width: `${pct}%`, height: "100%", background: pct === 100 ? "#2dd4bf" : typeColor[dayData.type], borderRadius: 2, transition: "width 0.4s ease" }} />
              </div>
            )}
          </div>

          {/* Tasks */}
          {dayData.type === "off" ? (
            <div style={{ background: "#1a1a1a", borderRadius: 12, padding: 24, textAlign: "center", color: "#555", border: "1px solid #2a2a2a" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🛋️</div>
              <div style={{ fontWeight: 600 }}>Rest Day</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>No cleaning scheduled</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
              {dayData.tasks.map((task) => {
                const checked = dayChecks[task] || false;
                return (
                  <button key={task} onClick={() => toggle(task)} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    background: checked ? "#1e2e2b" : "#1a1a1a",
                    border: `1px solid ${checked ? "#2dd4bf44" : "#2a2a2a"}`,
                    borderRadius: 10, padding: "14px 16px", cursor: "pointer",
                    textAlign: "left", transition: "all 0.2s",
                  }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: 6, flexShrink: 0,
                      background: checked ? "#2dd4bf" : "transparent",
                      border: `2px solid ${checked ? "#2dd4bf" : "#444"}`,
                      display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s",
                    }}>
                      {checked && <span style={{ color: "#111", fontSize: 14, fontWeight: 900 }}>✓</span>}
                    </div>
                    <span style={{ color: checked ? "#888" : "#f0f0f0", fontWeight: 500, fontSize: 15, textDecoration: checked ? "line-through" : "none" }}>
                      {task}
                    </span>
                    {checked && <span style={{ marginLeft: "auto", fontSize: 11, color: "#2dd4bf" }}>Done</span>}
                  </button>
                );
              })}
            </div>
          )}

          {total > 0 && done === total && (
            <div style={{ background: "#1e2e2b", border: "1px solid #2dd4bf", borderRadius: 10, padding: 14, textAlign: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 20 }}>✅</div>
              <div style={{ color: "#2dd4bf", fontWeight: 700, fontSize: 14 }}>All tasks complete — you're good to go!</div>
            </div>
          )}

          {/* Notes */}
          <div style={{ background: "#1a1a1a", borderRadius: 12, border: "1px solid #2a2a2a", overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid #2a2a2a", fontSize: 12, fontWeight: 700, color: "#888", letterSpacing: 1 }}>
              📝 NOTES FOR {activeDay.toUpperCase()}
            </div>
            <textarea
              value={notes[activeDay] || ""}
              onChange={(e) => updateNote(e.target.value)}
              placeholder="Add notes for today... (supply needs, issues found, follow-ups)"
              style={{
                width: "100%", minHeight: 100, background: "transparent", border: "none",
                color: "#f0f0f0", padding: 16, fontSize: 14, resize: "vertical",
                outline: "none", boxSizing: "border-box", fontFamily: "inherit",
              }}
            />
          </div>
        </div>
      )}

      {/* Schedule Tab */}
      {view === "schedule" && (
        <div style={{ padding: 16, maxWidth: 480, margin: "0 auto" }}>
          <div style={{ fontSize: 13, color: "#888", marginBottom: 12, fontWeight: 600, letterSpacing: 1 }}>WEEKLY OVERVIEW</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {ALL_DAYS.map((d) => {
              const sd = SCHEDULE[d] || { tasks: [], shift: "Off", type: "off" };
              const dc = checks[d] || {};
              const dt = Object.keys(dc).length;
              const dd = Object.values(dc).filter(Boolean).length;
              const hasNote = notes[d] && notes[d].trim().length > 0;
              return (
                <div key={d} onClick={() => { setActiveDay(d); setView("checklist"); }} style={{
                  background: "#1a1a1a", borderRadius: 10, padding: "14px 16px",
                  border: `1px solid ${d === activeDay ? typeColor[sd.type] : "#2a2a2a"}`,
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 12,
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, background: typeColor[sd.type] }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: "#fff", fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
                      {d}
                      {hasNote && <span style={{ fontSize: 9, color: "#2dd4bf", background: "#1e2e2b", padding: "1px 5px", borderRadius: 4 }}>NOTE</span>}
                    </div>
                    <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>
                      {sd.type === "off" ? "Day Off" : sd.tasks.join(" · ")}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, color: typeColor[sd.type], fontWeight: 600 }}>{sd.shift}</div>
                    {dt > 0 && (
                      <div style={{ fontSize: 10, color: dd === dt ? "#2dd4bf" : "#555", marginTop: 2 }}>{dd}/{dt} done</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 20, background: "#1a1a1a", borderRadius: 10, padding: 14, border: "1px solid #2a2a2a" }}>
            <div style={{ fontSize: 11, color: "#666", fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}>LEGEND</div>
            {Object.entries(typeColor).map(([type, color]) => (
              <div key={type} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
                <span style={{ fontSize: 12, color: "#aaa" }}>{typeLabel[type]}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}