import { memo, useEffect, useMemo, useState } from "react";
import { Alert, Box, CircularProgress, Tab, Tabs } from "@mui/material";

import OrderForm from "./basicinfo";
import { LineItems } from "./lineitems";
import OtherinfoForm from "./otherinfo";
import { BankDetails } from "./bankdetails";
import {
  getBarcodeDefaultContext,
  useLazyGetSalesOrderDetailsQuery,
} from "../../../../redux/api/barcode";
import {
  BarcodeSalesOrderDetailsViewModel,
  mapSalesOrderDetails,
} from "../barcodeAdapters";

type ViewDetailsProps = {
  defaultValues?: BarcodeSalesOrderDetailsViewModel | null;
  orderNumber?: string;
  setDisplayTitle?: (title: string) => void;
  setDataChanged?: (changed: boolean) => void;
  setHideFooter?: (hidden: boolean) => void;
  setWidth?: (width: number | string) => void;
};

function Index({
  defaultValues = null,
  orderNumber,
  setDisplayTitle,
  setHideFooter,
  setWidth,
}: ViewDetailsProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [triggerGetSalesOrderDetails, salesOrderQuery] =
    useLazyGetSalesOrderDetailsQuery();

  useEffect(() => {
    setDisplayTitle?.("Order Details");
    setHideFooter?.(true);
    setWidth?.(1100);
  }, [setDisplayTitle, setHideFooter, setWidth]);

  useEffect(() => {
    if (!orderNumber) {
      return;
    }

    triggerGetSalesOrderDetails({
      ...getBarcodeDefaultContext(),
      order_number: orderNumber,
    });
  }, [orderNumber, triggerGetSalesOrderDetails]);

  const mappedOrderDetails = useMemo(() => {
    if (salesOrderQuery.data?.data) {
      return mapSalesOrderDetails(salesOrderQuery.data.data);
    }

    return defaultValues;
  }, [defaultValues, salesOrderQuery.data]);

  const handleRefreshOrder = () => {
    if (!orderNumber) {
      return Promise.resolve();
    }

    return triggerGetSalesOrderDetails({
      ...getBarcodeDefaultContext(),
      order_number: orderNumber,
    });
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Tabs
        value={activeTab}
        onChange={(_, value) => setActiveTab(value)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Tab label="Basic Info" />
        <Tab label="Other Info" />
        <Tab label="Bank Details" />
        <Tab label="Line Items" />
      </Tabs>

      <Box>
        {salesOrderQuery.isFetching ? (
          <Box sx={{ py: 6, display: "grid", placeItems: "center" }}>
            <CircularProgress size={28} />
          </Box>
        ) : null}
        {!salesOrderQuery.isFetching && salesOrderQuery.error ? (
          <Alert severity="error">
            Unable to load live sales order details for {orderNumber}.
          </Alert>
        ) : null}
        {!salesOrderQuery.isFetching && !mappedOrderDetails ? (
          <Alert severity="warning">No sales-order data available to display.</Alert>
        ) : null}
        {!salesOrderQuery.isFetching && mappedOrderDetails ? (
          <>
            {activeTab === 0 && <OrderForm orderDetails={mappedOrderDetails} />}
            {activeTab === 1 && <OtherinfoForm orderDetails={mappedOrderDetails} />}
            {activeTab === 2 && <BankDetails orderDetails={mappedOrderDetails} />}
            {activeTab === 3 && (
              <LineItems
                orderDetails={mappedOrderDetails}
                onOrderUpdated={handleRefreshOrder}
              />
            )}
          </>
        ) : null}
      </Box>
    </Box>
  );
}

export const ViewDetails = memo(Index);
