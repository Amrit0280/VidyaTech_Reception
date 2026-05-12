const STORAGE_KEY = "vidyatech-reception-demo-data";
const CURRENT_YEAR = new Date().getFullYear();

export const documentTypes = [
  { id: "birthCertificate", label: "Birth Certificate", required: true },
  { id: "previousMarksheet", label: "Previous School Marksheet", required: false },
  { id: "transferCertificate", label: "Transfer Certificate", required: true },
  { id: "aadhaarCard", label: "Aadhaar Card", required: true },
  { id: "passportPhoto", label: "Passport Size Photo", required: true },
  { id: "otherDocuments", label: "Other Documents", required: false }
];

const houses = ["Blue", "Green", "Red", "Yellow"];

export const defaultReceptionData = {
  school: {
    name: "VidyaTech Demo School",
    session: "2026-27",
    logo: "/vidyatech-icon.svg",
    primaryColor: "#0f62fe"
  },
  students: [
    {
      id: "stu-001",
      admissionNumber: "ADM-1001",
      rollNumber: "12",
      name: "Aarav Sharma",
      fatherName: "Rohit Sharma",
      motherName: "Anita Sharma",
      dob: "2012-08-14",
      gender: "Male",
      className: "IX",
      section: "A",
      parentName: "Rohit Sharma",
      mobile: "+91 98100 10001",
      alternateMobile: "+91 98100 11001",
      email: "aarav.parent@example.com",
      address: "Civil Lines, Delhi",
      previousSchool: "Green Valley Public School",
      aadhaarId: "XXXX-XXXX-1001",
      house: "Blue",
      feePlan: "Monthly",
      dueBalance: 6400,
      attendance: 94,
      status: "Active",
      isDeleted: false,
      profilePhoto: "/vidyatech-icon.svg",
      documents: [],
      portalId: "VIDY-2026-0001",
      password: "School@A41K2"
    },
    {
      id: "stu-002",
      admissionNumber: "ADM-1002",
      rollNumber: "08",
      name: "Diya Patel",
      fatherName: "Rajesh Patel",
      motherName: "Nisha Patel",
      dob: "2013-02-19",
      gender: "Female",
      className: "VIII",
      section: "B",
      parentName: "Nisha Patel",
      mobile: "+91 98100 10002",
      alternateMobile: "+91 98100 11002",
      email: "diya.parent@example.com",
      address: "Model Town, Delhi",
      previousSchool: "Starlight Academy",
      aadhaarId: "XXXX-XXXX-1002",
      house: "Green",
      feePlan: "Quarterly",
      dueBalance: 0,
      attendance: 98,
      status: "Active",
      isDeleted: false,
      profilePhoto: "/vidyatech-icon.svg",
      documents: [],
      portalId: "VIDY-2026-0002",
      password: "School@P92L8"
    },
    {
      id: "stu-003",
      admissionNumber: "ADM-1003",
      rollNumber: "21",
      name: "Kabir Khan",
      fatherName: "Sameer Khan",
      motherName: "Farah Khan",
      dob: "2011-11-03",
      gender: "Male",
      className: "X",
      section: "C",
      parentName: "Sameer Khan",
      mobile: "+91 98100 10003",
      alternateMobile: "+91 98100 11003",
      email: "kabir.parent@example.com",
      address: "Rajendra Nagar, Delhi",
      previousSchool: "City Scholars School",
      aadhaarId: "XXXX-XXXX-1003",
      house: "Red",
      feePlan: "Monthly",
      dueBalance: 12400,
      attendance: 86,
      status: "Active",
      isDeleted: false,
      profilePhoto: "/vidyatech-icon.svg",
      documents: [],
      portalId: "VIDY-2026-0003",
      password: "School@K73Q1"
    }
  ],
  payments: [
    {
      id: "pay-001",
      receiptNo: "VT-2026-0001",
      studentId: "stu-002",
      studentName: "Diya Patel",
      feeType: "Tuition Fee",
      amount: 18000,
      discount: 1000,
      concession: 0,
      lateFee: 0,
      total: 17000,
      mode: "UPI",
      date: "2026-05-01",
      remarks: "Quarterly payment"
    }
  ],
  notifications: [
    {
      id: "note-001",
      audience: "Class IX-A",
      title: "Fee due reminder",
      message: "Monthly fee due date is approaching.",
      channel: "SMS + App",
      date: "2026-05-03"
    }
  ],
  admissions: [
    {
      id: "adm-001",
      studentName: "Meera Singh",
      guardianName: "Priya Singh",
      phone: "+91 98200 30001",
      classRequested: "VI",
      status: "Inquiry"
    }
  ],
  feeStructures: [
    { id: "fee-struct-001", className: "IX", session: "2026-27", category: "Tuition", amount: 4500, installments: 12, finePerDay: 25 },
    { id: "fee-struct-002", className: "IX", session: "2026-27", category: "Transport", amount: 1800, installments: 12, finePerDay: 10 },
    { id: "fee-struct-003", className: "X", session: "2026-27", category: "Exam", amount: 2500, installments: 2, finePerDay: 0 }
  ],
  certificates: [
    {
      id: "cert-001",
      certificateNo: "CERT-2026-0001",
      studentId: "stu-002",
      studentName: "Diya Patel",
      type: "Bonafide",
      date: "2026-05-02",
      status: "Issued"
    }
  ],
  idCards: [
    {
      id: "card-001",
      cardNo: "ID-2026-0001",
      studentId: "stu-001",
      studentName: "Aarav Sharma",
      status: "Active",
      issuedAt: "2026-05-01"
    }
  ],
  activityLog: [
    { id: "act-001", title: "Fee receipt generated", detail: "VT-2026-0001 / Diya Patel", date: "2026-05-01" },
    { id: "act-002", title: "Admission enquiry added", detail: "Meera Singh for Class VI", date: "2026-05-03" }
  ],
  deletedStudents: [],
  reportLogs: [],
  settings: {
    role: "Admin",
    offlineMode: true,
    autoLateFee: 150,
    syncStatus: "Offline-ready"
  }
};

