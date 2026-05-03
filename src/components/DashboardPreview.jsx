import { motion } from "framer-motion";
import { BellRing, CheckCircle2, CreditCard, GraduationCap, TrendingUp, UsersRound } from "lucide-react";

const rows = [
  ["Aarav Sharma", "IX-A", "Present", "Paid"],
  ["Diya Patel", "VIII-B", "Present", "Due"],
  ["Kabir Khan", "X-C", "Absent", "Paid"]
];

export default function DashboardPreview() {
  return (
    <motion.div
      className="dashboard-preview"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
    >
      <div className="dashboard-topbar">
        <div>
          <span className="preview-label">Institution Command Center</span>
          <strong>Academic + Finance Pulse</strong>
        </div>
        <span className="live-pill">Live</span>
      </div>

      <div className="preview-metrics">
        <div>
          <UsersRound size={18} />
          <span>Students</span>
          <strong>1,842</strong>
        </div>
        <div>
          <CreditCard size={18} />
          <span>Fees Collected</span>
          <strong>₹18.4L</strong>
        </div>
        <div>
          <TrendingUp size={18} />
          <span>Attendance</span>
          <strong>94%</strong>
        </div>
      </div>

      <div className="preview-body">
        <div className="preview-chart">
          {[46, 72, 58, 88, 64, 96, 80].map((height, index) => (
            <motion.span
              key={height}
              style={{ height: `${height}%` }}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: 0.15 + index * 0.06, duration: 0.45 }}
            />
          ))}
        </div>

        <div className="preview-list">
          <div className="notice-chip">
            <BellRing size={16} />
            Fee reminder sent to 126 parents
          </div>
          <div className="notice-chip">
            <GraduationCap size={16} />
            Class X results ready for review
          </div>
          <div className="notice-chip">
            <CheckCircle2 size={16} />
            18 new admissions approved
          </div>
        </div>
      </div>

      <div className="preview-table">
        {rows.map((row) => (
          <div key={row[0]} className="preview-row">
            {row.map((cell) => (
              <span key={cell} className={cell === "Due" || cell === "Absent" ? "warning-text" : ""}>
                {cell}
              </span>
            ))}
          </div>
        ))}
      </div>
    </motion.div>
  );
}
