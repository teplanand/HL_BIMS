import {
  BarcodeSalesOrderDetailsRaw,
  BarcodeSalesOrderLineRaw,
  BarcodeSalesOrderLineSerialRaw,
  BarcodeSerialLookupResponseData,
} from "../../../redux/api/barcode";

export type BarcodeSalesOrderStatus =
  | "New Sales Order"
  | "HOD Review"
  | "Planning"
  | "Dispatched";

export type BarcodeLineStatusCode = "PL" | "SH" | "MI" | "PK" | "BOOKED";

export type BarcodeRecentOrderRow = {
  id: string;
  orderId: string;
  customerName: string;
  customerId: string;
  status: BarcodeSalesOrderStatus;
  createdAt: string;
  orderNumber: string;
  headerId?: number | null;
};

export type BarcodeSerialItemViewModel = {
  serial_no: string;
  ass_rel_date: string | null;
  ac_ua_date: string | null;
  ac_comp_date: string | null;
  ac_pk_date: string | null;
  ac_ds_date: string | null;
  tent_rel_date: string | null;
  status: BarcodeLineStatusCode;
  sh_type: string | null;
  sh_item: string | null;
  rpm: string | null;
  motor_serial_no: string | null;
  ac_ho_date: string | null;
  ac_ca_date: string | null;
};

export type BarcodeLineItemViewModel = {
  id: string;
  lineId: number;
  headerId: number | null;
  orgId: number | null;
  line_no: string;
  item_code: string;
  description: string;
  quantity: number;
  list_price: number;
  discount_percent: number;
  selling_price: number;
  amount: number;
  ship_to_location: string;
  road_permit: boolean;
  wo_no: string;
  wo_date: string | null;
  client_delivery_date: string | null;
  delivery_month: string | null;
  con_auth: string | null;
  status: BarcodeLineStatusCode;
  mail_status: string;
  model: string;
  model_type: string;
  ratio: number;
  kw: number;
  quantitys: BarcodeSerialItemViewModel[];
};

export type BarcodeSalesOrderDetailsViewModel = {
  header_id: number | null;
  order: {
    order_number: string;
    order_type: string;
    status: string;
    order_date: string;
    currency: string;
    tax_category: string;
  };
  order_information: {
    main: {
      customer: {
        name: string;
        customer_number: string;
        customer_po: string;
        contact: string;
      };
      addresses: {
        shipping: {
          location: string;
          address_line_1: string;
          address_line_2: string;
          city: string;
          pincode: string;
          state: string;
        };
        billing: {
          location: string;
          address_line_1: string;
          address_line_2: string;
          city: string;
          pincode: string;
          state: string;
        };
      };
      sales: {
        sales_person: string;
        price_list: string;
      };
      amount: {
        sub_total: number;
        tax: number;
        total: number;
      };
      bank_details: {
        context_value: string;
        bank_address: string;
        lc_no: string;
        delivery_condition: string;
        destination: string;
        group_proj_ref: string;
        proj_title: string;
        insurance_by: string;
        bank_name: string;
        contact_name: string;
        email_address_and_phone: string;
      };
    };
    other_details: {
      payment_terms: string;
      warehouse: string;
      line_set: string;
      fob: string;
      shipping_instructions: string;
      tax_handling: string;
      exempt_reason: string;
      amount: string;
      credit_card_type: string;
      card_holder: string;
      approval_code: string;
      order_source: string;
      sales_channel: string;
      shipping_method: string;
      freight_terms: string;
      shipment_priority: string;
      packing_instruction: string;
      tax_exempt_number: string;
      payment_type: string;
      cheque_number: string;
      credit_card_number: string;
      card_expiry_date: string;
      prepaid_amount: string;
      order_source_reference: string;
    };
  };
  line_items: BarcodeLineItemViewModel[];
};

export type BarcodeSerialLookupViewModel = {
  rpm: string;
  motorSerialNumber: string;
  model: string;
  workOrderNumber: string;
};

const toStringValue = (value: unknown, fallback = ""): string => {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number") {
    return String(value);
  }

  return fallback;
};

const toNumberValue = (value: unknown, fallback = 0): number => {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : fallback;
};

const deriveLineStatus = (lineItem: BarcodeSalesOrderLineRaw): BarcodeLineStatusCode => {
  const serialItems = lineItem.serial_line_items || [];
  if (!serialItems.length && !lineItem.WIP_ENTITY_NAME) {
    return "BOOKED";
  }

  const hasPackedSerial = serialItems.some((serialItem) => serialItem.ac_pk_date);
  if (hasPackedSerial) {
    return "PK";
  }

  const hasCompletedSerial = serialItems.some(
    (serialItem) => serialItem.ac_comp_date || serialItem.ac_ua_date
  );
  if (hasCompletedSerial) {
    return "MI";
  }

  return "SH";
};

