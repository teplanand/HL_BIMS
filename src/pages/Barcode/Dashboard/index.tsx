import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Button, Card, CardContent, Grid, Stack, Typography } from "@mui/material";

import SalesOrders from "./components/salesorders";
import { useDialog } from "../../../hooks/useDialog";
import Importsalesorders from "./components/importsalesorders";
import { BarcodeRecentOrderRow } from "./barcodeAdapters";

const STORAGE_KEY = "barcode_recent_sales_orders";
const MAX_RECENT_ORDERS = 10;

export const defaultRecentOrders: BarcodeRecentOrderRow[] = [];

const persistRecentOrders = (orders: BarcodeRecentOrderRow[]) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(orders.slice(0, MAX_RECENT_ORDERS))
  );
};

const safeReadRecentOrders = (): BarcodeRecentOrderRow[] => {
  if (typeof window === "undefined") {
    return defaultRecentOrders;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultRecentOrders;
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.length) {
      return defaultRecentOrders;
    }

    return parsed.slice(0, MAX_RECENT_ORDERS);
  } catch {
    return defaultRecentOrders;
  }
};

const BarcodeDashboard = () => {
  const { openDialog } = useDialog();
  const [recentOrders, setRecentOrders] = useState<BarcodeRecentOrderRow[]>([]);

  useEffect(() => {
    setRecentOrders(safeReadRecentOrders());
  }, []);

  const handleOrderView = useCallback((order: BarcodeRecentOrderRow) => {
    setRecentOrders((currentOrders) => {
      const nextOrders = [
        order,
        ...currentOrders.filter(
          (currentOrder) => currentOrder.orderNumber !== order.orderNumber
        ),
      ].slice(0, MAX_RECENT_ORDERS);

      persistRecentOrders(nextOrders);
      return nextOrders;
    });
  }, []);

  const dashboardStats = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const newSalesOrderCount = recentOrders.filter(
      (order) => order.status === "New Sales Order"
    ).length;
    const hodCount = recentOrders.filter(
      (order) => order.status === "HOD Review"
    ).length;
    const planningCount = recentOrders.filter(
      (order) => order.status === "Planning"
    ).length;
    const dispatchThisMonthCount = recentOrders.filter((order) => {
      if (order.status !== "Dispatched") {
        return false;
      }

      const orderDate = new Date(order.createdAt);
      return (
        orderDate.getMonth() === currentMonth &&
        orderDate.getFullYear() === currentYear
      );
    }).length;

    return [
      {
        key: "new-sales-order",
        title: "New Sales Order",
        count: newSalesOrderCount,
        color: "#1D4ED8",
        showImport: true,
      },
      {
        key: "hod",
        title: "HOD",
        count: hodCount,
        color: "#D97706",
      },
      {
        key: "planning",
        title: "Planning",
        count: planningCount,
        color: "#0891B2",
      },
      {
        key: "dispatch",
        title: "Dispatch This Month",
        count: dispatchThisMonthCount,
        color: "#059669",
      },
    ];
  }, [recentOrders]);

  return (
    <Box>
      <Grid container spacing={2} className="mb-4">
        {dashboardStats.map((card) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={card.key}>
            <Card
              sx={{
                height: "100%",
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <CardContent>
                <Stack spacing={2}>
                  <Box>
                    <Typography
                      variant="subtitle2"
                      sx={{ color: "text.secondary", mb: 0.5 }}
                    >
                      {card.title}
                    </Typography>

                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        mt: 1,
                      }}
                    >
                      <Typography
                        variant="h4"
                        sx={{ color: card.color, fontWeight: 700 }}
                      >
                        {card.count}
                      </Typography>

                      {card.showImport ? (
                        <Box>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() =>
                              openDialog({
                                title: "Import Sales Orders",
                                width: 520,
                                showCloseButton: true,
                                component: (modalProps: any) => (
                                  <Importsalesorders {...modalProps} />
                                ),
                              })
                            }
                          >
                            Import
                          </Button>
                        </Box>
                      ) : null}
                    </Box>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <SalesOrders
        recentOrders={recentOrders}
        onOrderView={handleOrderView}
        title="Recently Viewed Sales Orders"
      />
    </Box>
  );
};

export default BarcodeDashboard;
