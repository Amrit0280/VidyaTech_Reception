import { Link } from "react-router-dom";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { brand, navigation } from "../data/siteData.js";
import { createWhatsAppLink } from "../utils/api.js";

export default function Footer() {
  const whatsapp = createWhatsAppLink(
    brand.whatsapp,
    "Hello, I want a demo of VidyaTech school management software."
  );

  return (
    <footer className="footer">
      <div className="section-container footer-grid">
        <div className="footer-brand">
          <img className="footer-logo" src={brand.logoFull} alt={`${brand.name} full logo`} />
          <span className="eyebrow">One Platform. Complete Institution Control.</span>
          <h2>{brand.name}</h2>
          <p>{brand.motive}</p>
          <div className="footer-actions">
            <a className="btn btn-primary" href={whatsapp} target="_blank" rel="noreferrer">
              <MessageCircle size={18} />
              WhatsApp
            </a>
            <Link className="btn btn-secondary" to="/contact">
              Contact Us
            </Link>
          </div>
        </div>

        <div className="footer-column">
          <h3>Pages</h3>
          {navigation.map((item) => (
            <Link key={item.href} to={item.href}>
              {item.label}
            </Link>
          ))}
        </div>

        <div className="footer-column">
          <h3>Contact</h3>
          <a href={`mailto:${brand.email}`}>
            <Mail size={16} />
            {brand.email}
          </a>
          <a href={`tel:${brand.phone.replace(/\s/g, "")}`}>
            <Phone size={16} />
            {brand.phone}
          </a>
          <span>
            <MapPin size={16} />
            {brand.address}
          </span>
        </div>
      </div>
      <div className="footer-bottom">
        <span>Copyright {new Date().getFullYear()} {brand.name}. All rights reserved.</span>
        <span>Built for school software India, ERP for schools, and institutional automation.</span>
      </div>
    </footer>
  );
}
