type OrderTrackingMockVariant =
  | "completed"
  | "inProgress"
  | "notStarted"
  | "mixed"
  | "designDelayed";

const COMMON_META = {
  created_date: "2026-01-01",
  created_by: null,
  updated_date: null,
  updated_by: null,
  is_deleted: false,
  deleted_date: null,
  deleted_by: null,
  is_active: true,
  IsAudit: false,
  DoLog: false,
  DoAudit: false,
};

const BRANCHES = [
  "AHMEDABAD",
  "SURAT",
  "RAJKOT",
  "VADODARA",
  "BHAVNAGAR",
  "JAMNAGAR",
  "GANDHIDHAM",
  "ANKLESHWAR",
  "MORBI",
  "MEHSANA",
] as const;

const SUB_DIVISIONS = ["GHB", "MMD", "HSD", "PWD"] as const;
const VARIANTS: OrderTrackingMockVariant[] = [
  "completed",
  "inProgress",
  "notStarted",
  "mixed",
  "designDelayed",
];

const pad = (value: number) => String(value).padStart(2, "0");
const dateValue = (month: number, day: number) => `2024-${pad(month)}-${pad(day)}`;

const getBaseOrder = (id: number) => {
  const month = ((id - 1) % 9) + 1;
  const day = ((id - 1) % 5) + 1;
  const branch = BRANCHES[(id - 1) % BRANCHES.length];
  const division = id % 2 === 0 ? "CP" : "EP";
  const subDivision = SUB_DIVISIONS[(id - 1) % SUB_DIVISIONS.length];

  return {
    id,
    line_id: 1000 + id,
    division,
    sub_division: subDivision,
    cust_po_no: `PO-${pad(id)}`,
    end_cust_name: `TEST CUSTOMER ${String.fromCharCode(64 + ((id - 1) % 26) + 1)}${id > 26 ? ` ${id}` : ""}`,
    branch_name: branch,
    item_desc_cust_po: `Item ${id}`,
    ora_item_desc: `Order Tracking Mock ${id}`,
    qty: ((id - 1) % 12) + 1,
    uom: "NOS",
    po_value: 500 + id * 125,
    cust_po_date: dateValue(month, day),
    cust_po_tech_clear_date: dateValue(month, day + 1),
    delivery_date_po: dateValue(month, day + 20),
    delivery_days_frm_po_date: 20,
    ga_dim_no: `GA-${pad(id)}`,
    work_order_no: `WO-${id}`,
    work_order_date: dateValue(month, day + 6),
    commited_ex_works_delivery_date: dateValue(month, day + 24),
    remarks: "",
    ...COMMON_META,
  };
};

const buildCompletedRecord = (id: number) => {
  const base = getBaseOrder(id);
  const month = ((id - 1) % 9) + 1;
  const day = ((id - 1) % 5) + 1;

  return {
    ...base,
    ora_item_desc: `Completed Order ${id}`,
    ga_dim_drw_submission_design_plan: dateValue(month, day + 2),
    ga_dim_drw_submission_design_actual: dateValue(month, day + 1),
    final_drg_approval_received_date_plan: dateValue(month, day + 4),
    final_drg_approval_received_date_actual: dateValue(month, day + 3),
    po_received_date_to_ga_drw_submission_days: 5,
    ga_drawing_submission_to_final_approval_received_days: 3,
    days_in_drawing_approval: 3,
    perc_time_taken_of_total_po_delivery: 35,
    amp_plan: dateValue(month, day + 7),
    amp_actual: dateValue(month, day + 7),
    bom_plan: dateValue(month, day + 8),
    bom_actual: dateValue(month, day + 8),
    gear_case_plan: dateValue(month, day + 10),
    gearcase_actual: dateValue(month, day + 10),
    internal_plan: dateValue(month, day + 12),
    internal_actual: dateValue(month, day + 12),
    bo_plan: dateValue(month, day + 14),
    bo_actual: dateValue(month, day + 14),
    assembly_plan: dateValue(month, day + 16),
    assembly_actual: dateValue(month, day + 16),
    testing_plan: dateValue(month, day + 18),
    testing_actual: dateValue(month, day + 18),
    dispatch_date_plan: dateValue(month, day + 19),
    dispatch_date_actual: dateValue(month, day + 19),
    on_time_delivery: 100,
    remarks: "Completed on time",
  };
};

const buildInProgressRecord = (id: number) => {
  const base = getBaseOrder(id);
  const month = ((id - 1) % 9) + 1;
  const day = ((id - 1) % 5) + 1;

  return {
    ...base,
    ora_item_desc: `In Progress Order ${id}`,
    ga_dim_drw_submission_design_plan: dateValue(month, day + 2),
    ga_dim_drw_submission_design_actual: null,
    final_drg_approval_received_date_plan: dateValue(month, day + 4),
    final_drg_approval_received_date_actual: null,
    po_received_date_to_ga_drw_submission_days: 4,
    ga_drawing_submission_to_final_approval_received_days: 0,
    days_in_drawing_approval: null,
    perc_time_taken_of_total_po_delivery: 20,
    amp_plan: dateValue(month, day + 7),
    amp_actual: null,
    bom_plan: dateValue(month, day + 8),
    bom_actual: null,
    gear_case_plan: dateValue(month, day + 10),
    gearcase_actual: null,
    internal_plan: dateValue(month, day + 12),
    internal_actual: null,
    bo_plan: dateValue(month, day + 14),
    bo_actual: null,
    assembly_plan: dateValue(month, day + 16),
    assembly_actual: null,
    testing_plan: dateValue(month, day + 18),
    testing_actual: null,
    dispatch_date_plan: dateValue(month, day + 19),
    dispatch_date_actual: null,
    on_time_delivery: null,
    remarks: "Running in progress",
  };
};

