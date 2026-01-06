// src/api.ts

export type LoginResponse =
  | { ok: true; role: "admin" | "user" }
  | { ok: false; error: string };

const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwJ6n08dUlx5AArYzSYGLe_Z2InfiRpl8oX2QRoczzw_k6zEgFyIGhHpmiEKF1O2sIy/exec";

export async function loginUser(
  username: string,
  password: string
): Promise<LoginResponse> {
  const res = await fetch(APPS_SCRIPT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: "login",
      username,
      password,
    }),
  });

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    return { ok: false, error: "Server không trả JSON hợp lệ." };
  }

  if (data?.ok === true) {
    return {
      ok: true,
      role: data.role === "admin" ? "admin" : "user",
    };
  }

  if (data?.success === true) {
    return {
      ok: true,
      role: data.role === "admin" ? "admin" : "user",
    };
  }

  return {
    ok: false,
    error: data?.error || "Đăng nhập thất bại.",
  };
}
