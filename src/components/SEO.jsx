import { Helmet } from "react-helmet-async";
import { brand } from "../data/siteData.js";

export default function SEO({ title, description, path = "/", schema }) {
  const url = `https://vidyatech.in${path}`;
  const jsonLd = schema || {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: `${brand.name} School Management Software`,
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web",
    description,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "INR"
    },
    provider: {
      "@type": "Organization",
      name: brand.name,
      slogan: brand.motive
    }
  };

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta
        name="keywords"
        content="School software India, school management software, school website developer, student management system, ERP for schools"
      />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
    </Helmet>
  );
}
