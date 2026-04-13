import React, { useCallback, useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { Box, Button, ButtonBase, Card, CardContent, Grid, Tooltip, Typography } from "@mui/material";
import {
  GridColDef,
  GridFilterInputValueProps,
  GridFilterModel,
  getGridDateOperators,
  GridFilterOperator,
  GridPaginationModel,
  GridRenderCellParams,
  GridSortModel,
} from "@mui/x-data-grid";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { Dayjs } from "dayjs";

import ApiActionButton from "../../components/common/ApiActionButton";
import ReusableDataGrid from "../../components/common/ReusableDataGrid";
import { useModal } from "../../hooks/useModal";
import { useGetOrdersMutation } from "../../redux/api/ordertracking";
import OpenEditPlanModal from "./Dashboard/components/AddEditPlan";
import { ViewDetails, ViewDetailsRef } from "./Dashboard/components/viewdetails";
import { OrderTrackingTimelineContent } from "./timeline";
import { formatDateOnly } from "../../utils/FormatDate";
import { ordertrackingdata } from "./Dashboard/data";

////// filter by number

const ORDER_TRACKING_COLORS = {
  slate: "#64748b",
  warning: "#f59e0b",
  success: "#10b981",
  danger: "#ef4444",
  statusSuccess: "#22C55E",
  statusDanger: "#EF4444",
  statusInfo: "#2563EB",
  statusMuted: "#9CA3AF",
} as const;

const STATUS_COLORS = {
  "Not Started": ORDER_TRACKING_COLORS.statusMuted,
  "In Progress": ORDER_TRACKING_COLORS.statusInfo,
  "Completed": ORDER_TRACKING_COLORS.statusSuccess,
} as const;

const SUMMARY_STATUS_COLORS = {
  "Completed On Time": ORDER_TRACKING_COLORS.statusSuccess,
  "Completed Delayed": ORDER_TRACKING_COLORS.statusDanger,
  "In Progress": ORDER_TRACKING_COLORS.statusInfo,
  "Not Started": ORDER_TRACKING_COLORS.statusMuted,
} as const;

const STAGE_ACCENT_COLORS = {
  Design: ORDER_TRACKING_COLORS.slate,
  Manufacturing: ORDER_TRACKING_COLORS.warning,
  Assembly: ORDER_TRACKING_COLORS.success,
  Testing: ORDER_TRACKING_COLORS.danger,
  Dispatch: ORDER_TRACKING_COLORS.success,
} as const;

const withAlpha = (hexColor: string, alpha: string) => `${hexColor}${alpha}`;

const ORDER_TRACKING_TOOLTIP_PROPS = {
  arrow: true,
  slotProps: {
    tooltip: {
      className:
        "!rounded-md !border !border-gray-200 !bg-white !px-2.5 !py-1.5 !text-xs !font-medium !text-gray-800 shadow-sm dark:!border-gray-700 dark:!bg-gray-900 dark:!text-white/90",
    },
    arrow: {
      className: "!text-white dark:!text-gray-900",
    },
  },
} as const;

const summaryCardClassMap: Record<
  string,
  { card: string; active: string; value: string; numberColor: string }
> = {
  Design: {
    card: "dashboard-stat-card dashboard-stat-card--requested",
    active: "dashboard-stat-card--requested-active",
    value: "dashboard-stat-value--requested",
    numberColor: STAGE_ACCENT_COLORS.Design,
  },
  Manufacturing: {
    card: "dashboard-stat-card dashboard-stat-card--pending",
    active: "dashboard-stat-card--pending-active",
    value: "dashboard-stat-value--pending",
    numberColor: STAGE_ACCENT_COLORS.Manufacturing,
  },
  Assembly: {
    card: "dashboard-stat-card dashboard-stat-card--approved",
    active: "dashboard-stat-card--approved-active",
    value: "dashboard-stat-value--approved",
    numberColor: STAGE_ACCENT_COLORS.Assembly,
  },
  Testing: {
    card: "dashboard-stat-card dashboard-stat-card--rejected",
    active: "dashboard-stat-card--rejected-active",
    value: "dashboard-stat-value--rejected",
    numberColor: STAGE_ACCENT_COLORS.Testing,
  },
  Dispatch: {
    card: "dashboard-stat-card dashboard-stat-card--approved",
    active: "dashboard-stat-card--approved-active",
    value: "dashboard-stat-value--approved",
    numberColor: STAGE_ACCENT_COLORS.Dispatch,
  },
};

const processStageColumns = [
  { field: "design", headerName: "Design", width: 86, minWidth: 86 },
  { field: "manufacturing", headerName: "Mfg", width: 86, minWidth: 86 },
  { field: "assembly", headerName: "Assembly", width: 96, minWidth: 96 },
  { field: "testing", headerName: "Testing", width: 88, minWidth: 88 },
  { field: "dispatch", headerName: "Dispatch", width: 92, minWidth: 92 },
] as const;

const planDateColumns = [
  { field: "amp_actual", headerName: "AMP Dt", width: 98, minWidth: 98 },
  { field: "bom_actual", headerName: "BOM Dt", width: 98, minWidth: 98 },
  { field: "gearcase_actual", headerName: "Gearcase Dt", width: 108, minWidth: 108 },
  { field: "internal_actual", headerName: "Internal Dt", width: 98, minWidth: 98 },
  { field: "bo_actual", headerName: "BO Dt", width: 88, minWidth: 88 },
  { field: "assembly_actual", headerName: "Assembly Dt", width: 108, minWidth: 108 },
  { field: "testing_actual", headerName: "Testing Dt", width: 98, minWidth: 98 },
  { field: "dispatch_date_actual", headerName: "Dispatch Dt", width: 110, minWidth: 110, filterable: true },
] as const;

const actualToPlanFieldMap: Record<string, string> = {
  amp_actual: "amp_plan",
  bom_actual: "bom_plan",
  gearcase_actual: "gear_case_plan",
  internal_actual: "internal_plan",
  bo_actual: "bo_plan",
  assembly_actual: "assembly_plan",
  testing_actual: "testing_plan",
  dispatch_date_actual: "dispatch_date_plan",
};

const summaryCardKeys: Record<(typeof processStageColumns)[number]["field"], string> = {
  design: "Design",
  manufacturing: "Manufacturing",
  assembly: "Assembly",
  testing: "Testing",
  dispatch: "Dispatch",
};

const summaryStatuses = [
  { key: "Completed On Time", color: SUMMARY_STATUS_COLORS["Completed On Time"], tooltip: "Completed" },
  { key: "Completed Delayed", color: SUMMARY_STATUS_COLORS["Completed Delayed"], tooltip: "Completed" },
  { key: "In Progress", color: SUMMARY_STATUS_COLORS["In Progress"], tooltip: "In Progress" },
  { key: "Not Started", color: SUMMARY_STATUS_COLORS["Not Started"], tooltip: "Not Started" },
] as const;

type SummaryStatusKey = (typeof summaryStatuses)[number]["key"];
type ProcessStageField = (typeof processStageColumns)[number]["field"];
type DateFilterInputProps = GridFilterInputValueProps;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

const OrderTrackingDateFilterInput = React.memo((props: DateFilterInputProps) => {
  const { item, applyValue, focusElementRef, disabled, slotProps } = props;
  const parsedValue = typeof item.value === "string" && item.value
    ? dayjs(item.value)
    : null;

  return (
    <DatePicker
      value={parsedValue && parsedValue.isValid() ? parsedValue : null}
      format="DD/MM/YYYY"
      disabled={disabled}
      onChange={(newValue: Dayjs | null) => {
        applyValue({
          ...item,
          value: newValue && newValue.isValid() ? newValue.format("YYYY-MM-DD") : "",
        });
      }}
      slotProps={{
        textField: {
          size: "small",
          inputRef: focusElementRef,
          placeholder: "dd/mm/yyyy",
          sx: {
            width: 160,
            ...(slotProps?.root ?? {}),
          },
        },
      }}
    />
  );
});

const orderTrackingDateFilterOperators: GridFilterOperator[] = getGridDateOperators(false).map((operator) => ({
  ...operator,
  InputComponent: OrderTrackingDateFilterInput,
}));

const getGridDateValue = (row: Record<string, unknown>, field: string) => {
  const rawValue = row?.[field];

  if (!rawValue) {
    return null;
  }

  const parsedDate = new Date(String(rawValue));
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};


const isNull = (val: any) => val === null || val === undefined;

const getStageStatus = (plan: any, actual: any) => {
  if (isNull(plan) && isNull(actual)) return "Not Started";
  if (!isNull(plan) && isNull(actual)) return "In Progress";
  if (!isNull(plan) && !isNull(actual)) return "Completed";
  return "Not Started";
};

const getDateOnlyTimestamp = (value: unknown) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return Date.UTC(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
};

const getAbsoluteDateDiffInDays = (start: unknown, end: unknown) => {
  const startTimestamp = getDateOnlyTimestamp(start);
  const endTimestamp = getDateOnlyTimestamp(end);

  if (startTimestamp === null || endTimestamp === null) {
    return null;
  }

  return Math.abs((endTimestamp - startTimestamp) / DAY_IN_MS);
};

const getFinalApprovalTimePercent = (row: Record<string, unknown>) => {
  const deliveryDaysFromPoDate = getAbsoluteDateDiffInDays(
    row.cust_po_date,
    row.delivery_date_po
  );
  const daysInDrawingApproval = getAbsoluteDateDiffInDays(
    row.cust_po_date,
    row.final_drg_approval_received_date_actual
  );

  return deliveryDaysFromPoDate && daysInDrawingApproval !== null
    ? (daysInDrawingApproval / deliveryDaysFromPoDate) * 100
    : null;
};

const getDesignCycleStatus = (value1: unknown, value2: unknown) => {
  const first = Number(value1);
  const second = Number(value2);
  const hasFirstProgress = !Number.isNaN(first) && first > 0;
  const hasSecondProgress = !Number.isNaN(second) && second > 0;

  if (!hasFirstProgress && !hasSecondProgress) {
    return "Not Started";
  }

  if (hasFirstProgress && !hasSecondProgress) {
    return "In Progress";
  }

  return "Completed";
};

const getDesignCycleColor = (value1: unknown, value2: unknown) => {
  const status = getDesignCycleStatus(value1, value2);

  if (status !== "Completed") {
    return statusColorMap[status] || STATUS_COLORS["Not Started"];
  }

  const first = Number(value1);
  const second = Number(value2);

  if (!Number.isNaN(first) && !Number.isNaN(second) && second > first) {
    return SUMMARY_STATUS_COLORS["Completed Delayed"];
  }

  return STATUS_COLORS.Completed;
};

const getCompletedColor = (plan: any, actual: any) => {
  if (isNull(plan) && isNull(actual)) return STATUS_COLORS["Not Started"];
  if (!isNull(plan) && isNull(actual)) return STATUS_COLORS["In Progress"];
  if (isNull(plan) && !isNull(actual)) return STATUS_COLORS.Completed;

  const planDate = new Date(String(plan));
  const actualDate = new Date(String(actual));

  if (!Number.isNaN(planDate.getTime()) && !Number.isNaN(actualDate.getTime())) {
    return planDate.getTime() >= actualDate.getTime()
      ? STATUS_COLORS.Completed
      : SUMMARY_STATUS_COLORS["Completed Delayed"];
  }

  const planNumber = Number(plan);
  const actualNumber = Number(actual);

  if (!Number.isNaN(planNumber) && !Number.isNaN(actualNumber)) {
    return planNumber >= actualNumber
      ? STATUS_COLORS.Completed
      : SUMMARY_STATUS_COLORS["Completed Delayed"];
  }

  return STATUS_COLORS.Completed;
};

const getPlanActualDisplayColor = (plan: any, actual: any) => {
  if (isNull(plan) && isNull(actual)) return STATUS_COLORS["Not Started"];
  if (isNull(plan) !== isNull(actual)) return STATUS_COLORS["Not Started"];

  const planDate = new Date(String(plan));
  const actualDate = new Date(String(actual));

  if (!Number.isNaN(planDate.getTime()) && !Number.isNaN(actualDate.getTime())) {
    return planDate.getTime() >= actualDate.getTime()
      ? STATUS_COLORS.Completed
      : SUMMARY_STATUS_COLORS["Completed Delayed"];
  }

  const planNumber = Number(plan);
  const actualNumber = Number(actual);

  if (!Number.isNaN(planNumber) && !Number.isNaN(actualNumber)) {
    return planNumber >= actualNumber
      ? STATUS_COLORS.Completed
      : SUMMARY_STATUS_COLORS["Completed Delayed"];
  }

  return STATUS_COLORS["In Progress"];
};

const getSummaryStatusKey = (field: string, row: Record<string, any>) => {
  const status = String(row[field] ?? "Not Started");

  if (status !== "Completed") {
    return status;
  }

  return getProcessStatusColor(field, row) === SUMMARY_STATUS_COLORS["Completed Delayed"]
    ? "Completed Delayed"
    : "Completed On Time";
};
const statusColorMap: Record<string, string> = STATUS_COLORS;

const getAggregateCompletedColor = (
  checks: Array<[any, any]>,
  fallbackStatus: string
) => {
  const completedColors = checks
    .filter(([plan, actual]) => getStageStatus(plan, actual) === "Completed")
    .map(([plan, actual]) => getCompletedColor(plan, actual));

  if (completedColors.length === 0) {
    return statusColorMap[fallbackStatus] || STATUS_COLORS["Not Started"];
  }

  return completedColors.some((color) => color === SUMMARY_STATUS_COLORS["Completed Delayed"])
    ? SUMMARY_STATUS_COLORS["Completed Delayed"]
    : STATUS_COLORS.Completed;
};

const getDesignProcessColor = (row: Record<string, any>) => {
  const gaDrawingColor = getCompletedColor(
    row.ga_dim_drw_submission_design_plan,
    row.ga_dim_drw_submission_design_actual
  );
  const finalApprovalColor = getCompletedColor(
    row.final_drg_approval_received_date_plan,
    row.final_drg_approval_received_date_actual
  );
  const bomColor = getCompletedColor(row.bom_plan, row.bom_actual);
  const designCycleColor = getDesignCycleColor(
    row.po_received_date_to_ga_drw_submission_days,
    row.ga_drawing_submission_to_final_approval_received_days
  );
  const colors = [gaDrawingColor, finalApprovalColor, bomColor, designCycleColor];

  if (colors.includes(SUMMARY_STATUS_COLORS["Completed Delayed"])) {
    return SUMMARY_STATUS_COLORS["Completed Delayed"];
  }

  if (colors.includes(STATUS_COLORS["In Progress"])) {
    return STATUS_COLORS["In Progress"];
  }

  if (colors.every((color) => color === STATUS_COLORS["Not Started"])) {
    return STATUS_COLORS["Not Started"];
  }

  return STATUS_COLORS.Completed;
};

const getProcessStatusColor = (field: string, row: Record<string, any>) => {
  switch (field) {
    case "design":
      return getDesignProcessColor(row);
    case "manufacturing":
    case "assembly":
      return getAggregateCompletedColor(
        [
          [row.gear_case_plan, row.gearcase_actual],
          [row.internal_plan, row.internal_actual],
          [row.bo_plan, row.bo_actual],
          [row.assembly_plan, row.assembly_actual],
        ],
        String(row[field] ?? "Not Started")
      );
    case "testing":
      return getCompletedColor(row.testing_plan, row.testing_actual);
    case "dispatch":
      return getCompletedColor(row.dispatch_date_plan, row.dispatch_date_actual);
    default:
      return statusColorMap[String(row[field] ?? "Not Started")] || STATUS_COLORS["Not Started"];
  }
};

const getDesignStatus = (row: any) => {
  const designStepStatuses = [
    getStageStatus(
      row.ga_dim_drw_submission_design_plan,
      row.ga_dim_drw_submission_design_actual
    ),
    getStageStatus(
      row.final_drg_approval_received_date_plan,
      row.final_drg_approval_received_date_actual
    ),
    getStageStatus(row.bom_plan, row.bom_actual),
    getDesignCycleStatus(
      row.po_received_date_to_ga_drw_submission_days,
      row.ga_drawing_submission_to_final_approval_received_days
    ),
  ];

  if (designStepStatuses.every((status) => status === "Not Started")) {
    return "Not Started";
  }

  if (designStepStatuses.every((status) => status === "Completed")) {
    return "Completed";
  }

  return "In Progress";
};

const getSalesStatus = (row: any) => {
  return getStageStatus(
    row.delivery_date_po,
    row.delivery_days_frm_po_date
  );
};

const getDispatchStatus = (row: any) => {
  return getStageStatus(
    row.dispatch_date_plan,
    row.dispatch_date_actual
  );
};

const getQCStatus = (row: any) => {
  return getStageStatus(
    row.testing_plan,
    row.testing_actual
  );
};

const getPlanningStatus = (row: any) => {
  return getStageStatus(
    row.amp_plan,
    row.amp_actual
  );
};



const getManufacturingStatus = (row: any) => {
  const steps = [
    [row.gear_case_plan, row.gearcase_actual],
    [row.internal_plan, row.internal_actual],
    [row.bo_plan, row.bo_actual],
    [row.assembly_plan, row.assembly_actual],
  ];

  const statuses = steps.map(([plan, actual]) =>
    getStageStatus(plan, actual)
  );

  if (statuses.every(s => s === "Not Started")) return "Not Started";
  if (statuses.every(s => s === "Completed")) return "Completed";

  return "In Progress";
};

 

const getFullStatus = (row: any) => {
  return {
    design: getDesignStatus(row),
    sales: getSalesStatus(row),
    planning: getPlanningStatus(row),
    manufacturing: getManufacturingStatus(row),
   
    qc: getQCStatus(row),
    dispatch: getDispatchStatus(row),
  };
};

 


const OrderTrackingDashboard = () => {
  const { openModal } = useModal();
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 5,
  });
  const [sortModel, setSortModel] = useState<GridSortModel>([
    { field: "date", sort: "desc" },
  ]);
  const [filterModel, setFilterModel] = useState<GridFilterModel>({
    items: [],
    quickFilterValues: [],
  });
  const [activeTab, setActiveTab] = useState("Design");
  const [activeStageFilter, setActiveStageFilter] = useState<{
    field: ProcessStageField;
    status: SummaryStatusKey;
  } | null>(null);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("Update Plan");
  const [selectedField, setSelectedField] = useState("");
  const [selectedRowData, setSelectedRowData] = useState<Record<string, unknown> | null>(null);

  const [getOrders, { isLoading,data }] = useGetOrdersMutation();

  useEffect(() => {
    getOrders();
  }, [getOrders]);

  const rows = useMemo(() => {

  const apiRows = Array.isArray(data?.data) ? data.data : [];
 // const sourceRows = apiRows.length > 0 ? apiRows : ordertrackingdata;
  const sourceRows = apiRows;
 
  return sourceRows.map((item: any, index: number) => {
    const status = getFullStatus(item);

    return {
      ...item,
      id: item.id ?? index,

      // 🔥 MUST ADD THIS
      design: status.design,
      manufacturing: status.manufacturing,
      assembly: status.manufacturing, // or separate later
      testing: status.qc,
      dispatch: status.dispatch,
    };
  });
}, [data]);

  const stageSummaryCounts = useMemo(
    () =>
      processStageColumns.reduce<Record<string, Record<string, number>>>((acc, stage) => {
        const counts = rows.reduce<Record<string, number>>(
          (stageAcc, row) => {
            const status = getSummaryStatusKey(stage.field, row as Record<string, any>);
            stageAcc[status] = (stageAcc[status] ?? 0) + 1;
            return stageAcc;
          },
          {
            "Completed On Time": 0,
            "Completed Delayed": 0,
            "In Progress": 0,
            "Not Started": 0,
          }
        );

        acc[stage.field] = counts;
        return acc;
      }, {}),
    [rows]
  );

  const filteredRows = useMemo(() => {
    if (!activeStageFilter) {
      return rows;
    }

    return rows.filter(
      (row) =>
        getSummaryStatusKey(activeStageFilter.field, row as Record<string, any>) ===
        activeStageFilter.status
    );
  }, [activeStageFilter, rows]);

  const totalCount = filteredRows.length;

  const handlePlanModalClose = useCallback(() => {
    setIsPlanModalOpen(false);
  }, []);

  const handleSummaryCountClick = useCallback(
    (field: ProcessStageField, summaryKey: string, statusKey: SummaryStatusKey) => {
      setActiveTab(summaryKey);
      setPaginationModel((current) => ({ ...current, page: 0 }));
      setActiveStageFilter((current) => {
        if (current?.field === field && current.status === statusKey) {
          return null;
        }

        return { field, status: statusKey };
      });
    },
    []
  );

  const clearStageFilter = useCallback(() => {
    setActiveStageFilter(null);
    setPaginationModel((current) => ({ ...current, page: 0 }));
  }, []);

  const handleLineIdClick = useCallback(
    (row: Record<string, unknown>) => {
      const viewDetailsFormRef = React.createRef<ViewDetailsRef>();

      openModal({
        title: "View Details",
        widthprops: "900px",
        showCloseButton: true,
        askDataChangeConfirm: false,
        component: (modelProps: any) => (
          <ViewDetails ref={viewDetailsFormRef} {...modelProps} defaultValues={row} />
        ),
        action: (
          <ApiActionButton
            onApiCall={() => viewDetailsFormRef.current?.submit?.() ?? Promise.resolve()}
          >
            Update
          </ApiActionButton>
        ),
      });
    },
    [openModal]
  );

  const handlePlanCellClick = useCallback(
    (field: string, title: string, row: Record<string, unknown>) => {
      setModalTitle(`${title} Plan Update`);
      setSelectedField(field);
      setSelectedRowData({...row,notes:''});
      setIsPlanModalOpen(true);
    },
    []
  );

  const handleTimelineOpen = useCallback(
    (stage: string, row: Record<string, unknown>) => {
      openModal({
        title: `${stage} Timeline`,
        width: "500px",
        showCloseButton: true,
        askDataChangeConfirm: false,
        hideFooter: true,
        component: (modalProps: any) => (
          <OrderTrackingTimelineContent
            {...modalProps}
            embedded
            stage={stage}
            rowData={row}
          />
        ),
      });
    },
    [openModal]
  );

  const renderActualDateCell = useCallback(
    (params: GridRenderCellParams) => {
      const value = params.row?.[params.field];
      const planField = actualToPlanFieldMap[params.field];
      const planValue = planField ? params.row?.[planField] : undefined;
      const displayPlanValue = planValue ? formatDateOnly(String(planValue)) || "-" : "-";
      const displayActualValue = value ? formatDateOnly(String(value)) || "-" : "-";
      const displayColor = getPlanActualDisplayColor(planValue, value);
      const title =
        typeof params.colDef.headerName === "string" && params.colDef.headerName.trim()
          ? params.colDef.headerName
          : params.field;

      return (
        <ButtonBase
          onClick={(event) => {
            event.stopPropagation();
            handlePlanCellClick(params.field, title, params.row as Record<string, unknown>);
          }}
          className="flex h-full w-full cursor-pointer items-center justify-center rounded-none px-3 py-2"
        >
          <Box
            className="grid w-full gap-px text-center leading-[1.15]"
          >
            <Typography
              component="span"
              className="whitespace-nowrap text-[0.66rem] text-slate-500"
            >
              {displayPlanValue}
            </Typography>
            <Typography
              component="span"
              className="whitespace-nowrap text-[0.7rem] font-semibold"
              style={{ color: displayColor }}
            >
              {displayActualValue}
            </Typography>
          </Box>
        </ButtonBase>
      );
    },
    [handlePlanCellClick]
  );

