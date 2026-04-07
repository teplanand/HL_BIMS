export const ordertrackingdata = [

/* ================== 🟢 ALL COMPLETED ================== */
{
  line_id: 1001,
  division: "EP",
  sub_division: "GHB",
  cust_po_no: "PO-001",
  end_cust_name: "TEST CUSTOMER A",
  branch_name: "AHMEDABAD",
  item_desc_cust_po: "Item A",
  ora_item_desc: "Completed Order",
  qty: 5,
  uom: "NOS",
  po_value: 1000,

  cust_po_date: "2024-01-01",
  cust_po_tech_clear_date: "2024-01-02",
  delivery_date_po: "2024-02-01",
 
  delivery_days_frm_po_date: 30,

  ga_dim_no: "GA-001",
  ga_dim_drw_submission_design_plan: "2024-01-03",
  ga_dim_drw_submission_design_actual: "2024-01-02",
  final_drg_approval_received_date_plan: "2024-01-05",
  final_drg_approval_received_date_actual: "2024-01-04",

  po_received_date_to_ga_drw_submission_days: 5,
  ga_drawing_submission_to_final_approval_received_days: 3,
  days_in_drawing_approval: 2,
  perc_time_taken_of_total_po_delivery: 80,

  work_order_no: "WO-1",
  work_order_date: "2024-01-06",
  commited_ex_works_delivery_date: "2024-02-05",

  amp_plan: "2024-01-07",
  amp_actual: "2024-01-08",

  bom_plan: "2024-01-09",
  bom_actual: "2024-01-8",

  gear_case_plan: "2024-01-11",
  gearcase_actual: "2024-01-12",

  internal_plan: "2024-01-13",
  internal_actual: "2024-01-14",

  bo_plan: "2024-01-15",
  bo_actual: "2024-01-16",

  assembly_plan: "2024-01-17",
  assembly_actual: "2024-01-18",

  testing_plan: "2024-01-19",
  testing_actual: "2024-01-20",

  dispatch_date_plan: "2024-01-21",
  dispatch_date_actual: "2024-01-22",

  on_time_delivery: true,
  remarks: "Completed",

  id: 1,
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
  DoAudit: false
},

/* ================== 🔴 IN PROGRESS ================== */
{
  line_id: 1002,
  division: "EP",
  sub_division: "GHB",
  cust_po_no: "PO-002",
  end_cust_name: "TEST CUSTOMER B",
  branch_name: "SURAT",
  item_desc_cust_po: "Item B",
  ora_item_desc: "In Progress Order",
  qty: 3,
  uom: "NOS",
  po_value: 500,

  cust_po_date: "2024-02-01",
  cust_po_tech_clear_date: "2024-02-02",
  delivery_date_po: "2024-03-01",
  delivery_days_frm_po_date: null,

  ga_dim_no: "GA-002",
  ga_dim_drw_submission_design_plan: "2024-02-03",
  ga_dim_drw_submission_design_actual: null,
  final_drg_approval_received_date_plan: "2024-02-05",
  final_drg_approval_received_date_actual: "2024-02-06",

  po_received_date_to_ga_drw_submission_days: 6,
  ga_drawing_submission_to_final_approval_received_days: 2,
  days_in_drawing_approval: 0,
  perc_time_taken_of_total_po_delivery: 40,

  work_order_no: "WO-2",
  work_order_date: "2024-02-06",
  commited_ex_works_delivery_date: "2024-03-05",

  amp_plan: "2024-02-07",
  amp_actual: null,

  bom_plan: "",
  bom_actual: null,

  gear_case_plan: "2024-02-11",
  gearcase_actual: null,

  internal_plan: "2024-02-13",
  internal_actual: null,

  bo_plan: "2024-02-15",
  bo_actual: null,

  assembly_plan: "2024-02-17",
  assembly_actual: null,

  testing_plan: "2024-02-19",
  testing_actual: null,

  dispatch_date_plan: "2024-02-21",
  dispatch_date_actual: null,

  on_time_delivery: null,
  remarks: "Running",

  id: 2,
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
  DoAudit: false
},

/* ================== ⚪ NOT STARTED ================== */
{
  line_id: 1003,
  division: "EP",
  sub_division: "GHB",
  cust_po_no: "PO-003",
  end_cust_name: "TEST CUSTOMER C",
  branch_name: "RAJKOT",
  item_desc_cust_po: "Item C",
  ora_item_desc: "Not Started",
  qty: 2,
  uom: "NOS",
  po_value: 200,

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

  id: 3,
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
  DoAudit: false
},

/* ================== 🔁 MIXED ================== */
{
  line_id: 1004,
  division: "EP",
  sub_division: "GHB",
  cust_po_no: "PO-004",
  end_cust_name: "TEST CUSTOMER D",
  branch_name: "VADODARA",
  item_desc_cust_po: "Item D",
  ora_item_desc: "Mixed Status",
  qty: 10,
  uom: "NOS",
  po_value: 1500,

  cust_po_date: "2024-03-01",
  cust_po_tech_clear_date: null,
  delivery_date_po: null,
  delivery_days_frm_po_date: null,

  ga_dim_no: "GA-004",
  ga_dim_drw_submission_design_plan: "2024-03-03",
  ga_dim_drw_submission_design_actual: "2024-03-04",
  final_drg_approval_received_date_plan: "2024-03-05",
  final_drg_approval_received_date_actual: "2024-03-04",

  po_received_date_to_ga_drw_submission_days: 5,
  ga_drawing_submission_to_final_approval_received_days: 3,
  days_in_drawing_approval: 2,
  perc_time_taken_of_total_po_delivery: 50,

  work_order_no: "WO-4",
  work_order_date: "2024-03-06",
  commited_ex_works_delivery_date: "2024-04-05",

  amp_plan: "2024-03-07",
  amp_actual: null,

  bom_plan: "2024-03-09",
  bom_actual: "2024-03-10",

  gear_case_plan: "2024-03-11",
  gearcase_actual: null,

  internal_plan: null,
  internal_actual: null,

  bo_plan: null,
  bo_actual: null,

  assembly_plan: null,
  assembly_actual: null,

  testing_plan: "2024-03-19",
  testing_actual: "2024-03-20",

  dispatch_date_plan: "2024-03-25",
  dispatch_date_actual: null,

  on_time_delivery: null,
  remarks: "Mixed",

  id: 4,
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
  DoAudit: false
}

];