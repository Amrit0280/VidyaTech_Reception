import { useEffect, useMemo, useState } from "react";
import {
  BadgeIndianRupee,
  BellRing,
  CalendarCheck2,
  CheckCircle2,
  Cloud,
  Download,
  Fingerprint,
  KeyRound,
  LayoutDashboard,
  LockKeyhole,
  Moon,
  Plus,
  Printer,
  QrCode,
  ReceiptText,
  RefreshCcw,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sun,
  Upload,
  UserPlus,
  UsersRound,
  WalletCards
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { brand } from "../data/siteData.js";
import { createReceiptNo, generatePassword, loadReceptionData, saveReceptionData } from "./receptionStore.js";
import {
  clearCloudSession,
  createCloudAdmission,
  createCloudCertificate,
  createCloudIdCard,
  createCloudNotification,
  createCloudPayment,
  createCloudStudent,
  getCloudSession,
  hasCloudApi,
  loadCloudReceptionData,
  loginToCloud,
  resetCloudPassword
} from "./receptionApi.js";

const tabs = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "admissions", label: "Admissions", icon: UserPlus },
  { id: "billing", label: "Fee Billing", icon: ReceiptText },
  { id: "dues", label: "Dues", icon: WalletCards },
  { id: "students", label: "Students", icon: UsersRound },
  { id: "credentials", label: "IDs & Passwords", icon: KeyRound },
  { id: "certificates", label: "Certificates", icon: Printer },
  { id: "idcards", label: "ID Cards", icon: Fingerprint },
  { id: "notifications", label: "Notifications", icon: BellRing },
  { id: "reports", label: "Reports", icon: BadgeIndianRupee },
  { id: "settings", label: "Backup & Settings", icon: Settings }
];

const feeTypes = ["Admission", "Tuition", "Transport", "Exam", "Miscellaneous"];
const paymentModes = ["Cash", "UPI", "Card", "Bank Transfer"];
const admissionStatuses = ["Inquiry", "Pending", "Approved", "Enrolled"];
const certificateTypes = [
  "Admission Confirmation",
  "Fee Receipt",
  "Bonafide",
  "Character Certificate",
  "Transfer Certificate Request",
  "Due Reminder Slip",
  "Student Profile"
];

function today() {
  return new Date().toISOString().slice(0, 10);
}

function formatMoney(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

function metricTrend(payments) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  return months.map((month, index) => ({
    month,
    collection: payments.reduce((total, payment, paymentIndex) => {
      return total + (paymentIndex % months.length === index ? Number(payment.total) : 0);
    }, index * 3500 + 12000)
  }));
}

