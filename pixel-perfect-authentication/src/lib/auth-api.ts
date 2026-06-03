import { API_ROOT_URL, AUTH_BASE_URL, getApiUrl } from "./api-config";
const BASE_URL = AUTH_BASE_URL;
const ROOT_URL = API_ROOT_URL;

const notifyAuthChange = () => {
  window.dispatchEvent(new Event("auth-changed"));
};

export interface SignUpRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: "STUDENT" | "TEACHER" | "ADMIN" | "SUPER_ADMIN";
}

export interface SignInRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken?: string;
  refreshToken?: string;
  message?: string;
  user?: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  [key: string]: unknown;
}

export async function signUp(data: SignUpRequest): Promise<AuthResponse> {
  const url = getApiUrl("/signup", BASE_URL);
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Ro'yxatdan o'tishda xatolik");
  }
  return res.json();
}

export async function verifyEmail(
  email: string,
  code: string,
): Promise<AuthResponse> {
  const url = getApiUrl("/verify-email", BASE_URL);
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("Verification failed:", err);
    throw new Error(err.message || "Tasdiqlashda xatolik");
  }

  // The response might be plain text "Email verified successfully"
  // which causes res.json() to fail.
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return res.json();
  } else {
    const text = await res.text();
    return { message: text } as AuthResponse;
  }
}

/** Decode a JWT payload (no verification – just extract claims). */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split(".")[1];
    const json = atob(base64.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export async function signIn(data: SignInRequest): Promise<AuthResponse> {
  const url = getApiUrl("/signin", BASE_URL);
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Kirishda xatolik");
  }
  const json = await res.json();

  // Backend only returns tokens – extract user info from JWT
  if (json.accessToken && !json.user) {
    const claims = decodeJwtPayload(json.accessToken);
    if (claims) {
      json.user = {
        id: claims.id,
        email: claims.sub || data.email,
        role: (claims.role as string) || "STUDENT",
        firstName: (claims.firstName as string) || data.email.split("@")[0],
        lastName: (claims.lastName as string) || "",
      };
    }
  }

  return json;
}

export function saveTokens(accessToken: string, refreshToken?: string) {
  localStorage.setItem("accessToken", accessToken);
  if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
  notifyAuthChange();
}

export function saveUser(user: any) {
  if (user != null) {
    // Always JSON.stringify to ensure getUser() can parse it back correctly.
    // Storing a raw string (e.g. "admin") would cause JSON.parse to throw.
    localStorage.setItem("user", JSON.stringify(user));
  }
  notifyAuthChange();
}

export function getUser() {
  const user = localStorage.getItem("user");
  if (!user) return null;
  try {
    return JSON.parse(user);
  } catch (e) {
    // Stale raw-string value from old sessions — clear it to prevent repeated errors.
    localStorage.removeItem("user");
    return null;
  }
}

export function getAccessToken() {
  return localStorage.getItem("accessToken");
}

/** Fetch current user profile from backend using the access token. */
export async function fetchMe(): Promise<Record<string, unknown> | null> {
  const token = getAccessToken();
  if (!token) return null;

  // Try common endpoints
  const endpoints = [
    getApiUrl("/me", BASE_URL),
    getApiUrl("/users/me", ROOT_URL),
    getApiUrl("/user/me", ROOT_URL),
    getApiUrl("/auth/profile", ROOT_URL),
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        console.log("fetchMe success from", url, data);
        return data;
      }
    } catch {
      // try next
    }
  }
  return null;
}

export function logout() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
  notifyAuthChange();
}