const buildNotStartedRecord = (id: number) => ({
  ...getBaseOrder(id),
  ora_item_desc: `Not Started Order ${id}`,
  cust_po_date: null,
  cust_po_tech_clear_date: null,
  delivery_date_po: null,
  delivery_days_frm_po_date: null,
  ga_dim_no: null,
  ga_dim_drw_submission_design_plan: null,
  ga_dim_drw_submission_design_actual: null,
  final_drg_approval_received_date_plan: null,
  final_drg_approval_received_date_actual: null,
  po_received_date_to_ga_drw_submission_days: null,
  ga_drawing_submission_to_final_approval_received_days: null,
  days_in_drawing_approval: null,
  perc_time_taken_of_total_po_delivery: null,
  work_order_no: null,
  work_order_date: null,
  commited_ex_works_delivery_date: null,
  amp_plan: null,
  amp_actual: null,
  bom_plan: null,
  bom_actual: null,
  gear_case_plan: null,
  gearcase_actual: null,
  internal_plan: null,
  internal_actual: null,
  bo_plan: null,
  bo_actual: null,
  assembly_plan: null,
  assembly_actual: null,
  testing_plan: null,
  testing_actual: null,
  dispatch_date_plan: null,
  dispatch_date_actual: null,
  on_time_delivery: null,
  remarks: "Not started",
});

const buildMixedRecord = (id: number) => {
  const base = getBaseOrder(id);
  const month = ((id - 1) % 9) + 1;
  const day = ((id - 1) % 5) + 1;

  return {
    ...base,
    ora_item_desc: `Mixed Status Order ${id}`,
    ga_dim_drw_submission_design_plan: dateValue(month, day + 2),
    ga_dim_drw_submission_design_actual: dateValue(month, day + 3),
    final_drg_approval_received_date_plan: dateValue(month, day + 4),
    final_drg_approval_received_date_actual: dateValue(month, day + 4),
    po_received_date_to_ga_drw_submission_days: 5,
    ga_drawing_submission_to_final_approval_received_days: 4,
    days_in_drawing_approval: 4,
    perc_time_taken_of_total_po_delivery: 48,
    amp_plan: dateValue(month, day + 7),
    amp_actual: null,
    bom_plan: dateValue(month, day + 8),
    bom_actual: dateValue(month, day + 9),
    gear_case_plan: dateValue(month, day + 10),
    gearcase_actual: null,
    internal_plan: null,
    internal_actual: null,
    bo_plan: null,
    bo_actual: null,
    assembly_plan: dateValue(month, day + 16),
    assembly_actual: null,
    testing_plan: dateValue(month, day + 18),
    testing_actual: dateValue(month, day + 19),
    dispatch_date_plan: dateValue(month, day + 20),
    dispatch_date_actual: null,
    on_time_delivery: null,
    remarks: "Mixed progress",
  };
};

const buildDesignDelayedRecord = (id: number) => {
  const base = getBaseOrder(id);
  const month = ((id - 1) % 9) + 1;
  const day = ((id - 1) % 5) + 1;

  return {
    ...base,
    ora_item_desc: `Design Delayed Order ${id}`,
    ga_dim_drw_submission_design_plan: dateValue(month, day + 2),
    ga_dim_drw_submission_design_actual: dateValue(month, day + 2),
    final_drg_approval_received_date_plan: dateValue(month, day + 4),
    final_drg_approval_received_date_actual: dateValue(month, day + 5),
    po_received_date_to_ga_drw_submission_days: 5,
    ga_drawing_submission_to_final_approval_received_days: 7,
    days_in_drawing_approval: 7,
    perc_time_taken_of_total_po_delivery: 62,
    amp_plan: dateValue(month, day + 7),
    amp_actual: dateValue(month, day + 8),
    bom_plan: dateValue(month, day + 8),
    bom_actual: dateValue(month, day + 10),
    gear_case_plan: dateValue(month, day + 10),
    gearcase_actual: dateValue(month, day + 12),
    internal_plan: dateValue(month, day + 12),
    internal_actual: dateValue(month, day + 14),
    bo_plan: dateValue(month, day + 14),
    bo_actual: dateValue(month, day + 16),
    assembly_plan: dateValue(month, day + 16),
    assembly_actual: dateValue(month, day + 18),
    testing_plan: dateValue(month, day + 18),
    testing_actual: dateValue(month, day + 20),
    dispatch_date_plan: dateValue(month, day + 19),
    dispatch_date_actual: dateValue(month, day + 22),
    on_time_delivery: 0,
    remarks: "Completed with design delay",
  };
};

const buildRecord = (id: number, variant: OrderTrackingMockVariant) => {
  switch (variant) {
    case "completed":
      return buildCompletedRecord(id);
    case "inProgress":
      return buildInProgressRecord(id);
    case "notStarted":
      return buildNotStartedRecord(id);
    case "mixed":
      return buildMixedRecord(id);
    case "designDelayed":
      return buildDesignDelayedRecord(id);
  }
};

export const ordertrackingdata = Array.from({ length: 500 }, (_, index) =>
  buildRecord(index + 1, VARIANTS[index % VARIANTS.length])
);