const renderProcessCell = useCallback(
  (params: GridRenderCellParams) => {
    const status = params.value as string;

    const bgcolor =
      status === "Completed"
        ? getProcessStatusColor(params.field, params.row as Record<string, any>)
        : statusColorMap[status] || STATUS_COLORS["Not Started"];

    const title =
      typeof params.colDef.headerName === "string" && params.colDef.headerName.trim()
        ? params.colDef.headerName
        : params.field;

    return (
      <Tooltip title={status.replace(/_/g, " ")} {...ORDER_TRACKING_TOOLTIP_PROPS}>
        <ButtonBase
          onClick={(event) => {
            event.stopPropagation();
            handleTimelineOpen(title, params.row as Record<string, unknown>);
          }}
          className="flex h-full w-full cursor-pointer items-center justify-center rounded-none"
        >
          <Box
            className="h-4 min-w-4 w-4 rounded-full"
            style={{ backgroundColor: bgcolor }}
          />
        </ButtonBase>
      </Tooltip>
    );
  },
  [handleTimelineOpen]
);

  const renderDateCell = useCallback((params: GridRenderCellParams) => {
    return formatDateOnly(String(params.value || "")) || "-";
  }, []);

  const renderMetricCell = useCallback((params: GridRenderCellParams) => {
    const computedValue = getFinalApprovalTimePercent(
      params.row as Record<string, unknown>
    );

    if (computedValue === null || Number.isNaN(computedValue)) {
      return "-";
    }

    return `${computedValue.toFixed(2)}%`;
  }, []);

  const columns: GridColDef[] = useMemo(
    () => [
      {
        field: "line_id",
        headerName: "Line ID",
        width: 96,
        minWidth: 96,
        renderCell: (params: GridRenderCellParams) => (
          <Box
            onClick={(event) => {
              event.stopPropagation();
              handleLineIdClick(params.row as Record<string, unknown>);
            }}
            className="flex h-full w-full cursor-pointer items-center justify-start whitespace-nowrap font-semibold text-blue-600"
          >
            {params.value}
          </Box>
        ),
      },
      {
        field: "cust_po_no",
        headerName: "Cust PO",
        filterable: true,
        width: 110,
        minWidth: 110,
      },
      {
        field: "end_cust_name",
        headerName: "Customer Name",
        filterable: true,
        width: 180,
        minWidth: 180,
        align: "left",
        headerAlign: "left",
      },
       {
        field: "branch_name",
        headerName: "Branch Name",
        sortable:false,
        width: 150,
        minWidth: 150,
        align: "left",
        headerAlign: "left",
      },
       {
        field: "qty",
        headerName: "Qty",
  
        width: 50,
        minWidth: 50,
        sortable: false,
        align: "center",
        headerAlign: "center",
      },
       {
        field: "uom",
        headerName: "UOM",
        sortable: false,
        width: 50,
        minWidth: 50,
      },
       {
        field: "po_value",
        headerName: "PO Value",
       sortable: false,
       width: 100,
        minWidth: 100,
      },
      {
        field: "cust_po_date",
        headerName: "Customer PO Date",
        type: "date",
        sortable: false,
        filterable: true,
        filterOperators: orderTrackingDateFilterOperators,
        valueGetter: (_value: unknown, row: Record<string, unknown>) =>
          getGridDateValue(row, "cust_po_date"),
        width: 130,
        minWidth: 130,
        renderCell: renderDateCell,
      },
      {
        field: "delivery_date_po",
        headerName: "Delivery PO Date",
        type: "date",
        sortable: false,
        filterable: true,
        filterOperators: orderTrackingDateFilterOperators,
        valueGetter: (_value: unknown, row: Record<string, unknown>) =>
          getGridDateValue(row, "delivery_date_po"),
        width: 130,
        minWidth: 130,
        renderCell: renderDateCell,
      },
      {
        field: "commited_ex_works_delivery_date",
        headerName: "Commercial Ex Works Delivery Date",
        type: "date",
        sortable: false,
        filterable: true,
        filterOperators: orderTrackingDateFilterOperators,
        valueGetter: (_value: unknown, row: Record<string, unknown>) =>
          getGridDateValue(row, "commited_ex_works_delivery_date"),
        width: 200,
        minWidth: 200,
        renderCell: renderDateCell,
      },
      {
        field: "perc_time_taken_of_total_po_delivery",
        headerName: "Final Approval Time",
        sortable: false,
        filterable: true,
        width: 130,
        minWidth: 130,
        renderCell: renderMetricCell,
      },
      ...processStageColumns.map((column) => ({
        ...column,
        sortable: false,
        filterable: false,
        width:70, 
        minWidth:70,
        renderCell: renderProcessCell,
      })),
      ...planDateColumns.map((column) => ({
        ...column,
        type: "date",
        sortable: false,
        filterable: true,
        filterOperators: orderTrackingDateFilterOperators,
        valueGetter: (_value: unknown, row: Record<string, unknown>) =>
          getGridDateValue(row, column.field),
        width:90, 
        minWidth:90,
        renderCell: renderActualDateCell,
      })),
    ],
    [handleLineIdClick, renderActualDateCell, renderDateCell, renderMetricCell, renderProcessCell]
  );

  const alignedColumns = useMemo(
    () =>
      columns.map((column) => {
        if (["line_id", "cust_po_no"].includes(column.field)) {
          return column;
        }

        return {
          ...column,
          headerAlign: "center" as const,
          align: "center" as const,
        };
      }),
    [columns]
  );

  const gridHeaderControls = useMemo(() => {
    if (!activeStageFilter) {
      return undefined;
    }

    return (
      <Box
        className="flex flex-wrap items-center gap-2"
      >
        <Typography variant="body2" color="text.secondary">
          Showing {summaryCardKeys[activeStageFilter.field]} rows with status {activeStageFilter.status}.
        </Typography>
        <Button size="small" variant="outlined" onClick={clearStageFilter}>
          Clear Filter
        </Button>
      </Box>
    );
  }, [activeStageFilter, clearStageFilter]);

  return (
    <Box>
      <Grid container spacing={2} className="mb-4">
        {processStageColumns.map((stage) => {
          const summaryKey = summaryCardKeys[stage.field];

          return (
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }} key={stage.field}>
            <Card
              onClick={() => setActiveTab(summaryKey)}
              className={clsx(
                summaryCardClassMap[summaryKey].card,
                "overflow-hidden",
                activeTab === summaryKey && summaryCardClassMap[summaryKey].active
              )}
            >
              <CardContent className="grid gap-3 p-3 sm:gap-4 sm:p-4">
                <Typography
                  variant="subtitle2"
                  color="textSecondary"
                  gutterBottom
                  className="dashboard-stat-title text-[0.78rem] sm:text-[0.82rem]"
                >
                  {stage.headerName}
                </Typography>
                <Box
                  className="grid grid-cols-2 gap-2 sm:grid-cols-4"
                >
                  {summaryStatuses.map((status) => (
                    <Tooltip key={status.key} title={status.tooltip} {...ORDER_TRACKING_TOOLTIP_PROPS}>
                      <Box
                        className="min-h-10 overflow-hidden rounded-md sm:min-h-11"
                        style={{
                          backgroundColor: withAlpha(status.color, "12"),
                          border: `1px solid ${withAlpha(status.color, "33")}`,
                        }}
                      >
                        <ButtonBase
                          onClick={(event) => {
                            event.stopPropagation();
                            handleSummaryCountClick(
                              stage.field,
                              summaryKey,
                              status.key
                            );
                          }}
                          className="grid h-full min-h-10 w-full place-items-center px-2 py-2 sm:min-h-11"
                          style={{
                            backgroundColor:
                              activeStageFilter?.field === stage.field &&
                              activeStageFilter.status === status.key
                                ? withAlpha(status.color, "24")
                                : "transparent",
                          }}
                        >
                          <Typography
                            variant="h6"
                            className={clsx(
                              "dashboard-stat-value text-[1rem] leading-none font-bold sm:text-[1.15rem]",
                              summaryCardClassMap[summaryKey].value
                            )}
                            style={{ color: status.color }}
                          >
                            {stageSummaryCounts[stage.field]?.[status.key] ?? 0}
                          </Typography>
                        </ButtonBase>
                      </Box>
                    </Tooltip>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )})}
      </Grid>

      <Box
        className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg px-2 py-1.5"
      >
        <Typography
          variant="subtitle2"
          className="mr-1 font-bold text-gray-800 dark:text-white/90 sm:mr-3"
        >
          Color Legend
        </Typography>
        {summaryStatuses.map((status) => (
          <Box
            key={status.key}
            className="mr-2 flex items-center gap-1.5 sm:mr-3"
          >
            <Box
              className="h-3.5 min-w-3.5 w-3.5 rounded-full"
              style={{ backgroundColor: status.color }}
            />
            <Typography variant="body2" color="text.secondary">
              {status.key}
            </Typography>
          </Box>
        ))}
      </Box>

      <ReusableDataGrid
        rows={filteredRows}
        columns={alignedColumns}
        totalCount={totalCount}
        loading={isLoading}
        rowHeight={52}
        paginationModel={paginationModel}
        setPaginationModel={setPaginationModel}
        sortModel={sortModel}
        setSortModel={setSortModel}
        filterModel={filterModel}
        setFilterModel={setFilterModel}
        title="Order Tracking"
        headerControls={gridHeaderControls}
        refetch={() => undefined}
        height="calc(100vh - 308px)"
     
        pageSizeOptions={[5, 10, 15, 20, 50]}
        enableViewToggle={false}
        permissions={{ create: true, edit: false, delete: false, download: true, view: true }}
        uniqueIdField="id"
        searchableFields={["end_cust_name", "line_id", "cust_po_no", "branch_name", "uom"]}
      />

      <OpenEditPlanModal
        open={isPlanModalOpen}
        title={modalTitle}
        rowData={selectedRowData}
        field={selectedField}
        onClose={handlePlanModalClose}
      />
    </Box>
  );
};

export default OrderTrackingDashboard;
