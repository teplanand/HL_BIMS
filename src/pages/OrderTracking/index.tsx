import React, { useCallback, useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { Box, Button, ButtonBase, Card, CardContent, Chip, Grid, Tooltip, Typography } from "@mui/material";
import {
  GridColDef,
  GridFilterModel,
  GridPaginationModel,
  GridRenderCellParams,
  GridSortModel,
} from "@mui/x-data-grid";

import ApiActionButton from "../../components/common/ApiActionButton";
import ReusableDataGrid from "../../components/common/ReusableDataGrid";
import { useModal } from "../../hooks/useModal";
import { useGetOrdersMutation } from "../../redux/api/ordertracking";
import { ordertrackingdata } from "./Dashboard/data";
import OpenEditPlanModal from "./Dashboard/components/AddEditPlan";
import { ViewDetails, ViewDetailsRef } from "./Dashboard/components/viewdetails";
import { OrderTrackingTimelineContent } from "./timeline";
import { formatDateOnly } from "../../utils/FormatDate";

////// filter by number

const summaryCardClassMap: Record<
  string,
  { card: string; active: string; value: string; numberColor: string }
> = {
  Design: {
    card: "dashboard-stat-card dashboard-stat-card--requested",
    active: "dashboard-stat-card--requested-active",
    value: "dashboard-stat-value--requested",
    numberColor: "#64748b",
  },
  Manufacturing: {
    card: "dashboard-stat-card dashboard-stat-card--pending",
    active: "dashboard-stat-card--pending-active",
    value: "dashboard-stat-value--pending",
    numberColor: "#f59e0b",
  },
  Assembly: {
    card: "dashboard-stat-card dashboard-stat-card--approved",
    active: "dashboard-stat-card--approved-active",
    value: "dashboard-stat-value--approved",
    numberColor: "#10b981",
  },
  Testing: {
    card: "dashboard-stat-card dashboard-stat-card--rejected",
    active: "dashboard-stat-card--rejected-active",
    value: "dashboard-stat-value--rejected",
    numberColor: "#ef4444",
  },
  Painting: {
    card: "dashboard-stat-card dashboard-stat-card--pending",
    active: "dashboard-stat-card--pending-active",
    value: "dashboard-stat-value--pending",
    numberColor: "#f59e0b",
  },
  Dispatch: {
    card: "dashboard-stat-card dashboard-stat-card--approved",
    active: "dashboard-stat-card--approved-active",
    value: "dashboard-stat-value--approved",
    numberColor: "#10b981",
  },
};

const processStageColumns = [
  { field: "design", headerName: "Design", width: 86, minWidth: 86 },
  { field: "manufacturing", headerName: "Mfg", width: 86, minWidth: 86 },
  { field: "assembly", headerName: "Assembly", width: 96, minWidth: 96 },
  { field: "testing", headerName: "Testing", width: 88, minWidth: 88 },
  { field: "painting", headerName: "Painting", width: 92, minWidth: 92 },
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
  painting: "Painting",
  dispatch: "Dispatch",
};

const summaryStatuses = [
  { key: "Completed On Time", color: "#22C55E", tooltip: "Completed" },
  { key: "Completed Delayed", color: "#EF4444", tooltip: "Completed" },
  { key: "In Progress", color: "#2563EB", tooltip: "In Progress" },
  { key: "Not Started", color: "#9CA3AF", tooltip: "Not Started" },
] as const;

type SummaryStatusKey = (typeof summaryStatuses)[number]["key"];
type ProcessStageField = (typeof processStageColumns)[number]["field"];
const DAY_IN_MS = 24 * 60 * 60 * 1000;


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

const getCompletedColor = (plan: any, actual: any) => {
  if (isNull(plan) && isNull(actual)) return "#9CA3AF";
  if (!isNull(plan) && isNull(actual)) return "#2563EB";
  if (isNull(plan) && !isNull(actual)) return "#22C55E";

  const planDate = new Date(String(plan));
  const actualDate = new Date(String(actual));

  if (!Number.isNaN(planDate.getTime()) && !Number.isNaN(actualDate.getTime())) {
    return planDate.getTime() >= actualDate.getTime() ? "#22C55E" : "#EF4444";
  }

  const planNumber = Number(plan);
  const actualNumber = Number(actual);

  if (!Number.isNaN(planNumber) && !Number.isNaN(actualNumber)) {
    return planNumber >= actualNumber ? "#22C55E" : "#EF4444";
  }

  return "#22C55E";
};

const getPlanActualDisplayColor = (plan: any, actual: any) => {
  if (isNull(plan) && isNull(actual)) return "#9CA3AF";
  if (isNull(plan) !== isNull(actual)) return "#9CA3AF";

  const planDate = new Date(String(plan));
  const actualDate = new Date(String(actual));

  if (!Number.isNaN(planDate.getTime()) && !Number.isNaN(actualDate.getTime())) {
    return planDate.getTime() >= actualDate.getTime() ? "#22C55E" : "#EF4444";
  }

  const planNumber = Number(plan);
  const actualNumber = Number(actual);

  if (!Number.isNaN(planNumber) && !Number.isNaN(actualNumber)) {
    return planNumber >= actualNumber ? "#22C55E" : "#EF4444";
  }

  return "#2563EB";
};

const getSummaryStatusKey = (field: string, row: Record<string, any>) => {
  const status = String(row[field] ?? "Not Started");

  if (status !== "Completed") {
    return status;
  }

  return getProcessStatusColor(field, row) === "#EF4444"
    ? "Completed Delayed"
    : "Completed On Time";
};

const statusColorMap: Record<string, string> = {
  "Not Started": "#9CA3AF",
  "In Progress": "#2563EB",
  "Completed": "#22C55E",
};

const getAggregateCompletedColor = (
  checks: Array<[any, any]>,
  fallbackStatus: string
) => {
  const completedColors = checks
    .filter(([plan, actual]) => getStageStatus(plan, actual) === "Completed")
    .map(([plan, actual]) => getCompletedColor(plan, actual));

  if (completedColors.length === 0) {
    return statusColorMap[fallbackStatus] || "#9CA3AF";
  }

  return completedColors.some((color) => color === "#EF4444")
    ? "#EF4444"
    : "#22C55E";
};

const getProcessStatusColor = (field: string, row: Record<string, any>) => {
  switch (field) {
    case "design":
      return getAggregateCompletedColor(
        [
          [row.ga_dim_drw_submission_design_plan, row.ga_dim_drw_submission_design_actual],
          [row.final_drg_approval_received_date_plan, row.final_drg_approval_received_date_actual],
          [row.bom_plan, row.bom_actual],
          [
            row.po_received_date_to_ga_drw_submission_days,
            row.ga_drawing_submission_to_final_approval_received_days,
          ],
        ],
        String(row[field] ?? "Not Started")
      );
    case "manufacturing":
    case "assembly":
    case "painting":
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
      return statusColorMap[String(row[field] ?? "Not Started")] || "#9CA3AF";
  }
};

const getDesignStatus = (row: any) => {
  const fields = [
    row.ga_dim_drw_submission_design_plan,
    row.ga_dim_drw_submission_design_actual,
    row.final_drg_approval_received_date_plan,
    row.final_drg_approval_received_date_actual,
    row.bom_plan,
    row.bom_actual,
  ];

  if (fields.every(isNull)) return "Not Started";
  if (fields.some(isNull)) return "In Progress";

  // optional strict logic
  const submissionDays = row.po_received_date_to_ga_drw_submission_days;
  const approvalDays = row.ga_drawing_submission_to_final_approval_received_days;

  if (!isNull(submissionDays) && !isNull(approvalDays)) return "Completed";

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
    pageSize: 15,
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

  const [getOrders, { data, isLoading }] = useGetOrdersMutation();

  useEffect(() => {
    getOrders();
  }, [getOrders]);

  const rows = useMemo(() => {

    // const apiRows = Array.isArray(data?.data) ? data.data : [];
    //const sourceRows = apiRows.length > 0 ? apiRows : ordertrackingdata;
  const sourceRows = ordertrackingdata;

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
      painting: status.manufacturing, // optional
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
      const value = params.value;
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
          sx={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            px: 0.75,
            py: 0.5,
            cursor: "pointer",
            borderRadius: 0,
          }}
        >
          <Box
            sx={{
              width: "100%",
              display: "grid",
              gap: 0.15,
              textAlign: "center",
              lineHeight: 1.15,
            }}
          >
            <Typography
              component="span"
              sx={{
                fontSize: "0.66rem",
                color: "text.secondary",
                whiteSpace: "nowrap",
              }}
            >
              {displayPlanValue}
            </Typography>
            <Typography
              component="span"
              sx={{
                fontSize: "0.7rem",
                fontWeight: 600,
                color: displayColor,
                whiteSpace: "nowrap",
              }}
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
        : statusColorMap[status] || "#9CA3AF";

    const title =
      typeof params.colDef.headerName === "string" && params.colDef.headerName.trim()
        ? params.colDef.headerName
        : params.field;

    return (
      <Tooltip title={status.replace(/_/g, " ")}>
        <ButtonBase
          onClick={(event) => {
            event.stopPropagation();
            handleTimelineOpen(title, params.row as Record<string, unknown>);
          }}
          sx={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            borderRadius: 0,
          }}
        >
          <Chip
            size="small"
            sx={{
              backgroundColor: bgcolor,
              borderRadius: "50%",
              height: "16px",
              width: "16px",
              minWidth: "16px",
            }}
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
            sx={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
              color: "primary.main",
              cursor: "pointer",
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
          >
            {params.value}
          </Box>
        ),
      },
      {
        field: "cust_po_no",
        headerName: "Cust PO",
        filterable: true,
        width: 100,
        minWidth: 100,
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
        sortable: false,
        filterable: true,
        width: 130,
        minWidth: 130,
        renderCell: renderDateCell,
      },
      {
        field: "delivery_date_po",
        headerName: "Delivery PO Date",
        sortable: false,
        filterable: true,
        width: 130,
        minWidth: 130,
        renderCell: renderDateCell,
      },
      {
        field: "commited_ex_works_delivery_date",
        headerName: "Commercial Ex Works Delivery Date",
        sortable: false,
        filterable: true,
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
        width:70, 
        minWidth:70,
        renderCell: renderProcessCell,
      })),
      ...planDateColumns.map((column) => ({
        ...column,
        sortable: false,
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
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          flexWrap: "wrap",
        }}
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
          <Grid size={{ xs: 12, sm: 6, md: 2 }} key={stage.field}>
            <Card
              onClick={() => setActiveTab(summaryKey)}
              className={clsx(
                summaryCardClassMap[summaryKey].card,
                activeTab === summaryKey && summaryCardClassMap[summaryKey].active
              )}
            >
              <CardContent sx={{ display: "grid", gap: 1.25 }}>
                <Typography
                  variant="subtitle2"
                  color="textSecondary"
                  gutterBottom
                  className="dashboard-stat-title"
                >
                  {stage.headerName}
                </Typography>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${summaryStatuses.length}, minmax(0, 1fr))`,
                    gap: 1,
                  }}
                >
                  {summaryStatuses.map((status) => (
                    <Tooltip key={status.key} title={status.tooltip}>
                      <Box
                        sx={{
                          minHeight: 44,
                          borderRadius: 1.5,
                          backgroundColor: `${status.color}12`,
                          border: `1px solid ${status.color}33`,
                          overflow: "hidden",
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
                          sx={{
                            width: "100%",
                            height: "100%",
                            minHeight: 44,
                            display: "grid",
                            placeItems: "center",
                            backgroundColor:
                              activeStageFilter?.field === stage.field &&
                              activeStageFilter.status === status.key
                                ? `${status.color}24`
                                : "transparent",
                          }}
                        >
                          <Typography
                            variant="h6"
                            className={clsx(
                              "dashboard-stat-value",
                              summaryCardClassMap[summaryKey].value
                            )}
                            sx={{
                              color: status.color,
                              fontSize: "1.15rem",
                              lineHeight: 1,
                              fontWeight: 700,
                            }}
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
        sx={{
          mb: 2,
          px: 2,
          py: 1.25,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 2,
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
          backgroundColor: "background.paper",
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mr: 1 }}>
          Color Legend
        </Typography>
        {summaryStatuses.map((status) => (
          <Box
            key={status.key}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.75,
            }}
          >
            <Chip
              size="small"
              sx={{
                backgroundColor: status.color,
                borderRadius: "50%",
                height: "14px",
                width: "14px",
                minWidth: "14px",
              }}
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
        enableViewToggle={false}
        permissions={{ create: true, edit: false, delete: false, download: true, view: true }}
        uniqueIdField="id"
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
