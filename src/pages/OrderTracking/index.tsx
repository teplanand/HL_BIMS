import React, { useCallback, useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { Box, Button, ButtonBase, Card, CardContent, TextField, Tooltip, Typography } from "@mui/material";
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
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

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
  "In Progress On Time": ORDER_TRACKING_COLORS.statusInfo,
  "In Progress Delay": "#60A5FA",
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
  { field: "design", headerName: "Design" },
  { field: "manufacturing", headerName: "Mfg"  },
  { field: "assembly", headerName: "Assembly"  },
  { field: "testing", headerName: "Testing"  },
  { field: "dispatch", headerName: "Dispatch"  },
] as const;

const planDateColumns = [
  { field: "amp_actual", headerName: "AMP Date"  },
  { field: "bom_actual", headerName: "BOM Date"  },
  { field: "gearcase_actual", headerName: "Gearcase Date"  },
  { field: "internal_actual", headerName: "Internal Date"  },
  { field: "bo_actual", headerName: "BO Date" },
  { field: "assembly_actual", headerName: "Assembly Date" },
  { field: "testing_actual", headerName: "Testing Date"  },
  { field: "dispatch_date_actual", headerName: "Dispatch Date",  filterable: true },
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
  { key: "Completed On Time", color: SUMMARY_STATUS_COLORS["Completed On Time"], tooltip: "Completed On Time" },
  { key: "Completed Delayed", color: SUMMARY_STATUS_COLORS["Completed Delayed"], tooltip: "Completed Delayed" },
  { key: "In Progress On Time", color: SUMMARY_STATUS_COLORS["In Progress On Time"], tooltip: "In Progress On Time" },
  { key: "In Progress Delay", color: SUMMARY_STATUS_COLORS["In Progress Delay"], tooltip: "In Progress Delay" },
  { key: "Not Started", color: SUMMARY_STATUS_COLORS["Not Started"], tooltip: "Not Started" },
] as const;

type SummaryStatusKey = (typeof summaryStatuses)[number]["key"];
type ProcessStageField = (typeof processStageColumns)[number]["field"];
type DateFilterInputProps = GridFilterInputValueProps;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

dayjs.extend(customParseFormat);

const parseOrderTrackingFilterDate = (value: unknown) => {
  if (!value || typeof value !== "string") {
    return null;
  }

  const parsedValue = dayjs(value, ["YYYY-MM-DD", "DD/MM/YYYY", "D/M/YYYY"], true);
  return parsedValue.isValid() ? parsedValue : null;
};

const formatOrderTrackingFilterDate = (value: unknown) => {
  const parsedValue = parseOrderTrackingFilterDate(value);
  return parsedValue ? parsedValue.format("DD/MM/YYYY") : "";
};

const normalizeOrderTrackingDateInput = (value: string) => {
  const digitsOnly = value.replace(/\D/g, "").slice(0, 8);

  if (digitsOnly.length <= 2) {
    return digitsOnly;
  }

  if (digitsOnly.length <= 4) {
    return `${digitsOnly.slice(0, 2)}/${digitsOnly.slice(2)}`;
  }

  return `${digitsOnly.slice(0, 2)}/${digitsOnly.slice(2, 4)}/${digitsOnly.slice(4)}`;
};

