import { stats } from "../data/siteData.js";

export default function StatStrip() {
  return (
    <section className="stat-strip">
      <div className="section-container stat-grid">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-item">
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
