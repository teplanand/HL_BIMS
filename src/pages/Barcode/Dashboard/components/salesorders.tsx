import React, { useMemo, useState } from "react";
import { Box, Chip } from "@mui/material";
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
import {
  BarcodeRecentOrderRow,
  mapSalesOrderDetails,
  mapSalesOrdersList,
} from "../barcodeAdapters";
import {
  getBarcodeDefaultContext,
  useGetSalesOrdersQuery,
  useLazyGetSalesOrderDetailsQuery,
} from "../../../../redux/api/barcode";

type RecentSalesOrder = BarcodeRecentOrderRow;
const EMPTY_SALES_ORDERS: RecentSalesOrder[] = [];

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

const formatDate = (value?: string) => {
  if (!value) {
    return "--";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-GB");
};

interface SalesOrdersProps {
  salesOrders?: RecentSalesOrder[];
  title?: string;
  loading?: boolean;
  summaryBadges?: Array<{
    key: string;
    title: string;
    count: string | number;
    color?: string;
  }>;
  setDisplayTitle?: (title: string) => void;
  setHideFooter?: (hidden: boolean) => void;
  setWidth?: (width: number | string) => void;
}

const SalesOrders = ({
  salesOrders,
  title,
  loading = false,
  summaryBadges = [],
}: SalesOrdersProps) => {
  const { openModal } = useModal();
  const [triggerOrderDetails] = useLazyGetSalesOrderDetailsQuery();
  const { data: salesOrdersResponse, isLoading: isSalesOrdersLoading } = useGetSalesOrdersQuery(
    undefined,
    {
      skip: salesOrders !== undefined,
    }
  );
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 5,
  });
  const [sortModel, setSortModel] = useState<GridSortModel>([]);
  const [filterModel, setFilterModel] = useState<GridFilterModel>({
    items: [],
    quickFilterValues: [],
  });
  const salesOrderRows = useMemo(() => {
    if (salesOrders !== undefined) {
      return salesOrders;
    }

    if (!salesOrdersResponse) {
      return EMPTY_SALES_ORDERS;
    }

    return mapSalesOrdersList(salesOrdersResponse?.data ?? salesOrdersResponse);
  }, [salesOrders, salesOrdersResponse]);

  const openQuickView = async (order: RecentSalesOrder): Promise<void> => {
    let prefetchedDetails = null;

    try {
      const response = await triggerOrderDetails({
        ...getBarcodeDefaultContext(),
        order_number: order.orderNumber,
      }).unwrap();

      prefetchedDetails = mapSalesOrderDetails(response?.data);
    } catch {
      prefetchedDetails = null;
    }

    openModal({
      title: "Sales Order View",
      width: "calc(100% - 100px)",
      showCloseButton: true,
      askDataChangeConfirm: false,
      component: (modalProps: any) => (
        <ViewDetails
          {...modalProps}
          orderNumber={order.orderNumber}
          defaultValues={prefetchedDetails}
        />
      ),
    });
  };

  const columns: GridColDef[] = useMemo(
    () => [
      {
        field: "orderNumber",
        headerName: "Oracle Order No",
        flex: 1,
        minWidth: 140,
      },
      {
        field: "headerId",
        headerName: "Header ID",
        flex: 1,
        minWidth: 140,
      },
      {
        field: "createdAt",
        headerName: "Booked Date",
        flex: 1,
        minWidth: 140,
        renderCell: (params: GridRenderCellParams<RecentSalesOrder>) =>
          formatDate(String(params.value || "")),
      },
      {
        field: "rawOrderStatus",
        headerName: "Order Status",
        flex: 1,
        minWidth: 160,
        renderCell: (params: GridRenderCellParams<RecentSalesOrder>) => {
          const statusStyle = getStatusColor(
            params.row.status as RecentSalesOrder["status"]
          );

          return (
            <Chip
              label={String(params.value || "--")}
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
      {
        field: "importStatus",
        headerName: "Imported",
        flex: 0.8,
        minWidth: 120,
        renderCell: (params: GridRenderCellParams<RecentSalesOrder>) => (
          <Chip
            label={params.value === true ? "Yes" : params.value === false ? "No" : "--"}
            size="small"
            color={params.value === true ? "success" : "default"}
            variant={params.value === true ? "filled" : "outlined"}
          />
        ),
      },
      {
        field: "generateStatus",
        headerName: "Generated",
        flex: 0.8,
        minWidth: 120,
        renderCell: (params: GridRenderCellParams<RecentSalesOrder>) => (
          <Chip
            label={params.value === true ? "Yes" : params.value === false ? "No" : "--"}
            size="small"
            color={params.value === true ? "info" : "default"}
            variant={params.value === true ? "filled" : "outlined"}
          />
        ),
      },
    ],
    []
  );

  const headerControls = useMemo(
    () => (
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
        {summaryBadges.map((badge) => (
          <Chip
            key={badge.key}
            size="small"
            label={`${badge.count} ${badge.title.toLowerCase()}`}
            sx={{
              fontWeight: 700,
              bgcolor: badge.color ? `${badge.color}1F` : "rgba(59,130,246,0.12)",
              color: badge.color || "#1D4ED8",
            }}
          />
        ))}
      </Box>
    ),
    [summaryBadges],
  );

  return (
    <Box>
      <ReusableDataGrid
        rows={salesOrderRows}
        columns={columns}
        totalCount={salesOrderRows.length}
        loading={loading || isSalesOrdersLoading}
        paginationModel={paginationModel}
        setPaginationModel={setPaginationModel}
        sortModel={sortModel}
        setSortModel={setSortModel}
        filterModel={filterModel}
        setFilterModel={setFilterModel}
        title={title || "Sales Orders"}
        refetch={() => undefined}
        headerControls={summaryBadges.length ? headerControls : undefined}
        enableViewToggle={false}
      
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