function cloneDefaultData() {
  return JSON.parse(JSON.stringify(defaultReceptionData));
}

function normalizeDocuments(student) {
  if (Array.isArray(student?.documents)) {
    return student.documents.map((document) => ({
      id: document.id || `doc-${student.id || Date.now()}-${document.type || "file"}`,
      type: document.type || "otherDocuments",
      label: document.label || documentTypes.find((item) => item.id === document.type)?.label || "Document",
      fileName: document.fileName || document.name || "Uploaded document",
      fileType: document.fileType || document.mimeType || "",
      fileSize: Number(document.fileSize || 0),
      dataUrl: document.dataUrl || document.fileUrl || document.url || "",
      uploadedAt: document.uploadedAt || student.createdAt || new Date().toISOString(),
      status: document.status || "Uploaded"
    }));
  }

  const legacyDocuments = [];
  if (student?.birthCertificate) {
    legacyDocuments.push({ type: "birthCertificate", label: "Birth Certificate" });
  }
  if (student?.transferCertificate) {
    legacyDocuments.push({ type: "transferCertificate", label: "Transfer Certificate" });
  }
  if (student?.aadhaarDocument) {
    legacyDocuments.push({ type: "aadhaarCard", label: "Aadhaar Card" });
  }
  if (student?.photoDocument || student?.photoUrl) {
    legacyDocuments.push({ type: "passportPhoto", label: "Passport Size Photo", dataUrl: student.photoUrl || "" });
  }

  return legacyDocuments.map((document) => ({
    id: `doc-${student.id || Date.now()}-${document.type}`,
    type: document.type,
    label: document.label,
    fileName: document.dataUrl ? "Legacy photo reference" : "Verified in old checklist",
    fileType: document.dataUrl ? "image/*" : "legacy/checklist",
    fileSize: 0,
    dataUrl: document.dataUrl || "",
    uploadedAt: student.createdAt || new Date().toISOString(),
    status: "Uploaded"
  }));
}

