const APPS_SCRIPT_URL = (window as any).process?.env?.APPS_SCRIPT_URL;
const ADMIN_MASTER_KEY = (window as any).process?.env?.ADMIN_MASTER_KEY;

async function callScript(payload: any) {
  if (!APPS_SCRIPT_URL) throw new Error("Thiếu APPS_SCRIPT_URL trong index.html");

  const res = await fetch(APPS_SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return await res.json();
}

export async function loginUser(email: string, password: string) {
  return callScript({ action: "login", email, password });
}

export async function adminCreateUser(email: string, password: string, role: "user" | "admin" = "user") {
  if (!ADMIN_MASTER_KEY) throw new Error("Thiếu ADMIN_MASTER_KEY trong index.html");

  return callScript({
    action: "admin_create_user",
    adminKey: ADMIN_MASTER_KEY,
    email,
    password,
    role,
  });
}
