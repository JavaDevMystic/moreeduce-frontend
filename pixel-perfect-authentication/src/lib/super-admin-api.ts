import { SUPER_ADMIN_BASE_URL, getApiUrl } from "./api-config";
const BASE_URL = SUPER_ADMIN_BASE_URL;

export interface AdminDto {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  resumeUrl?: string;
  certificatesUrl?: string;
  socialMediaLinks?: string;
  bio?: string;
  profileCompletionPercentage?: number;
  verified?: boolean;
  blocked?: boolean;
}

export interface CreateAdminDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = localStorage.getItem("accessToken");
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };

  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const url = getApiUrl(endpoint, BASE_URL);
  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "API call failed");
  }

  // Handle potentially empty or non-JSON responses for DELETE
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return response.json();
  }
  return {} as T;
}

export const getAdmins = () => apiFetch<AdminDto[]>("/super-admin/admins");

export const createAdmin = (data: CreateAdminDto) =>
  apiFetch<AdminDto>("/super-admin/create-admin", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const deleteAdmin = (adminId: number) =>
  apiFetch<string>(`/super-admin/admins/${adminId}`, {
    method: "DELETE",
  });
