import React, { useState, useEffect, useMemo, useRef } from "react";

/* ---------- design tokens ---------- */
const C = {
  ink: "#22282E",
  paper: "#EDEEE7",
  surface: "#FFFFFF",
  brass: "#A6791F",
  moss: "#3F7256",
  rust: "#A34638",
  slate: "#6B7280",
  slateDeep: "#454C55",
  rule: "#DCD9CC",
  ruleDark: "#3A414A",
};

const F = {
  display: "Georgia, 'Times New Roman', serif",
  sans: "-apple-system, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
  mono: "'SF Mono', 'Consolas', 'Courier New', monospace",
};

const WORK_TYPES = ["Analysis", "Development", "Support", "Training", "Meeting", "Testing"];
const STORAGE_KEY = "ledger-time-tracker-data";

/* ---------- helpers ---------- */
const pad = (n) => String(n).padStart(2, "0");
const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const nowHM = () => {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const toMinutes = (hm) => {
  if (!hm) return 0;
  const [h, m] = hm.split(":").map(Number);
  return h * 60 + m;
};
const hoursBetween = (start, end) => {
  let diff = toMinutes(end) - toMinutes(start);
  if (diff < 0) diff += 24 * 60;
  return Math.round((diff / 60) * 100) / 100;
};
const fmtHours = (h) => {
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return `${hh}:${pad(mm)}`;
};
const fmtDateLong = (iso) => {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
};
const uid = () => Math.random().toString(36).slice(2, 10);
const startOfWeek = (iso) => {
  const d = new Date(iso + "T00:00:00");
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  return d;
};

/* ---------- seed data ---------- */
function seedData() {
  const T = todayISO();
  return {
    users: [
      { id: "u1", name: "Alex Morgan" },
      { id: "u2", name: "Priya Nair" },
    ],
    customers: [
      { id: "c1", name: "ABC Corp" },
      { id: "c2", name: "XYZ Ltd" },
    ],
    projects: [
      { id: "p1", name: "Support Retainer", customerId: "c1" },
      { id: "p2", name: "Platform Rebuild", customerId: "c2" },
    ],
    entries: [
      {
        id: uid(), userId: "u1", date: T, customerId: "c1", projectId: "p1",
        task: "Customer Support", workType: "Support", description: "Ticket triage and calls",
        start: "09:00", end: "10:30", hours: 1.5, billable: true, status: "Done",
      },
      {
        id: uid(), userId: "u1", date: T, customerId: "c2", projectId: "p2",
        task: "Development", workType: "Development", description: "API integration work",
        start: "10:30", end: "13:00", hours: 2.5, billable: true, status: "Done",
      },
    ],
    currentUserId: "u1",
  };
}

function loadInitial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error("Could not read saved data, starting fresh:", err);
  }
  return seedData();
}

/* ---------- shared style bits ---------- */
const s = {
  input: {
    width: "100%", boxSizing: "border-box", padding: "9px 11px", fontSize: 14,
    fontFamily: F.sans, background: C.surface, border: `1px solid ${C.rule}`,
    borderRadius: 4, color: C.ink, outline: "none",
  },
  label: {
    display: "block", fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase",
    color: C.slate, marginBottom: 6, fontFamily: F.sans, fontWeight: 500,
  },
  card: {
    background: C.surface, border: `1px solid ${C.rule}`, borderRadius: 6, padding: "20px 22px",
  },
  btn: (variant) => ({
    fontFamily: F.sans, fontSize: 13, fontWeight: 500, padding: "9px 16px", borderRadius: 4,
    cursor: "pointer", border: variant === "primary" ? "none" : `1px solid ${C.rule}`,
    background: variant === "primary" ? C.ink : "transparent",
    color: variant === "primary" ? C.paper : C.ink,
  }),
};

function Field({ children }) {
  return <div style={{ marginBottom: 14 }}>{children}</div>;
}

