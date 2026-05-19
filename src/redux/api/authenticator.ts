import { createApi } from "@reduxjs/toolkit/query/react";
import { createAppBaseQuery } from "../../utils/customBaseQuery";

const AUTHENTICATOR_API_BASE_URL = (
  import.meta.env.VITE_AUTHENTICATOR_API_BASE_URL ||
  "https://authenticator.techelecon.in/"
).replace(/\/+$/, "");

export interface AuthenticatorApiResponse<TData> {
  response?: boolean;
  message?: string;
  data?: TData;
}

export interface AuthenticatorLoginPayload {
  username: string;
  password: string;
}

export interface AuthenticatorLoginData {
  token?: string;
  roles?: string[];
}

export interface AuthenticatorApp {
  appId: string;
  appDesc: string;
  appTitle: string;
}

export interface AuthenticatorOrganization {
  orgTitle: string;
  orgId: string;
}

export interface AuthenticatorDivision {
  divName: string;
  divId: string;
}

export interface AuthenticatorRole {
  roleName: string;
  roleId: number | string;
}

export interface AuthenticatorUser {
  name: string;
  hrmsId: string;
  userId: string;
}

export interface GetUsersPayload {
  orgId: string;
  divId: string;
}

export interface CreateAuthenticatorRolePayload {
  appId: string;
  roleName: string;
  roleDesc: string;
}

export const authenticatorApi = createApi({
  reducerPath: "authenticatorApi",
  baseQuery: createAppBaseQuery({
    baseUrl: AUTHENTICATOR_API_BASE_URL,
  }),
  tagTypes: ["AuthenticatorApps", "AuthenticatorOrganizations", "AuthenticatorDivisions", "AuthenticatorRoles", "AuthenticatorUsers"],
  endpoints: (builder) => ({
    authenticatorLogin: builder.mutation<
      AuthenticatorApiResponse<AuthenticatorLoginData>,
      AuthenticatorLoginPayload
    >({
      query: (body) => ({
        url: "/auth/login",
        method: "POST",
        body,
      }),
    }),
    getAuthenticatorDashboardApps: builder.query<
      AuthenticatorApiResponse<AuthenticatorApp[]>,
      void
    >({
      query: () => ({
        url: "/api/dashboard",
        method: "POST",
        body: {},
      }),
      providesTags: ["AuthenticatorApps"],
    }),
    getAuthenticatorOrganizations: builder.query<
      AuthenticatorApiResponse<AuthenticatorOrganization[]>,
      void
    >({
      query: () => ({
        url: "/api/org-div/getOrganizations",
        method: "GET",
      }),
      providesTags: ["AuthenticatorOrganizations"],
    }),
    getAuthenticatorDivisions: builder.query<
      AuthenticatorApiResponse<AuthenticatorDivision[]>,
      string
    >({
      query: (orgId) => ({
        url: `/api/org-div/getDivision/${orgId}`,
        method: "GET",
      }),
      providesTags: (_result, _error, orgId) => [
        { type: "AuthenticatorDivisions", id: orgId },
      ],
    }),
    getAuthenticatorRolesByApp: builder.query<
      AuthenticatorApiResponse<AuthenticatorRole[]>,
      string
    >({
      query: (appId) => ({
        url: `/api/roles/getRoles/${appId}`,
        method: "GET",
      }),
      providesTags: (_result, _error, appId) => [{ type: "AuthenticatorRoles", id: appId }],
    }),
    createAuthenticatorRole: builder.mutation<
      AuthenticatorApiResponse<null>,
      CreateAuthenticatorRolePayload
    >({
      query: (body) => ({
        url: "/api/roles/createRole",
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: "AuthenticatorRoles", id: arg.appId },
      ],
    }),
    getAuthenticatorUsers: builder.query<
      AuthenticatorApiResponse<AuthenticatorUser[]>,
      GetUsersPayload
    >({
      query: (body) => ({
        url: "/api/users/getUsers",
        method: "POST",
        body,
      }),
      providesTags: (_result, _error, arg) => [
        { type: "AuthenticatorUsers", id: `${arg.orgId}-${arg.divId}` },
      ],
    }),
  }),
});

export const {
  useAuthenticatorLoginMutation,
  useGetAuthenticatorDashboardAppsQuery,
  useGetAuthenticatorOrganizationsQuery,
  useGetAuthenticatorDivisionsQuery,
  useGetAuthenticatorRolesByAppQuery,
  useCreateAuthenticatorRoleMutation,
  useGetAuthenticatorUsersQuery,
} = authenticatorApi;
