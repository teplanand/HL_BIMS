type OrderTrackingMockVariant =
  | "notStarted"
  | "designComplete"
  | "mfgComplete"
  | "assemblyComplete"
  | "testingComplete"
  | "dispatchComplete"
  | "dispatchDelayed";

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
  "notStarted",
  "designComplete",
  "mfgComplete",
  "assemblyComplete",
  "testingComplete",
  "dispatchComplete",
  "dispatchDelayed",
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
    delivery_date_po: dateValue(month, day + 28),
    delivery_days_frm_po_date: 28,
    ga_dim_no: `GA-${pad(id)}`,
    work_order_no: `WO-${id}`,
    work_order_date: dateValue(month, day + 6),
    commited_ex_works_delivery_date: dateValue(month, day + 30),
    remarks: "",
    ...COMMON_META,
  };
};

const getEmptyStages = () => ({
  ga_dim_drw_submission_design_plan: null,
  ga_dim_drw_submission_design_actual: null,
  final_drg_approval_received_date_plan: null,
  final_drg_approval_received_date_actual: null,
  po_received_date_to_ga_drw_submission_days: null,
  ga_drawing_submission_to_final_approval_received_days: null,
  days_in_drawing_approval: null,
  perc_time_taken_of_total_po_delivery: null,
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
});

const buildStageProgressRecord = (
  id: number,
  variant: Exclude<OrderTrackingMockVariant, "notStarted">
) => {
  const base = getBaseOrder(id);
  const month = ((id - 1) % 9) + 1;
  const day = ((id - 1) % 5) + 1;

  const isDispatchDelayed = variant === "dispatchDelayed";
  const reachedDesign = true;
  const reachedMfg = [
    "mfgComplete",
    "assemblyComplete",
    "testingComplete",
    "dispatchComplete",
    "dispatchDelayed",
  ].includes(variant);
  const reachedAssembly = [
    "assemblyComplete",
    "testingComplete",
    "dispatchComplete",
    "dispatchDelayed",
  ].includes(variant);
  const reachedTesting = [
    "testingComplete",
    "dispatchComplete",
    "dispatchDelayed",
  ].includes(variant);
  const reachedDispatch = ["dispatchComplete", "dispatchDelayed"].includes(variant);

  return {
    ...base,
    ora_item_desc: `Stage ${variant} Order ${id}`,
    ...getEmptyStages(),
    ga_dim_drw_submission_design_plan: dateValue(month, day + 2),
    ga_dim_drw_submission_design_actual: reachedDesign ? dateValue(month, day + 2) : null,
    final_drg_approval_received_date_plan: dateValue(month, day + 4),
    final_drg_approval_received_date_actual: reachedDesign
      ? dateValue(month, isDispatchDelayed ? day + 5 : day + 4)
      : null,
    po_received_date_to_ga_drw_submission_days: reachedDesign ? 5 : null,
    ga_drawing_submission_to_final_approval_received_days: reachedDesign
      ? isDispatchDelayed
        ? 6
        : 4
      : null,
    days_in_drawing_approval: reachedDesign
      ? isDispatchDelayed
        ? 6
        : 4
      : null,
    perc_time_taken_of_total_po_delivery: reachedDispatch ? (isDispatchDelayed ? 78 : 64) : 36,
    amp_plan: dateValue(month, day + 7),
    amp_actual: reachedMfg ? dateValue(month, day + 7) : null,
    bom_plan: dateValue(month, day + 8),
    bom_actual: reachedDesign ? dateValue(month, isDispatchDelayed ? day + 9 : day + 8) : null,
    gear_case_plan: dateValue(month, day + 10),
    gearcase_actual: reachedMfg ? dateValue(month, isDispatchDelayed ? day + 11 : day + 10) : null,
    internal_plan: dateValue(month, day + 12),
    internal_actual: reachedMfg ? dateValue(month, isDispatchDelayed ? day + 13 : day + 12) : null,
    bo_plan: dateValue(month, day + 14),
    bo_actual: reachedMfg ? dateValue(month, isDispatchDelayed ? day + 15 : day + 14) : null,
    assembly_plan: dateValue(month, day + 17),
    assembly_actual: reachedAssembly ? dateValue(month, isDispatchDelayed ? day + 18 : day + 17) : null,
    testing_plan: dateValue(month, day + 20),
    testing_actual: reachedTesting ? dateValue(month, isDispatchDelayed ? day + 21 : day + 20) : null,
    dispatch_date_plan: dateValue(month, day + 23),
    dispatch_date_actual: reachedDispatch
      ? dateValue(month, isDispatchDelayed ? day + 26 : day + 23)
      : null,
    on_time_delivery: reachedDispatch ? (isDispatchDelayed ? 0 : 100) : null,
    remarks: {
      designComplete: "Design stage completed",
      mfgComplete: "Design and manufacturing completed",
      assemblyComplete: "Assembly stage completed",
      testingComplete: "Testing stage completed",
      dispatchComplete: "Dispatch completed on time",
      dispatchDelayed: "Dispatch completed with delay",
    }[variant],
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
  work_order_no: null,
  work_order_date: null,
  commited_ex_works_delivery_date: null,
  ...getEmptyStages(),
  remarks: "",
});

const buildRecord = (id: number, variant: OrderTrackingMockVariant) => {
  switch (variant) {
    case "notStarted":
      return buildNotStartedRecord(id);
    case "designComplete":
    case "mfgComplete":
    case "assemblyComplete":
    case "testingComplete":
    case "dispatchComplete":
    case "dispatchDelayed":
      return buildStageProgressRecord(id, variant);
  }
};

export const ordertrackingdata = Array.from({ length: 500 }, (_, index) =>
  buildRecord(index + 1, VARIANTS[index % VARIANTS.length])
);
