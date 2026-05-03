import SEO from "../components/SEO.jsx";
import Pricing from "../components/Pricing.jsx";
import SectionHeader from "../components/SectionHeader.jsx";

export default function PricingPage() {
  return (
    <>
      <SEO
        title="Pricing | VidyaTech"
        description="Basic, Professional, and Enterprise plans for school website development, student management system, and complete ERP for schools."
        path="/pricing"
      />
      <section className="inner-hero">
        <div className="section-container narrow">
          <span className="eyebrow">Pricing built for growth</span>
          <h1>Start with a premium website or launch complete institution automation.</h1>
          <p>
            Every plan is customized around institution size, modules, branding needs, and deployment support.
          </p>
        </div>
      </section>

      <section className="page-section">
        <div className="section-container">
          <Pricing />
        </div>
      </section>

      <section className="page-section surface-section">
        <div className="section-container">
          <SectionHeader
            eyebrow="What affects pricing"
            title="Transparent scope, premium execution."
            text="Final pricing depends on website pages, number of branches, user roles, custom reports, payment gateway configuration, branding depth, and hosting support."
          />
        </div>
      </section>
    </>
  );
}
