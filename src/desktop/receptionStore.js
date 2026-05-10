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
      className: "IX",
      section: "A",
      parentName: "Rohit Sharma",
      mobile: "+91 98100 10001",
      email: "aarav.parent@example.com",
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
      className: "VIII",
      section: "B",
      parentName: "Nisha Patel",
      mobile: "+91 98100 10002",
      email: "diya.parent@example.com",
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
      className: "X",
      section: "C",
      parentName: "Sameer Khan",
      mobile: "+91 98100 10003",
      email: "kabir.parent@example.com",
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
      status: "New"
    }
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

export async function loadReceptionData() {
  if (window.vidyaTechDesktop?.readData) {
    const desktopData = await window.vidyaTechDesktop.readData();
    return desktopData || cloneDefaultData();
  }

  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : cloneDefaultData();
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