/* ---------- main app ---------- */
export default function App() {
  const [data, setData] = useState(loadInitial);
  const { users, customers, projects, entries, currentUserId } = data;
  const [tab, setTab] = useState("dashboard");

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      console.error("Could not save data:", err);
    }
  }, [data]);

  const setCustomers = (updater) =>
    setData((d) => ({ ...d, customers: typeof updater === "function" ? updater(d.customers) : updater }));
  const setProjects = (updater) =>
    setData((d) => ({ ...d, projects: typeof updater === "function" ? updater(d.projects) : updater }));
  const setUsers = (updater) =>
    setData((d) => ({ ...d, users: typeof updater === "function" ? updater(d.users) : updater }));
  const setCurrentUserId = (id) => setData((d) => ({ ...d, currentUserId: id }));
  const addEntry = (entry) =>
    setData((d) => ({ ...d, entries: [{ ...entry, id: uid() }, ...d.entries] }));

  const addUser = (name) =>
    setData((d) => ({ ...d, users: [...d.users, { id: uid(), name }] }));

  const deleteUser = (id) =>
    setData((d) => {
      if (d.users.length <= 1) return d; // always keep at least one user
      const remainingUsers = d.users.filter((u) => u.id !== id);
      return {
        ...d,
        users: remainingUsers,
        currentUserId: d.currentUserId === id ? remainingUsers[0].id : d.currentUserId,
        entries: d.entries.filter((e) => e.userId !== id),
      };
    });

  const deleteCustomer = (id) =>
    setData((d) => {
      const projectIds = d.projects.filter((p) => p.customerId === id).map((p) => p.id);
      return {
        ...d,
        customers: d.customers.filter((c) => c.id !== id),
        projects: d.projects.filter((p) => p.customerId !== id),
        entries: d.entries.filter((e) => e.customerId !== id && !projectIds.includes(e.projectId)),
      };
    });

  const deleteProject = (id) =>
    setData((d) => ({
      ...d,
      projects: d.projects.filter((p) => p.id !== id),
      entries: d.entries.filter((e) => e.projectId !== id),
    }));

  const currentUser = users.find((u) => u.id === currentUserId);
  const custName = (id) => customers.find((c) => c.id === id)?.name ?? "—";
  const projName = (id) => projects.find((p) => p.id === id)?.name ?? "—";

  const hasEntryToday = entries.some((e) => e.userId === currentUserId && e.date === todayISO());

  const resetData = () => {
    if (window.confirm("Clear all data stored in this browser and start over?")) {
      const fresh = seedData();
      setData(fresh);
    }
  };

  const nav = [
    { key: "dashboard", label: "Dashboard" },
    { key: "add", label: "Add entry" },
    { key: "timer", label: "Timer" },
    { key: "reports", label: "Reports" },
    { key: "search", label: "Search" },
    { key: "masters", label: "Customers & projects" },
    { key: "team", label: "Users" },
  ];

  return (
    <div style={{ fontFamily: F.sans, background: C.paper, minHeight: "100vh", display: "flex", color: C.ink }}>
      {/* sidebar */}
      <div style={{ width: 210, background: C.ink, color: C.paper, padding: "22px 0", flexShrink: 0 }}>
        <div style={{ padding: "0 20px 22px", borderBottom: `1px solid ${C.ruleDark}`, marginBottom: 14 }}>
          <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, letterSpacing: "0.01em" }}>
            Ledger
          </div>
          <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>Time tracking</div>
        </div>

        {nav.map((n) => (
          <div
            key={n.key}
            onClick={() => setTab(n.key)}
            style={{
              padding: "10px 20px", fontSize: 13.5, cursor: "pointer",
              borderLeft: tab === n.key ? `3px solid ${C.brass}` : "3px solid transparent",
              background: tab === n.key ? "rgba(166,121,31,0.14)" : "transparent",
              color: tab === n.key ? "#fff" : "#B7BCC4", fontWeight: tab === n.key ? 500 : 400,
            }}
          >
            {n.label}
          </div>
        ))}

        <div style={{ marginTop: 22, padding: "0 20px" }}>
          <div style={{ ...s.label, color: "#8B9099" }}>User</div>
          <select
            value={currentUserId}
            onChange={(e) => setCurrentUserId(e.target.value)}
            style={{
              width: "100%", background: "#2E353D", color: "#fff", border: `1px solid ${C.ruleDark}`,
              borderRadius: 4, padding: "7px 8px", fontSize: 13, fontFamily: F.sans,
            }}
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>

        <div style={{ padding: "0 20px", marginTop: 24 }}>
          <div style={{ fontSize: 11, color: "#8B9099", lineHeight: 1.5 }}>
            Data is saved in this browser only.
          </div>
          <button onClick={resetData} style={{ ...s.btn(), marginTop: 8, padding: "6px 10px", fontSize: 12, color: "#B7BCC4", borderColor: C.ruleDark }}>
            Reset data
          </button>
        </div>
      </div>

      {/* main */}
      <div style={{ flex: 1, padding: "28px 34px", minWidth: 0 }}>
        {!hasEntryToday && tab !== "add" && tab !== "timer" && (
          <div
            style={{
              background: "#F6E9E5", border: `1px solid ${C.rust}`, color: "#7A2E22",
              borderRadius: 5, padding: "10px 14px", fontSize: 13, marginBottom: 20,
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}
          >
            <span>No time logged today for {currentUser?.name}.</span>
            <button onClick={() => setTab("add")} style={{ ...s.btn(), padding: "6px 12px", borderColor: C.rust, color: "#7A2E22" }}>
              Add entry
            </button>
          </div>
        )}

        {tab === "dashboard" && (
          <Dashboard entries={entries} currentUserId={currentUserId} custName={custName} projName={projName} />
        )}
        {tab === "add" && (
          <AddEntry customers={customers} projects={projects} currentUserId={currentUserId} onAdd={addEntry} />
        )}
        {tab === "timer" && (
          <TimerView customers={customers} projects={projects} currentUserId={currentUserId} onAdd={addEntry} />
        )}
        {tab === "reports" && (
          <Reports entries={entries} custName={custName} projName={projName} />
        )}
        {tab === "search" && (
          <SearchView entries={entries} custName={custName} projName={projName} />
        )}
        {tab === "masters" && (
          <Masters
            customers={customers} setCustomers={setCustomers}
            projects={projects} setProjects={setProjects}
            deleteCustomer={deleteCustomer} deleteProject={deleteProject}
          />
        )}
        {tab === "team" && (
          <TeamView users={users} addUser={addUser} deleteUser={deleteUser} currentUserId={currentUserId} />
        )}
      </div>
    </div>
  );
}

