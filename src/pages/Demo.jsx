import { Copy, KeyRound } from "lucide-react";
import SEO from "../components/SEO.jsx";
import DemoDashboard from "../components/DemoDashboard.jsx";
import SectionHeader from "../components/SectionHeader.jsx";
import { demoCredentials, moduleMatrix } from "../data/siteData.js";

export default function Demo() {
  return (
    <>
      <SEO
        title="Software Demo | VidyaTech"
        description="Interactive demo of student login, admin panel, fee payment, attendance, notifications, and school ERP modules."
        path="/demo"
      />
      <section className="inner-hero">
        <div className="section-container narrow">
          <span className="eyebrow">Interactive product preview</span>
          <h1>Show schools the complete software ecosystem before they buy.</h1>
          <p>
            A polished software mockup for admin, student, parent, and teacher workflows with demo credentials
            ready for sales calls.
          </p>
        </div>
      </section>

      <section className="page-section">
        <div className="section-container">
          <DemoDashboard />
        </div>
      </section>

      <section className="page-section surface-section">
        <div className="section-container demo-details-grid">
          <div>
            <SectionHeader
              align="left"
              eyebrow="Demo credentials"
              title="Role-based access examples."
              text="Use these credentials after running the backend seed SQL. Replace before production launch."
            />
            <div className="credential-list">
              {demoCredentials.map((credential) => (
                <article key={credential.role}>
                  <KeyRound size={18} />
                  <div>
                    <strong>{credential.role}</strong>
                    <span>{credential.login}</span>
                    <small>{credential.password}</small>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div>
            <SectionHeader
              align="left"
              eyebrow="Modules"
              title="Built for multi-school scalability."
              text="Each module is scoped by school ID and role permissions, so the platform can support multiple institutions."
            />
            <div className="module-grid">
              {moduleMatrix.map((module) => (
                <span key={module}>
                  <Copy size={15} />
                  {module}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
