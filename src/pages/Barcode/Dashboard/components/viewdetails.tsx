import { memo, useEffect, useState } from "react";
import { Box, Tab, Tabs } from "@mui/material";

import OrderForm from "./basicinfo";
import { LineItems } from "./lineitems";
import { OrderComplition } from "./ordercomplition";
import { Reports } from "./reports";
import { FinalInspection } from "./finalinspection";
import OtherinfoForm from "./otherinfo";
import { BankDetails } from "./bankdetails";

type ViewDetailsProps = {
  defaultValues?: any;
  setDisplayTitle?: (title: string) => void;
  setDataChanged?: (changed: boolean) => void;
  setHideFooter?: (hidden: boolean) => void;
  setWidth?: (width: number | string) => void;
};

function Index({
  defaultValues = {},
  setDisplayTitle,
  setHideFooter,
  setWidth,
}: ViewDetailsProps) {
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    setDisplayTitle?.("Order Details");
    setHideFooter?.(true);
    setWidth?.(1100);
  }, [setDisplayTitle, setHideFooter, setWidth]);

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
        {activeTab === 0 && <OrderForm />}
        {activeTab === 1 && <OtherinfoForm />}
        {activeTab === 2 && <BankDetails />}
        {activeTab === 3 && <LineItems defaultValues={defaultValues} />}



      </Box>
    </Box>
  );
}

export const ViewDetails = memo(Index);