/* ---------- ledger table ---------- */
function LedgerRow({ e, custName, projName, dense }) {
  const markColor = e.status === "Done" ? C.moss : e.status === "Running" ? C.brass : C.slate;
  return (
    <tr style={{ borderBottom: `1px solid ${C.rule}` }}>
      <td style={{ width: 4, padding: 0, background: markColor }} />
      <td style={{ padding: "10px 12px", fontSize: 13.5 }}>{e.task}</td>
      <td style={{ padding: "10px 12px", fontSize: 13, color: C.slateDeep }}>{custName(e.customerId)}</td>
      <td style={{ padding: "10px 12px", fontSize: 13, color: C.slateDeep }}>{projName(e.projectId)}</td>
      {!dense && <td style={{ padding: "10px 12px", fontSize: 12.5, color: C.slate }}>{e.workType}</td>}
      <td style={{ padding: "10px 12px", fontFamily: F.mono, fontSize: 13 }}>{e.start}</td>
      <td style={{ padding: "10px 12px", fontFamily: F.mono, fontSize: 13 }}>{e.end}</td>
      <td style={{ padding: "10px 12px", fontFamily: F.mono, fontSize: 13, fontWeight: 500 }}>{fmtHours(e.hours)}</td>
      <td style={{ padding: "10px 12px", fontSize: 12 }}>
        <span style={{
          padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 500,
          background: e.billable ? "rgba(63,114,86,0.12)" : "rgba(107,114,128,0.14)",
          color: e.billable ? C.moss : C.slate,
        }}>
          {e.billable ? "Billable" : "Non-billable"}
        </span>
      </td>
      <td style={{ padding: "10px 12px", fontSize: 12, color: markColor, fontWeight: 500 }}>{e.status}</td>
    </tr>
  );
}

function LedgerTable({ rows, custName, projName, dense }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr style={{ borderBottom: `2px solid ${C.ink}` }}>
          <th style={{ width: 4, padding: 0 }} />
          <Th>Task</Th><Th>Customer</Th><Th>Project</Th>
          {!dense && <Th>Type</Th>}
          <Th>Start</Th><Th>End</Th><Th>Hours</Th><Th>Billing</Th><Th>Status</Th>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 && (
          <tr><td colSpan={9} style={{ padding: "24px 12px", color: C.slate, fontSize: 13 }}>No entries.</td></tr>
        )}
        {rows.map((e) => <LedgerRow key={e.id} e={e} custName={custName} projName={projName} dense={dense} />)}
      </tbody>
    </table>
  );
}
function Th({ children }) {
  return (
    <th style={{
      textAlign: "left", padding: "0 12px 8px", fontSize: 11, textTransform: "uppercase",
      letterSpacing: "0.05em", color: C.slate, fontWeight: 500,
    }}>{children}</th>
  );
}