function Field({ label, children }) {
  return (
    <label className="reception-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

export default function ReceptionDesktop({ theme, setTheme }) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [data, setData] = useState(null);
  const [cloudMode, setCloudMode] = useState(() => hasCloudApi());
  const [cloudUser, setCloudUser] = useState(() => getCloudSession().user);
  const [loginForm, setLoginForm] = useState({
    login: "",
    password: "",
    schoolSlug: "skp-sainik-public-school"
  });
  const [query, setQuery] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [toast, setToast] = useState("");
  const [receipt, setReceipt] = useState(null);
  const [feeForm, setFeeForm] = useState({
    feeType: "Tuition Fee",
    amount: 4500,
    discount: 0,
    concession: 0,
    lateFee: 0,
    mode: "Cash",
    remarks: ""
  });
  const [studentForm, setStudentForm] = useState({
    name: "",
    admissionNumber: "",
    fatherName: "",
    motherName: "",
    dob: "",
    gender: "Male",
    className: "",
    section: "",
    rollNumber: "",
    session: "2026-27",
    parentName: "",
    mobile: "",
    alternateMobile: "",
    email: "",
    occupation: "",
    address: "",
    previousSchool: "",
    aadhaarId: "",
    photoUrl: "",
    feePlan: "Monthly",
    birthCertificate: false,
    transferCertificate: false,
    aadhaarDocument: false,
    photoDocument: false
  });
  const [admissionForm, setAdmissionForm] = useState({
    studentName: "",
    guardianName: "",
    phone: "",
    classRequested: "",
    status: "Inquiry",
    notes: ""
  });
  const [feeStructureForm, setFeeStructureForm] = useState({
    className: "IX",
    session: "2026-27",
    category: "Tuition",
    amount: 4500,
    installments: 12,
    finePerDay: 25
  });
  const [certificateForm, setCertificateForm] = useState({
    type: "Bonafide"
  });
  const [noticeForm, setNoticeForm] = useState({
    audience: "All Parents",
    title: "",
    message: "",
    channel: "App + SMS"
  });
  const [idCardBatch, setIdCardBatch] = useState("selected");

  async function loadData() {
    try {
      if (hasCloudApi() && getCloudSession().token) {
        const cloudData = await loadCloudReceptionData();
        setCloudMode(true);
        setCloudUser(getCloudSession().user);
        setData(cloudData);
        setSelectedStudentId(cloudData.students[0]?.id || "");
        return;
      }
    } catch (error) {
      console.error("Could not load cloud reception data", error);
      setToast("Cloud unavailable. Using local fallback data.");
    }

    const loadedData = await loadReceptionData();
    setCloudMode(false);
    setData(loadedData);
    setSelectedStudentId(loadedData.students[0]?.id || "");
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!data) {
      return;
    }

    if (cloudMode) {
      return;
    }

    saveReceptionData(data).catch((error) => {
      console.error("Could not save reception data", error);
      setToast("Could not save local data. Please export a backup.");
    });
  }, [cloudMode, data]);

  const selectedStudent = useMemo(() => {
    return data?.students.find((student) => student.id === selectedStudentId) || null;
  }, [data, selectedStudentId]);

  const filteredStudents = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!data) {
      return [];
    }
    if (!term) {
      return data.students;
    }
    return data.students.filter((student) => {
      return [
        student.name,
        student.className,
        student.section,
        student.rollNumber,
        student.admissionNumber,
        student.mobile,
        student.parentName,
        student.portalId,
        student.aadhaarId
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    });
  }, [data, query]);

  const stats = useMemo(() => {
    if (!data) {
      return { totalStudents: 0, dues: 0, overdue: 0, collection: 0 };
    }
    return {
      totalStudents: data.students.length,
      dues: data.students.reduce((total, student) => total + Number(student.dueBalance || 0), 0),
      overdue: data.students.filter((student) => Number(student.dueBalance || 0) > 5000).length,
      collection: data.payments.reduce((total, payment) => total + Number(payment.total || 0), 0),
      todayCollection: data.payments
        .filter((payment) => payment.date === today())
        .reduce((total, payment) => total + Number(payment.total || 0), 0),
      todayAdmissions: data.admissions.filter((admission) => admission.date === today()).length,
      certificatesIssued: data.certificates.length,
      newRegistrations: data.students.filter((student) => student.createdAt === today()).length,
      activeStudents: data.students.filter((student) => student.status === "Active").length
    };
  }, [data]);

  if (!data) {
    return (
      <div className="reception-loading">
        <img src={brand.logoIcon} alt="" />
        <strong>Opening VidyaTech Reception...</strong>
      </div>
    );
  }

  function showToast(message) {
    setToast(message);
    window.setTimeout(() => setToast(""), 3200);
  }

  async function handleCloudLogin(event) {
    event.preventDefault();
    try {
      const session = await loginToCloud(loginForm);
      setCloudUser(session.user);
      setCloudMode(true);
      const cloudData = await loadCloudReceptionData();
      setData(cloudData);
      setSelectedStudentId(cloudData.students[0]?.id || "");
      showToast("Cloud login successful.");
    } catch (error) {
      console.error(error);
      showToast(error.message || "Cloud login failed.");
    }
  }

  async function handleCloudLogout() {
    clearCloudSession();
    setCloudUser(null);
    setCloudMode(false);
    await loadData();
    showToast("Cloud session signed out.");
  }

  function patchFeeForm(field, value) {
    setFeeForm((current) => ({ ...current, [field]: value }));
  }

  function patchStudentForm(field, value) {
    setStudentForm((current) => ({ ...current, [field]: value }));
  }

  function patchAdmissionForm(field, value) {
    setAdmissionForm((current) => ({ ...current, [field]: value }));
  }

  function patchFeeStructureForm(field, value) {
    setFeeStructureForm((current) => ({ ...current, [field]: value }));
  }

  function patchNoticeForm(field, value) {
    setNoticeForm((current) => ({ ...current, [field]: value }));
  }

  async function recordPayment(event) {
    event.preventDefault();

    if (!selectedStudent) {
      showToast("Select a student before billing.");
      return;
    }

    const total = Math.max(
      0,
      Number(feeForm.amount || 0) + Number(feeForm.lateFee || 0) - Number(feeForm.discount || 0) - Number(feeForm.concession || 0)
    );
    const paymentInput = {
      studentId: selectedStudent.databaseId || selectedStudent.id,
      feeType: feeForm.feeType,
      amount: Number(feeForm.amount || 0),
      discount: Number(feeForm.discount || 0),
      concession: Number(feeForm.concession || 0),
      lateFee: Number(feeForm.lateFee || 0),
      mode: feeForm.mode,
      remarks: feeForm.remarks
    };

    const payment = {
      id: `pay-${Date.now()}`,
      receiptNo: createReceiptNo(data.payments.length),
      studentId: selectedStudent.id,
      studentName: selectedStudent.name,
      feeType: paymentInput.feeType,
      amount: paymentInput.amount,
      discount: paymentInput.discount,
      concession: paymentInput.concession,
      lateFee: paymentInput.lateFee,
      total,
      mode: paymentInput.mode,
      date: today(),
      remarks: paymentInput.remarks
    };

    if (cloudMode) {
      try {
        const cloudPayment = await createCloudPayment(paymentInput);
        const cloudData = await loadCloudReceptionData();
        setData(cloudData);
        setReceipt(cloudPayment);
        showToast(`Receipt ${cloudPayment.receiptNo} generated in cloud.`);
        return;
      } catch (error) {
        console.error(error);
        showToast(error.message || "Cloud payment failed.");
        return;
      }
    }

    setData((current) => ({
      ...current,
      payments: [payment, ...current.payments],
      students: current.students.map((student) =>
        student.id === selectedStudent.id
          ? { ...student, dueBalance: Math.max(0, Number(student.dueBalance || 0) - total), lastPaid: today() }
          : student
      ),
      activityLog: [
        { id: `act-${Date.now()}`, title: "Fee receipt generated", detail: `${payment.receiptNo} / ${payment.studentName}`, date: today() },
        ...(current.activityLog || [])
      ].slice(0, 20)
    }));
    setReceipt(payment);
    showToast(`Receipt ${payment.receiptNo} generated.`);
  }

  async function addStudent(event) {
    event.preventDefault();
    const nextIndex = data.students.length + 1;
    const student = {
      id: `stu-${Date.now()}`,
      ...studentForm,
      rollNumber: studentForm.rollNumber || String(nextIndex).padStart(2, "0"),
      createdAt: today(),
      dueBalance: 0,
      attendance: 100,
      status: "Active",
      portalId: `VIDY-2026-${String(nextIndex).padStart(4, "0")}`,
      password: generatePassword()
    };

    if (cloudMode) {
      try {
        const created = await createCloudStudent({
          ...studentForm,
          mobile: studentForm.mobile,
          parentName: studentForm.parentName,
          parentMobile: studentForm.mobile,
          dueBalance: 0
        });
        const cloudData = await loadCloudReceptionData();
        setData(cloudData);
        setSelectedStudentId(String(created.student.id));
        showToast(`Student created. Login ${created.credentials.login}`);
        return;
      } catch (error) {
        console.error(error);
        showToast(error.message || "Could not create cloud student.");
        return;
      }
    }

    setData((current) => ({
      ...current,
      students: [student, ...current.students],
      activityLog: [
        { id: `act-${Date.now()}`, title: "Student enrolled", detail: `${student.name} / ${student.className}-${student.section}`, date: today() },
        ...(current.activityLog || [])
      ].slice(0, 20)
    }));
    setSelectedStudentId(student.id);
    setStudentForm({
      name: "",
      admissionNumber: "",
      fatherName: "",
      motherName: "",
      dob: "",
      gender: "Male",
      className: "",
      section: "",
      rollNumber: "",
      session: "2026-27",
      parentName: "",
      mobile: "",
      alternateMobile: "",
      email: "",
      occupation: "",
      address: "",
      previousSchool: "",
      aadhaarId: "",
      photoUrl: "",
      feePlan: "Monthly",
      birthCertificate: false,
      transferCertificate: false,
      aadhaarDocument: false,
      photoDocument: false
    });
    showToast("Student profile and portal login created.");
  }

  async function resetPassword(studentId) {
    if (cloudMode) {
      try {
        const result = await resetCloudPassword(studentId);
        showToast(`Password reset. Login ${result.login}, temporary password ${result.password}`);
        return;
      } catch (error) {
        console.error(error);
        showToast(error.message || "Could not reset password.");
        return;
      }
    }

    const password = generatePassword();
    setData((current) => ({
      ...current,
      students: current.students.map((student) => (student.id === studentId ? { ...student, password } : student))
    }));
    showToast("Secure password reset successfully.");
  }

  async function addAdmission(event) {
    event.preventDefault();
    const admission = {
      id: `adm-${Date.now()}`,
      ...admissionForm,
      date: today()
    };

    if (cloudMode) {
      try {
        const savedAdmission = await createCloudAdmission({
          ...admissionForm,
          status: admissionForm.status.toLowerCase()
        });
        setData((current) => ({
          ...current,
          admissions: [savedAdmission, ...current.admissions],
          activityLog: [
            { id: `act-${Date.now()}`, title: "Admission enquiry added", detail: `${savedAdmission.studentName} / ${savedAdmission.classRequested}`, date: today() },
            ...(current.activityLog || [])
          ].slice(0, 20)
        }));
        setAdmissionForm({ studentName: "", guardianName: "", phone: "", classRequested: "", status: "Inquiry", notes: "" });
        showToast("Admission enquiry saved to cloud.");
        return;
      } catch (error) {
        console.error(error);
        showToast(error.message || "Could not save cloud admission.");
        return;
      }
    }

    setData((current) => ({
      ...current,
      admissions: [admission, ...current.admissions],
      activityLog: [
        { id: `act-${Date.now()}`, title: "Admission enquiry added", detail: `${admission.studentName} / ${admission.classRequested}`, date: today() },
        ...(current.activityLog || [])
      ].slice(0, 20)
    }));
    setAdmissionForm({ studentName: "", guardianName: "", phone: "", classRequested: "", status: "Inquiry", notes: "" });
    showToast("Admission workflow created.");
  }

  function addFeeStructure(event) {
    event.preventDefault();
    const structure = {
      id: `fee-struct-${Date.now()}`,
      ...feeStructureForm,
      amount: Number(feeStructureForm.amount || 0),
      installments: Number(feeStructureForm.installments || 1),
      finePerDay: Number(feeStructureForm.finePerDay || 0)
    };
    setData((current) => ({
      ...current,
      feeStructures: [structure, ...(current.feeStructures || [])],
      activityLog: [
        { id: `act-${Date.now()}`, title: "Fee structure updated", detail: `${structure.className} / ${structure.category}`, date: today() },
        ...(current.activityLog || [])
      ].slice(0, 20)
    }));
    showToast("Fee structure saved.");
  }

  function issueCertificate(event) {
    event.preventDefault();
    if (!selectedStudent) {
      showToast("Select a student before issuing a certificate.");
      return;
    }

    if (cloudMode) {
      createCloudCertificate({ studentId: selectedStudent.databaseId || selectedStudent.id, type: certificateForm.type })
        .then((certificate) => {
          setData((current) => ({
            ...current,
            certificates: [certificate, ...(current.certificates || [])],
            activityLog: [
              { id: `act-${Date.now()}`, title: "Certificate issued", detail: `${certificate.type} / ${certificate.studentName}`, date: today() },
              ...(current.activityLog || [])
            ].slice(0, 20)
          }));
          showToast(`${certificate.type} certificate issued in cloud.`);
        })
        .catch((error) => {
          console.error(error);
          showToast(error.message || "Could not issue cloud certificate.");
        });
      return;
    }

    const certificate = {
      id: `cert-${Date.now()}`,
      certificateNo: `CERT-${new Date().getFullYear()}-${String((data.certificates || []).length + 1).padStart(4, "0")}`,
      studentId: selectedStudent.id,
      studentName: selectedStudent.name,
      type: certificateForm.type,
      date: today(),
      status: "Issued"
    };
    setData((current) => ({
      ...current,
      certificates: [certificate, ...(current.certificates || [])],
      activityLog: [
        { id: `act-${Date.now()}`, title: "Certificate issued", detail: `${certificate.type} / ${certificate.studentName}`, date: today() },
        ...(current.activityLog || [])
      ].slice(0, 20)
    }));
    showToast(`${certificate.type} certificate issued.`);
  }

  function issueIdCard(student = selectedStudent) {
    if (!student) {
      showToast("Select a student before issuing an ID card.");
      return;
    }

    if (cloudMode) {
      createCloudIdCard({ studentId: student.databaseId || student.id })
        .then((card) => {
          setData((current) => ({
            ...current,
            idCards: [card, ...(current.idCards || [])],
            activityLog: [
              { id: `act-${Date.now()}`, title: "ID card issued", detail: `${card.cardNo} / ${card.studentName}`, date: today() },
              ...(current.activityLog || [])
            ].slice(0, 20)
          }));
          showToast(`ID card ${card.cardNo} issued in cloud.`);
        })
        .catch((error) => {
          console.error(error);
          showToast(error.message || "Could not issue cloud ID card.");
        });
      return;
    }

    const card = {
      id: `card-${Date.now()}-${student.id}`,
      cardNo: `ID-${new Date().getFullYear()}-${String((data.idCards || []).length + 1).padStart(4, "0")}`,
      studentId: student.id,
      studentName: student.name,
      status: "Active",
      issuedAt: today()
    };
    setData((current) => ({
      ...current,
      idCards: [card, ...(current.idCards || [])],
      activityLog: [
        { id: `act-${Date.now()}`, title: "ID card issued", detail: `${card.cardNo} / ${card.studentName}`, date: today() },
        ...(current.activityLog || [])
      ].slice(0, 20)
    }));
    showToast(`ID card ${card.cardNo} issued.`);
  }

  function bulkIssueIdCards() {
    const targets = idCardBatch === "all" ? filteredStudents : selectedStudent ? [selectedStudent] : [];
    if (!targets.length) {
      showToast("No students selected for ID card issue.");
      return;
    }

    if (cloudMode && idCardBatch === "selected") {
      issueIdCard(selectedStudent);
      return;
    }

    if (cloudMode) {
      showToast("Cloud bulk issue will be added after selected-card verification. Use selected student for now.");
      return;
    }

    setData((current) => {
      const cards = targets.map((student, index) => ({
        id: `card-${Date.now()}-${student.id}`,
        cardNo: `ID-${new Date().getFullYear()}-${String((current.idCards || []).length + index + 1).padStart(4, "0")}`,
        studentId: student.id,
        studentName: student.name,
        status: "Active",
        issuedAt: today()
      }));
      return {
        ...current,
        idCards: [...cards, ...(current.idCards || [])],
        activityLog: [
          { id: `act-${Date.now()}`, title: "ID cards issued", detail: `${cards.length} card(s) prepared for printing`, date: today() },
          ...(current.activityLog || [])
        ].slice(0, 20)
      };
    });
    showToast(`${targets.length} ID card(s) issued.`);
  }

  async function sendNotification(event) {
    event.preventDefault();
    const notification = {
      id: `note-${Date.now()}`,
      ...noticeForm,
      date: today()
    };

    if (cloudMode) {
      try {
        const savedNotification = await createCloudNotification(noticeForm);
        setData((current) => ({
          ...current,
          notifications: [savedNotification, ...current.notifications],
          activityLog: [
            { id: `act-${Date.now()}`, title: "Notification queued", detail: `${savedNotification.title} / ${savedNotification.audience}`, date: today() },
            ...(current.activityLog || [])
          ].slice(0, 20)
        }));
        setNoticeForm({ audience: "All Parents", title: "", message: "", channel: "App + SMS" });
        showToast("Notification queued in cloud.");
        return;
      } catch (error) {
        console.error(error);
        showToast(error.message || "Could not queue cloud notification.");
        return;
      }
    }
    setData((current) => ({
      ...current,
      notifications: [notification, ...current.notifications],
      activityLog: [
        { id: `act-${Date.now()}`, title: "Notification queued", detail: `${notification.title} / ${notification.audience}`, date: today() },
        ...(current.activityLog || [])
      ].slice(0, 20)
    }));
    setNoticeForm({ audience: "All Parents", title: "", message: "", channel: "App + SMS" });
    showToast("Notification recorded and ready for online sync.");
  }

  async function printReceipt() {
    if (window.vidyaTechDesktop?.printToPdf) {
      await window.vidyaTechDesktop.printToPdf();
      showToast("Receipt PDF saved.");
      return;
    }
    window.print();
  }

  async function saveBackup() {
    if (window.vidyaTechDesktop?.saveBackup) {
      const result = await window.vidyaTechDesktop.saveBackup(data);
      if (!result.canceled) {
        showToast("Backup exported successfully.");
      }
      return;
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `vidyatech-reception-backup-${today()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function restoreBackup() {
    if (window.vidyaTechDesktop?.restoreBackup) {
      const result = await window.vidyaTechDesktop.restoreBackup();
      if (result.ok) {
        setData(result.data);
        showToast("Backup restored.");
      }
    }
  }

  function exportCsv() {
    const rows = [
      ["Receipt", "Date", "Student", "Fee Type", "Mode", "Total"],
      ...data.payments.map((payment) => [
        payment.receiptNo,
        payment.date,
        payment.studentName,
        payment.feeType,
        payment.mode,
        payment.total
      ])
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `vidyatech-collections-${today()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="reception-shell">
      <aside className="reception-sidebar">
        <div className="reception-brand">
          <img className="reception-full-logo" src={brand.logoFull} alt="VidyaTech" />
          <span>Reception ERP</span>
        </div>

        <nav className="reception-nav">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                className={activeTab === tab.id ? "active" : ""}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={19} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        <div className="reception-secure-card">
          <ShieldCheck size={20} />
          <strong>Secure office mode</strong>
          <span>Encrypted local records, backups, and role-ready workflows.</span>
        </div>
      </aside>

      <section className="reception-workspace">
        <header className="reception-topbar">
          <div>
            <span>{data.school.session} Academic Session</span>
            <h1>{data.school.name}</h1>
          </div>
          <div className="reception-search">
            <Search size={18} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, class, roll, admission no., mobile"
            />
          </div>
          <div className="topbar-actions">
            <span className="sync-pill">
              <Cloud size={16} />
              {cloudMode ? `Cloud: ${cloudUser?.role || data.settings.role}` : data.settings.syncStatus}
            </span>
            <button className="icon-button" type="button" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </header>

        <main className="reception-content">
          {activeTab === "dashboard" && (
            <>
              <div className="reception-metrics">
                <article>
                  <UsersRound size={22} />
                  <span>Active Students</span>
                  <strong>{stats.totalStudents}</strong>
                </article>
                <article>
                  <UserPlus size={22} />
                  <span>Today Admissions</span>
                  <strong>{stats.todayAdmissions}</strong>
                </article>
                <article>
                  <BadgeIndianRupee size={22} />
                  <span>Fees Collected Today</span>
                  <strong>{formatMoney(stats.todayCollection)}</strong>
                </article>
                <article>
                  <BadgeIndianRupee size={22} />
                  <span>Total Collection</span>
                  <strong>{formatMoney(stats.collection)}</strong>
                </article>
                <article>
                  <WalletCards size={22} />
                  <span>Pending Dues</span>
                  <strong>{formatMoney(stats.dues)}</strong>
                </article>
                <article>
                  <BellRing size={22} />
                  <span>Overdue Alerts</span>
                  <strong>{stats.overdue}</strong>
                </article>
                <article>
                  <Printer size={22} />
                  <span>Certificates Issued</span>
                  <strong>{stats.certificatesIssued}</strong>
                </article>
                <article>
                  <Fingerprint size={22} />
                  <span>ID Cards Active</span>
                  <strong>{data.idCards?.length || 0}</strong>
                </article>
              </div>

              <div className="reception-grid two">
                <section className="reception-panel">
                  <div className="panel-heading">
                    <div>
                      <span>Quick actions</span>
                      <h2>Daily reception work</h2>
                    </div>
                  </div>
                  <div className="quick-actions">
                    <button type="button" onClick={() => setActiveTab("billing")}>
                      <ReceiptText size={22} />
                      New Receipt
                    </button>
                    <button type="button" onClick={() => setActiveTab("students")}>
                      <UserPlus size={22} />
                      Add Student
                    </button>
                    <button type="button" onClick={() => setActiveTab("admissions")}>
                      <CalendarCheck2 size={22} />
                      Admission Enquiry
                    </button>
                    <button type="button" onClick={() => setActiveTab("dues")}>
                      <WalletCards size={22} />
                      View Dues
                    </button>
                    <button type="button" onClick={() => setActiveTab("certificates")}>
                      <Printer size={22} />
                      Print Certificate
                    </button>
                    <button type="button" onClick={() => setActiveTab("idcards")}>
                      <Fingerprint size={22} />
                      ID Card
                    </button>
                    <button type="button" onClick={() => setActiveTab("notifications")}>
                      <Send size={22} />
                      Send Notice
                    </button>
                  </div>
                </section>

                <section className="reception-panel">
                  <div className="panel-heading">
                    <div>
                      <span>Collections</span>
                      <h2>Monthly finance pulse</h2>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={metricTrend(data.payments)}>
                      <defs>
                        <linearGradient id="deskCollection" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0f62fe" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#0f62fe" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(125,139,160,0.22)" />
                      <XAxis dataKey="month" tickLine={false} axisLine={false} />
                      <YAxis tickLine={false} axisLine={false} />
                      <Tooltip />
                      <Area type="monotone" dataKey="collection" stroke="#0f62fe" strokeWidth={3} fill="url(#deskCollection)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </section>
              </div>

              <section className="reception-panel">
                <div className="panel-heading">
                  <div>
                    <span>Activity log</span>
                    <h2>Latest reception actions</h2>
                  </div>
                  <ShieldCheck size={24} />
                </div>
                <div className="activity-list">
                  {(data.activityLog || []).slice(0, 8).map((activity) => (
                    <article key={activity.id}>
                      <strong>{activity.title}</strong>
                      <span>{activity.detail}</span>
                      <small>{activity.date}</small>
                    </article>
                  ))}
                </div>
              </section>
            </>
          )}

          {activeTab === "billing" && (
            <div className="reception-grid billing-grid">
              <section className="reception-panel">
                <div className="panel-heading">
                  <div>
                    <span>Billing</span>
                    <h2>Generate fee receipt</h2>
                  </div>
                  <ReceiptText size={24} />
                </div>
                <form className="fee-structure-strip" onSubmit={addFeeStructure}>
                  <strong>Fee structure setup</strong>
                  <input value={feeStructureForm.className} onChange={(event) => patchFeeStructureForm("className", event.target.value)} placeholder="Class" />
                  <select value={feeStructureForm.category} onChange={(event) => patchFeeStructureForm("category", event.target.value)}>
                    {feeTypes.map((type) => (
                      <option key={type}>{type}</option>
                    ))}
                  </select>
                  <input type="number" value={feeStructureForm.amount} onChange={(event) => patchFeeStructureForm("amount", event.target.value)} placeholder="Amount" />
                  <input type="number" value={feeStructureForm.finePerDay} onChange={(event) => patchFeeStructureForm("finePerDay", event.target.value)} placeholder="Fine/day" />
                  <button className="btn btn-secondary" type="submit">
                    Save
                  </button>
                </form>
                <form className="reception-form" onSubmit={recordPayment}>
                  <Field label="Student">
                    <select value={selectedStudentId} onChange={(event) => setSelectedStudentId(event.target.value)}>
                      {filteredStudents.map((student) => (
                        <option key={student.id} value={student.id}>
                          {student.name} - {student.className}-{student.section} - {student.admissionNumber}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <div className="form-row">
                    <Field label="Fee Type">
                      <select value={feeForm.feeType} onChange={(event) => patchFeeForm("feeType", event.target.value)}>
                        {feeTypes.map((type) => (
                          <option key={type}>{type}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Payment Mode">
                      <select value={feeForm.mode} onChange={(event) => patchFeeForm("mode", event.target.value)}>
                        {paymentModes.map((mode) => (
                          <option key={mode}>{mode}</option>
                        ))}
                      </select>
                    </Field>
                  </div>
                  <div className="form-row">
                    <Field label="Amount">
                      <input type="number" value={feeForm.amount} onChange={(event) => patchFeeForm("amount", event.target.value)} />
                    </Field>
                    <Field label="Late Fee">
                      <input type="number" value={feeForm.lateFee} onChange={(event) => patchFeeForm("lateFee", event.target.value)} />
                    </Field>
                  </div>
                  <div className="form-row">
                    <Field label="Discount">
                      <input type="number" value={feeForm.discount} onChange={(event) => patchFeeForm("discount", event.target.value)} />
                    </Field>
                    <Field label="Concession / Scholarship">
                      <input type="number" value={feeForm.concession} onChange={(event) => patchFeeForm("concession", event.target.value)} />
                    </Field>
                  </div>
                  <Field label="Remarks">
                    <textarea rows="3" value={feeForm.remarks} onChange={(event) => patchFeeForm("remarks", event.target.value)} />
                  </Field>
                  <button className="btn btn-primary" type="submit">
                    <CheckCircle2 size={18} />
                    Record Payment & Generate Receipt
                  </button>
                </form>
              </section>

              <section className="receipt-preview reception-panel">
                <div className="receipt-paper">
                  <div className="receipt-head">
                    <img className="receipt-logo" src={brand.logoFull} alt="VidyaTech" />
                    <div>
                      <strong>{data.school.name}</strong>
                      <span>Official Fee Receipt</span>
                    </div>
                  </div>
                  {receipt ? (
                    <>
                      <div className="receipt-meta">
                        <span>{receipt.receiptNo}</span>
                        <span>{receipt.date}</span>
                      </div>
                      <dl>
                        <dt>Student</dt>
                        <dd>{receipt.studentName}</dd>
                        <dt>Fee Type</dt>
                        <dd>{receipt.feeType}</dd>
                        <dt>Payment Mode</dt>
                        <dd>{receipt.mode}</dd>
                        <dt>Net Paid</dt>
                        <dd>{formatMoney(receipt.total)}</dd>
                      </dl>
                      <button className="btn btn-secondary" type="button" onClick={printReceipt}>
                        <Printer size={18} />
                        Print / Save PDF
                      </button>
                    </>
                  ) : (
                    <div className="empty-state">
                      <ReceiptText size={38} />
                      <strong>Receipt preview</strong>
                      <span>Record a payment to generate a printable receipt.</span>
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}

          {activeTab === "dues" && (
            <section className="reception-panel">
              <div className="panel-heading">
                <div>
                  <span>Dues tracking</span>
                  <h2>Pending and overdue payments</h2>
                </div>
                <button className="btn btn-secondary" type="button" onClick={() => setActiveTab("notifications")}>
                  <BellRing size={18} />
                  Send Reminder
                </button>
              </div>
              <div className="data-table">
                <div className="table-row table-head">
                  <span>Student</span>
                  <span>Class</span>
                  <span>Parent Mobile</span>
                  <span>Due</span>
                  <span>Status</span>
                </div>
                {filteredStudents
                  .filter((student) => Number(student.dueBalance || 0) > 0)
                  .map((student) => (
                    <div key={student.id} className="table-row">
                      <span>{student.name}</span>
                      <span>{student.className}-{student.section}</span>
                      <span>{student.mobile}</span>
                      <strong>{formatMoney(student.dueBalance)}</strong>
                      <span className={student.dueBalance > 5000 ? "danger-pill" : "soft-pill"}>
                        {student.dueBalance > 5000 ? "Overdue" : "Pending"}
                      </span>
                    </div>
                  ))}
              </div>
            </section>
          )}

          {activeTab === "students" && (
            <div className="reception-grid student-grid">
              <section className="reception-panel">
                <div className="panel-heading">
                  <div>
                    <span>Student database</span>
                    <h2>Add admission / student record</h2>
                  </div>
                  <UserPlus size={24} />
                </div>
                <form className="reception-form" onSubmit={addStudent}>
                  <Field label="Student Name">
                    <input required value={studentForm.name} onChange={(event) => patchStudentForm("name", event.target.value)} />
                  </Field>
                  <div className="form-row">
                    <Field label="Father Name">
                      <input value={studentForm.fatherName} onChange={(event) => patchStudentForm("fatherName", event.target.value)} />
                    </Field>
                    <Field label="Mother Name">
                      <input value={studentForm.motherName} onChange={(event) => patchStudentForm("motherName", event.target.value)} />
                    </Field>
                  </div>
                  <div className="form-row">
                    <Field label="DOB">
                      <input type="date" value={studentForm.dob} onChange={(event) => patchStudentForm("dob", event.target.value)} />
                    </Field>
                    <Field label="Gender">
                      <select value={studentForm.gender} onChange={(event) => patchStudentForm("gender", event.target.value)}>
                        <option>Male</option>
                        <option>Female</option>
                        <option>Other</option>
                      </select>
                    </Field>
                  </div>
                  <div className="form-row">
                    <Field label="Admission Number">
                      <input value={studentForm.admissionNumber} onChange={(event) => patchStudentForm("admissionNumber", event.target.value)} placeholder="Auto if blank" />
                    </Field>
                    <Field label="Roll Number">
                      <input value={studentForm.rollNumber} onChange={(event) => patchStudentForm("rollNumber", event.target.value)} />
                    </Field>
                  </div>
                  <div className="form-row">
                    <Field label="Class">
                      <input required value={studentForm.className} onChange={(event) => patchStudentForm("className", event.target.value)} />
                    </Field>
                    <Field label="Section">
                      <input required value={studentForm.section} onChange={(event) => patchStudentForm("section", event.target.value)} />
                    </Field>
                  </div>
                  <Field label="Session">
                    <input value={studentForm.session} onChange={(event) => patchStudentForm("session", event.target.value)} />
                  </Field>
                  <Field label="Parent / Guardian">
                    <input required value={studentForm.parentName} onChange={(event) => patchStudentForm("parentName", event.target.value)} />
                  </Field>
                  <div className="form-row">
                    <Field label="Parent Mobile">
                      <input required value={studentForm.mobile} onChange={(event) => patchStudentForm("mobile", event.target.value)} />
                    </Field>
                    <Field label="Alternate Mobile">
                      <input value={studentForm.alternateMobile} onChange={(event) => patchStudentForm("alternateMobile", event.target.value)} />
                    </Field>
                  </div>
                  <div className="form-row">
                    <Field label="Email">
                      <input type="email" value={studentForm.email} onChange={(event) => patchStudentForm("email", event.target.value)} />
                    </Field>
                    <Field label="Occupation">
                      <input value={studentForm.occupation} onChange={(event) => patchStudentForm("occupation", event.target.value)} />
                    </Field>
                  </div>
                  <Field label="Address">
                    <textarea rows="3" value={studentForm.address} onChange={(event) => patchStudentForm("address", event.target.value)} />
                  </Field>
                  <div className="form-row">
                    <Field label="Previous School">
                      <input value={studentForm.previousSchool} onChange={(event) => patchStudentForm("previousSchool", event.target.value)} />
                    </Field>
                    <Field label="Aadhaar / ID">
                      <input value={studentForm.aadhaarId} onChange={(event) => patchStudentForm("aadhaarId", event.target.value)} />
                    </Field>
                  </div>
                  <Field label="Photo URL">
                    <input value={studentForm.photoUrl} onChange={(event) => patchStudentForm("photoUrl", event.target.value)} placeholder="Cloud file URL when uploaded" />
                  </Field>
                  <div className="document-checks">
                    <label><input type="checkbox" checked={studentForm.birthCertificate} onChange={(event) => patchStudentForm("birthCertificate", event.target.checked)} /> Birth Certificate</label>
                    <label><input type="checkbox" checked={studentForm.transferCertificate} onChange={(event) => patchStudentForm("transferCertificate", event.target.checked)} /> Transfer Certificate</label>
                    <label><input type="checkbox" checked={studentForm.aadhaarDocument} onChange={(event) => patchStudentForm("aadhaarDocument", event.target.checked)} /> Aadhaar</label>
                    <label><input type="checkbox" checked={studentForm.photoDocument} onChange={(event) => patchStudentForm("photoDocument", event.target.checked)} /> Photo</label>
                  </div>
                  <button className="btn btn-primary" type="submit">
                    <Plus size={18} />
                    Enroll Student & Generate Login
                  </button>
                </form>
              </section>

              <section className="reception-panel">
                <div className="panel-heading">
                  <div>
                    <span>Records</span>
                    <h2>Fast student lookup</h2>
                  </div>
                </div>
                <div className="student-list">
                  {filteredStudents.map((student) => (
                    <button
                      key={student.id}
                      type="button"
                      className={selectedStudentId === student.id ? "active" : ""}
                      onClick={() => setSelectedStudentId(student.id)}
                    >
                      <strong>{student.name}</strong>
                      <span>{student.admissionNumber} / {student.className}-{student.section} / Roll {student.rollNumber}</span>
                      <small>{student.mobile}</small>
                    </button>
                  ))}
                </div>
              </section>
            </div>
          )}

          {activeTab === "credentials" && (
            <section className="reception-panel">
              <div className="panel-heading">
                <div>
                  <span>Secure access</span>
                  <h2>Student and parent portal credentials</h2>
                </div>
                <LockKeyhole size={24} />
              </div>
              <div className="credential-grid">
                {filteredStudents.map((student) => (
                  <article key={student.id} className="credential-card">
                    <div>
                      <QrCode size={22} />
                      <strong>{student.name}</strong>
                      <span>{student.portalId}</span>
                    </div>
                    <code>{student.password}</code>
                    <button className="btn btn-secondary" type="button" onClick={() => resetPassword(student.id)}>
                      <RefreshCcw size={17} />
                      Reset Password
                    </button>
                  </article>
                ))}
              </div>
            </section>
          )}

          {activeTab === "certificates" && (
            <div className="reception-grid two">
              <section className="reception-panel">
                <div className="panel-heading">
                  <div>
                    <span>Certificates</span>
                    <h2>Issue print-ready documents</h2>
                  </div>
                  <Printer size={24} />
                </div>
                <form className="reception-form" onSubmit={issueCertificate}>
                  <Field label="Student">
                    <select value={selectedStudentId} onChange={(event) => setSelectedStudentId(event.target.value)}>
                      {filteredStudents.map((student) => (
                        <option key={student.id} value={student.id}>
                          {student.name} - {student.className}-{student.section}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Certificate Type">
                    <select value={certificateForm.type} onChange={(event) => setCertificateForm({ type: event.target.value })}>
                      {certificateTypes.map((type) => (
                        <option key={type}>{type}</option>
                      ))}
                    </select>
                  </Field>
                  <button className="btn btn-primary" type="submit">
                    <CheckCircle2 size={18} />
                    Issue Certificate
                  </button>
                </form>

                <div className="certificate-paper">
                  <img src={brand.logoFull} alt="VidyaTech" />
                  <span>{certificateForm.type}</span>
                  <h3>{selectedStudent?.name || "Select Student"}</h3>
                  <p>
                    This document is prepared for {selectedStudent?.className || "Class"}-{selectedStudent?.section || "Section"} with QR verification and signature placeholders.
                  </p>
                  <div className="signature-row">
                    <span>Class Teacher</span>
                    <span>Principal</span>
                    <span>Office Seal</span>
                  </div>
                  <button className="btn btn-secondary" type="button" onClick={printReceipt}>
                    <Printer size={18} />
                    Print / Save PDF
                  </button>
                </div>
              </section>

              <section className="reception-panel">
                <div className="panel-heading">
                  <div>
                    <span>Issued</span>
                    <h2>Certificate register</h2>
                  </div>
                </div>
                <div className="data-table">
                  <div className="table-row table-head">
                    <span>No.</span>
                    <span>Student</span>
                    <span>Type</span>
                    <span>Date</span>
                    <span>Status</span>
                  </div>
                  {(data.certificates || []).map((certificate) => (
                    <div key={certificate.id} className="table-row">
                      <span>{certificate.certificateNo}</span>
                      <span>{certificate.studentName}</span>
                      <span>{certificate.type}</span>
                      <span>{certificate.date}</span>
                      <span className="soft-pill">{certificate.status}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {activeTab === "idcards" && (
            <div className="reception-grid two">
              <section className="reception-panel">
                <div className="panel-heading">
                  <div>
                    <span>ID cards</span>
                    <h2>Issue and bulk print student cards</h2>
                  </div>
                  <Fingerprint size={24} />
                </div>
                <div className="idcard-actions">
                  <select value={idCardBatch} onChange={(event) => setIdCardBatch(event.target.value)}>
                    <option value="selected">Selected student</option>
                    <option value="all">All filtered students</option>
                  </select>
                  <button className="btn btn-primary" type="button" onClick={bulkIssueIdCards}>
                    <CheckCircle2 size={18} />
                    Issue ID Card
                  </button>
                  <button className="btn btn-secondary" type="button" onClick={printReceipt}>
                    <Printer size={18} />
                    Bulk Print
                  </button>
                </div>
                <div className="id-card-preview">
                  <div>
                    <img src={selectedStudent?.photoUrl || brand.logoIcon} alt="" />
                    <strong>{selectedStudent?.name || "Select Student"}</strong>
                    <span>{selectedStudent?.portalId || "STUDENT-ID"}</span>
                  </div>
                  <dl>
                    <dt>Class</dt>
                    <dd>{selectedStudent ? `${selectedStudent.className}-${selectedStudent.section}` : "-"}</dd>
                    <dt>Parent Contact</dt>
                    <dd>{selectedStudent?.mobile || "-"}</dd>
                    <dt>QR</dt>
                    <dd>{selectedStudent?.admissionNumber || "-"}</dd>
                  </dl>
                </div>
              </section>

              <section className="reception-panel">
                <div className="panel-heading">
                  <div>
                    <span>Register</span>
                    <h2>Issued ID cards</h2>
                  </div>
                </div>
                <div className="data-table">
                  <div className="table-row table-head">
                    <span>Card No.</span>
                    <span>Student</span>
                    <span>Issued</span>
                    <span>Status</span>
                  </div>
                  {(data.idCards || []).map((card) => (
                    <div key={card.id} className="table-row">
                      <span>{card.cardNo}</span>
                      <span>{card.studentName}</span>
                      <span>{card.issuedAt}</span>
                      <span className="soft-pill">{card.status}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="reception-grid two">
              <section className="reception-panel">
                <div className="panel-heading">
                  <div>
                    <span>Broadcast</span>
                    <h2>Send parent / student notification</h2>
                  </div>
                  <Send size={24} />
                </div>
                <form className="reception-form" onSubmit={sendNotification}>
                  <Field label="Audience">
                    <input value={noticeForm.audience} onChange={(event) => patchNoticeForm("audience", event.target.value)} />
                  </Field>
                  <Field label="Title">
                    <input required value={noticeForm.title} onChange={(event) => patchNoticeForm("title", event.target.value)} />
                  </Field>
                  <Field label="Message">
                    <textarea required rows="5" value={noticeForm.message} onChange={(event) => patchNoticeForm("message", event.target.value)} />
                  </Field>
                  <Field label="Channel">
                    <select value={noticeForm.channel} onChange={(event) => patchNoticeForm("channel", event.target.value)}>
                      <option>App + SMS</option>
                      <option>App Notification</option>
                      <option>Email</option>
                      <option>Emergency Broadcast</option>
                    </select>
                  </Field>
                  <button className="btn btn-primary" type="submit">
                    <Send size={18} />
                    Queue Notification
                  </button>
                </form>
              </section>
              <section className="reception-panel">
                <div className="panel-heading">
                  <div>
                    <span>History</span>
                    <h2>Notification log</h2>
                  </div>
                </div>
                <div className="notice-list">
                  {data.notifications.map((notification) => (
                    <article key={notification.id}>
                      <strong>{notification.title}</strong>
                      <p>{notification.message}</p>
                      <span>{notification.audience} / {notification.channel} / {notification.date}</span>
                    </article>
                  ))}
                </div>
              </section>
            </div>
          )}

          {activeTab === "admissions" && (
            <div className="reception-grid two">
              <section className="reception-panel">
                <div className="panel-heading">
                  <div>
                    <span>Admissions</span>
                    <h2>Inquiry to enrollment workflow</h2>
                  </div>
                  <UserPlus size={24} />
                </div>
                <form className="reception-form" onSubmit={addAdmission}>
                  <Field label="Student Name">
                    <input required value={admissionForm.studentName} onChange={(event) => patchAdmissionForm("studentName", event.target.value)} />
                  </Field>
                  <div className="form-row">
                    <Field label="Guardian Name">
                      <input required value={admissionForm.guardianName} onChange={(event) => patchAdmissionForm("guardianName", event.target.value)} />
                    </Field>
                    <Field label="Mobile Number">
                      <input required value={admissionForm.phone} onChange={(event) => patchAdmissionForm("phone", event.target.value)} />
                    </Field>
                  </div>
                  <div className="form-row">
                    <Field label="Class Requested">
                      <input required value={admissionForm.classRequested} onChange={(event) => patchAdmissionForm("classRequested", event.target.value)} />
                    </Field>
                    <Field label="Workflow Status">
                      <select value={admissionForm.status} onChange={(event) => patchAdmissionForm("status", event.target.value)}>
                        {admissionStatuses.map((status) => (
                          <option key={status}>{status}</option>
                        ))}
                      </select>
                    </Field>
                  </div>
                  <Field label="Follow-up Notes">
                    <textarea rows="4" value={admissionForm.notes} onChange={(event) => patchAdmissionForm("notes", event.target.value)} />
                  </Field>
                  <button className="btn btn-primary" type="submit">
                    <CheckCircle2 size={18} />
                    Save Admission Enquiry
                  </button>
                </form>
              </section>

              <section className="reception-panel">
                <div className="panel-heading">
                  <div>
                    <span>Pipeline</span>
                    <h2>Current admission queue</h2>
                  </div>
                </div>
                <div className="data-table">
                  <div className="table-row table-head">
                    <span>Student</span>
                    <span>Guardian</span>
                    <span>Phone</span>
                    <span>Class</span>
                    <span>Status</span>
                  </div>
                  {data.admissions.map((admission) => (
                    <div key={admission.id} className="table-row">
                      <span>{admission.studentName}</span>
                      <span>{admission.guardianName}</span>
                      <span>{admission.phone}</span>
                      <span>{admission.classRequested}</span>
                      <span className="soft-pill">{admission.status}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {activeTab === "reports" && (
            <section className="reception-panel">
              <div className="panel-heading">
                <div>
                  <span>Reports</span>
                  <h2>Financial, admission, and class analytics</h2>
                </div>
                <div className="button-row">
                  <button className="btn btn-secondary" type="button" onClick={printReceipt}>
                    <Printer size={18} />
                    Export PDF
                  </button>
                  <button className="btn btn-secondary" type="button" onClick={exportCsv}>
                    <Download size={18} />
                    Export CSV
                  </button>
                </div>
              </div>
              <div className="report-cards">
                <article>
                  <BadgeIndianRupee size={24} />
                  <span>Daily Fee Report</span>
                  <strong>{formatMoney(stats.todayCollection)}</strong>
                </article>
                <article>
                  <BadgeIndianRupee size={24} />
                  <span>Monthly Fee Report</span>
                  <strong>{formatMoney(stats.collection)}</strong>
                </article>
                <article>
                  <WalletCards size={24} />
                  <span>Pending Dues</span>
                  <strong>{formatMoney(stats.dues)}</strong>
                </article>
                <article>
                  <ReceiptText size={24} />
                  <span>Discounts</span>
                  <strong>{formatMoney(data.payments.reduce((total, payment) => total + Number(payment.discount || 0) + Number(payment.concession || 0), 0))}</strong>
                </article>
                <article>
                  <BellRing size={24} />
                  <span>Fine Report</span>
                  <strong>{formatMoney(data.payments.reduce((total, payment) => total + Number(payment.lateFee || 0), 0))}</strong>
                </article>
                <article>
                  <UserPlus size={24} />
                  <span>New Admissions</span>
                  <strong>{data.admissions.length}</strong>
                </article>
                <article>
                  <UsersRound size={24} />
                  <span>Class Strength</span>
                  <strong>{new Set(data.students.map((student) => `${student.className}-${student.section}`)).size}</strong>
                </article>
                <article>
                  <Fingerprint size={24} />
                  <span>Avg Attendance</span>
                  <strong>
                    {data.students.length
                      ? Math.round(data.students.reduce((total, student) => total + Number(student.attendance || 0), 0) / data.students.length)
                      : 0}%
                  </strong>
                </article>
                <article>
                  <CalendarCheck2 size={24} />
                  <span>Receipts</span>
                  <strong>{data.payments.length}</strong>
                </article>
              </div>
            </section>
          )}

          {activeTab === "settings" && (
            <section className="reception-panel">
              <div className="panel-heading">
                <div>
                  <span>Safety</span>
                  <h2>Backup, restore, roles, and sync</h2>
                </div>
                <ShieldCheck size={24} />
              </div>
              <div className="settings-grid">
                <article>
                  <Upload size={24} />
                  <strong>Backup database</strong>
                  <span>Export a local JSON backup for safekeeping.</span>
                  <button className="btn btn-primary" type="button" onClick={saveBackup}>
                    Export Backup
                  </button>
                </article>
                <article>
                  <Download size={24} />
                  <strong>Restore backup</strong>
                  <span>Restore records from a previous backup file.</span>
                  <button className="btn btn-secondary" type="button" onClick={restoreBackup}>
                    Restore Backup
                  </button>
                </article>
                <article>
                  <LockKeyhole size={24} />
                  <strong>Current role</strong>
                  <span>{data.settings.role}</span>
                  <span className="soft-pill">Role-ready: Receptionist, Accountant, Admin, Principal</span>
                </article>
                <article>
                  <Cloud size={24} />
                  <strong>Cloud PostgreSQL sync</strong>
                  <span>{hasCloudApi() ? "Connected through secure backend API." : "Set VITE_API_URL to enable cloud API mode."}</span>
                  <span className="soft-pill">{cloudMode ? "Cloud connected" : data.settings.syncStatus}</span>
                  {hasCloudApi() && !cloudUser && (
                    <form className="compact-login" onSubmit={handleCloudLogin}>
                      <input
                        value={loginForm.login}
                        onChange={(event) => setLoginForm((current) => ({ ...current, login: event.target.value }))}
                        placeholder="Login ID or email"
                        required
                      />
                      <input
                        type="password"
                        value={loginForm.password}
                        onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))}
                        placeholder="Password"
                        required
                      />
                      <input
                        value={loginForm.schoolSlug}
                        onChange={(event) => setLoginForm((current) => ({ ...current, schoolSlug: event.target.value }))}
                        placeholder="School slug"
                      />
                      <button className="btn btn-primary" type="submit">Sign In</button>
                    </form>
                  )}
                  {cloudUser && (
                    <button className="btn btn-secondary" type="button" onClick={handleCloudLogout}>
                      Sign Out Cloud Session
                    </button>
                  )}
                </article>
              </div>
            </section>
          )}
        </main>
      </section>

      {toast && <div className="reception-toast">{toast}</div>}
    </div>
  );
}
