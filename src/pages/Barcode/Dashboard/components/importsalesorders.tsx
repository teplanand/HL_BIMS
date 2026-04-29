import { memo, useState } from "react";
import { Alert, Box, Button, Divider, Stack, Typography } from "@mui/material";
import SyncAltOutlinedIcon from "@mui/icons-material/SyncAltOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import { MuiTextField } from "../../../../components/mui/input";
import { FormStack } from "../../../../components/ui/form/stack";
import FormSection from "../../../../components/ui/form/FormSection";
import { useToast } from "../../../../hooks/useToast";
import {
  BarcodeImportResponseData,
  useImportSalesOrdersMutation,
} from "../../../../redux/api/barcode";

function ImportSalesOrders() {
  const { showToast } = useToast();
  const [organizationId, setOrganizationId] = useState("43");
  const [divisionId, setDivisionId] = useState("374");
  const [data, setData] = useState<{
    status: boolean;
    message: string;
    records: number;
    data: BarcodeImportResponseData[] | null;
  } | null>(null);
  const [importSalesOrders, { isLoading }] = useImportSalesOrdersMutation();

  const handleImport = async () => {
    try {
      const response = await importSalesOrders({
        ORGANIZATION_ID: Number(organizationId),
        DIVISION_ID: Number(divisionId),
      }).unwrap();

      const nextData = {
        status: Boolean(response.status),
        message: response.message || "Import completed",
        records: response.records || 0,
        data: Array.isArray(response.data) ? response.data : null,
      };

      setData(nextData);
      showToast(nextData.message, nextData.status ? "success" : "warning");
    } catch (error: any) {
      const message =
        error?.data?.message || error?.error || "Unable to import sales orders";
      setData({
        status: false,
        message,
        records: 0,
        data: null,
      });
      showToast(message, "error");
    }
  };

  return (
    <Box>
      <FormStack>
        <FormSection
          title="Run Barcode Import"
          description="Trigger barcode sales-order import using the configured organization and division."
          icon={<SyncAltOutlinedIcon fontSize="small" />}
          accentColor="#1D4ED8"
        >
          <Stack spacing={2}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 2,
              }}
            >
              <MuiTextField
                label="Organization ID"
                type="number"
                value={organizationId}
                onChange={(event) => setOrganizationId(event.target.value)}
              />
              <MuiTextField
                label="Division ID"
                type="number"
                value={divisionId}
                onChange={(event) => setDivisionId(event.target.value)}
              />
            </Box>

            <Box>
              <Button variant="contained" onClick={handleImport} disabled={isLoading}>
                {isLoading ? "Importing..." : "Import Sales Orders"}
              </Button>
            </Box>
          </Stack>
        </FormSection>

        {data ? (
          <Alert
            severity={data.status ? "success" : "warning"}
            icon={<CheckCircleOutlineOutlinedIcon />}
          >
            {data.message || "Sales-order import response received"}
          </Alert>
        ) : null}

        {data?.data ? (
          <FormSection
            title="Latest Import Result"
            description="Latest import response from barcode API."
            accentColor="#059669"
          >
            <Stack spacing={1.25}>
              <Typography variant="body2">
                Imported Orders: <strong>{data.records || 0}</strong>
              </Typography>
              <Typography variant="body2">
                Organization ID: <strong>{organizationId || "--"}</strong>
              </Typography>
              <Typography variant="body2">
                Division ID: <strong>{divisionId || "--"}</strong>
              </Typography>
              {data.data.map((order) => (
                <Box
                  key={`${order.header_id}-${order.ordernumber}`}
                  sx={{ p: 1.25, border: "1px solid", borderColor: "divider", borderRadius: 2 }}
                >
                  <Typography variant="body2">
                    Order No: <strong>{String(order.ordernumber || "--")}</strong>
                  </Typography>
                  <Typography variant="body2">
                    Header ID: <strong>{String(order.header_id || "--")}</strong>
                  </Typography>
                  <Typography variant="body2">
                    Customer: <strong>{order.customer_name || "--"}</strong>
                  </Typography>
                  <Typography variant="body2">
                    Customer No: <strong>{order.customer_number || "--"}</strong>
                  </Typography>
                  <Typography variant="body2">
                    Booked Date: <strong>{order.order_booked_date || "--"}</strong>
                  </Typography>
                </Box>
              ))}
              <Divider />
              <Typography variant="caption" color="text.secondary">
                Response is rendered directly from the shape documented in
                `PBL_QRCODE.json`.
              </Typography>
            </Stack>
          </FormSection>
        ) : null}
      </FormStack>
    </Box>
  );
}

export default memo(ImportSalesOrders);
