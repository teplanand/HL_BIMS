import React, { useMemo, useState } from "react";
import { Box, Button, Chip, Stack } from "@mui/material";
import {
  GridColDef,
  GridFilterModel,
  GridPaginationModel,
  GridRenderCellParams,
  GridSortModel,
} from "@mui/x-data-grid";

import { ViewDetails } from "./viewdetails";
import ReusableDataGrid from "../../../../components/common/ReusableDataGrid";
import { useModal } from "../../../../hooks/useModal";
import { MuiTextField } from "../../../../components/mui/input";
import {
  getBarcodeDefaultContext,
  useLazyGetSalesOrderDetailsQuery,
} from "../../../../redux/api/barcode";
import { useToast } from "../../../../hooks/useToast";
import { BarcodeRecentOrderRow, mapSalesOrderSummaryRow } from "../barcodeAdapters";
import { defaultRecentOrders } from "..";

type RecentSalesOrder = BarcodeRecentOrderRow;

const getStatusColor = (status: RecentSalesOrder["status"]) => {
  switch (status) {
    case "New Sales Order":
      return { bg: "#E1EFFE", color: "#1E429F" };
    case "HOD Review":
      return { bg: "#FEF3C7", color: "#92400E" };
    case "Planning":
      return { bg: "#E0F2FE", color: "#0369A1" };
    case "Dispatched":
      return { bg: "#DEF7EC", color: "#03543F" };
    default:
      return { bg: "#F3F4F6", color: "#374151" };
  }
};

interface SalesOrdersProps {
  recentOrders?: RecentSalesOrder[];
  title?: string;
  onOrderView?: (order: RecentSalesOrder) => void;
  setDisplayTitle?: (title: string) => void;
  setHideFooter?: (hidden: boolean) => void;
  setWidth?: (width: number | string) => void;
}

const SalesOrders = ({
  recentOrders = defaultRecentOrders,
  title,
  onOrderView,
}: SalesOrdersProps) => {
  const { openModal } = useModal();
  const { showToast } = useToast();
  const [triggerGetSalesOrderDetails, { isFetching }] =
    useLazyGetSalesOrderDetailsQuery();
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 5,
  });
  const [sortModel, setSortModel] = useState<GridSortModel>([]);
  const [filterModel, setFilterModel] = useState<GridFilterModel>({
    items: [],
    quickFilterValues: [],
  });
  const [orderNumberInput, setOrderNumberInput] = useState("");

  const loadOrderByNumber = async () => {
    const trimmedOrderNumber = orderNumberInput.trim();
    if (!trimmedOrderNumber) {
      showToast("Enter sales order number first", "warning");
      return;
    }

    try {
      const response = await triggerGetSalesOrderDetails({
        ...getBarcodeDefaultContext(),
        order_number: trimmedOrderNumber,
      }).unwrap();
      const nextOrder = mapSalesOrderSummaryRow(response.data);

      if (!nextOrder) {
        showToast("Sales order details not found", "warning");
        return;
      }

      onOrderView?.(nextOrder);
      setOrderNumberInput("");
      showToast(`Sales order ${nextOrder.orderNumber} loaded`, "success");
    } catch (error: any) {
      const message =
        error?.data?.message || error?.error || "Unable to load sales order";
      showToast(message, "error");
    }
  };

  const openQuickView = (order: RecentSalesOrder): void => {
    onOrderView?.(order);

    openModal({
      title: "Sales Order View",
      width: "calc(100% - 100px)",
      showCloseButton: true,
      askDataChangeConfirm: false,
      component: (modalProps: any) => (
        <ViewDetails {...modalProps} orderNumber={order.orderNumber} />
      ),
    });
  };

  const columns: GridColDef[] = useMemo(
    () => [
      {
        field: "orderId",
        headerName: "Sales Order Number",
        flex: 1,
        minWidth: 140,
      },
      {
        field: "customerName",
        headerName: "Customer Name",
        flex: 1.6,
        minWidth: 220,
      },
      {
        field: "customerId",
        headerName: "Customer ID",
        flex: 1,
        minWidth: 140,
      },
      {
        field: "status",
        headerName: "Status",
        flex: 1,
        minWidth: 160,
        renderCell: (params: GridRenderCellParams<RecentSalesOrder>) => {
          const statusStyle = getStatusColor(
            params.value as RecentSalesOrder["status"]
          );

          return (
            <Chip
              label={params.value}
              size="small"
              sx={{
                backgroundColor: statusStyle.bg,
                color: statusStyle.color,
                fontWeight: 600,
              }}
            />
          );
        },
      },
    ],
    []
  );

  return (
    <Box>
      <ReusableDataGrid
        rows={recentOrders}
        columns={columns}
        totalCount={recentOrders.length}
        loading={false}
        paginationModel={paginationModel}
        setPaginationModel={setPaginationModel}
        sortModel={sortModel}
        setSortModel={setSortModel}
        filterModel={filterModel}
        setFilterModel={setFilterModel}
        title={title || "Sales Orders"}
        refetch={() => {}}
        enableViewToggle={false}
        headerControls={
          <Stack direction={{ xs: "column", md: "row" }} spacing={1} sx={{ width: "100%" }}>
            <MuiTextField
              label="Load Sales Order"
              placeholder="Enter order number"
              value={orderNumberInput}
              onChange={(event) => setOrderNumberInput(event.target.value)}
            />
            <Button
              variant="contained"
              onClick={loadOrderByNumber}
              disabled={isFetching}
              sx={{ minWidth: 150 }}
            >
              {isFetching ? "Loading..." : "Fetch Order"}
            </Button>
          </Stack>
        }
        permissions={{
          create: false,
          edit: false,
          delete: false,
          view: true,
          download: true,
        }}
        uniqueIdField="id"
        onRowClick={openQuickView}
      />
    </Box>
  );
};

export default SalesOrders;
