export type BarcodeSalesOrderStatus =
  | "New Sales Order"
  | "HOD Review"
  | "Planning"
  | "Dispatched";

export type BarcodeLineStatusCode = "PL" | "SH" | "MI" | "PK" | "BOOKED";

export type BarcodeWorkflowStageStatus =
  | "Pending"
  | "In Progress"
  | "Completed"
  | "Done";

export type BarcodeActionConfig = {
  visible: boolean;
  enabled: boolean;
  mode: string;
  label: string;
};

export type BarcodeSerialItem = {
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

export type BarcodeLineItem = {
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
  wo_date: string;
  client_delivery_date: string | null;
  delivery_month: string | null;
  con_auth: string | null;
  status: BarcodeLineStatusCode;
  mail_status: string;
  actions?: Record<string, BarcodeActionConfig>;
  quantitys: BarcodeSerialItem[];
};

export type BarcodeSalesOrder = {
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
  line_items: BarcodeLineItem[];
};

export type BarcodeInspectionAccessories = {
  additionalReq: boolean;
  breatherPlug: boolean;
  oilLevelIndicator: boolean;
  stickerOilLevel: boolean;
  stickerCaution: boolean;
  namePlate: boolean;
  shaftProtector: boolean;
  adaptorCover: boolean;
  eyeBolt: boolean;
  torqueBrush: boolean;
  endCover: boolean;
  springWasher: boolean;
  circlip: boolean;
  hexBolt: boolean;
  washer: boolean;
  outputFlange: boolean;
  singleExeShaft: boolean;
  doubleExeShaft: boolean;
  torqueArm: boolean;
  motorMountingRing: boolean;
  mountingFeet: boolean;
};

export type BarcodeGearMotorLookup = {
  gearedMotorSerialNumber: string;
  finalInspection: {
    mountType: string;
    model: string;
    workOrderNumber: string;
    rpm: string;
    motorSerialNumber: string;
    pole: string;
    electricMotorMake: string;
    boreSize: string;
    holdBackType: string;
    remarks: string;
    accessories: BarcodeInspectionAccessories;
  };
  orderCompletion: {
    mountType: string;
    model: string;
    workOrderNumber: string;
    rpm: string;
    motorSerialNumber: string;
    pole: string;
    electricMotorMake: string;
    inputRpm: string;
    actualRatio: string;
    noiseLevelDb: string;
    paint: string;
    status: string;
  };
};

export type BarcodeReportDefinition = {
  id: string;
  name: string;
  apiKey: string;
  formats: Array<"xls" | "pdf">;
};

const defaultAccessories: BarcodeInspectionAccessories = {
  additionalReq: false,
  breatherPlug: false,
  oilLevelIndicator: false,
  stickerOilLevel: false,
  stickerCaution: false,
  namePlate: false,
  shaftProtector: false,
  adaptorCover: false,
  eyeBolt: false,
  torqueBrush: false,
  endCover: false,
  springWasher: false,
  circlip: false,
  hexBolt: false,
  washer: false,
  outputFlange: false,
  singleExeShaft: false,
  doubleExeShaft: false,
  torqueArm: false,
  motorMountingRing: false,
  mountingFeet: false,
};

const statusActionMap: Record<
  BarcodeLineStatusCode,
  {
    statusLabel: string;
    badgeVariant: "warning" | "success" | "info" | "secondary";
    actions: {
      workOrder: BarcodeActionConfig;
      serialNumber: BarcodeActionConfig;
      issueMaterial: BarcodeActionConfig;
      printLabel: BarcodeActionConfig;
      edit: BarcodeActionConfig;
    };
  }
> = {
  BOOKED: {
    statusLabel: "Booked",
    badgeVariant: "warning",
    actions: {
      workOrder: { visible: true, enabled: true, mode: "create", label: "Work Order" },
      serialNumber: { visible: true, enabled: false, mode: "manage", label: "Serial Number" },
      issueMaterial: { visible: true, enabled: false, mode: "issue", label: "Issue Material" },
      printLabel: { visible: true, enabled: false, mode: "print", label: "Print Label" },
      edit: { visible: true, enabled: true, mode: "edit", label: "Edit" },
    },
  },
  PL: {
    statusLabel: "In Planning",
    badgeVariant: "warning",
    actions: {
      workOrder: { visible: true, enabled: true, mode: "create", label: "Work Order" },
      serialNumber: { visible: true, enabled: false, mode: "manage", label: "Serial Number" },
      issueMaterial: { visible: true, enabled: false, mode: "issue", label: "Issue Material" },
      printLabel: { visible: true, enabled: false, mode: "print", label: "Print Label" },
      edit: { visible: true, enabled: true, mode: "edit", label: "Edit" },
    },
  },
  SH: {
    statusLabel: "Shop Floor Ready",
    badgeVariant: "success",
    actions: {
      workOrder: { visible: true, enabled: true, mode: "view", label: "Work Order" },
      serialNumber: { visible: true, enabled: true, mode: "manage", label: "Serial Number" },
      issueMaterial: { visible: true, enabled: true, mode: "issue", label: "Issue Material" },
      printLabel: { visible: true, enabled: false, mode: "print", label: "Print Label" },
      edit: { visible: true, enabled: true, mode: "edit", label: "Edit" },
    },
  },
  MI: {
    statusLabel: "Material Issued",
    badgeVariant: "info",
    actions: {
      workOrder: { visible: true, enabled: true, mode: "view", label: "Work Order" },
      serialNumber: { visible: true, enabled: true, mode: "manage", label: "Serial Number" },
      issueMaterial: { visible: true, enabled: true, mode: "issue", label: "Issue Material" },
      printLabel: { visible: true, enabled: true, mode: "print", label: "Print Label" },
      edit: { visible: true, enabled: true, mode: "edit", label: "Edit" },
    },
  },
  PK: {
    statusLabel: "Packed",
    badgeVariant: "secondary",
    actions: {
      workOrder: { visible: true, enabled: true, mode: "view", label: "Work Order" },
      serialNumber: { visible: true, enabled: true, mode: "manage", label: "Serial Number" },
      issueMaterial: { visible: true, enabled: true, mode: "issue", label: "Issue Material" },
      printLabel: { visible: true, enabled: true, mode: "print", label: "Print Label" },
      edit: { visible: true, enabled: true, mode: "edit", label: "Edit" },
    },
  },
};

const salesOrders: BarcodeSalesOrder[] = [
  {
    order: {
      order_number: "4879",
      order_type: "DBPRLS-PSC",
      status: "BOOKED",
      order_date: "2026-03-09",
      currency: "INR",
      tax_category: "",
    },
    order_information: {
      main: {
        customer: {
          name: "MA POWER SOLUTIONS",
          customer_number: "1408566",
          customer_po: "1992_B_R1",
          contact: "procurement@mapowersolutions.in",
        },
        addresses: {
          shipping: {
            location: "CHENNAI",
            address_line_1: "Plot No 57, Aishwarya Nagar Extension",
            address_line_2: "Vanagaram Road",
            city: "Chennai",
            pincode: "600095",
            state: "Tamil Nadu",
          },
          billing: {
            location: "CHENNAI",
            address_line_1: "Plot No 57, Aishwarya Nagar Extension",
            address_line_2: "Vanagaram Road",
            city: "Chennai",
            pincode: "600095",
            state: "Tamil Nadu",
          },
        },
        sales: {
          sales_person: "EMTICI-CHENNAI-2 (PBL)",
          price_list: "PBL Swift Centre Products Price List-2025",
        },
        amount: {
          sub_total: 101032,
          tax: 0,
          total: 101032,
        },
        bank_details: {
          context_value: "Bank Details",
          bank_address: "Elecon Engineering Co. Ltd., Vallabh Vidyanagar",
          lc_no: "",
          delivery_condition: "EX-WORKS",
          destination: "Chennai",
          group_proj_ref: "MAPS-PSC-2026",
          proj_title: "South Region Gear Motor Requirement",
          insurance_by: "BYCUSTOMER",
          bank_name: "HDFC Bank",
          contact_name: "Accounts Desk",
          email_address_and_phone: "accounts@elecon.com / +91-2692-123456",
        },
      },
      other_details: {
        payment_terms: "100-EX OF DOC",
        warehouse: "PSC",
        line_set: "",
        fob: "EX-WORKS (DOMESTIC)",
        shipping_instructions: "Dispatch after packing approval mail.",
        tax_handling: "S",
        exempt_reason: "",
        amount: "",
        credit_card_type: "",
        card_holder: "",
        approval_code: "",
        order_source: "Branch Sales",
        sales_channel: "BRANCH",
        shipping_method: "Any Reliable Transporter",
        freight_terms: "TO PAY",
        shipment_priority: "Standard",
        packing_instruction: "Use wooden crate for gear motors.",
        tax_exempt_number: "",
        payment_type: "",
        cheque_number: "",
        credit_card_number: "",
        card_expiry_date: "",
        prepaid_amount: "",
        order_source_reference: "EMTICI-CHN-2026-0309",
      },
    },
    line_items: [
      {
        line_no: "1.1",
        item_code: "DB.09M.022.36_BGCHI_7.5A",
        description: "Helical geared motor with compact housing",
        quantity: 1,
        list_price: 123208,
        discount_percent: 59,
        selling_price: 50516,
        amount: 50516,
        ship_to_location: "CHENNAI",
        road_permit: false,
        wo_no: "10136601",
        wo_date: "2026-03-09",
        client_delivery_date: "2026-03-28",
        delivery_month: "2603",
        con_auth: "EMTICI",
        status: "PL",
        mail_status: "Issue Material",
        actions: statusActionMap.PL.actions,
        quantitys: [
          {
            serial_no: "SC30583",
            ass_rel_date: null,
            ac_ua_date: null,
            ac_comp_date: null,
            ac_pk_date: null,
            ac_ds_date: null,
            tent_rel_date: null,
            status: "PL",
            sh_type: null,
            sh_item: null,
            rpm: null,
            motor_serial_no: null,
            ac_ho_date: null,
            ac_ca_date: null,
          },
        ],
      },
      {
        line_no: "2.1",
        item_code: "DB.09M.022.50_BGCHI_7.5A",
        description: "Inline geared motor with extended shaft",
        quantity: 1,
        list_price: 123208,
        discount_percent: 59,
        selling_price: 50516,
        amount: 50516,
        ship_to_location: "CHENNAI",
        road_permit: false,
        wo_no: "10136602",
        wo_date: "2026-03-09",
        client_delivery_date: "2026-03-28",
        delivery_month: "2603",
        con_auth: "EMTICI",
        status: "SH",
        mail_status: "Serial Number Created",
        actions: statusActionMap.SH.actions,
        quantitys: [
          {
            serial_no: "SC30584",
            ass_rel_date: "2026-03-12",
            ac_ua_date: "2026-03-14",
            ac_comp_date: null,
            ac_pk_date: null,
            ac_ds_date: null,
            tent_rel_date: "2026-03-24",
            status: "SH",
            sh_type: "GM",
            sh_item: "Stage-2",
            rpm: "1440",
            motor_serial_no: "MS-480527",
            ac_ho_date: null,
            ac_ca_date: null,
          },
        ],
      },
    ],
  },
  {
    order: {
      order_number: "4883",
      order_type: "EX-GM",
      status: "BOOKED",
      order_date: "2026-03-18",
      currency: "USD",
      tax_category: "EXPORT",
    },
    order_information: {
      main: {
        customer: {
          name: "ELECON MIDDLE EAST FZCO",
          customer_number: "CUST-1001",
          customer_po: "EME 2526146",
          contact: "ops.middleeast@elecon.com",
        },
        addresses: {
          shipping: {
            location: "DUBAI",
            address_line_1: "JAFZA South",
            address_line_2: "Warehouse 14",
            city: "Dubai",
            pincode: "000000",
            state: "Dubai",
          },
          billing: {
            location: "DUBAI",
            address_line_1: "JAFZA South",
            address_line_2: "Warehouse 14",
            city: "Dubai",
            pincode: "000000",
            state: "Dubai",
          },
        },
        sales: {
          sales_person: "EXPORT DESK",
          price_list: "Export Gear Motors FY-2026",
        },
        amount: {
          sub_total: 48500,
          tax: 0,
          total: 48500,
        },
        bank_details: {
          context_value: "Export Bank Details",
          bank_address: "Anand, Gujarat",
          lc_no: "LC-4488-2026",
          delivery_condition: "FOB",
          destination: "Jebel Ali",
          group_proj_ref: "EME-GM-APR",
          proj_title: "Middle East Stock Replenishment",
          insurance_by: "ELECON",
          bank_name: "ICICI Bank",
          contact_name: "Export Accounts",
          email_address_and_phone: "export.accounts@elecon.com / +91-2692-987654",
        },
      },
      other_details: {
        payment_terms: "LC 60 DAYS",
        warehouse: "EXPORT",
        line_set: "EXP-SET-A",
        fob: "FOB NHAVA SHEVA",
        shipping_instructions: "Pack for sea-worthy export dispatch.",
        tax_handling: "Z",
        exempt_reason: "Export without payment of tax",
        amount: "",
        credit_card_type: "",
        card_holder: "",
        approval_code: "",
        order_source: "Middle East Sales",
        sales_channel: "EXPORT",
        shipping_method: "Sea Cargo",
        freight_terms: "PREPAID",
        shipment_priority: "High",
        packing_instruction: "Corrosion protection mandatory.",
        tax_exempt_number: "LUT-2026-EXPORT",
        payment_type: "LC",
        cheque_number: "",
        credit_card_number: "",
        card_expiry_date: "",
        prepaid_amount: "",
        order_source_reference: "ME-STOCK-0318",
      },
    },
    line_items: [
      {
        line_no: "1.1",
        item_code: "ED-17400-NB",
        description: "Geared coupling multi crowned assembly",
        quantity: 2,
        list_price: 30000,
        discount_percent: 10,
        selling_price: 27000,
        amount: 54000,
        ship_to_location: "DUBAI",
        road_permit: true,
        wo_no: "10139001",
        wo_date: "2026-03-18",
        client_delivery_date: "2026-04-08",
        delivery_month: "2604",
        con_auth: "EXPORT",
        status: "MI",
        mail_status: "Label Pending",
        actions: statusActionMap.MI.actions,
        quantitys: [
          {
            serial_no: "ME40101",
            ass_rel_date: "2026-03-22",
            ac_ua_date: "2026-03-25",
            ac_comp_date: "2026-03-29",
            ac_pk_date: null,
            ac_ds_date: null,
            tent_rel_date: "2026-04-05",
            status: "MI",
            sh_type: "EXPORT",
            sh_item: "Main Unit",
            rpm: "960",
            motor_serial_no: "MS-ME40101",
            ac_ho_date: null,
            ac_ca_date: null,
          },
          {
            serial_no: "ME40102",
            ass_rel_date: "2026-03-22",
            ac_ua_date: "2026-03-25",
            ac_comp_date: "2026-03-29",
            ac_pk_date: null,
            ac_ds_date: null,
            tent_rel_date: "2026-04-05",
            status: "MI",
            sh_type: "EXPORT",
            sh_item: "Main Unit",
            rpm: "960",
            motor_serial_no: "MS-ME40102",
            ac_ho_date: null,
            ac_ca_date: null,
          },
        ],
      },
      {
        line_no: "2.1",
        item_code: "FBC-200-SPARE",
        description: "Flexible coupling spare set",
        quantity: 1,
        list_price: 6500,
        discount_percent: 5,
        selling_price: 6175,
        amount: 6175,
        ship_to_location: "DUBAI",
        road_permit: true,
        wo_no: "10139002",
        wo_date: "2026-03-18",
        client_delivery_date: "2026-04-08",
        delivery_month: "2604",
        con_auth: "EXPORT",
        status: "PK",
        mail_status: "Ready to Dispatch",
        actions: statusActionMap.PK.actions,
        quantitys: [
          {
            serial_no: "ME40103",
            ass_rel_date: "2026-03-22",
            ac_ua_date: "2026-03-24",
            ac_comp_date: "2026-03-27",
            ac_pk_date: "2026-04-01",
            ac_ds_date: null,
            tent_rel_date: "2026-04-05",
            status: "PK",
            sh_type: "SPARE",
            sh_item: "Flexible Coupling Set",
            rpm: null,
            motor_serial_no: null,
            ac_ho_date: "2026-03-30",
            ac_ca_date: "2026-03-31",
          },
        ],
      },
    ],
  },
];

const recentSalesOrders = [
  
];

const orderTracking = [
  {
    id: 904,
    line_id: 921903,
    division: "CP",
    sub_division: "GCP",
    cust_po_no: "EME 2526146",
    end_cust_name: "ELECON MIDDLE EAST FZCO",
    branch_name: "DUBAI-GEAR",
    item_desc_cust_po: "",
    ora_item_desc: "Geared Coup. Multi Crowned ED 17400 NB",
    qty: 1,
    uom: "NOS",
    po_value: 1234,
    cust_po_date: null,
    cust_po_tech_clear_date: null,
    delivery_date_po: null,
    delivery_days_frm_po_date: null,
    ga_dim_no: null,
    ga_dim_drw_submission_design_plan: null,
    ga_dim_drw_submission_design_actual: null,
    final_drg_approval_received_date_plan: null,
    final_drg_approval_received_date_actual: null,
    po_received_date_to_ga_drw_submission_days: 0,
    ga_drawing_submission_to_final_approval_received_days: 0,
    days_in_drawing_approval: 0,
    perc_time_taken_of_total_po_delivery: 0,
    work_order_no: 43,
    work_order_date: "2026-03-31",
    commited_ex_works_delivery_date: "2026-03-31",
    sales_person: null,
    order_registration: "Completed" as BarcodeWorkflowStageStatus,
    design: "Completed" as BarcodeWorkflowStageStatus,
    material_procurement: "Completed" as BarcodeWorkflowStageStatus,
    manufacturing: "In Progress" as BarcodeWorkflowStageStatus,
    assembly: "Pending" as BarcodeWorkflowStageStatus,
    testing: "Pending" as BarcodeWorkflowStageStatus,
    painting: "Pending" as BarcodeWorkflowStageStatus,
    dispatch: "Pending" as BarcodeWorkflowStageStatus,
  },
  {
    id: 905,
    line_id: 921905,
    division: "CP",
    sub_division: "GCP",
    cust_po_no: "EME 2526146",
    end_cust_name: "ELECON MIDDLE EAST FZCO",
    branch_name: "DUBAI-GEAR",
    item_desc_cust_po: "",
    ora_item_desc: "Set of Pin + Nut + Washer + Rubber Bush for Flexible Coup. Size CDF/FCF/FCFB-7, FBC-200",
    qty: 3,
    uom: "SET",
    po_value: 123,
    cust_po_date: null,
    work_order_no: 43,
    work_order_date: "2026-03-31",
    commited_ex_works_delivery_date: "2026-03-31",
    order_registration: "Completed" as BarcodeWorkflowStageStatus,
    design: "Completed" as BarcodeWorkflowStageStatus,
    material_procurement: "In Progress" as BarcodeWorkflowStageStatus,
    manufacturing: "Pending" as BarcodeWorkflowStageStatus,
    assembly: "Pending" as BarcodeWorkflowStageStatus,
    testing: "Pending" as BarcodeWorkflowStageStatus,
    painting: "Pending" as BarcodeWorkflowStageStatus,
    dispatch: "Pending" as BarcodeWorkflowStageStatus,
  },
  {
    id: 906,
    line_id: 922537,
    division: "CP",
    sub_division: "GCP",
    cust_po_no: "EME 2526146",
    end_cust_name: "ELECON MIDDLE EAST FZCO",
    branch_name: "DUBAI-GEAR",
    item_desc_cust_po: "",
    ora_item_desc: "Set of Pin + Nut + Washer + Rubber Bush for Flexible Coup. Size CDF/FCF/FCFB-13",
    qty: 3,
    uom: "SET",
    po_value: 321,
    cust_po_date: null,
    work_order_no: 43,
    work_order_date: "2026-03-31",
    commited_ex_works_delivery_date: "2026-03-31",
    order_registration: "Completed" as BarcodeWorkflowStageStatus,
    design: "In Progress" as BarcodeWorkflowStageStatus,
    material_procurement: "Pending" as BarcodeWorkflowStageStatus,
    manufacturing: "Pending" as BarcodeWorkflowStageStatus,
    assembly: "Pending" as BarcodeWorkflowStageStatus,
    testing: "Pending" as BarcodeWorkflowStageStatus,
    painting: "Pending" as BarcodeWorkflowStageStatus,
    dispatch: "Pending" as BarcodeWorkflowStageStatus,
  },
  {
    id: 907,
    line_id: 882785,
    division: "CP",
    sub_division: "GCP",
    cust_po_no: "FOC",
    end_cust_name: "RADICON DRIVE SYSTEMS INC.",
    branch_name: "RADICON(USA)-GEAR",
    item_desc_cust_po: "",
    ora_item_desc: "Flexible Coup. EFC-06, DRG.NO.47-74-1403 REV:0",
    qty: 1,
    uom: "NOS",
    po_value: 50,
    work_order_no: 47,
    work_order_date: "2025-10-16",
    commited_ex_works_delivery_date: "2025-10-16",
    order_registration: "Completed" as BarcodeWorkflowStageStatus,
    design: "Completed" as BarcodeWorkflowStageStatus,
    material_procurement: "Completed" as BarcodeWorkflowStageStatus,
    manufacturing: "Completed" as BarcodeWorkflowStageStatus,
    assembly: "Completed" as BarcodeWorkflowStageStatus,
    testing: "Completed" as BarcodeWorkflowStageStatus,
    painting: "In Progress" as BarcodeWorkflowStageStatus,
    dispatch: "Pending" as BarcodeWorkflowStageStatus,
  },
  {
    id: 908,
    line_id: 948890,
    division: "CP",
    sub_division: "GCP",
    cust_po_no: "FOC",
    end_cust_name: "BENZLER ANTRIEBSTECHNIK GMBH",
    branch_name: "BENZLERS - GMBH",
    item_desc_cust_po: "",
    ora_item_desc: "Set of Spare of ED-4500 & ES-29000",
    qty: 1,
    uom: "NOS",
    po_value: 25,
    work_order_no: 49,
    work_order_date: "2026-04-20",
    commited_ex_works_delivery_date: "2026-04-20",
    order_registration: "Completed" as BarcodeWorkflowStageStatus,
    design: "Completed" as BarcodeWorkflowStageStatus,
    material_procurement: "Completed" as BarcodeWorkflowStageStatus,
    manufacturing: "Completed" as BarcodeWorkflowStageStatus,
    assembly: "Completed" as BarcodeWorkflowStageStatus,
    testing: "Completed" as BarcodeWorkflowStageStatus,
    painting: "Completed" as BarcodeWorkflowStageStatus,
    dispatch: "Done" as BarcodeWorkflowStageStatus,
  },
];

const gearMotorLookups: Record<string, BarcodeGearMotorLookup> = {
  M480527: {
    gearedMotorSerialNumber: "M480527",
    finalInspection: {
      mountType: "Foot Mount",
      model: "EDR-FM-90L",
      workOrderNumber: "WO-240527",
      rpm: "1440",
      motorSerialNumber: "MS-480527",
      pole: "4",
      electricMotorMake: "PBL",
      boreSize: "40",
      holdBackType: "CW",
      remarks: "Inspected and ready for dispatch.",
      accessories: {
        ...defaultAccessories,
        breatherPlug: true,
        oilLevelIndicator: true,
        stickerOilLevel: true,
        stickerCaution: true,
        namePlate: true,
        shaftProtector: true,
        eyeBolt: true,
        endCover: true,
        springWasher: true,
        circlip: true,
        hexBolt: true,
        washer: true,
        singleExeShaft: true,
        mountingFeet: true,
      },
    },
    orderCompletion: {
      mountType: "Foot Mount",
      model: "EDR-FM-90L",
      workOrderNumber: "WO-240527",
      rpm: "1440",
      motorSerialNumber: "MS-480527",
      pole: "4",
      electricMotorMake: "PBL",
      inputRpm: "1440",
      actualRatio: "20",
      noiseLevelDb: "64",
      paint: "GOOD",
      status: "PK",
    },
  },
  M480528: {
    gearedMotorSerialNumber: "M480528",
    finalInspection: {
      mountType: "Flange Mount",
      model: "EDF-FM-112M",
      workOrderNumber: "WO-240528",
      rpm: "960",
      motorSerialNumber: "MS-480528",
      pole: "6",
      electricMotorMake: "BBL",
      boreSize: "55",
      holdBackType: "ACW",
      remarks: "Awaiting final paint check and name plate verification.",
      accessories: {
        ...defaultAccessories,
        breatherPlug: true,
        oilLevelIndicator: true,
        namePlate: true,
        shaftProtector: true,
        adaptorCover: true,
        eyeBolt: true,
        torqueArm: true,
        motorMountingRing: true,
      },
    },
    orderCompletion: {
      mountType: "Flange Mount",
      model: "EDF-FM-112M",
      workOrderNumber: "WO-240528",
      rpm: "960",
      motorSerialNumber: "MS-480528",
      pole: "6",
      electricMotorMake: "BBL",
      inputRpm: "1440",
      actualRatio: "30",
      noiseLevelDb: "67",
      paint: "Accreylated Alkyd Gear Blue Semi Glossy",
      status: "PI",
    },
  },
};

const reportCategories: Array<{
  id: string;
  title: string;
  reports: BarcodeReportDefinition[];
}> = [
  {
    id: "order-booking",
    title: "Order Booking",
    reports: [
      { id: "branch-wise-order-booking", name: "Branch Wise Order Booking", apiKey: "branchWiseOrderBooking", formats: ["xls", "pdf"] },
      { id: "customer-wise-order-booking", name: "Customer Wise Order Booking", apiKey: "customerWiseOrderBooking", formats: ["xls", "pdf"] },
      { id: "consolidated", name: "Consolidated", apiKey: "consolidatedOrderBooking", formats: ["xls", "pdf"] },
      { id: "generate-serial-details", name: "Generate SerialNo Details", apiKey: "generateSerialNoDetails", formats: ["xls", "pdf"] },
      { id: "sono-wise-generate-serial", name: "SONO wise Generate SerialNo", apiKey: "sonoWiseGenerateSerial", formats: ["xls", "pdf"] },
      { id: "date-wise-mi-status", name: "Date Wise MI Status", apiKey: "dateWiseMiStatus", formats: ["xls", "pdf"] },
    ],
  },
  {
    id: "shortages-process",
    title: "Shortages and Process",
    reports: [
      { id: "customer-wise-shortages", name: "Customer Wise Shortages", apiKey: "customerWiseShortages", formats: ["xls", "pdf"] },
      { id: "order-under-packing", name: "Order Under Packing", apiKey: "orderUnderPacking", formats: ["xls", "pdf"] },
      { id: "order-under-painting", name: "Order Under Painting", apiKey: "orderUnderPainting", formats: ["xls", "pdf"] },
      { id: "final-inspection-report", name: "Final Inspection Report", apiKey: "finalInspectionReport", formats: ["xls", "pdf"] },
      { id: "manufacturing-plan-quantity", name: "Manufacturing Plan Quantity", apiKey: "manufacturingPlanQuantity", formats: ["xls", "pdf"] },
      { id: "name-plate-printing-details", name: "Name Plate Printing Details", apiKey: "namePlatePrintingDetails", formats: ["xls", "pdf"] },
    ],
  },
  {
    id: "dispatch-status",
    title: "Dispatch and Status",
    reports: [
      { id: "work-order", name: "Work Order", apiKey: "workOrder", formats: ["xls", "pdf"] },
      { id: "vat-402-detail-report", name: "Vat 402 Detail Report", apiKey: "vat402DetailReport", formats: ["xls", "pdf"] },
      { id: "order-status-history", name: "Order Status History", apiKey: "orderStatusHistory", formats: ["xls", "pdf"] },
      { id: "date-wise-packing", name: "Date Wise Packing", apiKey: "dateWisePacking", formats: ["xls", "pdf"] },
      { id: "delivery-id-wise-dispatched", name: "Delivery Id Wise Dispatched", apiKey: "deliveryIdWiseDispatched", formats: ["xls", "pdf"] },
      { id: "transporter-waybill-details", name: "Transporter WayBill Details", apiKey: "transporterWaybillDetails", formats: ["xls", "pdf"] },
    ],
  },
  {
    id: "inventory",
    title: "Inventory",
    reports: [
      { id: "material-issue-slip", name: "Material Issue Slip", apiKey: "materialIssueSlip", formats: ["xls", "pdf"] },
      { id: "on-hand-quantity", name: "On-Hand Quantity", apiKey: "onHandQuantity", formats: ["xls", "pdf"] },
      { id: "part-list-slip", name: "Part List Slip", apiKey: "partListSlip", formats: ["xls", "pdf"] },
      { id: "invoice-report", name: "Invoice Report", apiKey: "invoiceReport", formats: ["xls", "pdf"] },
    ],
  },
];

const importedSalesOrders = [
  {
    id: 1,
    soNumber: "SO-2026-001",
    customer: "Reliance Industries",
    date: "2026-03-15",
    amount: "INR 125000",
    status: "Imported",
  },
  {
    id: 2,
    soNumber: "SO-2026-002",
    customer: "Tata Motors",
    date: "2026-03-16",
    amount: "INR 85400",
    status: "Imported",
  },
  {
    id: 3,
    soNumber: "SO-2026-003",
    customer: "Adani Green Energy",
    date: "2026-03-18",
    amount: "INR 210000",
    status: "Imported",
  },
  {
    id: 4,
    soNumber: "SO-2026-004",
    customer: "Infosys Ltd",
    date: "2026-03-19",
    amount: "INR 45000",
    status: "Imported",
  },
  {
    id: 5,
    soNumber: "SO-2026-005",
    customer: "Larsen & Toubro",
    date: "2026-03-20",
    amount: "INR 320000",
    status: "Imported",
  },
];

export const barcodeMockData = {
  recentSalesOrders,
  importedSalesOrders,
  orderTracking,
  salesOrders,
  editSalesOrder: {
    statusOptions: [
      { value: "Hold", label: "Hold" },
      { value: "Planning", label: "Planning" },
      { value: "Sortage", label: "Sortage" },
      { value: "Actual Release", label: "Actual Release" },
      { value: "Cancel", label: "Cancel" },
    ],
    editableFields: [
      "road_permit",
      "delivery_month",
      "status",
      "shipping_instructions",
      "packing_instruction",
    ],
    lineItemDrafts: salesOrders.flatMap((salesOrder) =>
      salesOrder.line_items.map((lineItem) => ({
        order_number: salesOrder.order.order_number,
        line_no: lineItem.line_no,
        road_permit: lineItem.road_permit,
        delivery_month: lineItem.delivery_month,
        status: lineItem.status,
      }))
    ),
  },
  finalInspection: {
    lookupBySerial: gearMotorLookups,
    defaultAccessories,
  },
  orderCompletion: {
    lookupBySerial: gearMotorLookups,
    statusOptions: ["PK", "PI"],
  },
  reports: {
    downloadableFormats: ["xls", "pdf"] as const,
    categories: reportCategories,
  },
};

export const ordertrackingdata = barcodeMockData.orderTracking;

export const salesorderslineitems = {
  statusActionMap,
  salesOrders: barcodeMockData.salesOrders,
};

export const barcodeSalesOrderRows = barcodeMockData.salesOrders.map(
  (salesOrder, index) => {
    const lineStatuses = salesOrder.line_items.map((lineItem) => lineItem.status);

    let status: BarcodeSalesOrderStatus = "New Sales Order";
    if (lineStatuses.some((lineStatus) => lineStatus === "PK")) {
      status = "Dispatched";
    } else if (lineStatuses.some((lineStatus) => lineStatus === "MI")) {
      status = "Planning";
    } else if (lineStatuses.some((lineStatus) => lineStatus === "SH")) {
      status = "HOD Review";
    }

    return {
      id: index + 1,
      orderId: `SO-${salesOrder.order.order_number}`,
      customerName: salesOrder.order_information.main.customer.name,
      customerId: salesOrder.order_information.main.customer.customer_number,
      status,
      createdAt: salesOrder.order.order_date,
      orderNumber: salesOrder.order.order_number,
    };
  }
);

export const barcodeRecentSalesOrders = barcodeMockData.recentSalesOrders;
export const barcodeImportedSalesOrders = barcodeMockData.importedSalesOrders;
export const barcodeReportCategories = barcodeMockData.reports.categories;
export const barcodeGearMotorLookups = barcodeMockData.finalInspection.lookupBySerial;
export const barcodeEditSalesOrderConfig = barcodeMockData.editSalesOrder;
