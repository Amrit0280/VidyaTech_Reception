import { CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { pricingPlans } from "../data/siteData.js";

export default function Pricing() {
  return (
    <div className="pricing-grid">
      {pricingPlans.map((plan) => (
        <article key={plan.name} className={`pricing-card ${plan.highlight ? "pricing-featured" : ""}`}>
          {plan.highlight && <span className="plan-badge">Recommended</span>}
          <h3>{plan.name}</h3>
          <strong>{plan.price}</strong>
          <p>{plan.description}</p>
          <ul>
            {plan.features.map((feature) => (
              <li key={feature}>
                <CheckCircle2 size={17} />
                {feature}
              </li>
            ))}
          </ul>
          <Link to="/contact" className={plan.highlight ? "btn btn-primary" : "btn btn-secondary"}>
            Book Demo
          </Link>
        </article>
      ))}
    </div>
  );
}
