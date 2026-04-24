import { memo, useMemo, useState } from "react";
import { Alert, Box, Button, Divider, Stack, Typography } from "@mui/material";
import SyncAltOutlinedIcon from "@mui/icons-material/SyncAltOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import { MuiTextField } from "../../../../components/mui/input";
import { FormStack } from "../../../../components/ui/form/stack";
import FormSection from "../../../../components/ui/form/FormSection";
import {
  getBarcodeDefaultContext,
  useImportSalesOrdersMutation,
} from "../../../../redux/api/barcode";
import { useToast } from "../../../../hooks/useToast";

function ImportSalesOrders() {
  const { showToast } = useToast();
  const defaultContext = useMemo(() => getBarcodeDefaultContext(), []);
  const [organizationId, setOrganizationId] = useState(
    String(defaultContext.ORGANIZATION_ID)
  );
  const [divisionId, setDivisionId] = useState(String(defaultContext.DIVISION_ID));
  const [importSalesOrders, { data, isLoading }] = useImportSalesOrdersMutation();

  const handleImport = async () => {
    try {
      const response = await importSalesOrders({
        ORGANIZATION_ID: Number(organizationId),
        DIVISION_ID: Number(divisionId),
      }).unwrap();

      showToast(response.message || "Sales orders import completed", "success");
    } catch (error: any) {
      const message =
        error?.data?.message || error?.error || "Unable to import sales orders";
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

        {data?.status ? (
          <Alert severity="success" icon={<CheckCircleOutlineOutlinedIcon />}>
            {data.message || "Sales orders imported successfully"}
          </Alert>
        ) : null}

        {data?.data ? (
          <FormSection
            title="Latest Import Result"
            description="Backend response returned from the import endpoint."
            accentColor="#059669"
          >
            <Stack spacing={1.25}>
              <Typography variant="body2">
                Header ID: <strong>{data.data.header_id || "--"}</strong>
              </Typography>
              <Typography variant="body2">
                Order Booked Date:{" "}
                <strong>{data.data.order_booked_date || "--"}</strong>
              </Typography>
              <Typography variant="body2">
                Order Type ID: <strong>{data.data.order_type_id || "--"}</strong>
              </Typography>
              <Typography variant="body2">
                Imported Order No: <strong>{String(data.data.ordernumber || "--")}</strong>
              </Typography>
              <Divider />
              <Typography variant="caption" color="text.secondary">
                Current import API returns import metadata only. Detailed order data is
                fetched separately from the sales-order detail API.
              </Typography>
            </Stack>
          </FormSection>
        ) : null}
      </FormStack>
    </Box>
  );
}

export default memo(ImportSalesOrders);
