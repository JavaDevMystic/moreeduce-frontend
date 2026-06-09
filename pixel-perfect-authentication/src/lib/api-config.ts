export const API_ROOT_URL =
    import.meta.env.VITE_API_ROOT_URL ||
    "http://178.104.243.219:8080/api/v1";

/**
 * Endpointlarni normalize qiladi va base URL bilan birlashtiradi.
 * Double slash (//) bo‘lib ketishini oldini oladi.
 */
export const getApiUrl = (
    endpoint: string,
    base: string = API_ROOT_URL
) => {
  const cleanBase = base.endsWith("/")
      ? base.slice(0, -1)
      : base;

  const cleanEndpoint = endpoint.startsWith("/")
      ? endpoint
      : `/${endpoint}`;

  return `${cleanBase}${cleanEndpoint}`;
};

export const AUTH_BASE_URL = `${API_ROOT_URL}/auth`;
export const STUDENT_BASE_URL = `${API_ROOT_URL}/student`;
export const TEACHER_BASE_URL = `${API_ROOT_URL}/teacher`;
export const ADMIN_BASE_URL = `${API_ROOT_URL}/admin`;
export const SUPER_ADMIN_BASE_URL = `${API_ROOT_URL}/superadmin`;