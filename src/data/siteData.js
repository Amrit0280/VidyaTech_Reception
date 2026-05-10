import {
  BadgeIndianRupee,
  BarChart3,
  BellRing,
  BookOpenCheck,
  Building2,
  CalendarCheck2,
  Fingerprint,
  GraduationCap,
  LayoutDashboard,
  Megaphone,
  ShieldCheck,
  Sparkles,
  UsersRound,
  WalletCards
} from "lucide-react";

const assetBase = import.meta.env.BASE_URL || "/";
const assetPath = (fileName) => `${assetBase}${fileName}`;

export const brand = {
  name: "VidyaTech",
  logoIcon: assetPath("vidyatech-icon.svg"),
  logoFull: assetPath("vidyatech_full_logo_v3.svg"),
  motive: "Connecting Every Institution With Technology",
  email: "mauryaamrit0280@gmail.com",
  phone: "+91 8318466940",
  whatsapp: import.meta.env.VITE_WHATSAPP_NUMBER || "918318466940",
  address: "India"
};

export const navigation = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Software Demo", href: "/demo" },
  { label: "Pricing", href: "/pricing" },
  { label: "Contact", href: "/contact" }
];

export const stats = [
  { label: "Modules in one platform", value: "24+" },
  { label: "Role-based portals", value: "4" },
  { label: "Setup support", value: "30 days" },
  { label: "Institution uptime goal", value: "99.9%" }
];

export const featureCards = [
  {
    title: "Student Management App",
    text: "Admissions, profiles, unique login IDs, documents, attendance, homework, results, and parent access in one connected record.",
    icon: GraduationCap
  },
  {
    title: "Admin Control Center",
    text: "Run academics, finance, staff, notices, branding, analytics, and reports from a secure institution dashboard.",
    icon: LayoutDashboard
  },
  {
    title: "Fees and Payments",
    text: "Track dues, collections, invoices, concessions, reminders, and payment gateway readiness for Indian institutions.",
    icon: WalletCards
  },
  {
    title: "Attendance Automation",
    text: "Teacher uploads, daily summaries, parent alerts, and class-wise attendance insights with clean audit trails.",
    icon: CalendarCheck2
  },
  {
    title: "Exams and Report Cards",
    text: "Marks upload, exam groups, result analytics, downloadable report cards, and parent-facing progress views.",
    icon: BookOpenCheck
  },
  {
    title: "Digital Branding",
    text: "Modern school websites, SEO content, visual identity, landing pages, and trust-building digital presence.",
    icon: Sparkles
  }
];

export const services = [
  {
    title: "School Website Development",
    summary: "Premium custom-coded websites built for trust, admissions, SEO, and mobile-first parent discovery.",
    points: ["Fast responsive pages", "Admission-focused copy", "SEO schema", "Domain and hosting guidance"],
    icon: Building2
  },
  {
    title: "Student App",
    summary: "A clean student portal for homework, fees, attendance, notices, results, and profile access.",
    points: ["Unique student ID", "Secure password login", "Fees and reports", "Notifications"],
    icon: UsersRound
  },
  {
    title: "Admin App",
    summary: "Central command for owners, principals, and administrators to manage the institution digitally.",
    points: ["Student CRUD", "Analytics", "Branding controls", "Notice board"],
    icon: BarChart3
  },
  {
    title: "Finance System",
    summary: "Fees, staff salary, ledgers, dues, receipts, and payment gateway readiness designed for growth.",
    points: ["Fee plans", "Salary records", "Payment status", "Monthly collection charts"],
    icon: BadgeIndianRupee
  },
  {
    title: "Attendance System",
    summary: "Class-wise attendance uploads with parent alerts, reports, and dashboard summaries.",
    points: ["Teacher upload", "Parent visibility", "Daily reports", "Absence alerts"],
    icon: Fingerprint
  },
  {
    title: "Branding and Notifications",
    summary: "Digital identity, real-time notices, WhatsApp-ready communication, and polished parent experience.",
    points: ["School branding", "Live notices", "WhatsApp CTA", "Trust assets"],
    icon: Megaphone
  }
];

export const pricingPlans = [
  {
    name: "Basic",
    price: "Custom",
    description: "For schools starting their digital journey with a professional online presence.",
    features: ["Premium school website", "Contact and admission forms", "Basic student records", "WhatsApp CTA", "SEO foundation"],
    highlight: false
  },
  {
    name: "Professional",
    price: "Best Value",
    description: "Complete website plus core ERP for active daily operations.",
    features: ["Everything in Basic", "Admin, student, teacher panels", "Fees and attendance", "Results and notices", "30-day launch support"],
    highlight: true
  },
  {
    name: "Enterprise",
    price: "Scale",
    description: "For multi-branch schools, colleges, coaching institutes, and academies.",
    features: ["Everything in Professional", "Multi-school architecture", "Custom workflows", "Advanced analytics", "Priority support"],
    highlight: false
  }
];

export const testimonials = [
  {
    quote: "The platform gave our management team one clear view of admissions, fees, attendance, and parent communication.",
    name: "Principal, CBSE School",
    role: "Nagpur"
  },
  {
    quote: "Parents started trusting our digital process immediately because the interface feels premium and simple.",
    name: "Director, Coaching Institute",
    role: "Pune"
  },
  {
    quote: "From reports to fee reminders, the daily admin workload became easier to control.",
    name: "Administrator, Academy",
    role: "Indore"
  }
];

export const demoCredentials = [
  { role: "Admin", login: "admin@demo-school.in", password: "Admin@12345" },
  { role: "Teacher", login: "teacher@demo-school.in", password: "Teacher@12345" },
  { role: "Student", login: "VIDY-2026-0001", password: "Student@12345" },
  { role: "Parent", login: "parent@demo-school.in", password: "Parent@12345" }
];

export const trustItems = [
  "JWT authentication",
  "Role-based access",
  "PostgreSQL-ready",
  "Payment gateway ready",
  "Real-time notifications",
  "Multi-school scalable"
];

export const moduleMatrix = [
  "Admissions",
  "Students",
  "Parents",
  "Teachers",
  "Fees",
  "Payroll",
  "Attendance",
  "Homework",
  "Results",
  "Notices",
  "Reports",
  "Branding"
];

export const securityItems = [
  { title: "Protected Logins", icon: ShieldCheck },
  { title: "Live Alerts", icon: BellRing },
  { title: "ERP Analytics", icon: BarChart3 }
];
