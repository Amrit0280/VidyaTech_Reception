export default function SectionHeader({ eyebrow, title, text, align = "center" }) {
  return (
    <div className={`section-header ${align === "left" ? "section-header-left" : ""}`}>
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h2>{title}</h2>
      {text && <p>{text}</p>}
    </div>
  );
}