function normalizeStudent(student, index) {
  const documents = normalizeDocuments(student);
  const passportPhoto = documents.find((document) => document.type === "passportPhoto" && document.dataUrl);
  return {
    ...student,
    id: student.id || `stu-${Date.now()}-${index}`,
    admissionNumber: student.admissionNumber || createAdmissionNumber({ students: [student] }),
    session: student.session || `${CURRENT_YEAR}-${String(CURRENT_YEAR + 1).slice(-2)}`,
    house: student.house || houses[index % houses.length],
    dueBalance: Number(student.dueBalance || 0),
    attendance: Number(student.attendance || 100),
    status: student.isDeleted ? "Inactive" : student.status || "Active",
    isDeleted: Boolean(student.isDeleted || student.deletedAt),
    deletedAt: student.deletedAt || null,
    deletedBy: student.deletedBy || "",
    profilePhoto: student.profilePhoto || passportPhoto?.dataUrl || student.photoUrl || "/vidyatech-icon.svg",
    documents
  };
}

function ensureUniqueAdmissionNumbers(students, admissions = []) {
  const year = new Date().getFullYear();
  const used = new Set(admissions.map((admission) => admission.admissionNumber).filter(Boolean));
  let next = 1;

  return students.map((student) => {
    let admissionNumber = student.admissionNumber;
    if (!admissionNumber || used.has(admissionNumber)) {
      while (used.has(`ADM-${year}-${String(next).padStart(4, "0")}`)) {
        next += 1;
      }
      admissionNumber = `ADM-${year}-${String(next).padStart(4, "0")}`;
    }
    used.add(admissionNumber);
    return { ...student, admissionNumber };
  });
}

function normalizeReceptionData(data) {
  const defaults = cloneDefaultData();
  const mergedStudents = Array.isArray(data?.students) ? data.students : defaults.students;
  const mergedAdmissions = Array.isArray(data?.admissions) ? data.admissions : defaults.admissions;
  const normalizedStudents = ensureUniqueAdmissionNumbers(mergedStudents.map(normalizeStudent), mergedAdmissions);
  return {
    ...defaults,
    ...data,
    school: { ...defaults.school, ...(data?.school || {}) },
    settings: { ...defaults.settings, ...(data?.settings || {}) },
    students: normalizedStudents,
    payments: Array.isArray(data?.payments) ? data.payments : defaults.payments,
    notifications: Array.isArray(data?.notifications) ? data.notifications : defaults.notifications,
    admissions: mergedAdmissions,
    feeStructures: Array.isArray(data?.feeStructures) ? data.feeStructures : defaults.feeStructures,
    certificates: Array.isArray(data?.certificates) ? data.certificates : defaults.certificates,
    idCards: Array.isArray(data?.idCards) ? data.idCards : defaults.idCards,
    deletedStudents: Array.isArray(data?.deletedStudents) ? data.deletedStudents : defaults.deletedStudents,
    reportLogs: Array.isArray(data?.reportLogs) ? data.reportLogs : defaults.reportLogs,
    activityLog: Array.isArray(data?.activityLog) ? data.activityLog : defaults.activityLog
  };
}

export async function loadReceptionData() {
  if (window.vidyaTechDesktop?.readData) {
    const desktopData = await window.vidyaTechDesktop.readData();
    return normalizeReceptionData(desktopData || cloneDefaultData());
  }

  const saved = localStorage.getItem(STORAGE_KEY);
  return normalizeReceptionData(saved ? JSON.parse(saved) : cloneDefaultData());
}

export async function saveReceptionData(data) {
  if (window.vidyaTechDesktop?.writeData) {
    await window.vidyaTechDesktop.writeData(data);
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function generatePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let token = "";
  for (let index = 0; index < 6; index += 1) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return `School@${token}`;
}

export function createReceiptNo(count) {
  return `VT-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;
}

export function createAdmissionNumber(data) {
  const year = new Date().getFullYear();
  const candidates = [
    ...(Array.isArray(data?.students) ? data.students : []),
    ...(Array.isArray(data?.admissions) ? data.admissions : [])
  ];
  const maxNumber = candidates.reduce((max, item) => {
    const admissionNumber = item.admissionNumber || item.admissionNo || "";
    const match = String(admissionNumber).match(new RegExp(`ADM-${year}-(\\d+)`));
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  return `ADM-${year}-${String(maxNumber + 1).padStart(4, "0")}`;
}

export function createPortalId(count) {
  return `VIDY-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;
}
