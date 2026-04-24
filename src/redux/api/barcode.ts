import { createApi } from "@reduxjs/toolkit/query/react";
import { createAppBaseQuery } from "../../utils/customBaseQuery";

export interface BarcodeApiResponse<TData = unknown> {
  status?: boolean | number;
  message?: string;
  data?: TData | null;
}

export interface BarcodeContextPayload {
  ORGANIZATION_ID: number;
  DIVISION_ID: number;
}

export interface BarcodeSalesOrderDetailsRequest extends BarcodeContextPayload {
  order_number: number | string;
}

export interface BarcodeCreateWorkOrderRequest extends BarcodeContextPayload {
  LINE_ID: number | string;
  order_type: string;
}

export interface BarcodeGenerateSerialRequest {
  DIVISION_ID: number;
  LINE_ID: number | string;
}

export interface BarcodeIssueMaterialRequest extends BarcodeContextPayload {
  LINE_ID: number | string;
}

export interface BarcodePrintLabelRequest {
  WONO: string;
  Line_Id: number | string;
}

export interface BarcodeSerialLookupRequest {
  serial_no: string;
}

export interface BarcodeCompletionLookupRequest {
  BarcodeSerialNo: string;
}

export type BarcodeCompletionStage = "completion" | "painting" | "packing";

export interface BarcodeCompletionRecordPayload {
  oracle_order_no: number;
  model_type: string;
  model: string;
  ratio: number;
  qty: number;
  wo_no: string;
  order_header_id: number;
  order_line_id: number;
  status: string;
  kw: number;
  serial_no: string;
  rpm: number;
  motor_serial_no: string;
  input_RPM: number;
  actual_ratio: number;
  pole: number;
  noiseLevel: number;
  paintColor: string;
  MotorMake: string;
  OracleUserId: number;
  P_AMB_TEMP: string;
  P_GREASE_TEMP: string;
}

export interface BarcodeCompletionUpdateRequest {
  stage: BarcodeCompletionStage;
  DivisionId: string;
  dtPrint: BarcodeCompletionRecordPayload;
}

export interface BarcodeImportResponseData {
  order_booked_date?: string | null;
  order_type_id?: number | null;
  header_id?: number | null;
  ordernumber?: number | string | null;
}

export interface BarcodeSalesOrderLineSerialRaw {
  serial_no?: string | null;
  ass_rel_date?: string | null;
  ac_ua_date?: string | null;
  ac_comp_date?: string | null;
  ac_pk_date?: string | null;
  ac_ds_date?: string | null;
  tent_rel_date?: string | null;
  ac_ho_date?: string | null;
  ac_ca_date?: string | null;
  status?: string | null;
  sh_type?: string | null;
  sh_item?: string | null;
  rpm?: string | number | null;
  motor_serial_no?: string | null;
}

export interface BarcodeSalesOrderLineRaw {
  LINE_ID?: number;
  HEADER_ID?: number;
  ORG_ID?: number;
  ORDERED_ITEM?: string | null;
  ORDERED_QUANTITY?: number | string | null;
  UNIT_LIST_PRICE?: number | string | null;
  UNIT_SELLING_PRICE?: number | string | null;
  SHIP_FROM_ORG_ID?: number | string | null;
  SHIP_TO_ORG_ID?: number | string | null;
  AMOUNT?: number | string | null;
  DISCOUNT?: number | string | null;
  DESCRIPTION?: string | null;
  MODEL?: string | null;
  MODEL_TYPE?: string | null;
  KW?: number | string | null;
  RATIO?: number | string | null;
  WIP_ENTITY_NAME?: string | null;
  CREATION_DATE?: string | null;
  serial_line_items?: BarcodeSalesOrderLineSerialRaw[] | null;
}

export interface BarcodeSalesOrderDetailsRaw {
  header_id?: number | null;
  order?: {
    order_number?: number | string | null;
    order_type?: string | null;
    status?: string | null;
    order_date?: string | null;
    currency?: string | null;
    tax_category?: string | null;
  } | null;
  customer?: {
    customer_name?: string | null;
    customer_number?: string | null;
    customer_po?: string | null;
    contact?: string | null;
  } | null;
  billing_address?: {
    location?: string | null;
    address_line_1?: string | null;
    address_line_2?: string | null;
    city?: string | null;
    pincode?: string | null;
    state?: string | null;
  } | null;
  shipping_address?: {
    location?: string | null;
    address_line_1?: string | null;
    address_line_2?: string | null;
    city?: string | null;
    pincode?: string | null;
    state?: string | null;
  } | null;
  sales?: {
    sales_person?: string | null;
    price_list?: string | null;
    sales_channel?: string | null;
  } | null;
  amounts?: {
    sub_total?: string | number | null;
    tax?: string | number | null;
    total?: string | number | null;
  } | null;
  shipping?: {
    shipping_method?: string | null;
    freight_terms?: string | null;
  } | null;
  payment?: {
    payment_terms?: string | null;
  } | null;
  bank_details?: {
    bank_name?: string | null;
    account_number?: string | null;
    ifsc_code?: string | null;
    branch?: string | null;
  } | null;
  line_items?: BarcodeSalesOrderLineRaw[] | null;
}

