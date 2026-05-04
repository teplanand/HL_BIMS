import React, { useMemo } from "react";
import { Box, Button, Card, CardContent, Grid, Stack, Typography } from "@mui/material";

import SalesOrders from "./components/salesorders";
import { useDialog } from "../../../hooks/useDialog";
import Importsalesorders from "./components/importsalesorders";
import { mapSalesOrdersList } from "./barcodeAdapters";
import {
  useGetSalesOrdersInitQuery,
  useGetSalesOrdersQuery,
} from "../../../redux/api/barcode";

const counterLabelMap: Record<string, string> = {
  totalsalesorder: "Total Sales Orders",
  imported: "Imported",
  generated: "Generated",
  openorders: "Open Orders",
  newimportsalse: "New Import Sales",
};

const counterColorMap: Record<string, string> = {
  totalsalesorder: "#1D4ED8",
  imported: "#D97706",
  generated: "#0891B2",
  openorders: "#059669",
  newimportsalse: "#7C3AED",
};

const normalizeCounterKey = (key: string) => key.replace(/[\s_-]/g, "").toLowerCase();

const getCounterLabel = (key: string) => {
  const normalizedKey = normalizeCounterKey(key);
  if (counterLabelMap[normalizedKey]) {
    return counterLabelMap[normalizedKey];
  }

  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const toCounterValue = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : value;
  }

  if (typeof value === "boolean") {
    return value ? 1 : 0;
  }

  return 0;
};

const BarcodeDashboard = () => {
  const { openDialog } = useDialog();
  const {
    data: salesOrdersResponse,
    isLoading,
    refetch: refetchSalesOrders,
  } = useGetSalesOrdersQuery();
  const {
    data: initResponse,
    isLoading: isInitLoading,
    refetch: refetchInit,
  } = useGetSalesOrdersInitQuery();
  const salesOrders = useMemo(
    () => mapSalesOrdersList(salesOrdersResponse?.data ?? salesOrdersResponse),
    [salesOrdersResponse]
  );

  const fallbackDashboardStats = useMemo(() => {
    const totalOrders = salesOrders.length;
    const importedCount = salesOrders.filter((order) => order.importStatus === true).length;
    const generatedCount = salesOrders.filter((order) => order.generateStatus === true).length;
    const openOrderCount = salesOrders.filter(
      (order) => String(order.rawOrderStatus || "").toUpperCase() === "OPEN"
    ).length;

    return [
      {
        key: "total-sales-order",
        title: "Total Sales Orders",
        count: totalOrders,
        color: "#1D4ED8",
      },
      {
        key: "imported",
        title: "Imported",
        count: importedCount,
        color: "#D97706",
      },
      {
        key: "generated",
        title: "Generated",
        count: generatedCount,
        color: "#0891B2",
      },
      {
        key: "open-orders",
        title: "Open Orders",
        count: openOrderCount,
        color: "#059669",
      },
    ];
  }, [salesOrders]);

  const dashboardStats = useMemo(() => {
    const initCounters = initResponse?.data;
    if (!initCounters || Array.isArray(initCounters) || typeof initCounters !== "object") {
      return fallbackDashboardStats;
    }

    return Object.entries(initCounters).map(([key, value]) => {
      const normalizedKey = normalizeCounterKey(key);
      const count = toCounterValue(value);

      return {
        key,
        title: getCounterLabel(key),
        count,
        color: counterColorMap[normalizedKey] || "#1D4ED8",
        showImport: normalizedKey === "newimportsalse" && Number(count || 0) > 0,
      };
    });
  }, [fallbackDashboardStats, initResponse]);

  return (
    <Box>
      <Grid container spacing={2} className="mb-4">
        {dashboardStats.map((card) => (
          <Grid size={{ xs: 12, sm: 3, md: 1 }} key={card.key}>
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
                                  <Importsalesorders
                                    {...modalProps}
                                    onImportCompleted={async () => {
                                      await Promise.all([refetchInit(), refetchSalesOrders()]);
                                    }}
                                  />
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
        salesOrders={salesOrders}
        loading={isLoading || isInitLoading}
        title="Sales Orders"
        summaryBadges={dashboardStats.map((card) => ({
          key: card.key,
          title: card.title,
          count: card.count,
          color: card.color,
        }))}
      />
    </Box>
  );
};

export default BarcodeDashboard;