function SectionTitle({ children, sub }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontFamily: F.display, fontSize: 24, fontWeight: 700 }}>{children}</div>
      {sub && <div style={{ fontSize: 13, color: C.slate, marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

/* ---------- dashboard ---------- */
function Dashboard({ entries, currentUserId, custName, projName }) {
  const today = todayISO();
  const todays = entries.filter((e) => e.date === today && e.userId === currentUserId);
  const total = todays.reduce((a, e) => a + e.hours, 0);
  const billable = todays.filter((e) => e.billable).reduce((a, e) => a + e.hours, 0);

  return (
    <div>
      <SectionTitle sub={fmtDateLong(today)}>Today</SectionTitle>
      <div style={{ display: "flex", gap: 14, marginBottom: 22 }}>
        <Metric label="Hours logged" value={fmtHours(total)} />
        <Metric label="Billable" value={fmtHours(billable)} accent={C.moss} />
        <Metric label="Entries" value={todays.length} />
      </div>
      <div style={s.card}>
        <LedgerTable rows={todays} custName={custName} projName={projName} />
      </div>
    </div>
  );
}
function Metric({ label, value, accent }) {
  return (
    <div style={{ ...s.card, minWidth: 130 }}>
      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: C.slate, marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: F.mono, fontSize: 24, fontWeight: 500, color: accent || C.ink }}>{value}</div>
    </div>
  );
}

/* ---------- add entry ---------- */
function AddEntry({ customers, projects, currentUserId, onAdd }) {
  const [date, setDate] = useState(todayISO());
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? "");
  const [projectId, setProjectId] = useState("");
  const [task, setTask] = useState("");
  const [workType, setWorkType] = useState(WORK_TYPES[0]);
  const [description, setDescription] = useState("");
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("10:00");
  const [billable, setBillable] = useState(true);
  const [saved, setSaved] = useState(false);

  const availableProjects = projects.filter((p) => p.customerId === customerId);
  const hours = hoursBetween(start, end);

  const submit = () => {
    if (!task.trim() || !projectId) return;
    onAdd({
      userId: currentUserId, date, customerId, projectId, task, workType, description,
      start, end, hours, billable, status: "Done",
    });
    setTask(""); setDescription("");
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ maxWidth: 560 }}>
      <SectionTitle sub="Log time against a customer and project">Add time entry</SectionTitle>
      <div style={s.card}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Field><label style={s.label}>Date</label><input type="date" style={s.input} value={date} onChange={(e) => setDate(e.target.value)} /></Field>
          <Field><label style={s.label}>Work type</label>
            <select style={s.input} value={workType} onChange={(e) => setWorkType(e.target.value)}>
              {WORK_TYPES.map((w) => <option key={w}>{w}</option>)}
            </select>
          </Field>
          <Field><label style={s.label}>Customer</label>
            <select style={s.input} value={customerId} onChange={(e) => { setCustomerId(e.target.value); setProjectId(""); }}>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field><label style={s.label}>Project</label>
            <select style={s.input} value={projectId} onChange={(e) => setProjectId(e.target.value)}>
              <option value="">Select project</option>
              {availableProjects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
        </div>
        <Field><label style={s.label}>Task</label><input style={s.input} value={task} onChange={(e) => setTask(e.target.value)} placeholder="Customer support" /></Field>
        <Field><label style={s.label}>Description</label><textarea style={{ ...s.input, minHeight: 64, resize: "vertical" }} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What did you work on" /></Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, alignItems: "end" }}>
          <Field><label style={s.label}>Start time</label><input type="time" style={s.input} value={start} onChange={(e) => setStart(e.target.value)} /></Field>
          <Field><label style={s.label}>End time</label><input type="time" style={s.input} value={end} onChange={(e) => setEnd(e.target.value)} /></Field>
          <Field>
            <label style={s.label}>Hours</label>
            <div style={{ ...s.input, fontFamily: F.mono, background: C.paper, fontWeight: 500 }}>{fmtHours(hours)}</div>
          </Field>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
          <input type="checkbox" checked={billable} onChange={(e) => setBillable(e.target.checked)} id="bill" />
          <label htmlFor="bill" style={{ fontSize: 13.5 }}>Billable</label>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button style={s.btn("primary")} onClick={submit}>Save entry</button>
          {saved && <span style={{ fontSize: 12.5, color: C.moss }}>Entry saved.</span>}
        </div>
      </div>
    </div>
  );
}

