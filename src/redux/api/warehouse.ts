import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface WarehouseOtherOptions {
  doLog?: boolean;
  whCon?: string;
  UniqueId?: number;
}

export interface WarehousePayload<TData = Record<string, unknown>> {
  AppToken: string;
  UserName?: string;
  ClientIP?: string;
  data?: TData;
  Other?: WarehouseOtherOptions;
}

export interface WarehouseRecord {
  [key: string]: unknown;
}

export interface WarehouseResponse<TData = WarehouseRecord[]> {
  status: number;
  message: string;
  data: TData;
}

export interface GetWarehouseWhereArgs<TData = Record<string, unknown>> {
  whCon?: string;
  data?: TData;
}

export interface ListWarehousesParams {
  [key: string]: string | number | boolean | null | undefined;
}

export const buildWarehousePayload = <TData = Record<string, unknown>>(
  overrides: Partial<WarehousePayload<TData>> = {}
): WarehousePayload<TData> => ({
  AppToken: "abcd",
  UserName: "",
  ClientIP: "::1",
  data: {} as TData,
  Other: {
    doLog: true,
    whCon: "1=1",
  },
  ...overrides,
});

export const buildWarehouseWherePayload = <TData = Record<string, unknown>>({
  whCon = "1=1",
  data,
}: GetWarehouseWhereArgs<TData> = {}): WarehousePayload<TData> => ({
  AppToken: "abcd",
  UserName: "",
  ClientIP: "::1",
  data: (data ?? {}) as TData,
  Other: {
    doLog: true,
    whCon,
  },
});

export const buildWarehouseByIdPayload = (
  UniqueId: number
): WarehousePayload<Record<string, unknown>> => ({
  AppToken: "abcd",
  UserName: "",
  ClientIP: "::1",
  data: {},
  Other: {
    UniqueId,
    doLog: true,
  },
});

export const warehouseApi = createApi({
  reducerPath: "warehouseApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "https://wmsapi.techelecon.in/api",
    prepareHeaders: (headers) => {
      headers.set("Content-Type", "application/json");
      return headers;
    },
  }),
  tagTypes: ["Warehouse"],
  endpoints: (builder) => ({
    listWarehouses: builder.query<WarehouseResponse, ListWarehousesParams | void>({
      query: (params) => {
        const cleanedParams: Record<string, string | number | boolean> = {};
        const safeParams: ListWarehousesParams = params ? params : {};

        Object.entries(safeParams).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value !== "") {
            cleanedParams[key] = value;
          }
        });

        return {
          url: "/warehouse",
          method: "GET",
          params: cleanedParams,
        };
      },
      providesTags: ["Warehouse"],
    }),
  }),
});

export const {
  useListWarehousesQuery,
  useLazyListWarehousesQuery,
} = warehouseApi;
