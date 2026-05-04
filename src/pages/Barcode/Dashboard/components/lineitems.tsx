import React, { memo, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  Chip,
  Pagination,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import PrecisionManufacturingOutlinedIcon from "@mui/icons-material/PrecisionManufacturingOutlined";
import QrCode2OutlinedIcon from "@mui/icons-material/QrCode2Outlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import LocalPrintshopOutlinedIcon from "@mui/icons-material/LocalPrintshopOutlined";
import RouteOutlinedIcon from "@mui/icons-material/RouteOutlined";
import WarehouseOutlinedIcon from "@mui/icons-material/WarehouseOutlined";
import CurrencyRupeeOutlinedIcon from "@mui/icons-material/CurrencyRupeeOutlined";
import FilterListOutlinedIcon from "@mui/icons-material/FilterListOutlined";
import ViewListOutlinedIcon from "@mui/icons-material/ViewListOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";

import { DateRange } from "../../../../components/common/DateRangePicker";
import {
  MuiDateRangePicker,
  MuiSelect,
  MuiTextField,
} from "../../../../components/mui/input";
import { PageHeader } from "../../../../components/ui/form/stack";
import FormSection from "../../../../components/ui/form/FormSection";
import { useModal } from "../../../../hooks/useModal";
import { useToast } from "../../../../hooks/useToast";
import { useAppSelector } from "../../../../redux/hooks";
import {
  BarcodeLineItemViewModel,
  BarcodeSalesOrderStatus,
  BarcodeSalesOrderDetailsViewModel,
  mapSerialItem,
} from "../barcodeAdapters";
import { FinalInspection } from "./finalinspection";
import {
  barcodeDefaults,
  BarcodeCompletionStage,
  BarcodeCreateWorkOrderResponseData,
  getBarcodeDefaultContext,
  useCreateWorkOrderMutation,
  useGenerateSerialNumbersMutation,
  useLazyGetCompletionGearboxDetailsQuery,
  useLazyGetQualityCheckDetailsQuery,
  useLazyGetUnderAssemblyDetailsQuery,
  useIssueMaterialMutation,
  usePrintLabelMutation,
  useUpdateOrderCompletionStageMutation,
} from "../../../../redux/api/barcode";
import { printPdfBlob } from "../../../../utils/printPdfBlob";

type LineItemsProps = {
  orderDetails?: BarcodeSalesOrderDetailsViewModel | null;
  onOrderUpdated?: () => Promise<unknown> | unknown;
};
type StatusCode = "PL" | "SH" | "MI" | "PK" | "BOOKED" | string;
type ActionKey = "workOrder" | "serialNumber" | "issueMaterial" | "printLabel" | "edit";

type ActionConfig = {
  visible: boolean;
  enabled: boolean;
  label: string;
  mode?: string;
};

type SerialItem = {
  id?: number | null;
  serial_no: string;
  status: string | null;
  sh_type: string | null;
  sh_item: string | null;
  ass_rel_date: string | null;
  ac_ua_date: string | null;
  ac_qc_date?: string | null;
  ac_comp_date: string | null;
  ac_pk_date: string | null;
  tent_rel_date: string | null;
  rpm: string | null;
  motor_serial_no: string | null;
  ac_ds_date?: string | null;
  ac_ho_date?: string | null;
  ac_ca_date?: string | null;
};

type SerialWorkflowActionKey = "acUa" | "acQc" | "acComp" | "acPk" | "acDs";

type CompletionLookupMetadata = {
  oracle_order_no?: number | string | null;
  model_type?: string | null;
  qty?: number | string | null;
  order_header_id?: number | string | null;
  order_line_id?: number | string | null;
  kw?: number | string | null;
  input_RPM?: number | string | null;
  actual_ratio?: number | string | null;
  pole?: number | string | null;
  noiseLevel?: number | string | null;
  paintColor?: string | null;
  MotorMake?: string | null;
  OracleUserId?: number | string | null;
  P_AMB_TEMP?: string | null;
  P_GREASE_TEMP?: string | null;
  rpm?: number | string | null;
  motor_serial_no?: string | null;
  Model?: string | null;
  model?: string | null;
  wo_no?: string | null;
};

type LineItemRow = {
  id: string;
  lineId: number;
  headerId?: number | null;
  orgId?: number | null;
  line_no: string;
  item_code: string;
  description?: string;
  quantity: number;
  list_price: number;
  discount_percent: number;
  selling_price: number;
  amount: number;
  ship_to_location: string;
  road_permit: string | boolean;
  wo_no: string;
  wo_date: string | null;
  client_delivery_date: string | null;
  delivery_month: string | null;
  con_auth: string | null;
  status: StatusCode;
  mail_status?: string;
  model?: string | null;
  model_type?: string | null;
  kw?: number | null;
  ratio?: number | null;
  quantitys?: SerialItem[];
  actions?: Record<string, ActionConfig>;
};

type LineItemOverride = Partial<LineItemRow> & {
  forceEnableSerialNumber?: boolean;
  materialIssued?: boolean;
};

const meta: Record<
  string,
  { label: string; bg: string; color: string; accent: string }
> = {
  PL: { label: "In Planning", bg: "#FFF4D6", color: "#9A5B00", accent: "#D68A00" },
  SH: { label: "Shop Floor Ready", bg: "#DCFCE7", color: "#166534", accent: "#15803D" },
  MI: { label: "Material Issued", bg: "#DBEAFE", color: "#1D4ED8", accent: "#2563EB" },
  PK: { label: "Label Ready", bg: "#F3E8FF", color: "#7E22CE", accent: "#9333EA" },
  BOOKED: { label: "Booked", bg: "#FFF4D6", color: "#9A5B00", accent: "#D68A00" },
};

const actionIcon: Record<string, React.ReactNode> = {
  workOrder: <PrecisionManufacturingOutlinedIcon fontSize="small" />,
  serialNumber: <QrCode2OutlinedIcon fontSize="small" />,
  issueMaterial: <Inventory2OutlinedIcon fontSize="small" />,
  printLabel: <LocalPrintshopOutlinedIcon fontSize="small" />,
  edit: <ViewListOutlinedIcon fontSize="small" />,
};

const actionSet = (
  status: StatusCode,
  options?: {
    forceEnableSerialNumber?: boolean;
    hasWorkOrder?: boolean;
    hasSerialNumbers?: boolean;
    materialIssued?: boolean;
  }
): Record<ActionKey, ActionConfig> => ({
  workOrder: {
    visible: !options?.hasWorkOrder,
    enabled: true,
    label: "Create WO",
  },
  serialNumber: {
    visible:
      !options?.hasSerialNumbers &&
      (options?.forceEnableSerialNumber || options?.hasWorkOrder || (status !== "PL" && status !== "BOOKED")),
    enabled:
      options?.forceEnableSerialNumber || (status !== "PL" && status !== "BOOKED"),
    label: "Serial No",
  },
  issueMaterial: {
    visible:
      !options?.materialIssued &&
      !["MI", "PK"].includes(status),
    enabled:
      !options?.materialIssued &&
      status !== "PL" &&
      status !== "BOOKED",
    label: "Issue Material",
  },
  printLabel: {
    visible: true,
    enabled: options?.materialIssued || status === "MI" || status === "PK",
    label: "Print Label",
  },
  edit: { visible: false, enabled: false, label: "Edit" },
});

const sampleRows = (
  orderDetails?: BarcodeSalesOrderDetailsViewModel | null,
  overrides: Record<string, LineItemOverride> = {}
): LineItemRow[] =>
  (orderDetails?.line_items || []).map((line: BarcodeLineItemViewModel) => ({
    ...line,
    ...(overrides[String(line.lineId)] || {}),
    lineId: line.lineId,
    description: line.description || "Description not available",
    actions: actionSet(line.status, {
      forceEnableSerialNumber: overrides[String(line.lineId)]?.forceEnableSerialNumber,
      hasWorkOrder: Boolean((overrides[String(line.lineId)]?.wo_no ?? line.wo_no) || ""),
      hasSerialNumbers: Boolean(
        ((overrides[String(line.lineId)]?.quantitys ?? line.quantitys) || []).length
      ),
      materialIssued: Boolean(overrides[String(line.lineId)]?.materialIssued),
    }),
    quantitys: line.quantitys || [],
  }));

const cardSx = { border: "1px solid rgba(15,23,42,0.08)" };

const parseDate = (value: string | null | undefined) => {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date(`${value}T00:00:00`);
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    const [d, m, y] = value.split("/").map(Number);
    return new Date(y, m - 1, d);
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDate = (value: string | null | undefined) => {
  const date = parseDate(value);
  return date ? date.toLocaleDateString("en-GB") : value || "--";
};

const formatAmount = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);

const toNumeric = (value: unknown) => {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
};

const resolveCompletionStage = (status: string): BarcodeCompletionStage => {
  if (status === "PI") {
    return "painting";
  }

  if (status === "PK") {
    return "packing";
  }

  return "completion";
};

const serialActionButtonMeta: Record<
  SerialWorkflowActionKey,
  { label: string; status: string; stage?: BarcodeCompletionStage; dateField: keyof SerialItem }
> = {
  acUa: { label: "Under Assembly", status: "UA", dateField: "ac_ua_date" },
  acQc: { label: "Quality Check", status: "QC", dateField: "ac_qc_date" },
  acComp: {
    label: "Completion",
    status: "CP",
    stage: "completion",
    dateField: "ac_comp_date",
  },
  acPk: { label: "Packing", status: "PK", stage: "packing", dateField: "ac_pk_date" },
  acDs: { label: "Dispatch", status: "DS", dateField: "ac_ds_date" },
};

const dateHeaderLabel = (label: string) => (
  <Stack direction="row" spacing={0.5} alignItems="center">
    <Box component="span">{label}</Box>
    <CalendarMonthOutlinedIcon sx={{ fontSize: 15 }} />
  </Stack>
);

function SerialNumberDrawer({
  row,
  orderDetails,
  onSerialUpdated,
  setDisplayTitle,
  setHideFooter,
  setWidth,
}: {
  row: LineItemRow;
  orderDetails?: BarcodeSalesOrderDetailsViewModel | null;
  onSerialUpdated?: (
    lineId: number,
    serialNo: string,
    updates: Partial<SerialItem>,
  ) => void;
  setDisplayTitle?: (title: string) => void;
  setHideFooter?: (hidden: boolean) => void;
  setWidth?: (width: number | string) => void;
}) {
  const { showToast } = useToast();
  const { openModal } = useModal();
  const authUserId = useAppSelector((state) => state.auth.id);
  const [triggerUnderAssembly] = useLazyGetUnderAssemblyDetailsQuery();
  const [triggerQualityCheck] = useLazyGetQualityCheckDetailsQuery();
  const [triggerCompletionLookup] = useLazyGetCompletionGearboxDetailsQuery();
  const [updateOrderCompletionStage] = useUpdateOrderCompletionStageMutation();
  const serialsCount = row.quantitys?.length || 0;
  const [serialRows, setSerialRows] = useState<SerialItem[]>(() => row.quantitys || []);
  const [pendingActionKey, setPendingActionKey] = useState<string | null>(null);

  useEffect(() => {
    setDisplayTitle?.(`Line ${row.line_no} Serial Numbers`);
    setHideFooter?.(true);
    setWidth?.(980);
  }, [row.line_no, setDisplayTitle, setHideFooter, setWidth]);

  useEffect(() => {
    setSerialRows(row.quantitys || []);
  }, [row.quantitys]);

  const currentOrder = orderDetails?.order;

  const handleSerialWorkflowAction = async (
    serial: SerialItem,
    actionKey: SerialWorkflowActionKey,
  ) => {
    const serialActionId = `${serial.serial_no}-${actionKey}`;
    const metaConfig = serialActionButtonMeta[actionKey];

    if (actionKey === "acQc") {
      openModal({
        title: serial.serial_no,
        width: 980,
        showCloseButton: true,
        askDataChangeConfirm: false,
        component: (modalProps: any) => (
          <FinalInspection
            {...modalProps}
            serialNumber={serial.serial_no}
            onSaved={({ savedAt }) => {
              const serialUpdates: Partial<SerialItem> = {
                ac_qc_date: savedAt,
              };

              setSerialRows((current) =>
                current.map((entry) =>
                  entry.serial_no === serial.serial_no
                    ? {
                        ...entry,
                        ...serialUpdates,
                      }
                    : entry,
                ),
              );
              onSerialUpdated?.(row.lineId, serial.serial_no, serialUpdates);
            }}
          />
        ),
      });
      return;
    }

    if (actionKey === "acDs") {
      showToast("Dispatch API is not available in barcode docs yet.", "warning");
      return;
    }

    if (!serial.serial_no?.trim()) {
      showToast("Serial number is required for this action.", "warning");
      return;
    }

    setPendingActionKey(serialActionId);

    try {
      let successMessage = `${metaConfig.label} completed successfully`;
      let serialUpdates: Partial<SerialItem> = {};

      if (actionKey === "acUa") {
        if (!serial.id) {
          showToast("Serial id is required for Under Assembly action.", "warning");
          return;
        }

        const response = await triggerUnderAssembly({
          serial_no: serial.serial_no,
          id: serial.id,
        }).unwrap();

        serialUpdates = {
          ac_ua_date: new Date().toISOString(),
        };
        successMessage =
          response?.message ||
          "Under assembly updated successfully";
      }

      if (actionKey === "acComp" || actionKey === "acPk") {
        let response = await triggerCompletionLookup({
          BarcodeSerialNo: serial.serial_no,
        }).unwrap();

        if (!response?.data) {
          response = await triggerQualityCheck({
            serial_no: serial.serial_no,
          }).unwrap();
        }

        const lookup = (response?.data || {}) as CompletionLookupMetadata;
        const status = metaConfig.status;
        const stage = metaConfig.stage || resolveCompletionStage(status);
        const oracleUserId = toNumeric(authUserId) || toNumeric(lookup?.OracleUserId) || 1;

        const updateResponse = await updateOrderCompletionStage({
          stage,
          DivisionId: String(barcodeDefaults.divisionId),
          dtPrint: {
            oracle_order_no:
              toNumeric(lookup?.oracle_order_no) ||
              toNumeric(currentOrder?.order_number) ||
              0,
            model_type: String(lookup?.model_type || row.model_type || "GM"),
            model: String(lookup?.Model || lookup?.model || row.model || row.item_code || ""),
            ratio: toNumeric(lookup?.actual_ratio) || toNumeric(row.ratio) || 0,
            qty: Math.max(1, toNumeric(lookup?.qty) || toNumeric(row.quantity) || 1),
            wo_no: String(lookup?.wo_no || row.wo_no || ""),
            order_header_id:
              toNumeric(lookup?.order_header_id) ||
              toNumeric(orderDetails?.header_id) ||
              toNumeric(row.headerId) ||
              0,
            order_line_id: toNumeric(lookup?.order_line_id) || toNumeric(row.lineId),
            status,
            kw: toNumeric(lookup?.kw) || toNumeric(row.kw),
            serial_no: String(serial.serial_no || ""),
            rpm: toNumeric(serial.rpm) || toNumeric(lookup?.rpm),
            motor_serial_no: String(serial.motor_serial_no || lookup?.motor_serial_no || ""),
            input_RPM:
              toNumeric(lookup?.input_RPM) || toNumeric(serial.rpm) || toNumeric(lookup?.rpm),
            actual_ratio: toNumeric(lookup?.actual_ratio) || toNumeric(row.ratio),
            pole: toNumeric(lookup?.pole),
            noiseLevel: toNumeric(lookup?.noiseLevel),
            paintColor: String(lookup?.paintColor || "GOOD"),
            MotorMake: String(lookup?.MotorMake || ""),
            OracleUserId: oracleUserId,
            P_AMB_TEMP: String(lookup?.P_AMB_TEMP || ""),
            P_GREASE_TEMP: String(lookup?.P_GREASE_TEMP || ""),
          },
        }).unwrap();

        serialUpdates =
          actionKey === "acComp"
            ? { ac_comp_date: new Date().toISOString() }
            : { ac_pk_date: new Date().toISOString() };
        successMessage = updateResponse?.message || `${metaConfig.label} updated successfully`;
      }

      if (Object.keys(serialUpdates).length) {
        setSerialRows((current) =>
          current.map((entry) =>
            entry.serial_no === serial.serial_no
              ? {
                  ...entry,
                  ...serialUpdates,
                }
              : entry,
          ),
        );
        onSerialUpdated?.(row.lineId, serial.serial_no, serialUpdates);
      }

      showToast(successMessage, "success");
    } catch (error: any) {
      const message =
        error?.data?.message || error?.error || `Unable to process ${metaConfig.label}`;
      showToast(message, "error");
    } finally {
      setPendingActionKey(null);
    }
  };

  const renderSerialWorkflowCell = (
    serial: SerialItem,
    actionKey: SerialWorkflowActionKey,
  ) => {
    const actionMeta = serialActionButtonMeta[actionKey];
    const value = serial[actionMeta.dateField] as string | null | undefined;
    const isPending = pendingActionKey === `${serial.serial_no}-${actionKey}`;

    if (value) {
      return <TableCell>{formatDate(value)}</TableCell>;
    }

    return (
      <TableCell>
        <Button
          size="small"
          variant="contained"
          disabled={isPending}
          onClick={() => void handleSerialWorkflowAction(serial, actionKey)}
          sx={{
            minWidth: 88,
            textTransform: "none",
            borderRadius: 2,
            boxShadow: "none",
            fontSize: "0.72rem",
            px: 1,
            py: 0.4,
          }}
        >
          {isPending ? "Working..." : actionMeta.label}
        </Button>
      </TableCell>
    );
  };

  return (
    <Box sx={{ px: { xs: 0.5, md: 1 }, py: 1 }}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ mb: 2.5 }}>
        <Card sx={{ ...cardSx, flex: 1 }}>
          <Box sx={{ p: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Serial Register
            </Typography>
            <Typography variant="h6" fontWeight={800}>
              {serialsCount} serials logged
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Each serial child can drive manufacturing, issue and label workflow.
            </Typography>
          </Box>
        </Card>
        <Card sx={{ ...cardSx, flex: 1 }}>
          <Box sx={{ p: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Dispatch Readiness
            </Typography>
            <Typography variant="h6" fontWeight={800}>
              {row.actions?.printLabel?.enabled
                ? "Ready for label print"
                : "Not ready for label print"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Work order {row.wo_no || "--"} with target dispatch{" "}
              {formatDate(row.client_delivery_date)}.
            </Typography>
          </Box>
        </Card>
      
        <Card sx={{ ...cardSx, flex: 1 }}>
          <Box sx={{ p: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Ordered Item
            </Typography>
            <Typography variant="h6" fontWeight={800}>
              {row.item_code}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {row.description || "--"}
            </Typography>
          </Box>
        </Card>
        <Card sx={{ ...cardSx, flex: 1 }}>
          <Box sx={{ p: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Line Snapshot
            </Typography>
            <Typography variant="h6" fontWeight={800}>
              Qty {row.quantity}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Ship to {row.ship_to_location || "--"} | Status{" "}
              {meta[row.status]?.label || row.status}
            </Typography>
          </Box>
        </Card>
      </Stack>

      <Typography variant="body1" fontWeight={800} sx={{ mb: 1.5, color: "text.primary" }}>
        Serial Number Wise Child Items
      </Typography>
      <TableContainer
        sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, bgcolor: "#FFF" }}
      >
        <Table size="small">
          <TableHead>
            <TableRow
              sx={{
                "& th": {
                  bgcolor: "#F8FAFC",
                  color: "#475569",
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                },
              }}
            >
              <TableCell>Serial No</TableCell>
              <TableCell>{dateHeaderLabel("Ass Rel")}</TableCell>
              <TableCell>{dateHeaderLabel("Ac Ua")}</TableCell>
              <TableCell>{dateHeaderLabel("Qc")}</TableCell>
              <TableCell>{dateHeaderLabel("Ac Comp")}</TableCell>
              <TableCell>{dateHeaderLabel("Ac Pk")}</TableCell>
              <TableCell>{dateHeaderLabel("Ac Ds")}</TableCell>
              <TableCell>{dateHeaderLabel("Tent Rel")}</TableCell>
              <TableCell>{dateHeaderLabel("Ac Ho")}</TableCell>
              <TableCell>{dateHeaderLabel("Ac Ca")}</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Sh Type</TableCell>
              <TableCell>Sh Item</TableCell>
              <TableCell>Rpm</TableCell>
              <TableCell>Motor Serial No</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {serialRows.length ? (
              serialRows.map((serial) => (
                <TableRow key={serial.serial_no} hover>
                  <TableCell>
                    <Typography fontWeight={700}>{serial.serial_no}</Typography>
                  </TableCell>
                  <TableCell>{formatDate(serial.ass_rel_date)}</TableCell>
                  {renderSerialWorkflowCell(serial, "acUa")}
                  {renderSerialWorkflowCell(serial, "acQc")}
                  {renderSerialWorkflowCell(serial, "acComp")}
                  {renderSerialWorkflowCell(serial, "acPk")}
                  {renderSerialWorkflowCell(serial, "acDs")}
                  <TableCell>{formatDate(serial.tent_rel_date)}</TableCell>
                  <TableCell>{formatDate(serial.ac_ho_date)}</TableCell>
                  <TableCell>{formatDate(serial.ac_ca_date)}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={meta[serial.status || ""]?.label || serial.status}
                      sx={{
                        bgcolor: meta[serial.status || ""]?.bg || "#ccc",
                        color: meta[serial.status || ""]?.color || "#000",
                        fontWeight: 700,
                      }}
                    />
                  </TableCell>
                  <TableCell>{serial.sh_type || "--"}</TableCell>
                  <TableCell>{serial.sh_item || "--"}</TableCell>
                  <TableCell>{serial.rpm || "--"}</TableCell>
                  <TableCell>{serial.motor_serial_no || "--"}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={15} align="center" sx={{ py: 4 }}>
                  <Typography fontWeight={700}>Serials not generated yet.</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Start with work order approval, then enable serial number generation.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

function Row({
  row,
  onOpenSerialDrawer,
  onAction,
}: {
  row: LineItemRow;
  onOpenSerialDrawer: (row: LineItemRow) => void;
  onAction: (row: LineItemRow, actionKey: ActionKey) => void;
}) {
  const serialsCount = row.quantitys?.length || 0;
  const coverage = Math.min(
    100,
    Math.round((serialsCount / Math.max(row.quantity || 1, 1)) * 100)
  );
  const statusMeta = meta[row.status] || meta.PL;
  const handleOpenSerialDrawer = () => onOpenSerialDrawer(row);
  const stopRowToggle = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
  };

  return (
    <TableRow
      hover
      onClick={handleOpenSerialDrawer}
      sx={{
        "& > *": {
          verticalAlign: "top",
          borderColor: "divider",
        },
        cursor: "pointer",
      }}
    >
      <TableCell sx={{ minWidth: 70 }}>
        <Typography fontWeight={700}>{row.line_no}</Typography>
        <Typography variant="caption" color="text.secondary">
          {row.lineId || "--"}
        </Typography>
      </TableCell>
      <TableCell sx={{ minWidth: 270 }}>
        <Typography fontWeight={700}>{row.item_code}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {row.description}
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1.25 }}>
          <Tooltip title={`Ship to ${row.ship_to_location}`}>
            <Chip
              size="small"
              label={row.ship_to_location}
              sx={{ bgcolor: "#EFF6FF", color: "#1D4ED8", fontWeight: 700 }}
            />
          </Tooltip>
          <Tooltip title={row.road_permit ? "Road Permit Required" : "Road Permit Not Required"}>
            <Chip
              size="small"
              label={row.road_permit ? "Road Permit Required" : "Road Permit Not Required"}
              variant="outlined"
            />
          </Tooltip>
        </Stack>
      </TableCell>
      <TableCell sx={{ minWidth: 90 }}>
        <Typography fontWeight={700}>{row.quantity}</Typography>
        <Typography variant="caption" color="text.secondary">
          {" "}
          units
        </Typography>
      </TableCell>
      <TableCell sx={{ minWidth: 150 }}>
        <Typography fontWeight={700}>{formatAmount(row.selling_price)}</Typography>
        <Typography variant="caption" color="text.secondary" display="block">
          List {formatAmount(row.list_price)}
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block">
          Discount {row.discount_percent}%
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block">
          Amount {formatAmount(row.amount)}
        </Typography>
      </TableCell>
      <TableCell sx={{ minWidth: 130 }}>
        <Typography fontWeight={700}>{formatDate(row.client_delivery_date)}</Typography>
        <Typography variant="caption" color="text.secondary" display="block">
          Month {row.delivery_month || "--"}
        </Typography>
      </TableCell>
      <TableCell sx={{ minWidth: 125 }}>
        <Typography fontWeight={700}>{row.wo_no || "--"}</Typography>
        <Typography variant="caption" color="text.secondary" display="block">
          WO Date {formatDate(row.wo_date)}
        </Typography>
      </TableCell>
      <TableCell sx={{ minWidth: 130 }}>
        <Chip
          label={statusMeta.label || row.status}
          size="small"
          sx={{ bgcolor: statusMeta.bg, color: statusMeta.color, fontWeight: 800, mb: 1 }}
        />
        <Typography variant="caption" color="text.secondary" display="block">
          {serialsCount} serials | {coverage}% mapped
        </Typography>
      </TableCell>

      <TableCell sx={{ minWidth: 280 }}>
        <Stack direction="column" spacing={0.3} flexWrap="wrap" useFlexGap>
          {row.actions &&
            (Object.entries(row.actions) as [string, ActionConfig][]).map(([key, action]) =>
              action.visible ? (
                <Tooltip
                  key={key}
                  title={
                    action.enabled
                      ? action.label
                      : `${action.label} available after next stage`
                  }
                >
                  <span onClick={stopRowToggle}>
                    <Button
                      size="small"
                      variant={action.enabled ? "contained" : "outlined"}
                      disabled={!action.enabled}
                      onClick={(event) => {
                        event.stopPropagation();
                        onAction(row, key as ActionKey);
                      }}
                      startIcon={
                        actionIcon[key] || (
                          <PrecisionManufacturingOutlinedIcon fontSize="small" />
                        )
                      }
                      sx={{
                        minWidth: 122,
                        justifyContent: "flex-start",
                        textTransform: "none",
                        borderRadius: 2,
                        boxShadow: "none",
                        ...(action.enabled
                          ? { bgcolor: "#0F172A", "&:hover": { bgcolor: "#1E293B" } }
                          : { borderColor: "divider", color: "text.disabled" }),
                      }}
                    >
                      {action.label}
                    </Button>
                  </span>
                </Tooltip>
              ) : null
            )}
        </Stack>
      </TableCell>
    </TableRow>
  );
}

function Index({ orderDetails, onOrderUpdated }: LineItemsProps) {
  const { openModal } = useModal();
  const { showToast } = useToast();
  const [createWorkOrder] = useCreateWorkOrderMutation();
  const [generateSerialNumbers] = useGenerateSerialNumbersMutation();
  const [issueMaterial] = useIssueMaterialMutation();
  const [printLabel] = usePrintLabelMutation();
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: null,
    endDate: null,
  });
  const [status, setStatus] = useState("");
  const [location, setLocation] = useState("");
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(1);
  const [rowOverrides, setRowOverrides] = useState<Record<string, LineItemOverride>>({});
  const [rows, setRows] = useState<LineItemRow[]>(() => sampleRows(orderDetails, rowOverrides));
  const rowsPerPage = 4;

  useEffect(() => {
    setRows(sampleRows(orderDetails, rowOverrides));
  }, [orderDetails, rowOverrides]);

  const statusOptions = useMemo(
    () => [
      { value: "", label: "All Status" },
      ...Array.from(new Set(rows.map((row) => row.status))).map((value) => ({
        value,
        label: meta[value]?.label || value,
      })),
    ],
    [rows]
  );

  const locationOptions = useMemo(
    () => [
      { value: "", label: "All Locations" },
      ...Array.from(new Set(rows.map((row) => row.ship_to_location))).map((value) => ({
        value,
        label: value,
      })),
    ],
    [rows]
  );

  const filteredRows = useMemo(() => {
    const q = searchText.trim().toLowerCase();

    const inRange = (value: string | null) => {
      if (!dateRange.startDate || !dateRange.endDate) return true;
      const date = parseDate(value);
      if (!date) return false;
      const start = new Date(dateRange.startDate);
      const end = new Date(dateRange.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return date >= start && date <= end;
    };

    return rows.filter((row) => {
      const haystack = [
        row.line_no,
        row.item_code,
        row.description,
        row.wo_no,
        row.ship_to_location,
        row.status,
        row.mail_status,
        ...(row.quantitys || []).map((serial) => serial.serial_no),
      ]
        .join(" ")
        .toLowerCase();

      return (
        (!q || haystack.includes(q)) &&
        (!status || row.status === status) &&
        (!location || row.ship_to_location === location) &&
        inRange(row.client_delivery_date)
      );
    });
  }, [dateRange, location, rows, searchText, status]);

  const pagedRows = useMemo(
    () => filteredRows.slice((page - 1) * rowsPerPage, page * rowsPerPage),
    [filteredRows, page]
  );

  const summary = useMemo(
    () => ({
      qty: rows.reduce((sum, row) => sum + (row.quantity || 0), 0),
      amount: rows.reduce((sum, row) => sum + (row.amount || 0), 0),
      serials: rows.reduce((sum, row) => sum + (row.quantitys?.length || 0), 0),
      issueReady: rows.filter((row) => row.actions?.issueMaterial?.enabled).length,
      labelReady: rows.filter((row) => row.actions?.printLabel?.enabled).length,
    }),
    [rows]
  );

  const currentOrder = orderDetails?.order;
  const currentCustomer = orderDetails?.order_information?.main?.customer;

  const salesOrderNo = currentOrder?.order_number || "N/A";
  const customerCode = currentCustomer?.customer_number || "N/A";

  const tiles = [
    {
      title: "TOTAL GEAR QTY",
      value: String(summary.qty),
      caption: "Across all line items",
      icon: <PrecisionManufacturingOutlinedIcon />,
      accent: "#1D4ED8",
    },
    {
      title: "SERIALS CREATED",
      value: String(summary.serials),
      caption: "Child items registered",
      icon: <QrCode2OutlinedIcon />,
      accent: "#0F766E",
    },
    {
      title: "READY FOR LABEL",
      value: String(summary.labelReady),
      caption: "Lines ready to print",
      icon: <LocalPrintshopOutlinedIcon />,
      accent: "#7C3AED",
    },
    {
      title: "ORDER VALUE",
      value: formatAmount(summary.amount),
      caption: "Net selling value",
      icon: <CurrencyRupeeOutlinedIcon />,
      accent: "#B45309",
    },
  ];

  const handleSerialUpdated = (
    lineId: number,
    serialNo: string,
    updates: Partial<SerialItem>,
  ) => {
    setRows((current) =>
      current.map((currentRow) =>
        currentRow.lineId === lineId
          ? {
              ...currentRow,
              quantitys: (currentRow.quantitys || []).map((serial) =>
                serial.serial_no === serialNo
                  ? {
                      ...serial,
                      ...updates,
                    }
                  : serial,
              ),
            }
          : currentRow,
      ),
    );
  };

  const handleOpenSerialDrawer = (row: LineItemRow) => {
    openModal({
      title: `Line ${row.line_no} Serial Numbers`,
      width: "calc(100% - 180px)",
      showCloseButton: true,
      askDataChangeConfirm: false,
      component: (modalProps: any) => (
        <SerialNumberDrawer
          {...modalProps}
          row={row}
          orderDetails={orderDetails}
          onSerialUpdated={handleSerialUpdated}
        />
      ),
    });
  };

  const handleRowAction = async (row: LineItemRow, actionKey: ActionKey) => {
    if (actionKey === "edit") {
      showToast("Line item edit API is not available yet", "warning");
      return;
    }

    try {
      let successMessage = "Line item action completed";

      if (actionKey === "workOrder") {
        const response = await createWorkOrder({
          ...getBarcodeDefaultContext(),
          LINE_ID: row.lineId,
          order_type: String(currentOrder?.order_type || ""),
        }).unwrap();
        if (response?.status === true || response?.status === 1) {
          const workOrderData = (response?.data || {}) as BarcodeCreateWorkOrderResponseData;
          const nextWoNo = String(workOrderData.WONO || "");
          const nextWoDate = workOrderData.WONODATE || null;

          setRowOverrides((current) => ({
            ...current,
            [String(row.lineId)]: {
              ...current[String(row.lineId)],
              wo_no: nextWoNo,
              wo_date: nextWoDate,
              forceEnableSerialNumber: true,
            },
          }));

          setRows((current) =>
            current.map((currentRow) =>
              currentRow.id === row.id
                ? {
                    ...currentRow,
                    wo_no: nextWoNo,
                    wo_date: nextWoDate,
                  actions: actionSet(currentRow.status, {
                      forceEnableSerialNumber: true,
                      hasWorkOrder: Boolean(nextWoNo),
                      hasSerialNumbers: Boolean(currentRow.quantitys?.length),
                      materialIssued: Boolean(
                        rowOverrides[String(currentRow.lineId)]?.materialIssued
                      ),
                    }),
                  }
                : currentRow
            )
          );
        }

        successMessage =
          response?.data?.Massage ||
          response?.message ||
          "Work order processed successfully";
      }

      if (actionKey === "serialNumber") {
        const response = await generateSerialNumbers({
          DIVISION_ID: barcodeDefaults.divisionId,
          LINE_ID: row.lineId,
        }).unwrap();
        const generatedSerials = Array.isArray((response?.data as any)?.serial_line_items)
          ? ((response?.data as any).serial_line_items as any[]).map(mapSerialItem)
          : [];

        if (generatedSerials.length) {
          setRows((current) =>
            current.map((currentRow) =>
              currentRow.id === row.id
                ? {
                    ...currentRow,
                    quantitys: generatedSerials,
                    actions: actionSet(currentRow.status, {
                      forceEnableSerialNumber:
                        rowOverrides[String(currentRow.lineId)]?.forceEnableSerialNumber,
                      hasWorkOrder: Boolean(
                        (rowOverrides[String(currentRow.lineId)]?.wo_no ?? currentRow.wo_no) || ""
                      ),
                      hasSerialNumbers: generatedSerials.length > 0,
                      materialIssued: Boolean(
                        rowOverrides[String(currentRow.lineId)]?.materialIssued
                      ),
                    }),
                  }
                : currentRow
            )
          );
        }

        successMessage = response?.message || "Serial numbers generated successfully";
      }

      if (actionKey === "issueMaterial") {
        const response = await issueMaterial({
          ...getBarcodeDefaultContext(),
          LINE_ID: row.lineId,
        }).unwrap();

        setRowOverrides((current) => ({
          ...current,
          [String(row.lineId)]: {
            ...current[String(row.lineId)],
            materialIssued: true,
          },
        }));

        setRows((current) =>
          current.map((currentRow) =>
            currentRow.id === row.id
              ? {
                  ...currentRow,
                  actions: actionSet(currentRow.status, {
                    forceEnableSerialNumber:
                      rowOverrides[String(currentRow.lineId)]?.forceEnableSerialNumber,
                    hasWorkOrder: Boolean(
                      (rowOverrides[String(currentRow.lineId)]?.wo_no ?? currentRow.wo_no) || ""
                    ),
                    hasSerialNumbers: Boolean(currentRow.quantitys?.length),
                    materialIssued: true,
                  }),
                }
              : currentRow
          )
        );

        successMessage = response?.message || "Material issue processed successfully";
      }

      if (actionKey === "printLabel") {
        if (!row.wo_no) {
          showToast("Work order number missing for label print", "warning");
          return;
        }

        const response = await printLabel({
          WONO: row.wo_no,
          Line_Id: row.lineId,
          ORGANIZATION_ID: row.orgId ?? barcodeDefaults.organizationId,
          ORDER_LINE_NO:
            Number.isFinite(Number(row.line_no)) ? Number(row.line_no) : row.line_no,
        }).unwrap();

        if (response?.blob) {
          await printPdfBlob(response.blob, {
            fileName: response.fileName || `label-${row.wo_no}.pdf`,
          });
          successMessage = "Label PDF opened in print dialog";
        } else {
          successMessage = response?.message || "Print label request submitted successfully";
        }
      }

      await onOrderUpdated?.();
      showToast(successMessage, "success");
    } catch (error: any) {
      const message =
        error?.data?.message || error?.error || "Unable to process line action";
      showToast(message, "error");
    }
  };

  return (
    <Stack spacing={1}>
      <Box>
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          spacing={2}
        >
          <Box>
            <PageHeader title={`Sales Order ${salesOrderNo} / ${customerCode}`} />
          </Box>
          <Stack direction="row" spacing={1.25} flexWrap="wrap" useFlexGap>
            <Chip
              icon={<WarehouseOutlinedIcon />}
              label={`${rows.length} line items`}
              sx={{ bgcolor: "rgba(255,255,255,0.12)", height: 34 }}
            />
            <Chip
              icon={<RouteOutlinedIcon />}
              label={`${summary.issueReady} ready for issue`}
              sx={{ bgcolor: "rgba(255,255,255,0.12)", height: 34 }}
            />
          </Stack>
        </Stack>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)", lg: "repeat(4, 1fr)" },
          gap: 2,
        }}
      >
        {tiles.map((tile) => (
          <Card key={tile.title} sx={{ ...cardSx, height: "100%" }}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ p: 2 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  display: "grid",
                  placeItems: "center",
                  color: tile.accent,
                  bgcolor: alpha(tile.accent, 0.12),
                }}
              >
                {tile.icon}
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  {tile.title}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                  <Typography variant="h6" fontWeight={800}>
                    {tile.value}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    {tile.caption}
                  </Typography>
                </Box>
              </Box>
            </Stack>
          </Card>
        ))}
      </Box>

      <FormSection
        title="Filters"
        description="Narrow down line items by date, status, or keyword"
        icon={<FilterListOutlinedIcon fontSize="small" />}
        accentColor="#0891B2"
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1.2fr 0.8fr 0.8fr 1fr" },
            gap: 2,
          }}
        >
          <MuiDateRangePicker
            value={dateRange}
            onChange={(range) => {
              setDateRange(range);
              setPage(1);
            }}
          />
          <MuiTextField
            label="Search line / WO / serial"
            value={searchText}
            onChange={(event) => {
              setSearchText(event.target.value);
              setPage(1);
            }}
          />
          <MuiSelect
            label="Status"
            options={statusOptions}
            value={status}
            onChange={(event) => {
              setStatus(String(event.target.value));
              setPage(1);
            }}
          />
          <MuiSelect
            label="Ship To Location"
            options={locationOptions}
            value={location}
            onChange={(event) => {
              setLocation(String(event.target.value));
              setPage(1);
            }}
          />
        </Box>
      </FormSection>

      <FormSection
        title="Sales Order Line Items"
        description="Click any line item to open its serial-number child records in a child drawer"
        icon={<ViewListOutlinedIcon fontSize="small" />}
        accentColor="#1D4ED8"
      >
        <Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow
                  sx={{
                    "& th": {
                      bgcolor: "#F8FAFC",
                      color: "#475569",
                      fontSize: "0.78rem",
                      fontWeight: 800,
                      whiteSpace: "nowrap",
                    },
                  }}
                >
                  <TableCell>Line</TableCell>
                  <TableCell>Ordered Item</TableCell>
                  <TableCell>Qty</TableCell>
                  <TableCell>Commercial</TableCell>
                  <TableCell>Delivery</TableCell>
                  <TableCell>Work Order</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pagedRows.map((row) => (
                  <Row
                    key={row.id}
                    row={row}
                    onOpenSerialDrawer={handleOpenSerialDrawer}
                    onAction={handleRowAction}
                  />
                ))}
                {!pagedRows.length && (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 7 }}>
                      <Typography variant="h6" fontWeight={800}>
                        No line items matched the current filters.
                      </Typography>
                      <Typography color="text.secondary">
                        Try clearing date or status filters to see the full execution board.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 2,
              p: 1.75,
              borderTop: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Showing {pagedRows.length} of {filteredRows.length} filtered line items
            </Typography>
            <Pagination
              count={Math.max(1, Math.ceil(filteredRows.length / rowsPerPage))}
              page={page}
              onChange={(_, value) => setPage(value)}
              size="small"
              color="primary"
            />
          </Box>
        </Box>
      </FormSection>
    </Stack>
  );
}

export const LineItems = memo(Index);
