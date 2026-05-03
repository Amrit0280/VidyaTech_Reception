import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { BellRing, CreditCard, Fingerprint, LockKeyhole, PanelTop, UserRound } from "lucide-react";

const tabs = [
  { id: "student", label: "Student Login", icon: UserRound },
  { id: "admin", label: "Admin Panel", icon: PanelTop },
  { id: "fees", label: "Fee Payment", icon: CreditCard },
  { id: "attendance", label: "Attendance", icon: Fingerprint },
  { id: "notifications", label: "Notifications", icon: BellRing }
];

const collectionData = [
  { month: "Jan", collection: 8.4 },
  { month: "Feb", collection: 10.2 },
  { month: "Mar", collection: 9.8 },
  { month: "Apr", collection: 12.7 },
  { month: "May", collection: 14.1 },
  { month: "Jun", collection: 15.8 }
];

const attendanceData = [
  { name: "Present", value: 94, color: "#1fb6a6" },
  { name: "Absent", value: 6, color: "#c9962b" }
];

const content = {
  student: {
    title: "Secure student portal",
    description: "Students sign in with a unique ID and password to view fees, homework, attendance, results, notifications, and profile details.",
    metrics: ["Unique ID", "Homework", "Results"]
  },
  admin: {
    title: "Institution command dashboard",
    description: "Admins manage students, fees, salary, notices, results, analytics, school branding, and role-based access from one control center.",
    metrics: ["Admissions", "Finance", "Reports"]
  },
  fees: {
    title: "Payment-ready fee tracking",
    description: "Track paid, pending, overdue, concessions, invoices, and gateway-ready payment workflows with clean parent communication.",
    metrics: ["Receipts", "Dues", "Gateway"]
  },
  attendance: {
    title: "Daily attendance intelligence",
    description: "Teachers upload class attendance while parents and admins see instant summaries, alerts, and trends.",
    metrics: ["Teacher Upload", "Parent Alerts", "Daily Summary"]
  },
  notifications: {
    title: "Real-time notices and alerts",
    description: "Send institution notices, homework reminders, fee alerts, and result updates through a real-time notification architecture.",
    metrics: ["Live Board", "Alerts", "WhatsApp Ready"]
  }
};

export default function DemoDashboard() {
  const [active, setActive] = useState("admin");
  const selected = useMemo(() => content[active], [active]);

  return (
    <div className="demo-console">
      <div className="demo-tabs" role="tablist" aria-label="Software demo modules">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={active === tab.id ? "active" : ""}
              type="button"
              onClick={() => setActive(tab.id)}
              role="tab"
              aria-selected={active === tab.id}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="demo-panel">
        <div className="demo-copy">
          <span className="eyebrow">Interactive software mockup</span>
          <h2>{selected.title}</h2>
          <p>{selected.description}</p>
          <div className="demo-metrics">
            {selected.metrics.map((metric) => (
              <span key={metric}>{metric}</span>
            ))}
          </div>
          <div className="login-card">
            <LockKeyhole size={18} />
            <div>
              <strong>Demo credentials enabled</strong>
              <span>Admin, teacher, student, and parent roles included.</span>
            </div>
          </div>
        </div>

        <div className="demo-visual">
          <div className="chart-card">
            <div className="chart-heading">
              <span>Fee Collection</span>
              <strong>₹15.8L</strong>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={collectionData}>
                <defs>
                  <linearGradient id="collection" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0f62fe" stopOpacity={0.34} />
                    <stop offset="95%" stopColor="#0f62fe" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(125,139,160,0.22)" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="collection" stroke="#0f62fe" fill="url(#collection)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="split-charts">
            <div className="mini-panel">
              <span>Attendance</span>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={attendanceData} innerRadius={42} outerRadius={62} paddingAngle={4} dataKey="value">
                    {attendanceData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mini-panel activity-feed">
              <span>Live Activity</span>
              <p>New admission approved</p>
              <p>Class VIII attendance uploaded</p>
              <p>Fee reminder scheduled</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
