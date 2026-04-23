// src/utils/tokenUtils.ts
type AuthResponseLike = {
  token?: string | null;
  access_token?: string | null;
  name?: string | null;
  email?: string | null;
  employee_id?: string | null;
  employeeId?: string | null;
  role?: string | null;
  role_name?: string | null;
  username?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  user?: Record<string, unknown> | null;
  profile?: Record<string, unknown> | null;
  data?: {
    token?: string | null;
    access_token?: string | null;
    name?: string | null;
    email?: string | null;
    employee_id?: string | null;
    employeeId?: string | null;
    role?: string | null;
    role_name?: string | null;
    username?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    user?: Record<string, unknown> | null;
    profile?: Record<string, unknown> | null;
  } | null;
} | null | undefined;

export type AuthUserProfile = {
  id?: string | number;
  name?: string;
  email?: string;
  employee_id?: string;
  employeeId?: string;
  role?: string;
  role_name?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
};

const AUTH_USER_PROFILE_KEY = "userInfo";
const LEGACY_AUTH_USER_PROFILE_KEY = "authUserProfile";

const getRecordValue = (source: Record<string, unknown> | null | undefined, key: string) => {
  const value = source?.[key];
  return typeof value === "string" || typeof value === "number" ? value : undefined;
};

const firstFilled = (...values: Array<unknown>) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }

    if (typeof value === "number") {
      return String(value);
    }
  }

  return "";
};

export const setToken = (token: string): void => {
  // Set in localStorage
  localStorage.setItem("authToken", token);

  // Set in cookie that expires in 7 days
  const date = new Date();
  date.setTime(date.getTime() + 7 * 24 * 60 * 60 * 1000);
  const expires = "expires=" + date.toUTCString();
  document.cookie = `authToken=${token};${expires};path=/;SameSite=Strict`;
};

export const getToken = (): string | null => {
  // First check localStorage
  const localStorageToken = localStorage.getItem("authToken");
  if (localStorageToken) return localStorageToken;

  // If not in localStorage, check cookies
  const cookieToken = document.cookie
    .split("; ")
    .find((row) => row.startsWith("authToken="))
    ?.split("=")[1];

  return cookieToken || null;
};

export const removeToken = (): void => {
  // Remove from localStorage
  localStorage.removeItem("authToken");
  localStorage.removeItem("selectedBranches");
  localStorage.removeItem(AUTH_USER_PROFILE_KEY);
  localStorage.removeItem(LEGACY_AUTH_USER_PROFILE_KEY);

  // Remove cookie by setting past expiration
  document.cookie =
    "authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
};

export const extractAuthToken = (response: AuthResponseLike): string | null => {
  return (
    response?.token ||
    response?.access_token ||
    response?.data?.token ||
    response?.data?.access_token ||
    null
  );
};

export const decodeToken = <T = any>(token: string): T | null => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload) as T;
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
};

export const setStoredUserProfile = (profile: AuthUserProfile | null | undefined): void => {
  if (!profile) {
    localStorage.removeItem(AUTH_USER_PROFILE_KEY);
    localStorage.removeItem(LEGACY_AUTH_USER_PROFILE_KEY);
    return;
  }

  localStorage.setItem(AUTH_USER_PROFILE_KEY, JSON.stringify(profile));
  localStorage.setItem(LEGACY_AUTH_USER_PROFILE_KEY, JSON.stringify(profile));
};

export const getStoredUserProfile = (): AuthUserProfile | null => {
  const raw =
    localStorage.getItem(AUTH_USER_PROFILE_KEY) ||
    localStorage.getItem(LEGACY_AUTH_USER_PROFILE_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthUserProfile;
  } catch (error) {
    console.error("Error parsing stored user profile:", error);
    localStorage.removeItem(AUTH_USER_PROFILE_KEY);
    localStorage.removeItem(LEGACY_AUTH_USER_PROFILE_KEY);
    return null;
  }
};

export const extractAuthUserProfile = (
  response: AuthResponseLike,
  fallbackToken?: string | null
): AuthUserProfile | null => {
  const token = fallbackToken || extractAuthToken(response);
  const decodedToken = token ? (decodeToken<Record<string, unknown>>(token) ?? {}) : {};
  const responseUser =
    (response?.user as Record<string, unknown> | undefined) ||
    (response?.profile as Record<string, unknown> | undefined) ||
    (response?.data?.user as Record<string, unknown> | undefined) ||
    (response?.data?.profile as Record<string, unknown> | undefined) ||
    {};

  const name =
    firstFilled(
      getRecordValue(responseUser, "name"),
      getRecordValue(decodedToken, "name"),
      response?.name,
      response?.data?.name,
      firstFilled(
        getRecordValue(responseUser, "first_name"),
        getRecordValue(responseUser, "last_name")
      ),
      firstFilled(
        getRecordValue(decodedToken, "first_name"),
        getRecordValue(decodedToken, "last_name")
      ),
      response?.username,
      response?.data?.username,
      getRecordValue(responseUser, "username"),
      getRecordValue(decodedToken, "username")
    ) || undefined;

  const email =
    firstFilled(
      getRecordValue(responseUser, "email"),
      getRecordValue(decodedToken, "email"),
      response?.email,
      response?.data?.email
    ) || undefined;

  const employeeId =
    firstFilled(
      getRecordValue(responseUser, "employee_id"),
      getRecordValue(responseUser, "employeeId"),
      getRecordValue(decodedToken, "employee_id"),
      getRecordValue(decodedToken, "employeeId"),
      response?.employee_id,
      response?.employeeId,
      response?.data?.employee_id,
      response?.data?.employeeId,
      localStorage.getItem("loginIdentifier")
    ) || undefined;

  const role =
    firstFilled(
      getRecordValue(responseUser, "role"),
      getRecordValue(responseUser, "role_name"),
      getRecordValue(decodedToken, "role"),
      getRecordValue(decodedToken, "role_name"),
      response?.role,
      response?.role_name,
      response?.data?.role,
      response?.data?.role_name
    ) || undefined;

  const id =
    getRecordValue(responseUser, "id") ||
    getRecordValue(decodedToken, "id") ||
    getRecordValue(response?.data as Record<string, unknown> | undefined, "id");

  if (!name && !email && !employeeId && !role && !id) {
    return null;
  }

  return {
    id,
    name,
    email,
    employee_id: employeeId,
    employeeId,
    role,
    role_name: role,
    username:
      firstFilled(
        getRecordValue(responseUser, "username"),
        getRecordValue(decodedToken, "username"),
        response?.username,
        response?.data?.username
      ) || undefined,
    first_name:
      firstFilled(
        getRecordValue(responseUser, "first_name"),
        getRecordValue(decodedToken, "first_name"),
        response?.first_name,
        response?.data?.first_name
      ) || undefined,
    last_name:
      firstFilled(
        getRecordValue(responseUser, "last_name"),
        getRecordValue(decodedToken, "last_name"),
        response?.last_name,
        response?.data?.last_name
      ) || undefined,
  };
};

export const getDecodedToken = <T = any>(): T | null => {
  const token = getToken();
  if (!token) return null;

  return decodeToken<T>(token);
};
