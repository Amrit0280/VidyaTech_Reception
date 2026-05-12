import { useEffect, useMemo, useState } from "react";
import {
  BadgeIndianRupee,
  BellRing,
  CalendarCheck2,
  CheckCircle2,
  Cloud,
  Download,
  Eye,
  FileText,
  Filter,
  ImagePlus,
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
  Trash2,
  Upload,
  UserPlus,
  UserRoundCheck,
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
import {
  createAdmissionNumber,
  createPortalId,
  createReceiptNo,
  documentTypes,
  generatePassword,
  loadReceptionData,
  saveReceptionData
} from "./receptionStore.js";
import {
  clearCloudSession,
  createCloudAdmission,
  createCloudCertificate,
  createCloudNotification,
  createCloudPayment,
  createCloudStudent,
  deleteCloudStudent,
  getCloudSession,
  hasCloudApi,
  loadCloudReceptionData,
  loginToCloud,
  resetCloudPassword,
  upsertCloudStudentDocument
} from "./receptionApi.js";

const tabs = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "admissions", label: "Admissions", icon: UserPlus },
  { id: "profiles", label: "Student Profile", icon: UserRoundCheck },
  { id: "billing", label: "Fee Billing", icon: ReceiptText },
  { id: "dues", label: "Dues", icon: WalletCards },
  { id: "students", label: "Students", icon: UsersRound },
  { id: "management", label: "Management", icon: Filter },
  { id: "credentials", label: "IDs & Passwords", icon: KeyRound },
  { id: "certificates", label: "Certificates", icon: Printer },
  { id: "notifications", label: "Notifications", icon: BellRing },
  { id: "reports", label: "Reports", icon: BadgeIndianRupee },
  { id: "settings", label: "Backup & Settings", icon: Settings }
];

const feeTypes = ["Admission", "Tuition", "Transport", "Exam", "Miscellaneous"];
const paymentModes = ["Cash", "UPI", "Card", "Bank Transfer"];
const admissionStatuses = ["Inquiry", "Pending", "Approved", "Enrolled"];
const schoolHouses = ["Blue", "Green", "Red", "Yellow"];
const emptyFilterValue = "All";
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

function isAdminRole(role = "") {
  return ["admin", "principal", "super admin", "super_admin"].includes(String(role).toLowerCase());
}

function isSuperAdminRole(role = "") {
  return ["super admin", "super_admin"].includes(String(role).toLowerCase());
}

function activeOnly(students = []) {
  return students.filter((student) => !student.isDeleted && student.status !== "Inactive");
}

function getStudentDocuments(student) {
  return Array.isArray(student?.documents) ? student.documents : [];
}

function getMissingDocuments(student) {
  const uploadedTypes = new Set(getStudentDocuments(student).map((document) => document.type));
  return documentTypes.filter((document) => document.required && !uploadedTypes.has(document.id));
}

function getDocumentLabel(type) {
  return documentTypes.find((document) => document.id === type)?.label || type;
}

function getFileAccept(type) {
  return type === "passportPhoto" ? "image/png,image/jpeg,image/jpg" : "application/pdf,image/png,image/jpeg,image/jpg";
}