const deriveSalesOrderStatus = (
  lineItems: BarcodeLineItemViewModel[]
): BarcodeSalesOrderStatus => {
  const statuses = lineItems.map((lineItem) => lineItem.status);

  if (statuses.some((status) => status === "PK")) {
    return "Dispatched";
  }

  if (statuses.some((status) => status === "MI")) {
    return "Planning";
  }

  if (statuses.some((status) => status === "SH")) {
    return "HOD Review";
  }

  return "New Sales Order";
};

const getMailStatus = (status: BarcodeLineStatusCode) => {
  switch (status) {
    case "PK":
      return "Ready for label print";
    case "MI":
      return "Material issued";
    case "SH":
      return "Serial number available";
    case "BOOKED":
    default:
      return "Awaiting work order";
  }
};

const mapSerialItem = (
  serialItem: BarcodeSalesOrderLineSerialRaw
): BarcodeSerialItemViewModel => ({
  serial_no: toStringValue(serialItem.serial_no),
  ass_rel_date: toStringValue(serialItem.ass_rel_date) || null,
  ac_ua_date: toStringValue(serialItem.ac_ua_date) || null,
  ac_comp_date: toStringValue(serialItem.ac_comp_date) || null,
  ac_pk_date: toStringValue(serialItem.ac_pk_date) || null,
  ac_ds_date: toStringValue(serialItem.ac_ds_date) || null,
  tent_rel_date: toStringValue(serialItem.tent_rel_date) || null,
  status:
    (toStringValue(serialItem.status).toUpperCase() as BarcodeLineStatusCode) || "SH",
  sh_type: toStringValue(serialItem.sh_type) || null,
  sh_item: toStringValue(serialItem.sh_item) || null,
  rpm: toStringValue(serialItem.rpm) || null,
  motor_serial_no: toStringValue(serialItem.motor_serial_no) || null,
  ac_ho_date: toStringValue(serialItem.ac_ho_date) || null,
  ac_ca_date: toStringValue(serialItem.ac_ca_date) || null,
});

const mapLineItem = (
  lineItem: BarcodeSalesOrderLineRaw,
  index: number,
  shippingCity: string
): BarcodeLineItemViewModel => {
  const status = deriveLineStatus(lineItem);
  const lineId = toNumberValue(lineItem.LINE_ID);
  const quantity = toNumberValue(lineItem.ORDERED_QUANTITY);
  const serialItems = (lineItem.serial_line_items || []).map(mapSerialItem);

  return {
    id: String(lineId || `${index + 1}`),
    lineId,
    headerId: lineItem.HEADER_ID ?? null,
    orgId: lineItem.ORG_ID ?? null,
    line_no: `${index + 1}`,
    item_code: toStringValue(lineItem.ORDERED_ITEM),
    description: toStringValue(lineItem.DESCRIPTION, "Description not available"),
    quantity,
    list_price: toNumberValue(lineItem.UNIT_LIST_PRICE),
    discount_percent: toNumberValue(lineItem.DISCOUNT),
    selling_price: toNumberValue(lineItem.UNIT_SELLING_PRICE),
    amount: toNumberValue(lineItem.AMOUNT),
    ship_to_location: shippingCity || toStringValue(lineItem.SHIP_TO_ORG_ID, "--"),
    road_permit: false,
    wo_no: toStringValue(lineItem.WIP_ENTITY_NAME),
    wo_date: toStringValue(lineItem.CREATION_DATE) || null,
    client_delivery_date: null,
    delivery_month: null,
    con_auth: null,
    status,
    mail_status: getMailStatus(status),
    model: toStringValue(lineItem.MODEL),
    model_type: toStringValue(lineItem.MODEL_TYPE),
    ratio: toNumberValue(lineItem.RATIO),
    kw: toNumberValue(lineItem.KW),
    quantitys: serialItems,
  };
};

