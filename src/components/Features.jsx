import { featureCards } from "../data/siteData.js";
import SectionHeader from "./SectionHeader.jsx";

export default function Features() {
  return (
    <section className="page-section">
      <div className="section-container">
        <SectionHeader
          eyebrow="Software ecosystem"
          title="One Platform. Complete Institution Control."
          text="Every module is designed to reduce manual work, improve parent trust, and give management a clear operating picture."
        />
        <div className="feature-grid">
          {featureCards.map((feature) => {
            const Icon = feature.icon;
            return (
              <article key={feature.title} className="feature-card">
                <span className="feature-icon">
                  <Icon size={22} />
                </span>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
