import { Link } from "react-router-dom";
import { ArrowRight, CalendarCheck2, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import DashboardPreview from "./DashboardPreview.jsx";
import { brand } from "../data/siteData.js";
import { createWhatsAppLink } from "../utils/api.js";

export default function HeroSection() {
  const whatsapp = createWhatsAppLink(
    brand.whatsapp,
    "Hello VidyaTech, I want to book a demo for school software and website development."
  );

  return (
    <section className="hero-section">
      <div className="section-container hero-grid">
        <motion.div
          className="hero-copy"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65 }}
        >
          <span className="eyebrow">Empowering Schools Through Innovation</span>
          <h1>Transform Your Institution Digitally</h1>
          <p>
            Professional websites, smart student management, finance control, and complete institutional automation.
          </p>

          <div className="hero-actions">
            <Link to="/contact" className="btn btn-primary">
              <CalendarCheck2 size={18} />
              Book Demo
            </Link>
            <Link to="/pricing" className="btn btn-secondary">
              Get Started
              <ArrowRight size={18} />
            </Link>
            <a href={whatsapp} target="_blank" rel="noreferrer" className="btn btn-ghost">
              <MessageCircle size={18} />
              Contact Us
            </a>
          </div>

          <div className="hero-proof">
            <span>From Admissions to Finance - Everything Digitally Managed</span>
            <span>Built for schools, colleges, coaching institutes, and academies</span>
          </div>
        </motion.div>

        <DashboardPreview />
      </div>
    </section>
  );
}