export const mapSalesOrderDetails = (
  rawDetails?: BarcodeSalesOrderDetailsRaw | null
): BarcodeSalesOrderDetailsViewModel | null => {
  if (!rawDetails?.order?.order_number) {
    return null;
  }

  const shippingCity = toStringValue(rawDetails.shipping_address?.city);
  const lineItems = (rawDetails.line_items || []).map((lineItem, index) =>
    mapLineItem(lineItem, index, shippingCity)
  );

  return {
    header_id: rawDetails.header_id ?? null,
    order: {
      order_number: toStringValue(rawDetails.order?.order_number),
      order_type: toStringValue(rawDetails.order?.order_type),
      status: toStringValue(rawDetails.order?.status),
      order_date: toStringValue(rawDetails.order?.order_date),
      currency: toStringValue(rawDetails.order?.currency),
      tax_category: toStringValue(rawDetails.order?.tax_category),
    },
    order_information: {
      main: {
        customer: {
          name: toStringValue(rawDetails.customer?.customer_name),
          customer_number: toStringValue(rawDetails.customer?.customer_number),
          customer_po: toStringValue(rawDetails.customer?.customer_po),
          contact: toStringValue(rawDetails.customer?.contact),
        },
        addresses: {
          shipping: {
            location:
              toStringValue(rawDetails.shipping_address?.location) ||
              toStringValue(rawDetails.shipping_address?.city),
            address_line_1: toStringValue(rawDetails.shipping_address?.address_line_1),
            address_line_2: toStringValue(rawDetails.shipping_address?.address_line_2),
            city: toStringValue(rawDetails.shipping_address?.city),
            pincode: toStringValue(rawDetails.shipping_address?.pincode),
            state: toStringValue(rawDetails.shipping_address?.state),
          },
          billing: {
            location:
              toStringValue(rawDetails.billing_address?.location) ||
              toStringValue(rawDetails.billing_address?.city),
            address_line_1: toStringValue(rawDetails.billing_address?.address_line_1),
            address_line_2: toStringValue(rawDetails.billing_address?.address_line_2),
            city: toStringValue(rawDetails.billing_address?.city),
            pincode: toStringValue(rawDetails.billing_address?.pincode),
            state: toStringValue(rawDetails.billing_address?.state),
          },
        },
        sales: {
          sales_person: toStringValue(rawDetails.sales?.sales_person),
          price_list: toStringValue(rawDetails.sales?.price_list),
        },
        amount: {
          sub_total: toNumberValue(rawDetails.amounts?.sub_total),
          tax: toNumberValue(rawDetails.amounts?.tax),
          total: toNumberValue(rawDetails.amounts?.total),
        },
        bank_details: {
          context_value: "Bank Details",
          bank_address: toStringValue(rawDetails.bank_details?.branch),
          lc_no: "",
          delivery_condition: "",
          destination: toStringValue(rawDetails.shipping_address?.city),
          group_proj_ref: "",
          proj_title: "",
          insurance_by: "",
          bank_name: toStringValue(rawDetails.bank_details?.bank_name),
          contact_name: "",
          email_address_and_phone: toStringValue(rawDetails.bank_details?.ifsc_code),
        },
      },
      other_details: {
        payment_terms: toStringValue(rawDetails.payment?.payment_terms),
        warehouse: "",
        line_set: "",
        fob: "",
        shipping_instructions: "",
        tax_handling: "",
        exempt_reason: "",
        amount: toStringValue(rawDetails.amounts?.total),
        credit_card_type: "",
        card_holder: "",
        approval_code: "",
        order_source: "",
        sales_channel: toStringValue(rawDetails.sales?.sales_channel),
        shipping_method: toStringValue(rawDetails.shipping?.shipping_method),
        freight_terms: toStringValue(rawDetails.shipping?.freight_terms),
        shipment_priority: "",
        packing_instruction: "",
        tax_exempt_number: "",
        payment_type: "",
        cheque_number: "",
        credit_card_number: "",
        card_expiry_date: "",
        prepaid_amount: "",
        order_source_reference: "",
      },
    },
    line_items: lineItems,
  };
};

export const mapSalesOrderSummaryRow = (
  orderDetails?: BarcodeSalesOrderDetailsRaw | null
): BarcodeRecentOrderRow | null => {
  const mappedDetails = mapSalesOrderDetails(orderDetails);
  if (!mappedDetails) {
    return null;
  }

  return {
    id: mappedDetails.order.order_number,
    orderId: `SO-${mappedDetails.order.order_number}`,
    customerName: mappedDetails.order_information.main.customer.name || "Unknown Customer",
    customerId: mappedDetails.order_information.main.customer.customer_number || "--",
    status: deriveSalesOrderStatus(mappedDetails.line_items),
    createdAt: mappedDetails.order.order_date,
    orderNumber: mappedDetails.order.order_number,
    headerId: mappedDetails.header_id,
  };
};

export const mapSerialLookup = (
  data?: BarcodeSerialLookupResponseData | null,
  serialNumber?: string
): BarcodeSerialLookupViewModel => ({
  rpm: toStringValue(data?.rpm),
  motorSerialNumber: toStringValue(data?.motor_serial_no),
  model: toStringValue(data?.Model, serialNumber ? `GM-${serialNumber}` : ""),
  workOrderNumber: toStringValue(data?.wo_no),
});
