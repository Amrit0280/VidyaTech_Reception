import { Link } from "react-router-dom";
import { ArrowRight, Building2, CheckCircle2 } from "lucide-react";
import SEO from "../components/SEO.jsx";
import HeroSection from "../components/HeroSection.jsx";
import StatStrip from "../components/StatStrip.jsx";
import Features from "../components/Features.jsx";
import SectionHeader from "../components/SectionHeader.jsx";
import Pricing from "../components/Pricing.jsx";
import DemoDashboard from "../components/DemoDashboard.jsx";
import { testimonials, trustItems } from "../data/siteData.js";

export default function Home() {
  return (
    <>
      <SEO
        title="VidyaTech | Premium School Management Software India"
        description="VidyaTech provides complete school management software, student ERP, and school website development to digitize institutions."
      />
      <HeroSection />
      <StatStrip />

      <section className="page-section trust-band">
        <div className="section-container trust-grid">
          <div>
            <span className="eyebrow">Built for institutional trust</span>
            <h2>Premium digital systems for schools that want to look modern and operate smarter.</h2>
          </div>
          <div className="trust-list">
            {trustItems.map((item) => (
              <span key={item}>
                <CheckCircle2 size={17} />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <Features />

      <section className="page-section surface-section">
        <div className="section-container">
          <SectionHeader
            eyebrow="Software demo"
            title="A client-converting interface schools can understand instantly."
            text="Show administrators exactly how daily operations become cleaner, faster, and easier to control."
          />
          <DemoDashboard />
        </div>
      </section>

      <section className="page-section">
        <div className="section-container why-grid">
          <div className="why-copy">
            <span className="eyebrow">Why choose us</span>
            <h2>Designed for admissions, operations, and long-term school growth.</h2>
            <p>
              We combine a premium website, a practical ERP workflow, and institutional branding so your school
              looks credible online and runs with modern digital discipline.
            </p>
            <Link to="/services" className="btn btn-primary">
              Explore Services
              <ArrowRight size={18} />
            </Link>
          </div>
          <div className="why-stack">
            {["Investor-grade UI quality", "Indian education market copy", "Multi-role software architecture", "Launch and hosting guidance"].map((item) => (
              <article key={item}>
                <Building2 size={20} />
                <strong>{item}</strong>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="page-section testimonial-section">
        <div className="section-container">
          <SectionHeader
            eyebrow="Testimonials"
            title="Trusted by leaders who want less paperwork and more control."
          />
          <div className="testimonial-grid">
            {testimonials.map((testimonial) => (
              <article key={testimonial.name} className="testimonial-card">
                <p>"{testimonial.quote}"</p>
                <strong>{testimonial.name}</strong>
                <span>{testimonial.role}</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="page-section">
        <div className="section-container">
          <SectionHeader
            eyebrow="Pricing"
            title="Simple plans that scale with the institution."
            text="Start with a premium website, then grow into complete ERP automation."
          />
          <Pricing />
        </div>
      </section>
    </>
  );
}
