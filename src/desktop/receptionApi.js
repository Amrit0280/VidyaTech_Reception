const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const TOKEN_KEY = "vidyatech-reception-token";
const USER_KEY = "vidyatech-reception-user";

export function hasCloudApi() {
  return Boolean(API_URL);
}

export function getCloudSession() {
  const token = localStorage.getItem(TOKEN_KEY);
  const userText = localStorage.getItem(USER_KEY);
  return {
    token,
    user: userText ? JSON.parse(userText) : null
  };
}

export function clearCloudSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function request(path, options = {}) {
  if (!API_URL) {
    throw new Error("Cloud API URL is not configured");
  }

  const { token } = getCloudSession();
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || `Request failed with ${response.status}`);
  }
  return payload;
}

export async function loginToCloud({ login, password, schoolSlug }) {
  const payload = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ login, password, schoolSlug })
  });
  localStorage.setItem(TOKEN_KEY, payload.token);
  localStorage.setItem(USER_KEY, JSON.stringify(payload.user));
  return payload;
}

export async function loadCloudReceptionData() {
  const payload = await request("/api/reception/snapshot");
  return payload.data;
}

export async function createCloudStudent(student) {
  const payload = await request("/api/reception/students", {
    method: "POST",
    body: JSON.stringify(student)
  });
  return payload;
}

export async function createCloudPayment(payment) {
  const payload = await request("/api/reception/payments", {
    method: "POST",
    body: JSON.stringify(payment)
  });
  return payload.payment;
}

export async function resetCloudPassword(studentId) {
  return request("/api/reception/credentials/reset", {
    method: "POST",
    body: JSON.stringify({ studentId })
  });
}

export async function createCloudNotification(notification) {
  const payload = await request("/api/reception/notifications", {
    method: "POST",
    body: JSON.stringify(notification)
  });
  return payload.notification;
}

export async function createCloudAdmission(admission) {
  const payload = await request("/api/reception/admissions", {
    method: "POST",
    body: JSON.stringify(admission)
  });
  return payload.admission;
}