const OrderTrackingDateFilterInput = React.memo((props: DateFilterInputProps) => {
  const { item, applyValue, focusElementRef, disabled, slotProps } = props;
  const [inputValue, setInputValue] = useState(() => formatOrderTrackingFilterDate(item.value));

  useEffect(() => {
    setInputValue(formatOrderTrackingFilterDate(item.value));
  }, [item.value]);

  const commitValue = useCallback((nextInputValue: string) => {
    if (!nextInputValue) {
      applyValue({
        ...item,
        value: "",
      });
      return;
    }

    const parsedValue = parseOrderTrackingFilterDate(nextInputValue);
    if (!parsedValue) {
      return;
    }

    applyValue({
      ...item,
      value: parsedValue.format("YYYY-MM-DD"),
    });
  }, [applyValue, item]);

  return (
    <TextField
      value={inputValue}
      disabled={disabled}
      onChange={(event) => {
        const normalizedValue = normalizeOrderTrackingDateInput(event.target.value);
        setInputValue(normalizedValue);
        commitValue(normalizedValue);
      }}
      onBlur={() => {
        const parsedValue = parseOrderTrackingFilterDate(inputValue);

        if (!inputValue) {
          commitValue("");
          return;
        }

        if (!parsedValue) {
          setInputValue("");
          commitValue("");
          return;
        }

        const normalizedValue = parsedValue.format("DD/MM/YYYY");
        setInputValue(normalizedValue);
        commitValue(normalizedValue);
      }}
      onKeyDown={(event) => {
        if (event.key !== "Enter") {
          return;
        }

        const parsedValue = parseOrderTrackingFilterDate(inputValue);
        if (!parsedValue) {
          return;
        }

        const normalizedValue = parsedValue.format("DD/MM/YYYY");
        setInputValue(normalizedValue);
        commitValue(normalizedValue);
      }}
      placeholder="DD/MM/YYYY"
      size="small"
      inputRef={focusElementRef}
      inputProps={{
        inputMode: "numeric",
        maxLength: 10,
      }}
      sx={{
        width: 160,
        ...(slotProps?.root ?? {}),
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

const getOrderTrackingPlanOrActualDateValue = (
  row: Record<string, unknown>,
  actualField: string,
) => {
  const planField = actualToPlanFieldMap[actualField];

  return (
    getGridDateValue(row, actualField) ||
    (planField ? getGridDateValue(row, planField) : null)
  );
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

const getTodayDateTimestamp = () => {
  const today = new Date();
  return Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
};

const isPlanDateDelayedAgainstToday = (plan: unknown) => {
  const planTimestamp = getDateOnlyTimestamp(plan);

  if (planTimestamp === null) {
    return false;
  }

  const todayTimestamp = getTodayDateTimestamp();

  return todayTimestamp > planTimestamp;
};

const getPendingPlanDatesForStage = (field: string, row: Record<string, any>) => {
  switch (field) {
    case "design":
      return [
        [row.ga_dim_drw_submission_design_plan, row.ga_dim_drw_submission_design_actual],
        [row.final_drg_approval_received_date_plan, row.final_drg_approval_received_date_actual],
        [row.bom_plan, row.bom_actual],
      ]
        .filter(([, actual]) => isNull(actual))
        .map(([plan]) => plan);
    case "manufacturing":
    case "assembly":
      return [
        [row.gear_case_plan, row.gearcase_actual],
        [row.internal_plan, row.internal_actual],
        [row.bo_plan, row.bo_actual],
        [row.assembly_plan, row.assembly_actual],
      ]
        .filter(([, actual]) => isNull(actual))
        .map(([plan]) => plan);
    case "testing":
      return isNull(row.testing_actual) ? [row.testing_plan] : [];
    case "dispatch":
      return isNull(row.dispatch_date_actual) ? [row.dispatch_date_plan] : [];
    default:
      return [];
  }
};

const getInProgressStatusKey = (field: string, row: Record<string, any>) => {
  const pendingPlanDates = getPendingPlanDatesForStage(field, row);

  return pendingPlanDates.some((planDate) => isPlanDateDelayedAgainstToday(planDate))
    ? "In Progress Delay"
    : "In Progress On Time";
};

const getSummaryStatusKey = (field: string, row: Record<string, any>) => {
  const status = String(row[field] ?? "Not Started");

  if (status === "In Progress") {
    return getInProgressStatusKey(field, row);
  }

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
    return getInProgressStatusKey("design", row) === "In Progress Delay"
      ? SUMMARY_STATUS_COLORS["In Progress Delay"]
      : SUMMARY_STATUS_COLORS["In Progress On Time"];
  }

  if (colors.every((color) => color === STATUS_COLORS["Not Started"])) {
    return STATUS_COLORS["Not Started"];
  }

  return STATUS_COLORS.Completed;
};

const getProcessStatusColor = (field: string, row: Record<string, any>) => {
  const stageStatus = String(row[field] ?? "Not Started");

  if (stageStatus === "In Progress") {
    return SUMMARY_STATUS_COLORS[
      getInProgressStatusKey(field, row) as keyof typeof SUMMARY_STATUS_COLORS
    ];
  }

  if (stageStatus === "Not Started") {
    return STATUS_COLORS["Not Started"];
  }

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
      return statusColorMap[stageStatus] || STATUS_COLORS["Not Started"];
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

  const [getOrders, { isLoading, data }] = useGetOrdersMutation();

  const refreshOrders = useCallback(() => {
    void getOrders();
  }, [getOrders]);

  useEffect(() => {
    refreshOrders();
  }, [refreshOrders]);

  const rows = useMemo(() => {

  const apiRows = Array.isArray(data?.data) ? data.data : [];
  //const sourceRows = apiRows.length > 0 ? apiRows : ordertrackingdata;
 
  const sourceRows =  apiRows;
  
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
            "In Progress On Time": 0,
            "In Progress Delay": 0,
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
    const row = params.row as Record<string, any>;
    const summaryStatus = getSummaryStatusKey(params.field, row);

    const bgcolor =
      status === "Completed" || status === "In Progress"
        ? getProcessStatusColor(params.field, row)
        : statusColorMap[status] || STATUS_COLORS["Not Started"];
    const tooltipLabel =
      status === "Completed" || status === "In Progress"
        ? summaryStatus
        : status.replace(/_/g, " ");

    const title =
      typeof params.colDef.headerName === "string" && params.colDef.headerName.trim()
        ? params.colDef.headerName
        : params.field;

    return (
      <Tooltip title={tooltipLabel} {...ORDER_TRACKING_TOOLTIP_PROPS}>
        <ButtonBase
          onClick={(event) => {
            event.stopPropagation();
            handleTimelineOpen(title, params.row as Record<string, unknown>);
          }}
          className="flex h-full w-full cursor-pointer   rounded-none"
          style={{maxWidth:'50px'}}
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

  const columns: GridColDef[] = useMemo<GridColDef[]>(() => [
      {
        field: "line_id",
        headerName: "Line ID",
      sortable:true,
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
        headerName: "Customer PO",
        filterable: true,
        sortable:true,
      },
      {
        field: "division",
        headerName: "Division",
        filterable: true,
       sortable:true,
      },
      {
        field: "sub_division",
        headerName: "Sub Division",
        filterable: true,
       sortable:true,
      },
      {
        field: "order_type",
        headerName: "Order Type",
        filterable: true,
        sortable:true,
      },
      {
        field: "work_order_no",
        headerName: "Order Number",
        filterable: true,
       sortable:true,
      },
      {
        field: "line_no",
        headerName: "Line No",
        filterable: true,
        sortable:true,
      },
      {
        field: "spare_gearbox",
        headerName: "Spare / Products",
        filterable: true,
        sortable:true,
      },
      {
        field: "end_cust_name",
        headerName: "Customer Name",
        filterable: true,
       sortable:true,
       minWidth: 150,
       flex: 1,
       
       
      },
       {
        field: "branch_name",
        headerName: "Branch Name",
        sortable:true,
          filterable: true,
           flex: 1,
             minWidth: 150,
      },
       {
        field: "qty",
        headerName: "Qty",
  
       
        sortable: true,
         
      },
       {
        field: "uom",
        headerName: "UOM",
        sortable: true,
        
      },
       {
        field: "po_value",
        headerName: "PO Value",
       sortable: true,
       
      },
      {
        field: "currency",
        headerName: "Currency",
        filterable: true,
         sortable: true,
      },
      {
        field: "cust_po_date",
        headerName: "Cust PO Date",
        type: "date" as const,
        sortable: true,
        filterable: true,
        filterOperators: orderTrackingDateFilterOperators,
        valueGetter: (_value: unknown, row: Record<string, unknown>) =>
          getGridDateValue(row, "cust_po_date"),
        
        renderCell: renderDateCell,
      },
      {
        field: "delivery_date_po",
        headerName: "Delivery Date",
        type: "date" as const,
        sortable: true,
        filterable: true,
        filterOperators: orderTrackingDateFilterOperators,
        valueGetter: (_value: unknown, row: Record<string, unknown>) =>
          getGridDateValue(row, "delivery_date_po"),
        
        renderCell: renderDateCell,
      },
      {
        field: "commited_ex_works_delivery_date",
        headerName: "Ex Works Date",
        type: "date" as const,
        sortable: true,
        filterable: true,
        filterOperators: orderTrackingDateFilterOperators,
        valueGetter: (_value: unknown, row: Record<string, unknown>) =>
          getGridDateValue(row, "commited_ex_works_delivery_date"),
        
        renderCell: renderDateCell,
      },
      {
        field: "perc_time_taken_of_total_po_delivery",
        headerName: "Approval %",
        sortable: true,
        filterable: true,
       
        renderCell: renderMetricCell,
      },
      ...processStageColumns.map<GridColDef>((column) => ({
        ...column,
        sortable: false,
        filterable: false,
       
        renderCell: renderProcessCell,
      })),
      ...planDateColumns.map<GridColDef>((column) => {
        const planDateColumn = {
          ...column,
          type: "date" as const,
          sortable: false,
          filterable: true,
          filterOperators: orderTrackingDateFilterOperators,
          valueGetter: (_value: unknown, row: Record<string, unknown>) =>
            getGridDateValue(row, column.field),
          filterValueGetter: (row: Record<string, unknown>) =>
            getOrderTrackingPlanOrActualDateValue(row, column.field),
           
          renderCell: renderActualDateCell,
        };

        return planDateColumn as unknown as GridColDef;
      }),
    ],
    [handleLineIdClick, renderActualDateCell, renderDateCell, renderMetricCell, renderProcessCell]
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
      <Box
        className="mb-4 grid gap-3"
        sx={{
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, minmax(0, 1fr))",
            lg: "repeat(5, minmax(0, 1fr))",
            xl: "repeat(5, minmax(0, 1fr))",
          },
        }}
      >
        {processStageColumns.map((stage) => {
          const summaryKey = summaryCardKeys[stage.field];

          return (
          <Card
            key={stage.field}
            onClick={() => setActiveTab(summaryKey)}
            className={clsx(
              summaryCardClassMap[summaryKey].card,
              "overflow-hidden rounded-xl",
              activeTab === summaryKey && summaryCardClassMap[summaryKey].active
            )}
            sx={{
              width: "100%",
              minWidth: 0,
            }}
          >
            <CardContent className="grid gap-2.5  ">
              <Typography
                variant="subtitle2"
                color="textSecondary"
                className="dashboard-stat-title text-[0.74rem] font-semibold uppercase tracking-[0.04em] sm:text-[0.78rem]"
              >
                {stage.headerName}
              </Typography>
              <Box
                className="grid grid-cols-5 gap-1.5 sm:gap-2"
              >
                {summaryStatuses.map((status) => (
                  <Tooltip key={status.key} title={status.tooltip} {...ORDER_TRACKING_TOOLTIP_PROPS}>
                    <Box
                      className="overflow-hidden rounded-md"
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
                        className="grid h-full min-h-9 w-full place-items-center px-1 py-1.5 sm:min-h-10"
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
                            "dashboard-stat-value text-[0.95rem] leading-none font-semibold sm:text-[1.05rem]",
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
        )})}
      </Box>

      <Box
        className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-lg px-1 py-1"
      >
        <Typography
          variant="subtitle2"
          className="mr-1 whitespace-nowrap font-bold text-gray-800 dark:text-white/90 sm:mr-2"
        >
          Color Legend
        </Typography>
        {summaryStatuses.map((status) => (
          <Box
            key={status.key}
            className="flex items-center gap-1.5"
          >
            <Box
              className="h-3 min-w-3 w-3 rounded-full"
              style={{ backgroundColor: status.color }}
            />
            <Typography variant="caption" color="text.secondary" className="whitespace-nowrap">
              {status.key}
            </Typography>
          </Box>
        ))}
      </Box>

      <ReusableDataGrid
        rows={filteredRows}
        columns={columns}
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
        refetch={refreshOrders}
        height="calc(100vh - 290px)"
     
        pageSizeOptions={[5, 10, 15, 20, 50]}
        enableViewToggle={false}
        permissions={{ create: true, edit: false, delete: false, download: true, view: true }}
        uniqueIdField="id"
        headerTextAlign="left"
        headerVerticalAlign="top"
        searchableFields={[
          "division",
          "sub_division",
          "order_type",
          "work_order_no",
          "line_no",
          "spare_gearbox",
          "currency",
          "end_cust_name",
          "line_id",
          "cust_po_no",
          "branch_name",
          "uom",
        ]}
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