export interface BarcodeSerialLookupResponseData {
  rpm?: number | string | null;
  motor_serial_no?: string | null;
  Model?: string | null;
  wo_no?: string | null;
}

const parseNumericEnv = (value: string | undefined, fallback: number) => {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : fallback;
};

export const barcodeDefaults = {
  baseUrl:
    import.meta.env.VITE_BARCODE_API_BASE_URL || "https://barcodeapi.techelecon.in/api",
  organizationId: parseNumericEnv(import.meta.env.VITE_BARCODE_ORGANIZATION_ID, 43),
  divisionId: parseNumericEnv(import.meta.env.VITE_BARCODE_DIVISION_ID, 374),
};

export const getBarcodeDefaultContext = (): BarcodeContextPayload => ({
  ORGANIZATION_ID: barcodeDefaults.organizationId,
  DIVISION_ID: barcodeDefaults.divisionId,
});

export const barcodeApi = createApi({
  reducerPath: "barcodeApi",
  baseQuery: createAppBaseQuery({
    baseUrl: barcodeDefaults.baseUrl,
    includeAuthHeader: false,
  }),
  tagTypes: ["BarcodeSalesOrder"],
  endpoints: (builder) => ({
    importSalesOrders: builder.mutation<
      BarcodeApiResponse<BarcodeImportResponseData>,
      Partial<BarcodeContextPayload> | void
    >({
      query: (body) => ({
        url: "/barcode/sales-orders/import",
        method: "POST",
        body: {
          ...getBarcodeDefaultContext(),
          ...(body || {}),
        },
      }),
      invalidatesTags: ["BarcodeSalesOrder"],
    }),
    getSalesOrderDetails: builder.query<
      BarcodeApiResponse<BarcodeSalesOrderDetailsRaw>,
      BarcodeSalesOrderDetailsRequest
    >({
      query: (body) => ({
        url: "/barcode/sales-orders/salseOrderDetails",
        method: "POST",
        body,
      }),
      providesTags: (_result, _error, arg) => [
        { type: "BarcodeSalesOrder", id: String(arg.order_number) },
      ],
    }),
    createWorkOrder: builder.mutation<BarcodeApiResponse, BarcodeCreateWorkOrderRequest>({
      query: (body) => ({
        url: "/barcode/sales-orders/workordercreate",
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: "BarcodeSalesOrder", id: String(arg.LINE_ID) },
      ],
    }),
    generateSerialNumbers: builder.mutation<BarcodeApiResponse, BarcodeGenerateSerialRequest>({
      query: (body) => ({
        url: "/barcode/sales-orders/generateSrNO",
        method: "POST",
        body,
      }),
      invalidatesTags: ["BarcodeSalesOrder"],
    }),
    issueMaterial: builder.mutation<BarcodeApiResponse, BarcodeIssueMaterialRequest>({
      query: (body) => ({
        url: "/barcode/sales-orders/IssueMaterial",
        method: "POST",
        body,
      }),
      invalidatesTags: ["BarcodeSalesOrder"],
    }),
    printLabel: builder.mutation<BarcodeApiResponse, BarcodePrintLabelRequest>({
      query: (body) => ({
        url: "/barcode/sales-orders/printlabel",
        method: "POST",
        body,
      }),
    }),
    getUnderAssemblyDetails: builder.query<
      BarcodeApiResponse<BarcodeSerialLookupResponseData>,
      BarcodeSerialLookupRequest
    >({
      query: (body) => ({
        url: "/barcode/sales-orders/underAssembly",
        method: "POST",
        body,
      }),
    }),
    getQualityCheckDetails: builder.query<
      BarcodeApiResponse<BarcodeSerialLookupResponseData>,
      BarcodeSerialLookupRequest
    >({
      query: (body) => ({
        url: "/barcode/sales-orders/qualityCheck",
        method: "POST",
        body,
      }),
    }),
    getCompletionGearboxDetails: builder.query<
      BarcodeApiResponse<BarcodeSerialLookupResponseData>,
      BarcodeCompletionLookupRequest
    >({
      query: (body) => ({
        url: "/completionGearboxSerialNumber",
        method: "POST",
        body,
      }),
    }),
    updateOrderCompletionStage: builder.mutation<
      BarcodeApiResponse,
      BarcodeCompletionUpdateRequest
    >({
      query: ({ stage, ...body }) => ({
        url: `/barcode/order-completion/${stage}`,
        method: "POST",
        body,
      }),
    }),
  }),
});

export const {
  useImportSalesOrdersMutation,
  useLazyGetSalesOrderDetailsQuery,
  useCreateWorkOrderMutation,
  useGenerateSerialNumbersMutation,
  useIssueMaterialMutation,
  usePrintLabelMutation,
  useLazyGetUnderAssemblyDetailsQuery,
  useLazyGetQualityCheckDetailsQuery,
  useLazyGetCompletionGearboxDetailsQuery,
  useUpdateOrderCompletionStageMutation,
} = barcodeApi;