/* ---------- timer ---------- */
function TimerView({ customers, projects, currentUserId, onAdd }) {
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? "");
  const [projectId, setProjectId] = useState("");
  const [task, setTask] = useState("");
  const [workType, setWorkType] = useState(WORK_TYPES[0]);
  const [billable, setBillable] = useState(true);

  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [startClock, setStartClock] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (running && !paused) {
      intervalRef.current = setInterval(() => setElapsedSec((s) => s + 1), 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, paused]);

  const availableProjects = projects.filter((p) => p.customerId === customerId);

  const start = () => {
    if (!task.trim() || !projectId) return;
    setStartClock(nowHM());
    setElapsedSec(0);
    setRunning(true);
    setPaused(false);
  };
  const pause = () => setPaused((p) => !p);
  const stop = () => {
    if (!running) return;
    const end = nowHM();
    const hours = Math.max(0.02, Math.round((elapsedSec / 3600) * 100) / 100);
    onAdd({
      userId: currentUserId, date: todayISO(), customerId, projectId, task, workType,
      description: "Timer entry", start: startClock, end, hours, billable, status: "Done",
    });
    setRunning(false); setPaused(false); setElapsedSec(0); setStartClock(null); setTask("");
  };

  const hh = pad(Math.floor(elapsedSec / 3600));
  const mm = pad(Math.floor((elapsedSec % 3600) / 60));
  const ss = pad(elapsedSec % 60);

  return (
    <div style={{ maxWidth: 480 }}>
      <SectionTitle sub="Track live and generate the entry automatically">Timer</SectionTitle>
      <div style={s.card}>
        <div style={{
          textAlign: "center", fontFamily: F.mono, fontSize: 52, fontWeight: 500, letterSpacing: "0.02em",
          padding: "18px 0 22px", color: running && !paused ? C.brass : C.ink,
        }}>
          {hh}:{mm}:{ss}
        </div>

        <fieldset disabled={running} style={{ border: "none", padding: 0, margin: 0, opacity: running ? 0.55 : 1 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field><label style={s.label}>Customer</label>
              <select style={s.input} value={customerId} onChange={(e) => { setCustomerId(e.target.value); setProjectId(""); }}>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field><label style={s.label}>Project</label>
              <select style={s.input} value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                <option value="">Select project</option>
                {availableProjects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field><label style={s.label}>Task</label><input style={s.input} value={task} onChange={(e) => setTask(e.target.value)} placeholder="Development" /></Field>
            <Field><label style={s.label}>Work type</label>
              <select style={s.input} value={workType} onChange={(e) => setWorkType(e.target.value)}>
                {WORK_TYPES.map((w) => <option key={w}>{w}</option>)}
              </select>
            </Field>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <input type="checkbox" checked={billable} onChange={(e) => setBillable(e.target.checked)} id="bill2" />
            <label htmlFor="bill2" style={{ fontSize: 13.5 }}>Billable</label>
          </div>
        </fieldset>

        <div style={{ display: "flex", gap: 10, marginTop: 18, justifyContent: "center" }}>
          {!running && <button style={s.btn("primary")} onClick={start}>▶ Start</button>}
          {running && <button style={s.btn()} onClick={pause}>{paused ? "▶ Resume" : "⏸ Pause"}</button>}
          {running && <button style={{ ...s.btn(), borderColor: C.rust, color: C.rust }} onClick={stop}>■ Stop</button>}
        </div>
      </div>
    </div>
  );
}

/* ---------- reports ---------- */
function Reports({ entries, custName, projName }) {
  const [range, setRange] = useState("daily");
  const today = todayISO();
  const weekStart = startOfWeek(today);
  const monthPrefix = today.slice(0, 7);

  const filtered = useMemo(() => {
    if (range === "daily") return entries.filter((e) => e.date === today);
    if (range === "weekly") return entries.filter((e) => {
      const d = new Date(e.date + "T00:00:00");
      const diffDays = Math.floor((d - weekStart) / 86400000);
      return diffDays >= 0 && diffDays < 7;
    });
    return entries.filter((e) => e.date.startsWith(monthPrefix));
  }, [entries, range]);

  const totalHours = filtered.reduce((a, e) => a + e.hours, 0);
  const billableHours = filtered.filter((e) => e.billable).reduce((a, e) => a + e.hours, 0);

  const byProject = useMemo(() => {
    const map = {};
    filtered.forEach((e) => {
      const key = projName(e.projectId);
      map[key] = (map[key] || 0) + e.hours;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filtered]);

  const exportCsv = () => {
    const headers = ["Date", "Customer", "Project", "Task", "Work Type", "Start", "End", "Hours", "Billable", "Status"];
    const rows = filtered.map((e) => [
      e.date, custName(e.customerId), projName(e.projectId), e.task, e.workType,
      e.start, e.end, e.hours, e.billable ? "Yes" : "No", e.status,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `time-report-${range}-${today}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <SectionTitle sub="Daily, weekly, and monthly summaries">Reports</SectionTitle>
      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        {["daily", "weekly", "monthly"].map((r) => (
          <button key={r} onClick={() => setRange(r)}
            style={{ ...s.btn(range === r ? "primary" : undefined), textTransform: "capitalize" }}>
            {r}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button style={s.btn()} onClick={exportCsv}>Export to CSV</button>
      </div>

      <div style={{ display: "flex", gap: 14, marginBottom: 20 }}>
        <Metric label="Total hours" value={fmtHours(totalHours)} />
        <Metric label="Billable hours" value={fmtHours(billableHours)} accent={C.moss} />
        <Metric label="Entries" value={filtered.length} />
      </div>

      <div style={{ display: "flex", gap: 18 }}>
        <div style={{ ...s.card, flex: 2 }}>
          <LedgerTable rows={filtered} custName={custName} projName={projName} />
        </div>
        <div style={{ ...s.card, flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: C.slate, marginBottom: 12 }}>By project</div>
          {byProject.length === 0 && <div style={{ fontSize: 13, color: C.slate }}>No data.</div>}
          {byProject.map(([name, hrs]) => (
            <div key={name} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                <span>{name}</span>
                <span style={{ fontFamily: F.mono }}>{fmtHours(hrs)}</span>
              </div>
              <div style={{ height: 5, background: C.paper, borderRadius: 3 }}>
                <div style={{
                  height: 5, borderRadius: 3, background: C.brass,
                  width: `${totalHours ? (hrs / totalHours) * 100 : 0}%`,
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- search ---------- */
function SearchView({ entries, custName, projName }) {
  const [q, setQ] = useState("");
  const results = entries.filter((e) => {
    const hay = `${e.task} ${e.description} ${custName(e.customerId)} ${projName(e.projectId)} ${e.workType}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  });
  return (
    <div>
      <SectionTitle sub="Search across customer, project, task, type, and notes">Search entries</SectionTitle>
      <input
        style={{ ...s.input, maxWidth: 400, marginBottom: 18 }}
        placeholder="Search entries…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div style={s.card}>
        <LedgerTable rows={results} custName={custName} projName={projName} />
      </div>
    </div>
  );
}

/* ---------- masters ---------- */
function DeleteButton({ onClick, title }) {
  return (
    <button
      onClick={onClick}
      title={title || "Delete"}
      style={{
        border: "none", background: "transparent", color: C.slate, cursor: "pointer",
        fontSize: 13, padding: "2px 6px", lineHeight: 1, fontFamily: F.sans,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.color = C.rust)}
      onMouseLeave={(e) => (e.currentTarget.style.color = C.slate)}
    >
      ✕
    </button>
  );
}

function Masters({ customers, setCustomers, projects, setProjects, deleteCustomer, deleteProject }) {
  const [newCustomer, setNewCustomer] = useState("");
  const [newProject, setNewProject] = useState("");
  const [newProjectCustomer, setNewProjectCustomer] = useState(customers[0]?.id ?? "");

  const addCustomer = () => {
    if (!newCustomer.trim()) return;
    setCustomers((prev) => [...prev, { id: uid(), name: newCustomer.trim() }]);
    setNewCustomer("");
  };
  const addProject = () => {
    if (!newProject.trim() || !newProjectCustomer) return;
    setProjects((prev) => [...prev, { id: uid(), name: newProject.trim(), customerId: newProjectCustomer }]);
    setNewProject("");
  };

  const handleDeleteCustomer = (c) => {
    const projectCount = projects.filter((p) => p.customerId === c.id).length;
    const msg = projectCount > 0
      ? `Delete "${c.name}"? This also removes ${projectCount} project(s) under it and any time entries logged against them.`
      : `Delete "${c.name}"?`;
    if (window.confirm(msg)) deleteCustomer(c.id);
  };
  const handleDeleteProject = (p) => {
    if (window.confirm(`Delete "${p.name}"? Any time entries logged against it will also be removed.`)) {
      deleteProject(p.id);
    }
  };

  return (
    <div>
      <SectionTitle sub="Maintain the customer and project lists used across the app">Customers & projects</SectionTitle>
      <div style={{ display: "flex", gap: 18 }}>
        <div style={{ ...s.card, flex: 1 }}>
          <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Customers</div>
          {customers.length === 0 && <div style={{ fontSize: 13, color: C.slate }}>No customers yet.</div>}
          {customers.map((c) => (
            <div key={c.id} style={{ padding: "8px 0", borderBottom: `1px solid ${C.rule}`, fontSize: 13.5, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>{c.name}</span>
              <DeleteButton onClick={() => handleDeleteCustomer(c)} title={`Delete ${c.name}`} />
            </div>
          ))}
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <input style={s.input} placeholder="New customer name" value={newCustomer} onChange={(e) => setNewCustomer(e.target.value)} />
            <button style={s.btn("primary")} onClick={addCustomer}>Add</button>
          </div>
        </div>
        <div style={{ ...s.card, flex: 1 }}>
          <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Projects</div>
          {projects.length === 0 && <div style={{ fontSize: 13, color: C.slate }}>No projects yet.</div>}
          {projects.map((p) => (
            <div key={p.id} style={{ padding: "8px 0", borderBottom: `1px solid ${C.rule}`, fontSize: 13.5, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>{p.name}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: C.slate }}>{customers.find((c) => c.id === p.customerId)?.name}</span>
                <DeleteButton onClick={() => handleDeleteProject(p)} title={`Delete ${p.name}`} />
              </span>
            </div>
          ))}
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <select style={s.input} value={newProjectCustomer} onChange={(e) => setNewProjectCustomer(e.target.value)}>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input style={s.input} placeholder="New project name" value={newProject} onChange={(e) => setNewProject(e.target.value)} />
            <button style={s.btn("primary")} onClick={addProject}>Add</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- team / users ---------- */
function TeamView({ users, addUser, deleteUser, currentUserId }) {
  const [newUser, setNewUser] = useState("");

  const handleAdd = () => {
    if (!newUser.trim()) return;
    addUser(newUser.trim());
    setNewUser("");
  };

  const handleDelete = (u) => {
    if (users.length <= 1) {
      window.alert("At least one user is required.");
      return;
    }
    const msg = u.id === currentUserId
      ? `Delete "${u.name}"? This is your currently selected user — the app will switch to another user, and all of ${u.name}'s time entries will be removed.`
      : `Delete "${u.name}"? All of their time entries will be removed too.`;
    if (window.confirm(msg)) deleteUser(u.id);
  };

  return (
    <div>
      <SectionTitle sub="Add or remove the people who log time in this app">Users</SectionTitle>
      <div style={{ ...s.card, maxWidth: 460 }}>
        {users.map((u) => (
          <div key={u.id} style={{ padding: "9px 0", borderBottom: `1px solid ${C.rule}`, fontSize: 13.5, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>
              {u.name}
              {u.id === currentUserId && (
                <span style={{ marginLeft: 8, fontSize: 11, color: C.brass, fontWeight: 500 }}>Current</span>
              )}
            </span>
            <DeleteButton onClick={() => handleDelete(u)} title={`Delete ${u.name}`} />
          </div>
        ))}
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <input
            style={s.input}
            placeholder="New user name"
            value={newUser}
            onChange={(e) => setNewUser(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
          />
          <button style={s.btn("primary")} onClick={handleAdd}>Add</button>
        </div>
      </div>
    </div>
  );
}
