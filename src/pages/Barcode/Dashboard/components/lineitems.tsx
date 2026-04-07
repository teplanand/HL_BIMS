import React, { memo, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  Chip,
  Collapse,
  IconButton,
  LinearProgress,
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
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
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
import { MuiDateRangePicker, MuiSelect, MuiTextField } from "../../../../components/mui/input";
import { PageHeader } from "../../../../components/ui/form/stack";
import FormSection from "../../../../components/ui/form/FormSection";
import { useModal } from "../../../../hooks/useModal";
import { salesorderslineitems } from "../data";
import { openEntityFormModal } from "../../../Warehouse/shared/openEntityFormModal";
import { EditListItem, EditListItemRef } from "./editlistitem";

type LineItemsProps = { defaultValues?: any };
type StatusCode = "PL" | "SH" | "MI" | "PK" | "BOOKED" | string;
type ActionKey = "workOrder" | "serialNumber" | "issueMaterial" | "printLabel" | "edit";

type ActionConfig = {
  visible: boolean;
  enabled: boolean;
  label: string;
  mode?: string;
};

type SerialItem = {
  serial_no: string;
  status: string | null;
  sh_type: string | null;
  sh_item: string | null;
  ass_rel_date: string | null;
  ac_ua_date: string | null;
  ac_comp_date: string | null;
  ac_pk_date: string | null;
  tent_rel_date: string | null;
  rpm: string | null;
  motor_serial_no: string | null;
  ac_ds_date?: string | null;
  ac_ho_date?: string | null;
  ac_ca_date?: string | null;
};

type LineItemRow = {
  id: string; // added manually for datagrid row id toggle feature
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
  wo_date: string;
  client_delivery_date: string | null;
  delivery_month: string | null;
  con_auth: string | null;
  status: StatusCode;
  mail_status?: string;
  quantitys?: SerialItem[];
  actions?: Record<string, ActionConfig>;
};

const meta: Record<string, { label: string; bg: string; color: string; accent: string }> = {
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

const actionSet = (status: StatusCode): Record<ActionKey, ActionConfig> => ({
  workOrder: { visible: true, enabled: true, label: status === "PL" ? "Create WO" : "View WO" },
  serialNumber: { visible: true, enabled: status !== "PL", label: "Serial No" },
  issueMaterial: { visible: true, enabled: status !== "PL", label: "Issue Material" },
  printLabel: { visible: true, enabled: status === "MI" || status === "PK", label: "Print Label" },
  edit: { visible: true, enabled: true, label: "Edit" },
});

const editStatusOptions = [
  { value: "Hold", label: "Hold" },
  { value: "Planning", label: "Planning" },
  { value: "Sortage", label: "Sortage" },
  { value: "Actual Release", label: "Actual Release" },
  { value: "Cancel", label: "Cancel" },
];

const sampleRows = (defaultValues: any): LineItemRow[] => {
  // Mapping all line_items from JSON and adding a unique `id`.
  return (salesorderslineitems.salesOrders || []).flatMap((order: any) =>
    (order.line_items || []).map((line: any) => ({
      ...line,
      id: `${order.order?.order_number || ""}-${line.line_no}`,
      description: line.description || "Description not available",
      actions: line.actions || actionSet(line.status),
      quantitys: line.quantitys || [],
    }))
  );
};

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
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value || 0);

const dateHeaderLabel = (label: string) => (
  <Stack direction="row" spacing={0.5} alignItems="center">
    <Box component="span">{label}</Box>
    <CalendarMonthOutlinedIcon sx={{ fontSize: 15 }} />
  </Stack>
);

// ─── Row Component ───────────────────────────────────────────────────
function Row({
  row,
  open,
  onToggle,
  onAction,
}: {
  row: LineItemRow;
  open: boolean;
  onToggle: (rowId: string) => void;
  onAction: (row: LineItemRow, actionKey: ActionKey) => void;
}) {
  const serialsCount = row.quantitys?.length || 0;
  const coverage = Math.min(100, Math.round((serialsCount / Math.max(row.quantity || 1, 1)) * 100));
  const statusMeta = meta[row.status] || meta["PL"];
  const handleRowToggle = () => onToggle(row.id);
  const stopRowToggle = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
  };

  return (
    <>
      <TableRow
        hover
        onClick={handleRowToggle}
        sx={{
          "& > *": {
            verticalAlign: "top",
            borderColor: "divider",
            borderBottom: open ? "none" : undefined,
          },
          bgcolor: open ? alpha(statusMeta.accent, 0.04) : "transparent",
          cursor: "pointer",
        }}
      >
        <TableCell width={52}>
          <IconButton
            size="small"
            onClick={(event) => {
              event.stopPropagation();
              handleRowToggle();
            }}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell sx={{ minWidth: 70 }}>
          <Typography fontWeight={700}>{row.line_no}</Typography>
          <Typography variant="caption" color="text.secondary">{row.con_auth || "--"}</Typography>
        </TableCell>
        <TableCell sx={{ minWidth: 270 }}>
          <Typography fontWeight={700}>{row.item_code}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{row.description}</Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1.25 }}>
            <Chip size="small" label={row.ship_to_location} sx={{ bgcolor: "#EFF6FF", color: "#1D4ED8", fontWeight: 700 }} />
            <Chip size="small" label={row.road_permit ? "Road Permit Required" : "Road Permit Not Required"} variant="outlined" />
          </Stack>
        </TableCell>
        <TableCell sx={{ minWidth: 90 }}>
          <Typography fontWeight={700}>{row.quantity}</Typography>
          <Typography variant="caption" color="text.secondary">  units</Typography>
        </TableCell>
        <TableCell sx={{ minWidth: 150 }}>
          <Typography fontWeight={700}>{formatAmount(row.selling_price)}</Typography>
          <Typography variant="caption" color="text.secondary" display="block">List {formatAmount(row.list_price)}</Typography>
          <Typography variant="caption" color="text.secondary" display="block">Discount {row.discount_percent}%</Typography>
          <Typography variant="caption" color="text.secondary" display="block">Amount {formatAmount(row.amount)}</Typography>
        </TableCell>
        <TableCell sx={{ minWidth: 130 }}>
          <Typography fontWeight={700}>{formatDate(row.client_delivery_date)}</Typography>
          <Typography variant="caption" color="text.secondary" display="block">WO Date {formatDate(row.wo_date)}</Typography>
          <Typography variant="caption" color="text.secondary" display="block">Month {row.delivery_month || "--"}</Typography>
        </TableCell>
        <TableCell sx={{ minWidth: 125 }}>
          <Typography fontWeight={700}>{row.wo_no || "--"}</Typography>
          <Typography variant="caption" color="text.secondary">{row.mail_status || "--"}</Typography>
        </TableCell>
        <TableCell sx={{ minWidth: 130 }}>
          <Chip label={statusMeta?.label || row.status} size="small" sx={{ bgcolor: statusMeta?.bg, color: statusMeta?.color, fontWeight: 800, mb: 1 }} />
        </TableCell>
         
        <TableCell sx={{ minWidth: 280 }}>
          <Stack direction="column" spacing={0.3} flexWrap="wrap" useFlexGap>
            {row.actions && (Object.entries(row.actions) as [string, ActionConfig][]).map(([key, action]) =>
              action.visible ? (
                <Tooltip key={key} title={action.enabled ? action.label : `${action.label} available after next stage`}>
                  <span onClick={stopRowToggle}>
                    <Button
                      size="small"
                      variant={action.enabled ? "contained" : "outlined"}
                      disabled={!action.enabled}
                      onClick={(event) => {
                        event.stopPropagation();
                        onAction(row, key as ActionKey);
                      }}
                      startIcon={actionIcon[key] || <PrecisionManufacturingOutlinedIcon fontSize="small" />}
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
      <TableRow sx={{ bgcolor: open ? alpha(statusMeta.accent, 0.04) : "transparent" }}>
        <TableCell
          colSpan={10}
          sx={{
            py: 0,
            border: "none",
            borderBottom: open ? "1px solid" : "none",
            borderColor: "divider",
          }}
        >
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ px: { xs: 2, md: 3 }, py: 2 }}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ mb: 2.5 }}>
                <Card sx={{ ...cardSx, flex: 1 }}><Box sx={{ p: 2 }}><Typography variant="caption" color="text.secondary">Serial Register</Typography><Typography variant="h6" fontWeight={800}>{serialsCount} serials logged</Typography><Typography variant="body2" color="text.secondary">Each serial child can drive manufacturing, issue and label workflow.</Typography></Box></Card>
                <Card sx={{ ...cardSx, flex: 1 }}><Box sx={{ p: 2 }}><Typography variant="caption" color="text.secondary">Dispatch Readiness</Typography><Typography variant="h6" fontWeight={800}>{row.actions?.printLabel?.enabled ? "Ready for label print" : "Not ready for label print"}</Typography><Typography variant="body2" color="text.secondary">Work order {row.wo_no} with target dispatch {formatDate(row.client_delivery_date)}.</Typography></Box></Card>
              </Stack>
              <Typography variant="body1" fontWeight={800} sx={{ mb: 1.5, color: "text.primary" }}>Serial Number Wise Child Items</Typography>
              <TableContainer sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, bgcolor: "#FFF" }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ "& th": { bgcolor: "#F8FAFC", color: "#475569", fontWeight: 700, whiteSpace: "nowrap" } }}>
                      <TableCell>Serial No</TableCell>
                      <TableCell>{dateHeaderLabel("Ass Rel")}</TableCell>
                      <TableCell>{dateHeaderLabel("Ac Ua")}</TableCell>
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
                    {row.quantitys && row.quantitys.length ? row.quantitys.map((serial) => (
                      <TableRow key={serial.serial_no} hover>
                        <TableCell><Typography fontWeight={700}>{serial.serial_no}</Typography></TableCell>
                        <TableCell>{formatDate(serial.ass_rel_date)}</TableCell>
                        <TableCell>{formatDate(serial.ac_ua_date)}</TableCell>
                        <TableCell>{formatDate(serial.ac_comp_date)}</TableCell>
                        <TableCell>{formatDate(serial.ac_pk_date)}</TableCell>
                        <TableCell>{formatDate(serial.ac_ds_date)}</TableCell>
                        <TableCell>{formatDate(serial.tent_rel_date)}</TableCell>
                         <TableCell>{formatDate(serial.ac_ho_date)}</TableCell>
                        <TableCell>{formatDate(serial.ac_ca_date)}</TableCell>
                        <TableCell><Chip size="small" label={meta[serial.status || ""]?.label || serial.status} sx={{ bgcolor: meta[serial.status || ""]?.bg || "#ccc", color: meta[serial.status || ""]?.color || "#000", fontWeight: 700 }} /></TableCell>
                        <TableCell>{serial.sh_type || "--"}</TableCell>
                        <TableCell>{serial.sh_item || "--"}</TableCell>
                        <TableCell>{serial.rpm || "--"}</TableCell>
                        <TableCell>{serial.motor_serial_no || "--"}</TableCell>
                       
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={14} align="center" sx={{ py: 4 }}>
                          <Typography fontWeight={700}>Serials not generated yet.</Typography>
                          <Typography variant="body2" color="text.secondary">Start with work order approval, then enable serial number generation.</Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

// ─── Main Component ──────────────────────────────────────────────────
function Index({ defaultValues = {} }: LineItemsProps) {
  const { openModal } = useModal();
  const [dateRange, setDateRange] = useState<DateRange>({ startDate: null, endDate: null });
  const [status, setStatus] = useState("");
  const [location, setLocation] = useState("");
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(1);
  const [openRowId, setOpenRowId] = useState<string | null>(null);
  const [rows, setRows] = useState<LineItemRow[]>(() => sampleRows(defaultValues));
  const rowsPerPage = 4;

  useEffect(() => {
    setRows(sampleRows(defaultValues));
  }, [defaultValues]);

  const statusOptions = useMemo(() => [{ value: "", label: "All Status" }, ...Array.from(new Set(rows.map((row) => row.status))).map((value) => ({ value, label: meta[value]?.label || value }))], [rows]);
  const locationOptions = useMemo(() => [{ value: "", label: "All Locations" }, ...Array.from(new Set(rows.map((row) => row.ship_to_location))).map((value) => ({ value, label: value }))], [rows]);
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
      const haystack = [row.line_no, row.item_code, row.description, row.wo_no, row.ship_to_location, row.status, row.mail_status, ...(row.quantitys || []).map((serial) => serial.serial_no)].join(" ").toLowerCase();
      return (!q || haystack.includes(q)) && (!status || row.status === status) && (!location || row.ship_to_location === location) && inRange(row.client_delivery_date);
    });
  }, [dateRange, location, rows, searchText, status]);

  const pagedRows = useMemo(() => filteredRows.slice((page - 1) * rowsPerPage, page * rowsPerPage), [filteredRows, page]);
  const summary = useMemo(() => ({
    qty: rows.reduce((sum, row) => sum + (row.quantity || 0), 0),
    amount: rows.reduce((sum, row) => sum + (row.amount || 0), 0),
    serials: rows.reduce((sum, row) => sum + (row.quantitys?.length || 0), 0),
    issueReady: rows.filter((row) => row.actions?.issueMaterial?.enabled).length,
    labelReady: rows.filter((row) => row.actions?.printLabel?.enabled).length,
  }), [rows]);

  // Using dynamic data from JSON if available
  const currentOrder = salesorderslineitems.salesOrders[0]?.order;
  const currentCustomer = salesorderslineitems.salesOrders[0]?.order_information?.main?.customer;

  const salesOrderNo = currentOrder?.order_number || defaultValues?.salesOrderNo || "N/A";
  const customerCode = currentCustomer?.customer_number || defaultValues?.customerCode || "N/A";

  const tiles = [
    { title: "TOTAL GEAR QTY", value: String(summary.qty), caption: "Across all line items", icon: <PrecisionManufacturingOutlinedIcon />, accent: "#1D4ED8" },
    { title: "SERIALS CREATED", value: String(summary.serials), caption: "Child items registered", icon: <QrCode2OutlinedIcon />, accent: "#0F766E" },
    { title: "READY FOR LABEL", value: String(summary.labelReady), caption: "Lines ready to print", icon: <LocalPrintshopOutlinedIcon />, accent: "#7C3AED" },
    { title: "ORDER VALUE", value: formatAmount(summary.amount), caption: "Net selling value", icon: <CurrencyRupeeOutlinedIcon />, accent: "#B45309" },
  ];

  const handleToggleRow = (rowId: string) => {
    setOpenRowId((current) => (current === rowId ? null : rowId));
  };

  const normalizeRoadPermitValue = (value: string | boolean) => {
    if (typeof value === "boolean") {
      return value;
    }

    return Boolean(value);
  };

  const handleUpdateLineItem = async (
    rowId: string,
    payload: { roadPermit: boolean; deliveryMonth: string; status: string }
  ) => {
    setRows((current) =>
      current.map((row) =>
        row.id === rowId
          ? {
              ...row,
              road_permit: payload.roadPermit,
              delivery_month: payload.deliveryMonth,
              status: payload.status as StatusCode,
              actions: actionSet(payload.status as StatusCode),
            }
          : row
      )
    );
  };

  const handleRowAction = (row: LineItemRow, actionKey: ActionKey) => {
    if (actionKey !== "edit") {
      return;
    }

    openEntityFormModal<EditListItemRef>({
      openModal,
      entityLabel: "Line Item",
      width: 520,
      FormComponent: EditListItem,
      defaultValues: {
        roadPermit: normalizeRoadPermitValue(row.road_permit),
        deliveryMonth: row.delivery_month || "",
        status: row.status || "",
      },
      extraProps: {
        statusOptions: editStatusOptions,
        onSubmitSection: (payload: {
          roadPermit: boolean;
          deliveryMonth: string;
          status: string;
        }) => handleUpdateLineItem(row.id, payload),
      },
    });
  };

  return (
    <Stack spacing={1}>
      {/* ══════════ Header ══════════ */}
      <Box>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
          <Box>
            <PageHeader title={`Sales Order ${salesOrderNo} / ${customerCode}`} />
          </Box>
          <Stack direction="row" spacing={1.25} flexWrap="wrap" useFlexGap>
            <Chip icon={<WarehouseOutlinedIcon />} label={`${rows.length} line items`} sx={{ bgcolor: "rgba(255,255,255,0.12)", height: 34 }} />
            <Chip icon={<RouteOutlinedIcon />} label={`${summary.issueReady} ready for issue`} sx={{ bgcolor: "rgba(255,255,255,0.12)", height: 34 }} />
          </Stack>
        </Stack>
      </Box>

      {/* ══════════ Summary Tiles ══════════ */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", xl: "repeat(4, 1fr)" }, gap: 2 }}>
        {tiles.map((tile) => (
          <Card key={tile.title} sx={{ ...cardSx, height: "100%" }}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ p: 2 }}>
              <Box sx={{ width: 48, height: 48, borderRadius: 2, display: "grid", placeItems: "center", color: tile.accent, bgcolor: alpha(tile.accent, 0.12) }}>{tile.icon}</Box>
              <Box>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>{tile.title}</Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                  <Typography variant="h6" fontWeight={800}>{tile.value}</Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>{tile.caption}</Typography>
                </Box>
              </Box>
            </Stack>
          </Card>
        ))}
      </Box>

      {/* ══════════ Filters ══════════ */}
      <FormSection
        title="Filters"
        description="Narrow down line items by date, status, or keyword"
        icon={<FilterListOutlinedIcon fontSize="small" />}
        accentColor="#0891B2"
      >
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.2fr 0.8fr 0.8fr 1fr" }, gap: 2 }}>
          <MuiDateRangePicker value={dateRange} onChange={(range) => { setDateRange(range); setPage(1); }} />
          <MuiTextField label="Search line / WO / serial" value={searchText} onChange={(event) => { setSearchText(event.target.value); setPage(1); }} />
          <MuiSelect label="Status" options={statusOptions} value={status} onChange={(event) => { setStatus(String(event.target.value)); setPage(1); }} />
          <MuiSelect label="Ship To Location" options={locationOptions} value={location} onChange={(event) => { setLocation(String(event.target.value)); setPage(1); }} />
        </Box>
      </FormSection>

      {/* ══════════ Line Items Table ══════════ */}
      <FormSection
        title="Sales Order Line Items"
        description="Each parent row controls serial-number child items and workflow buttons"
        icon={<ViewListOutlinedIcon fontSize="small" />}
        accentColor="#1D4ED8"

      >
        <Box>


          {/* Table */}
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ "& th": { bgcolor: "#F8FAFC", color: "#475569", fontSize: "0.78rem", fontWeight: 800, whiteSpace: "nowrap" } }}>
                  <TableCell /><TableCell>Line</TableCell><TableCell>Ordered Item</TableCell><TableCell>Qty</TableCell><TableCell>Commercial</TableCell><TableCell>Delivery</TableCell><TableCell>Work Order</TableCell><TableCell>Status</TableCell> <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pagedRows.map((row) => (
                  <Row
                    key={row.id}
                    row={row}
                    open={openRowId === row.id}
                    onToggle={handleToggleRow}
                    onAction={handleRowAction}
                  />
                ))}
                {!pagedRows.length && (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 7 }}>
                      <Typography variant="h6" fontWeight={800}>No line items matched the current filters.</Typography>
                      <Typography color="text.secondary">Try clearing date or status filters to see the full execution board.</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, p: 1.75, borderTop: "1px solid", borderColor: "divider" }}>
            <Typography variant="body2" color="text.secondary">Showing {pagedRows.length} of {filteredRows.length} filtered line items</Typography>
            <Pagination count={Math.max(1, Math.ceil(filteredRows.length / rowsPerPage))} page={page} onChange={(_, value) => setPage(value)} size="small" color="primary" />
          </Box>
        </Box>
      </FormSection>
    </Stack>
  );
}

export const LineItems = memo(Index);
