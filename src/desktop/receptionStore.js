const STORAGE_KEY = "vidyatech-reception-demo-data";

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
      feePlan: "Monthly",
      dueBalance: 6400,
      attendance: 94,
      status: "Active",
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
      feePlan: "Quarterly",
      dueBalance: 0,
      attendance: 98,
      status: "Active",
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
      feePlan: "Monthly",
      dueBalance: 12400,
      attendance: 86,
      status: "Active",
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
  settings: {
    role: "Receptionist",
    offlineMode: true,
    autoLateFee: 150,
    syncStatus: "Offline-ready"
  }
};

function cloneDefaultData() {
  return JSON.parse(JSON.stringify(defaultReceptionData));
}

function normalizeReceptionData(data) {
  const defaults = cloneDefaultData();
  return {
    ...defaults,
    ...data,
    school: { ...defaults.school, ...(data?.school || {}) },
    settings: { ...defaults.settings, ...(data?.settings || {}) },
    students: Array.isArray(data?.students) ? data.students : defaults.students,
    payments: Array.isArray(data?.payments) ? data.payments : defaults.payments,
    notifications: Array.isArray(data?.notifications) ? data.notifications : defaults.notifications,
    admissions: Array.isArray(data?.admissions) ? data.admissions : defaults.admissions,
    feeStructures: Array.isArray(data?.feeStructures) ? data.feeStructures : defaults.feeStructures,
    certificates: Array.isArray(data?.certificates) ? data.certificates : defaults.certificates,
    idCards: Array.isArray(data?.idCards) ? data.idCards : defaults.idCards,
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
