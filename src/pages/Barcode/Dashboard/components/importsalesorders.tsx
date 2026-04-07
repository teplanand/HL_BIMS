import { memo } from "react";
import {
  Box,
  Alert,
  AlertTitle,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
} from "@mui/material";
import { PageHeader, FormStack } from "../../../../components/ui/form/stack";

const salesOrdersData = [
  { id: 1, soNumber: "SO-2024-001", customer: "Reliance Industries", date: "2024-03-15", amount: "₹ 1,25,000", status: "Imported" },
  { id: 2, soNumber: "SO-2024-002", customer: "Tata Motors", date: "2024-03-16", amount: "₹ 85,400", status: "Imported" },
  { id: 3, soNumber: "SO-2024-003", customer: "Adani Green Energy", date: "2024-03-18", amount: "₹ 2,10,000", status: "Imported" },
  { id: 4, soNumber: "SO-2024-004", customer: "Infosys Ltd", date: "2024-03-19", amount: "₹ 45,000", status: "Imported" },
  { id: 5, soNumber: "SO-2024-005", customer: "Larsen & Toubro", date: "2024-03-20", amount: "₹ 3,20,000", status: "Imported" },
];

function ImportSalesOrders() {
  return (
    <Box>

      <FormStack>
        <Alert severity="success" variant="filled" sx={{ mb: 3 }}>

          Sales orders imported successfully
        </Alert>

        <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2, overflow: "hidden" }}>
          <Table sx={{ minWidth: 650 }} aria-label="sales orders table">
            <TableHead sx={{ bgcolor: "action.hover" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>SO Number</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Customer Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Order Date</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Total Amount</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {salesOrdersData.map((row) => (
                <TableRow
                  key={row.id}
                  sx={{ "&:last-child td, &:last-child th": { border: 0 }, "&:hover": { bgcolor: "action.hover" } }}
                >
                  <TableCell component="th" scope="row" sx={{ fontWeight: 600, color: "primary.main" }}>
                    {row.soNumber}
                  </TableCell>
                  <TableCell>{row.customer}</TableCell>
                  <TableCell>{row.date}</TableCell>
                  <TableCell align="right">{row.amount}</TableCell>
                  <TableCell align="center">
                    <Typography
                      variant="caption"
                      sx={{
                        bgcolor: "success.light",
                        color: "success.contrastText",
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        fontWeight: 700,
                        textTransform: "uppercase"
                      }}
                    >
                      {row.status}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </FormStack>
    </Box>
  );
}

export default memo(ImportSalesOrders);
