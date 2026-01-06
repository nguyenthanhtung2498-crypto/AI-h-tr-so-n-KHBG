const APPS_SCRIPT_URL = (window as any).process?.env?.APPS_SCRIPT_URL;

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
