import { useState } from "react";
import { CalendarCheck2, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import SEO from "../components/SEO.jsx";
import SectionHeader from "../components/SectionHeader.jsx";
import { brand } from "../data/siteData.js";
import { apiRequest, createWhatsAppLink } from "../utils/api.js";

export default function Contact() {
  const [status, setStatus] = useState("");
  const mapUrl = import.meta.env.VITE_GOOGLE_MAPS_EMBED || "https://www.google.com/maps?q=New%20Delhi%20India&output=embed";
  const whatsapp = createWhatsAppLink(
    brand.whatsapp,
    "Hello VidyaTech, I want to book a demo for school ERP and website development."
  );

  async function handleSubmit(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const payload = Object.fromEntries(form.entries());
    setStatus("Sending demo request...");

    try {
      await apiRequest("/leads", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      setStatus("Demo request sent. Our team will contact you shortly.");
      formElement.reset();
    } catch (error) {
      console.error("Lead submission fallback", error);
      setStatus("Could not send right now. Please call or WhatsApp us, and try again in a moment.");
    }
  }

  return (
    <>
      <SEO
        title="Contact | VidyaTech"
        description="Contact VidyaTech to book a demo for school management software, school website development, and complete ERP automation."
        path="/contact"
      />
      <section className="inner-hero">
        <div className="section-container narrow">
          <span className="eyebrow">Book a demo</span>
          <h1>Let us map your institution's website, ERP, and automation needs.</h1>
          <p>
            Share your school type, student strength, and required modules. We will recommend a launch plan.
          </p>
        </div>
      </section>

      <section className="page-section">
        <div className="section-container contact-grid">
          <form className="contact-form" onSubmit={handleSubmit}>
            <SectionHeader align="left" eyebrow="Demo booking" title="Tell us what you want to build." />
            <label>
              Institution Name
              <input name="institution" type="text" placeholder="ABC International School" required />
            </label>
            <label>
              Your Name
              <input name="name" type="text" placeholder="Director / Principal / Admin" required />
            </label>
            <label>
              Phone
              <input name="phone" type="tel" placeholder="+91 98765 43210" required />
            </label>
            <label>
              Email
              <input name="email" type="email" placeholder="name@school.in" required />
            </label>
            <label>
              Required Modules
              <select name="module" defaultValue="Complete ERP">
                <option>Complete ERP</option>
                <option>School Website</option>
                <option>Student App</option>
                <option>Finance and Fees</option>
                <option>Attendance and Results</option>
              </select>
            </label>
            <label>
              Message
              <textarea name="message" rows="5" placeholder="Tell us about your student strength, branches, and launch timeline." />
            </label>
            <button className="btn btn-primary" type="submit">
              <CalendarCheck2 size={18} />
              Submit Demo Request
            </button>
            {status && <p className="form-status">{status}</p>}
          </form>

          <aside className="contact-panel">
            <SectionHeader align="left" eyebrow="Contact channels" title="Fast response for serious institutions." />
            <a href={whatsapp} target="_blank" rel="noreferrer">
              <MessageCircle size={18} />
              WhatsApp Demo Request
            </a>
            <a href={`mailto:${brand.email}`}>
              <Mail size={18} />
              {brand.email}
            </a>
            <a href={`tel:${brand.phone.replace(/\s/g, "")}`}>
              <Phone size={18} />
              {brand.phone}
            </a>
            <span>
              <MapPin size={18} />
              {brand.address}
            </span>
            <iframe title="Google Maps location" src={mapUrl} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          </aside>
        </div>
      </section>
    </>
  );
}
