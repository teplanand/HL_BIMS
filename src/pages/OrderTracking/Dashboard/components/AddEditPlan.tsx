import { memo, useRef } from "react";
import {
  Box,
  Button,
  DialogActions,
  DialogContent,
  Drawer,
  IconButton,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

import ApiActionButton from "../../../../components/common/ApiActionButton";
import { AddEditPlandate, AddEditPlandateRef } from "./addeditplandate";

type OpenEditPlanModalProps = {
  open: boolean;
  title: string;
  rowData?: Record<string, unknown> | null;
  field?: string;
  onClose: () => void;
};

function Index({
  open,
  title,
  rowData,
  field,
  onClose,
}: OpenEditPlanModalProps) {
  const formRef = useRef<AddEditPlandateRef>(null);

  return (
    <Drawer
      open={open}
      anchor="right"
      variant="temporary"
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      sx={{
        zIndex: 99999,
        "& .MuiDrawer-paper": {
          width: {
            xs: "100%",
            sm: 400,
            md: 400,
          },
          maxWidth: "100%",
      
        },
      }}
    >
      <Box
        className="drawer-header no-print p-2"
        sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
      >
        <Typography variant="h6">{title}</Typography>
        <IconButton
          size="small"
          onClick={onClose}
          sx={{
            p: "0.438rem",
            borderRadius: 1,
            color: "text.primary",
            backgroundColor: "action.selected",
          }}
        >
          <CloseIcon fontSize="medium" />
        </IconButton>
      </Box>

      <DialogContent dividers className="drawer-body drawer-body-print">
        <AddEditPlandate
          ref={formRef}
          rowData={rowData as Record<string, any> | undefined}
          field={field}
          onSuccess={onClose}
        />
      </DialogContent>

      <DialogActions className="drawer-footer no-print">
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
            overflow: "auto",
          }}
        >
          <Box sx={{ display: "flex", gap: 1 }}>
            <ApiActionButton
              onApiCall={() => formRef.current?.submit?.() ?? Promise.resolve()}
              loadingText="Updating..."
            >
              Update
            </ApiActionButton>
            <Button variant="outlined" onClick={onClose}>
              Close
            </Button>
          </Box>
        </Box>
      </DialogActions>
    </Drawer>
  );
}

export default memo(Index);
