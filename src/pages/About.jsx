import { Compass, Lightbulb, Rocket, Target } from "lucide-react";
import SEO from "../components/SEO.jsx";
import SectionHeader from "../components/SectionHeader.jsx";
import { brand } from "../data/siteData.js";

const blocks = [
  {
    title: "Mission",
    text: "To give every school, college, coaching institute, and academy a premium digital foundation that improves trust, speed, and daily control.",
    icon: Target
  },
  {
    title: "Vision",
    text: "A connected education ecosystem where institutions manage admissions, academics, finance, and communication without scattered paperwork.",
    icon: Compass
  },
  {
    title: "Why We Exist",
    text: "Many institutions work hard offline but look outdated online. We close that gap with elegant websites and practical software that schools can actually use.",
    icon: Lightbulb
  },
  {
    title: "Founder Story",
    text: "The brand was shaped around a simple insight: schools need more than a website. They need a technology partner who understands parents, administrators, and growth.",
    icon: Rocket
  }
];

export default function About() {
  return (
    <>
      <SEO
        title={`About VidyaTech | Connecting Every Institution With Technology`}
        description="Learn the mission, vision, and story behind a premium school software and website development company for Indian educational institutions."
        path="/about"
      />
      <section className="inner-hero">
        <div className="section-container narrow">
          <span className="eyebrow">VidyaTech’s motive</span>
          <h1>We build the digital backbone modern institutions deserve.</h1>
          <p>
            VidyaTech exists to help education businesses look credible, operate intelligently, and scale with
            software designed around real school workflows.
          </p>
        </div>
      </section>

      <section className="page-section">
        <div className="section-container about-grid">
          {blocks.map((block) => {
            const Icon = block.icon;
            return (
              <article key={block.title} className="feature-card">
                <span className="feature-icon">
                  <Icon size={22} />
                </span>
                <h2>{block.title}</h2>
                <p>{block.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="page-section surface-section">
        <div className="section-container">
          <SectionHeader
            eyebrow="Our belief"
            title="Technology should make institutions feel stronger, not more complicated."
            text="Every design decision, workflow, and dashboard is built to help school teams move faster while parents experience more transparency."
          />
        </div>
      </section>
    </>
  );
}
