import { fetchBaseQuery } from "@reduxjs/toolkit/query";
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
  FetchBaseQueryMeta,
} from "@reduxjs/toolkit/query";
import { getToken, removeToken } from "./auth";

const PUBLIC_AUTH_PATHS = [
  "/users/login",
  "/auth/send-otp",
  "/auth/verify-otp",
  "/auth/forgot-password",
];

const getRequestUrl = (args: string | FetchArgs) =>
  typeof args === "string" ? args : args.url;

const isPublicAuthRequest = (args: string | FetchArgs) =>
  PUBLIC_AUTH_PATHS.some((path) => getRequestUrl(args).includes(path));

const extractErrorMessage = (error: FetchBaseQueryError | undefined) => {
  const data = error?.data;

  if (typeof data === "string") {
    return data;
  }

  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    const messageCandidates = [
      record.message,
      record.error,
      record.details,
      record.title,
    ];

    for (const candidate of messageCandidates) {
      if (typeof candidate === "string" && candidate.trim()) {
        return candidate;
      }
    }
  }

  return "";
};

const hasExpiredTokenMessage = (error: FetchBaseQueryError | undefined) => {
  const message = extractErrorMessage(error).toLowerCase();

  if (!message) {
    return false;
  }

  return [
    "token expired",
    "jwt expired",
    "expired token",
    "invalid token",
    "unauthorized",
    "unauthenticated",
    "authentication failed",
    "authorization denied",
    "forbidden",
    "login again",
    "please login",
  ].some((pattern) => message.includes(pattern));
};

const shouldRedirectToSignIn = (
  args: string | FetchArgs,
  error: FetchBaseQueryError | undefined
) => {
  if (!error || isPublicAuthRequest(args)) {
    return false;
  }

  if (error.status === 401) {
    return true;
  }

  if (error.status === 403 && hasExpiredTokenMessage(error)) {
    return true;
  }

  return hasExpiredTokenMessage(error);
};

const redirectToSignIn = () => {
  removeToken();

  if (typeof window === "undefined") {
    return;
  }

  if (window.location.pathname !== "/signin") {
    window.location.assign("/signin");
  }
};

type CreateAppBaseQueryOptions = {
  baseUrl: string;
  includeAuthHeader?: boolean;
  prepareHeaders?: (headers: Headers) => Headers | void;
};

export const createAppBaseQuery = ({
  baseUrl,
  includeAuthHeader = true,
  prepareHeaders,
}: CreateAppBaseQueryOptions): BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError,
  {},
  FetchBaseQueryMeta
> => {
  const rawBaseQuery = fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers) => {
      if (includeAuthHeader) {
        const token = getToken();
        if (token) {
          headers.set("Authorization", `Bearer ${token}`);
        }
      }

      const preparedHeaders = prepareHeaders?.(headers);
      return preparedHeaders ?? headers;
    },
  });

  return async (args, api, extraOptions) => {
    const result = await rawBaseQuery(args, api, extraOptions);

    if (shouldRedirectToSignIn(args, result.error)) {
      redirectToSignIn();
    }

    return result;
  };
};

export const baseQueryWithReauth = createAppBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE_URL,
});

export default baseQueryWithReauth;