function downloadBlob(content, fileName, type) {
  const blob = content instanceof Blob ? content : new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
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
  const [uploadProgress, setUploadProgress] = useState({});
  const [managementFilters, setManagementFilters] = useState({
    className: emptyFilterValue,
    section: emptyFilterValue,
    feeDues: emptyFilterValue,
    pendingDocuments: emptyFilterValue,
    documentType: emptyFilterValue,
    house: emptyFilterValue,
    admissionStatus: emptyFilterValue
  });
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
    house: "Blue",
    feePlan: "Monthly",
    admissionStatus: "Pending",
    documents: [],
    profilePhoto: ""
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

  async function loadData() {
    try {
      if (hasCloudApi() && getCloudSession().token) {
        const cloudData = await loadCloudReceptionData();
        setCloudMode(true);
        setCloudUser(getCloudSession().user);
        setData(cloudData);
        setSelectedStudentId(activeOnly(cloudData.students)[0]?.id || "");
        return;
      }
    } catch (error) {
      console.error("Could not load cloud reception data", error);
      setToast("Cloud unavailable. Using local fallback data.");
    }

    const loadedData = await loadReceptionData();
    setCloudMode(false);
    setData(loadedData);
    setSelectedStudentId(activeOnly(loadedData.students)[0]?.id || "");
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

  const activeStudents = useMemo(() => activeOnly(data?.students || []), [data]);

  const filteredStudents = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!data) {
      return [];
    }
    if (!term) {
      return activeStudents;
    }
    return activeStudents.filter((student) => {
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
  }, [activeStudents, data, query]);

  const deletedStudents = useMemo(() => {
    return (data?.students || []).filter((student) => student.isDeleted || student.status === "Inactive");
  }, [data]);

  const nextAdmissionNumber = useMemo(() => createAdmissionNumber(data || { students: [], admissions: [] }), [data]);

  const filterOptions = useMemo(() => {
    const unique = (selector) => [emptyFilterValue, ...new Set(activeStudents.map(selector).filter(Boolean))];
    return {
      classes: unique((student) => student.className),
      sections: unique((student) => student.section),
      houses: unique((student) => student.house),
      statuses: unique((student) => student.status || "Active")
    };
  }, [activeStudents]);

  const managementStudents = useMemo(() => {
    return activeStudents.filter((student) => {
      const missingDocuments = getMissingDocuments(student);
      const documents = getStudentDocuments(student);
      const hasDocumentType =
        managementFilters.documentType === emptyFilterValue ||
        documents.some((document) => document.type === managementFilters.documentType);
      return (
        (managementFilters.className === emptyFilterValue || student.className === managementFilters.className) &&
        (managementFilters.section === emptyFilterValue || student.section === managementFilters.section) &&
        (managementFilters.house === emptyFilterValue || student.house === managementFilters.house) &&
        (managementFilters.admissionStatus === emptyFilterValue || (student.status || "Active") === managementFilters.admissionStatus) &&
        (managementFilters.feeDues === emptyFilterValue ||
          (managementFilters.feeDues === "With Dues" ? Number(student.dueBalance || 0) > 0 : Number(student.dueBalance || 0) <= 0)) &&
        (managementFilters.pendingDocuments === emptyFilterValue ||
          (managementFilters.pendingDocuments === "Pending" ? missingDocuments.length > 0 : missingDocuments.length === 0)) &&
        hasDocumentType
      );
    });
  }, [activeStudents, managementFilters]);

  const stats = useMemo(() => {
    if (!data) {
      return { totalStudents: 0, dues: 0, overdue: 0, collection: 0 };
    }
    return {
      totalStudents: activeStudents.length,
      dues: activeStudents.reduce((total, student) => total + Number(student.dueBalance || 0), 0),
      overdue: activeStudents.filter((student) => Number(student.dueBalance || 0) > 5000).length,
      collection: data.payments.reduce((total, payment) => total + Number(payment.total || 0), 0),
      todayCollection: data.payments
        .filter((payment) => payment.date === today())
        .reduce((total, payment) => total + Number(payment.total || 0), 0),
      todayAdmissions: data.admissions.filter((admission) => admission.date === today()).length,
      certificatesIssued: data.certificates.length,
      newRegistrations: activeStudents.filter((student) => student.createdAt === today()).length,
      activeStudents: activeStudents.filter((student) => student.status === "Active").length,
      pendingDocuments: activeStudents.filter((student) => getMissingDocuments(student).length > 0).length
    };
  }, [activeStudents, data]);

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
      setSelectedStudentId(activeOnly(cloudData.students)[0]?.id || "");
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

  function patchManagementFilter(field, value) {
    setManagementFilters((current) => ({ ...current, [field]: value }));
  }

  function resetAdmissionForm() {
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
      session: data?.school?.session || "2026-27",
      parentName: "",
      mobile: "",
      alternateMobile: "",
      email: "",
      occupation: "",
      address: "",
      previousSchool: "",
      aadhaarId: "",
      house: "Blue",
      feePlan: "Monthly",
      admissionStatus: "Pending",
      documents: [],
      profilePhoto: ""
    });
    setUploadProgress({});
  }

  function handleDocumentUpload(type, file) {
    if (!file) {
      return;
    }

    const allowedTypes = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      showToast("Only PDF, JPG, and PNG documents are allowed.");
      return;
    }

    const maxSize = 8 * 1024 * 1024;
    if (file.size > maxSize) {
      showToast("Document must be below 8 MB.");
      return;
    }

    setUploadProgress((current) => ({ ...current, [type]: 45 }));
    const reader = new FileReader();
    reader.onload = () => {
      const document = {
        id: `doc-${Date.now()}-${type}`,
        type,
        label: getDocumentLabel(type),
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        dataUrl: reader.result,
        uploadedAt: new Date().toISOString(),
        status: "Uploaded"
      };

      setStudentForm((current) => {
        const documents = [
          document,
          ...(current.documents || []).filter((item) => item.type !== type)
        ];
        return {
          ...current,
          documents,
          profilePhoto: type === "passportPhoto" ? reader.result : current.profilePhoto
        };
      });
      setUploadProgress((current) => ({ ...current, [type]: 100 }));
      showToast(`${document.label} uploaded.`);
    };
    reader.onerror = () => showToast("Could not read selected document.");
    reader.readAsDataURL(file);
  }

  function downloadDocument(studentDocument) {
    if (!studentDocument?.dataUrl) {
      showToast("This document only has metadata. No local file is attached.");
      return;
    }

    const link = document.createElement("a");
    link.href = studentDocument.dataUrl;
    link.download = studentDocument.fileName || `${studentDocument.label}.pdf`;
    link.click();
  }

  function replaceStudentDocument(studentId, type, file) {
    if (!file) {
      return;
    }

    const allowedTypes = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      showToast("Only PDF, JPG, and PNG documents are allowed.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const studentDocument = {
        id: `doc-${Date.now()}-${type}`,
        type,
        label: getDocumentLabel(type),
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        dataUrl: reader.result,
        uploadedAt: new Date().toISOString(),
        status: "Uploaded"
      };

      const targetStudent = data.students.find((student) => student.id === studentId);
      if (cloudMode && targetStudent?.databaseId) {
        try {
          await upsertCloudStudentDocument(targetStudent.databaseId, studentDocument);
          const cloudData = await loadCloudReceptionData();
          setData(cloudData);
          showToast(`${studentDocument.label} updated in cloud.`);
          return;
        } catch (error) {
          console.error(error);
          showToast(error.message || "Could not update cloud document.");
          return;
        }
      }

      setData((current) => ({
        ...current,
        students: current.students.map((student) =>
          student.id === studentId
            ? {
                ...student,
                profilePhoto: type === "passportPhoto" ? reader.result : student.profilePhoto,
                documents: [studentDocument, ...getStudentDocuments(student).filter((document) => document.type !== type)]
              }
            : student
        ),
        activityLog: [
          { id: `act-${Date.now()}`, title: "Student document updated", detail: `${getDocumentLabel(type)} replaced`, date: today() },
          ...(current.activityLog || [])
        ].slice(0, 30)
      }));
      showToast(`${studentDocument.label} updated.`);
    };
    reader.readAsDataURL(file);
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
      className: selectedStudent.className,
      section: selectedStudent.section,
      admissionNumber: selectedStudent.admissionNumber,
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
    const admissionNumber = studentForm.admissionNumber || nextAdmissionNumber;
    const shouldEnroll = ["Approved", "Enrolled"].includes(studentForm.admissionStatus);
    const duplicateAdmission = data.students.some((student) => student.admissionNumber === admissionNumber);
    if (duplicateAdmission) {
      showToast("Admission number already exists. Refresh and try again.");
      return;
    }

    const nextIndex = activeStudents.length + 1;
    const admission = {
      id: `adm-${Date.now()}`,
      admissionNumber,
      studentName: studentForm.name,
      guardianName: studentForm.parentName,
      phone: studentForm.mobile,
      classRequested: studentForm.className,
      section: studentForm.section,
      status: studentForm.admissionStatus,
      workflowStatus: studentForm.admissionStatus,
      notes: shouldEnroll ? "Approved and moved to student database." : "Admission form saved for follow-up.",
      date: today()
    };
    const student = {
      id: `stu-${Date.now()}`,
      ...studentForm,
      admissionNumber,
      rollNumber: studentForm.rollNumber || String(nextIndex).padStart(2, "0"),
      createdAt: today(),
      dueBalance: 0,
      attendance: 100,
      status: "Active",
      isDeleted: false,
      portalId: createPortalId(activeStudents.length),
      password: generatePassword()
    };

    if (cloudMode) {
      try {
        await createCloudAdmission({
          studentName: admission.studentName,
          guardianName: admission.guardianName,
          phone: admission.phone,
          classRequested: admission.classRequested,
          status: studentForm.admissionStatus.toLowerCase()
        });

        if (!shouldEnroll) {
          const cloudData = await loadCloudReceptionData();
          setData(cloudData);
          resetAdmissionForm();
          showToast("Admission form saved to cloud queue.");
          return;
        }

        const created = await createCloudStudent({
          ...studentForm,
          admissionNumber,
          mobile: studentForm.mobile,
          parentName: studentForm.parentName,
          parentMobile: studentForm.mobile,
          dueBalance: 0
        });
        const cloudData = await loadCloudReceptionData();
        setData(cloudData);
        setSelectedStudentId(String(created.student.id));
        resetAdmissionForm();
        showToast(`Admission approved. Login ${created.credentials.login}`);
        return;
      } catch (error) {
        console.error(error);
        showToast(error.message || "Could not create cloud student.");
        return;
      }
    }

    setData((current) => ({
      ...current,
      admissions: [admission, ...(current.admissions || [])],
      students: shouldEnroll ? [student, ...current.students] : current.students,
      activityLog: [
        {
          id: `act-${Date.now()}`,
          title: shouldEnroll ? "Admission approved" : "Admission saved",
          detail: `${admissionNumber} / ${student.name} / ${student.className}-${student.section}`,
          date: today()
        },
        ...(current.activityLog || [])
      ].slice(0, 20)
    }));
    if (shouldEnroll) {
      setSelectedStudentId(student.id);
    }
    resetAdmissionForm();
    showToast(shouldEnroll ? "Student profile and portal login created." : "Admission saved. Approve it when ready.");
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

  async function softDeleteStudent(student) {
    if (!student) {
      return;
    }

    if (!isAdminRole(data.settings.role)) {
      showToast("Only Admin users can delete students.");
      return;
    }

    const confirmed = window.confirm("Are you sure you want to delete this student?");
    if (!confirmed) {
      return;
    }

    if (cloudMode && student.databaseId) {
      try {
        await deleteCloudStudent(student.databaseId, "soft");
        const cloudData = await loadCloudReceptionData();
        setData(cloudData);
        setSelectedStudentId(activeOnly(cloudData.students)[0]?.id || "");
        showToast("Student deleted in cloud with audit log.");
        return;
      } catch (error) {
        console.error(error);
        showToast(error.message || "Could not delete cloud student.");
        return;
      }
    }

    setData((current) => ({
      ...current,
      students: current.students.map((item) =>
        item.id === student.id
          ? {
              ...item,
              isDeleted: true,
              status: "Inactive",
              deletedAt: new Date().toISOString(),
              deletedBy: current.settings.role
            }
          : item
      ),
      deletedStudents: [
        {
          id: `del-${Date.now()}`,
          studentId: student.id,
          admissionNumber: student.admissionNumber,
          studentName: student.name,
          className: student.className,
          section: student.section,
          deletedBy: current.settings.role,
          deletedAt: new Date().toISOString(),
          mode: "soft-delete"
        },
        ...(current.deletedStudents || [])
      ],
      activityLog: [
        { id: `act-${Date.now()}`, title: "Student deleted", detail: `${student.name} marked inactive`, date: today() },
        ...(current.activityLog || [])
      ].slice(0, 30)
    }));

    if (selectedStudentId === student.id) {
      setSelectedStudentId(activeStudents.find((item) => item.id !== student.id)?.id || "");
    }
    showToast("Student removed from active records. Audit log maintained.");
  }

  function permanentDeleteStudent(student) {
    if (!student || !isSuperAdminRole(data.settings.role)) {
      showToast("Permanent delete is restricted to Super Admin.");
      return;
    }

    const confirmed = window.confirm("Permanent delete cannot be undone. Continue?");
    if (!confirmed) {
      return;
    }

    setData((current) => ({
      ...current,
      students: current.students.filter((item) => item.id !== student.id),
      payments: current.payments.filter((payment) => payment.studentId !== student.id),
      certificates: current.certificates.filter((certificate) => certificate.studentId !== student.id),
      deletedStudents: [
        {
          id: `del-${Date.now()}`,
          studentId: student.id,
          admissionNumber: student.admissionNumber,
          studentName: student.name,
          className: student.className,
          section: student.section,
          deletedBy: current.settings.role,
          deletedAt: new Date().toISOString(),
          mode: "permanent-delete"
        },
        ...(current.deletedStudents || [])
      ],
      activityLog: [
        { id: `act-${Date.now()}`, title: "Student permanently deleted", detail: student.name, date: today() },
        ...(current.activityLog || [])
      ].slice(0, 30)
    }));
    showToast("Student permanently deleted by Super Admin.");
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

  function buildReceiptHtml() {
    if (!receipt) {
      return "";
    }

    return `<!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${receipt.receiptNo}</title>
          <style>
            body { margin: 0; background: #fff; color: #07111f; font-family: Arial, sans-serif; }
            .receipt { width: 760px; margin: 24px auto; border: 2px solid #07111f; padding: 28px; }
            .header { display: grid; grid-template-columns: 100px 1fr; gap: 18px; align-items: center; border-bottom: 2px solid #07111f; padding-bottom: 14px; }
            .logo { width: 88px; height: 88px; object-fit: contain; }
            h1 { margin: 0; font-size: 28px; text-transform: uppercase; text-align: center; }
            .address { margin-top: 6px; color: #42526a; text-align: center; font-size: 13px; }
            .title { margin: 18px 0; text-align: center; font-weight: 800; font-size: 18px; text-decoration: underline; }
            .meta, .student, .totals { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px 24px; margin-bottom: 16px; }
            .item { display: flex; justify-content: space-between; gap: 20px; border-bottom: 1px dashed #9aa6b2; padding-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin: 18px 0; }
            th, td { border: 1px solid #07111f; padding: 10px; text-align: left; }
            th { background: #eef4ff; }
            td:last-child, th:last-child { text-align: right; }
            .total-row td { font-weight: 800; font-size: 17px; }
            .signatures { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-top: 58px; }
            .signatures span { border-top: 1px solid #07111f; padding-top: 8px; text-align: center; font-weight: 700; }
            @media print { .receipt { margin: 0 auto; width: auto; min-height: calc(100vh - 64px); } }
          </style>
        </head>
        <body>
          <main class="receipt">
            <section class="header">
              <img class="logo" src="${brand.logoIcon}" alt="" />
              <div>
                <h1>${data.school.name}</h1>
                <div class="address">${data.school.address || "School Address"} | Session ${data.school.session}</div>
              </div>
            </section>
            <div class="title">Official Fee Receipt</div>
            <section class="meta">
              <div class="item"><strong>Receipt No.</strong><span>${receipt.receiptNo}</span></div>
              <div class="item"><strong>Date</strong><span>${receipt.date}</span></div>
              <div class="item"><strong>Payment Mode</strong><span>${receipt.mode}</span></div>
              <div class="item"><strong>Session</strong><span>${data.school.session}</span></div>
            </section>
            <section class="student">
              <div class="item"><strong>Student Name</strong><span>${receipt.studentName}</span></div>
              <div class="item"><strong>Admission No.</strong><span>${receipt.admissionNumber || "-"}</span></div>
              <div class="item"><strong>Class</strong><span>${receipt.className || "-"}-${receipt.section || "-"}</span></div>
              <div class="item"><strong>Fee Type</strong><span>${receipt.feeType}</span></div>
            </section>
            <table>
              <thead><tr><th>Description</th><th>Amount</th></tr></thead>
              <tbody>
                <tr><td>${receipt.feeType}</td><td>${formatMoney(receipt.amount)}</td></tr>
                <tr><td>Fine / Late Fee</td><td>${formatMoney(receipt.lateFee)}</td></tr>
                <tr><td>Discount</td><td>-${formatMoney(receipt.discount)}</td></tr>
                <tr><td>Concession / Scholarship</td><td>-${formatMoney(receipt.concession)}</td></tr>
                <tr class="total-row"><td>Total Paid</td><td>${formatMoney(receipt.total)}</td></tr>
              </tbody>
            </table>
            <section class="signatures">
              <span>Received By</span>
              <span>Accountant</span>
              <span>Principal / Seal</span>
            </section>
          </main>
        </body>
      </html>`;
  }

  async function printReceipt() {
    if (!receipt) {
      showToast("Generate a receipt first.");
      return;
    }

    const html = buildReceiptHtml();
    if (window.vidyaTechDesktop?.printReceiptHtml) {
      const result = await window.vidyaTechDesktop.printReceiptHtml(html);
      if (!result?.canceled) {
        showToast("Receipt sent to printer.");
      }
      return;
    }

    const printWindow = window.open("", "_blank", "width=900,height=1100");
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  function exportFilteredReport() {
    const rows = [
      ["S.No.", "Student Name", "Class", "Section", "Fee Dues", "Pending Documents", "House"],
      ...managementStudents.map((student, index) => [
        index + 1,
        student.name,
        student.className,
        student.section,
        student.dueBalance,
        getMissingDocuments(student).map((document) => document.label).join("; ") || "Complete",
        student.house || "-"
      ])
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    downloadBlob(csv, `vidyatech-filtered-students-${today()}.csv`, "text/csv");
    showToast("Filtered report downloaded.");
  }

  function generateShareableReport() {
    const rows = managementStudents.slice(0, 28);
    const canvas = document.createElement("canvas");
    const width = 1600;
    const rowHeight = 54;
    const headerHeight = 210;
    const height = headerHeight + rowHeight * (rows.length + 1) + 80;
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.fillStyle = "#0b1728";
    context.fillRect(0, 0, width, 150);
    context.fillStyle = "#ffffff";
    context.font = "800 46px Arial";
    context.fillText(data.school.name, 60, 64);
    context.font = "600 24px Arial";
    context.fillText(`${data.school.address || "School Address"} | Session ${data.school.session}`, 60, 108);
    context.fillStyle = "#0f62fe";
    context.fillRect(60, 168, width - 120, 4);
    context.fillStyle = "#0b1728";
    context.font = "800 30px Arial";
    context.fillText("School Standard Shareable Report", 60, 202);

    const columns = [
      { label: "S.No.", x: 60, width: 80 },
      { label: "Student Name", x: 145, width: 310 },
      { label: "Class", x: 465, width: 105 },
      { label: "Sec.", x: 580, width: 85 },
      { label: "Fees Dues", x: 675, width: 150 },
      { label: "Conveyance", x: 835, width: 150 },
      { label: "Fine", x: 995, width: 120 },
      { label: "Total", x: 1125, width: 150 },
      { label: "Pending Documents", x: 1285, width: 205 },
      { label: "House", x: 1495, width: 80 }
    ];

    const drawCell = (text, x, y, widthValue, bold = false) => {
      context.font = `${bold ? "800" : "600"} 20px Arial`;
      context.fillStyle = "#0b1728";
      const cleanText = String(text || "-");
      const fitted = cleanText.length > 24 ? `${cleanText.slice(0, 23)}...` : cleanText;
      context.fillText(fitted, x + 10, y + 34, widthValue - 20);
    };

    let y = headerHeight;
    context.fillStyle = "#eaf2ff";
    context.fillRect(60, y, width - 120, rowHeight);
    columns.forEach((column) => drawCell(column.label, column.x, y, column.width, true));
    y += rowHeight;

    rows.forEach((student, index) => {
      context.fillStyle = index % 2 === 0 ? "#ffffff" : "#f8fbff";
      context.fillRect(60, y, width - 120, rowHeight);
      const due = Number(student.dueBalance || 0);
      const pending = getMissingDocuments(student).map((document) => document.label).join(", ") || "Complete";
      const values = [
        index + 1,
        student.name,
        student.className,
        student.section,
        formatMoney(due),
        formatMoney(student.conveyance || 0),
        formatMoney(student.fine || 0),
        formatMoney(due + Number(student.conveyance || 0) + Number(student.fine || 0)),
        pending,
        student.house || "-"
      ];
      columns.forEach((column, columnIndex) => drawCell(values[columnIndex], column.x, y, column.width));
      y += rowHeight;
    });

    context.strokeStyle = "#d3dfef";
    context.lineWidth = 2;
    for (let lineY = headerHeight; lineY <= y; lineY += rowHeight) {
      context.beginPath();
      context.moveTo(60, lineY);
      context.lineTo(width - 60, lineY);
      context.stroke();
    }
    context.font = "600 20px Arial";
    context.fillStyle = "#536176";
    context.fillText(`Generated on ${today()} | VidyaTech Reception`, 60, height - 34);

    canvas.toBlob((blob) => {
      downloadBlob(blob, `vidyatech-shareable-report-${today()}.png`, "image/png");
    }, "image/png", 0.94);

    setData((current) => ({
      ...current,
      reportLogs: [
        { id: `rep-${Date.now()}`, type: "shareable-report", filters: managementFilters, count: rows.length, generatedAt: new Date().toISOString() },
        ...(current.reportLogs || [])
      ]
    }));
    showToast("WhatsApp-ready PNG report generated.");
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
                  <FileText size={22} />
                  <span>Pending Documents</span>
                  <strong>{stats.pendingDocuments}</strong>
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
                      Student Database
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
                    <button type="button" onClick={() => setActiveTab("management")}>
                      <Filter size={22} />
                      Filter Records
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
                {receipt && (
                  <div className="receipt-toolbar">
                    <button className="btn btn-primary" type="button" onClick={printReceipt}>
                      <Printer size={18} />
                      Print Receipt
                    </button>
                  </div>
                )}
                <div className="receipt-paper">
                  <div className="receipt-head">
                    <img className="receipt-logo" src={brand.logoFull} alt="VidyaTech" />
                    <div>
                      <strong>{data.school.name}</strong>
                      <span>{data.school.address || "School Address"} | Session {data.school.session}</span>
                    </div>
                  </div>
                  {receipt ? (
                    <>
                      <div className="receipt-title">Official Fee Receipt</div>
                      <div className="receipt-meta">
                        <span>Receipt No. {receipt.receiptNo}</span>
                        <span>Date {receipt.date}</span>
                      </div>
                      <dl>
                        <dt>Student</dt>
                        <dd>{receipt.studentName}</dd>
                        <dt>Class</dt>
                        <dd>{receipt.className}-{receipt.section}</dd>
                        <dt>Admission No.</dt>
                        <dd>{receipt.admissionNumber}</dd>
                        <dt>Fee Type</dt>
                        <dd>{receipt.feeType}</dd>
                        <dt>Payment Mode</dt>
                        <dd>{receipt.mode}</dd>
                        <dt>Fine</dt>
                        <dd>{formatMoney(receipt.lateFee)}</dd>
                        <dt>Net Paid</dt>
                        <dd>{formatMoney(receipt.total)}</dd>
                      </dl>
                      <div className="receipt-signatures">
                        <span>Received By</span>
                        <span>Accountant</span>
                        <span>Principal / Seal</span>
                      </div>
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
            <div className="reception-grid two">
              <section className="reception-panel">
                <div className="panel-heading">
                  <div>
                    <span>Records</span>
                    <h2>Student database</h2>
                  </div>
                  <button className="btn btn-secondary" type="button" onClick={() => setActiveTab("admissions")}>
                    <UserPlus size={18} />
                    New Admission
                  </button>
                </div>
                <div className="student-list">
                  {filteredStudents.map((student) => (
                    <article key={student.id} className={selectedStudentId === student.id ? "student-record active" : "student-record"}>
                      <button type="button" onClick={() => setSelectedStudentId(student.id)}>
                        <img src={student.profilePhoto || brand.logoIcon} alt="" />
                        <span>
                          <strong>{student.name}</strong>
                          <small>{student.admissionNumber} / {student.className}-{student.section} / Roll {student.rollNumber || "-"}</small>
                          <small>{student.mobile}</small>
                        </span>
                      </button>
                      <div className="student-record-actions">
                        <button className="btn btn-secondary" type="button" onClick={() => { setSelectedStudentId(student.id); setActiveTab("profiles"); }}>
                          <Eye size={16} />
                          Profile
                        </button>
                        <button className="btn btn-danger" type="button" disabled={!isAdminRole(data.settings.role)} onClick={() => softDeleteStudent(student)}>
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <section className="reception-panel">
                <div className="panel-heading">
                  <div>
                    <span>Deleted records</span>
                    <h2>Soft delete audit</h2>
                  </div>
                  <ShieldCheck size={24} />
                </div>
                <div className="data-table compact-table">
                  <div className="table-row table-head">
                    <span>Student</span>
                    <span>Class</span>
                    <span>Deleted By</span>
                    <span>Deleted On</span>
                    <span>Mode</span>
                  </div>
                  {(data.deletedStudents || []).slice(0, 10).map((record) => (
                    <div key={record.id} className="table-row">
                      <span>{record.studentName}</span>
                      <span>{record.className}-{record.section}</span>
                      <span>{record.deletedBy}</span>
                      <span>{String(record.deletedAt).slice(0, 10)}</span>
                      <span className="soft-pill">{record.mode}</span>
                    </div>
                  ))}
                  {deletedStudents.map((student) => (
                    <div key={student.id} className="table-row">
                      <span>{student.name}</span>
                      <span>{student.className}-{student.section}</span>
                      <span>{student.deletedBy || "-"}</span>
                      <span>{String(student.deletedAt || "").slice(0, 10) || "-"}</span>
                      <button className="btn btn-danger" type="button" disabled={!isSuperAdminRole(data.settings.role)} onClick={() => permanentDeleteStudent(student)}>
                        Permanent Delete
                      </button>
                    </div>
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
                          {student.name} - {student.className}-{student.section} - {student.admissionNumber}
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
            <div className="reception-grid admission-grid">
              <section className="reception-panel">
                <div className="panel-heading">
                  <div>
                    <span>Admissions</span>
                    <h2>Admission to student database workflow</h2>
                  </div>
                  <UserPlus size={24} />
                </div>
                <form className="reception-form" onSubmit={addStudent}>
                  <div className="form-row">
                    <Field label="Admission Number">
                      <input readOnly value={studentForm.admissionNumber || nextAdmissionNumber} />
                    </Field>
                    <Field label="Workflow Status">
                      <select value={studentForm.admissionStatus} onChange={(event) => patchStudentForm("admissionStatus", event.target.value)}>
                        {admissionStatuses.map((status) => (
                          <option key={status}>{status}</option>
                        ))}
                      </select>
                    </Field>
                  </div>
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
                    <Field label="Class">
                      <input required value={studentForm.className} onChange={(event) => patchStudentForm("className", event.target.value)} />
                    </Field>
                    <Field label="Section">
                      <input required value={studentForm.section} onChange={(event) => patchStudentForm("section", event.target.value)} />
                    </Field>
                  </div>
                  <div className="form-row">
                    <Field label="Roll Number">
                      <input value={studentForm.rollNumber} onChange={(event) => patchStudentForm("rollNumber", event.target.value)} />
                    </Field>
                    <Field label="House">
                      <select value={studentForm.house} onChange={(event) => patchStudentForm("house", event.target.value)}>
                        {schoolHouses.map((house) => (
                          <option key={house}>{house}</option>
                        ))}
                      </select>
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
                  <div className="document-upload-grid">
                    {documentTypes.map((documentType) => {
                      const uploaded = studentForm.documents?.find((document) => document.type === documentType.id);
                      return (
                        <label key={documentType.id} className={uploaded ? "document-upload uploaded" : "document-upload"}>
                          <input type="file" accept={getFileAccept(documentType.id)} onChange={(event) => handleDocumentUpload(documentType.id, event.target.files?.[0])} />
                          <FileText size={18} />
                          <strong>{documentType.label}</strong>
                          <span>{uploaded ? uploaded.fileName : documentType.required ? "Required" : "Optional"}</span>
                          {uploadProgress[documentType.id] ? <small>{uploadProgress[documentType.id]}% uploaded</small> : null}
                        </label>
                      );
                    })}
                  </div>
                  <button className="btn btn-primary" type="submit">
                    <CheckCircle2 size={18} />
                    {["Approved", "Enrolled"].includes(studentForm.admissionStatus) ? "Approve & Create Student Login" : "Save Admission Form"}
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
                      <span>{admission.classRequested}-{admission.section || ""}</span>
                      <span className="soft-pill">{admission.status}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {activeTab === "profiles" && (
            <div className="reception-grid profile-grid">
              <section className="reception-panel">
                <div className="panel-heading">
                  <div>
                    <span>Student profile</span>
                    <h2>Search and open complete profile</h2>
                  </div>
                  <UserRoundCheck size={24} />
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
                      <span>{student.className}-{student.section} / {student.admissionNumber}</span>
                      <small>{student.mobile}</small>
                    </button>
                  ))}
                </div>
              </section>

              <section className="reception-panel profile-panel">
                {selectedStudent ? (
                  <>
                    <div className="profile-header">
                      <img src={selectedStudent.profilePhoto || brand.logoIcon} alt="" />
                      <div>
                        <span className="soft-pill">{selectedStudent.status || "Active"}</span>
                        <h2>{selectedStudent.name}</h2>
                        <p>{selectedStudent.admissionNumber} / {selectedStudent.className}-{selectedStudent.section} / House {selectedStudent.house || "-"}</p>
                      </div>
                    </div>
                    {getMissingDocuments(selectedStudent).length > 0 && (
                      <div className="alert-strip">
                        <FileText size={18} />
                        Pending documents: {getMissingDocuments(selectedStudent).map((document) => document.label).join(", ")}
                      </div>
                    )}
                    <div className="profile-sections">
                      <article>
                        <h3>Personal Details</h3>
                        <dl>
                          <dt>DOB</dt><dd>{selectedStudent.dob || "-"}</dd>
                          <dt>Gender</dt><dd>{selectedStudent.gender || "-"}</dd>
                          <dt>Aadhaar</dt><dd>{selectedStudent.aadhaarId || "-"}</dd>
                          <dt>Address</dt><dd>{selectedStudent.address || "-"}</dd>
                        </dl>
                      </article>
                      <article>
                        <h3>Admission Details</h3>
                        <dl>
                          <dt>Session</dt><dd>{selectedStudent.session || data.school.session}</dd>
                          <dt>Roll No.</dt><dd>{selectedStudent.rollNumber || "-"}</dd>
                          <dt>Previous School</dt><dd>{selectedStudent.previousSchool || "-"}</dd>
                          <dt>Attendance</dt><dd>{selectedStudent.attendance || 0}%</dd>
                        </dl>
                      </article>
                      <article>
                        <h3>Parent Details</h3>
                        <dl>
                          <dt>Guardian</dt><dd>{selectedStudent.parentName}</dd>
                          <dt>Father</dt><dd>{selectedStudent.fatherName || "-"}</dd>
                          <dt>Mother</dt><dd>{selectedStudent.motherName || "-"}</dd>
                          <dt>Mobile</dt><dd>{selectedStudent.mobile}</dd>
                        </dl>
                      </article>
                      <article>
                        <h3>Fee and Credentials</h3>
                        <dl>
                          <dt>Fee Status</dt><dd>{Number(selectedStudent.dueBalance || 0) > 0 ? formatMoney(selectedStudent.dueBalance) : "Paid / Clear"}</dd>
                          <dt>Portal ID</dt><dd>{selectedStudent.portalId}</dd>
                          <dt>Password</dt><dd>{selectedStudent.password}</dd>
                          <dt>Plan</dt><dd>{selectedStudent.feePlan || "-"}</dd>
                        </dl>
                      </article>
                    </div>
                    <div className="document-library">
                      <h3>Uploaded Documents</h3>
                      {documentTypes.map((documentType) => {
                        const uploaded = getStudentDocuments(selectedStudent).find((document) => document.type === documentType.id);
                        return (
                          <article key={documentType.id} className={uploaded ? "document-card uploaded" : "document-card missing"}>
                            <FileText size={20} />
                            <div>
                              <strong>{documentType.label}</strong>
                              <span>{uploaded ? uploaded.fileName : "Missing"}</span>
                            </div>
                            {uploaded ? (
                              <span className="inline-actions">
                                <button className="btn btn-secondary" type="button" onClick={() => downloadDocument(uploaded)}>
                                  <Download size={16} />
                                  Download
                                </button>
                                <label className="btn btn-secondary">
                                  <Upload size={16} />
                                  Replace
                                  <input type="file" accept={getFileAccept(documentType.id)} onChange={(event) => replaceStudentDocument(selectedStudent.id, documentType.id, event.target.files?.[0])} hidden />
                                </label>
                              </span>
                            ) : (
                              <label className="btn btn-danger">
                                <Upload size={16} />
                                Upload
                                <input type="file" accept={getFileAccept(documentType.id)} onChange={(event) => replaceStudentDocument(selectedStudent.id, documentType.id, event.target.files?.[0])} hidden />
                              </label>
                            )}
                          </article>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="empty-state">
                    <UserRoundCheck size={38} />
                    <strong>Select a student</strong>
                    <span>Search by name, class, section, or admission number.</span>
                  </div>
                )}
              </section>
            </div>
          )}

          {activeTab === "management" && (
            <section className="reception-panel">
              <div className="panel-heading">
                <div>
                  <span>Advanced management</span>
                  <h2>Class-wise, section-wise, dues, documents, and house filters</h2>
                </div>
                <div className="button-row">
                  <button className="btn btn-secondary" type="button" onClick={exportFilteredReport}>
                    <Download size={18} />
                    Export Filtered CSV
                  </button>
                  <button className="btn btn-primary" type="button" onClick={generateShareableReport}>
                    <ImagePlus size={18} />
                    Generate Shareable Report
                  </button>
                </div>
              </div>

              <div className="filter-grid">
                <Field label="Class">
                  <select value={managementFilters.className} onChange={(event) => patchManagementFilter("className", event.target.value)}>
                    {filterOptions.classes.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </Field>
                <Field label="Section">
                  <select value={managementFilters.section} onChange={(event) => patchManagementFilter("section", event.target.value)}>
                    {filterOptions.sections.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </Field>
                <Field label="Fee Dues">
                  <select value={managementFilters.feeDues} onChange={(event) => patchManagementFilter("feeDues", event.target.value)}>
                    <option>{emptyFilterValue}</option>
                    <option>With Dues</option>
                    <option>No Dues</option>
                  </select>
                </Field>
                <Field label="Pending Documents">
                  <select value={managementFilters.pendingDocuments} onChange={(event) => patchManagementFilter("pendingDocuments", event.target.value)}>
                    <option>{emptyFilterValue}</option>
                    <option>Pending</option>
                    <option>Complete</option>
                  </select>
                </Field>
                <Field label="Document Type">
                  <select value={managementFilters.documentType} onChange={(event) => patchManagementFilter("documentType", event.target.value)}>
                    <option>{emptyFilterValue}</option>
                    {documentTypes.map((documentType) => <option key={documentType.id} value={documentType.id}>{documentType.label}</option>)}
                  </select>
                </Field>
                <Field label="House">
                  <select value={managementFilters.house} onChange={(event) => patchManagementFilter("house", event.target.value)}>
                    {filterOptions.houses.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </Field>
              </div>

              <div className="data-table management-table">
                <div className="table-row table-head">
                  <span>Student</span>
                  <span>Class</span>
                  <span>Dues</span>
                  <span>Missing Documents</span>
                  <span>House</span>
                  <span>Actions</span>
                </div>
                {managementStudents.map((student) => {
                  const missing = getMissingDocuments(student);
                  return (
                    <div key={student.id} className="table-row">
                      <span>{student.name}</span>
                      <span>{student.className}-{student.section}</span>
                      <strong>{formatMoney(student.dueBalance)}</strong>
                      <span>{missing.map((document) => document.label).join(", ") || "Complete"}</span>
                      <span className="soft-pill">{student.house || "-"}</span>
                      <span className="inline-actions">
                        <button className="btn btn-secondary" type="button" onClick={() => { setSelectedStudentId(student.id); setActiveTab("profiles"); }}>
                          Profile
                        </button>
                        <button className="btn btn-secondary" type="button" onClick={() => { setSelectedStudentId(student.id); setActiveTab("billing"); }}>
                          Receipt
                        </button>
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {activeTab === "reports" && (
            <section className="reception-panel">
              <div className="panel-heading">
                <div>
                  <span>Reports</span>
                  <h2>Financial, admission, and class analytics</h2>
                </div>
                <div className="button-row">
                  <button className="btn btn-primary" type="button" onClick={generateShareableReport}>
                    <ImagePlus size={18} />
                    Generate Shareable Report
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
                  <strong>{new Set(activeStudents.map((student) => `${student.className}-${student.section}`)).size}</strong>
                </article>
                <article>
                  <CalendarCheck2 size={24} />
                  <span>Avg Attendance</span>
                  <strong>
                    {activeStudents.length
                      ? Math.round(activeStudents.reduce((total, student) => total + Number(student.attendance || 0), 0) / activeStudents.length)
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
                  <select
                    value={data.settings.role}
                    onChange={(event) =>
                      setData((current) => ({
                        ...current,
                        settings: { ...current.settings, role: event.target.value }
                      }))
                    }
                  >
                    <option>Receptionist</option>
                    <option>Accountant</option>
                    <option>Admin</option>
                    <option>Principal</option>
                    <option>Super Admin</option>
                  </select>
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
