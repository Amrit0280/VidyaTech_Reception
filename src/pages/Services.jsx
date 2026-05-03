import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import SEO from "../components/SEO.jsx";
import SectionHeader from "../components/SectionHeader.jsx";
import { services } from "../data/siteData.js";

export default function Services() {
  return (
    <>
      <SEO
        title="Services | VidyaTech"
        description="Premium school website development, student app, admin app, finance management, attendance system, and digital branding for institutions."
        path="/services"
      />
      <section className="inner-hero">
        <div className="section-container narrow">
          <span className="eyebrow">Premium education technology services</span>
          <h1>From admissions to finance, every core operation becomes digitally managed.</h1>
          <p>
            Choose individual modules or launch the complete institutional ecosystem with website, ERP, parent
            communication, and school branding.
          </p>
        </div>
      </section>

      <section className="page-section">
        <div className="section-container">
          <SectionHeader
            eyebrow="Core services"
            title="Everything a school needs to look premium and run professionally."
          />
          <div className="service-grid">
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <article key={service.title} className="service-card">
                  <span className="feature-icon">
                    <Icon size={22} />
                  </span>
                  <h2>{service.title}</h2>
                  <p>{service.summary}</p>
                  <ul>
                    {service.points.map((point) => (
                      <li key={point}>
                        <CheckCircle2 size={16} />
                        {point}
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="page-section cta-band">
        <div className="section-container cta-grid">
          <div>
            <span className="eyebrow">Ready to launch</span>
            <h2>Give your institution a premium digital identity and full management system.</h2>
          </div>
          <Link to="/contact" className="btn btn-primary">
            Book Demo
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </>
  );
}
