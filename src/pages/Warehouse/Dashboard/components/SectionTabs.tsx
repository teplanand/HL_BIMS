import { memo } from "react";
import { Box, Button, Tab, Tabs } from "@mui/material";

import { Section } from "../types";
import { AddEditZone, AddEditZoneRef } from "../../Zonelist/addeditzone";
import { useModal } from "../../../../hooks/useModal";
import { openEntityFormModal } from "../../shared/openEntityFormModal";

type SectionTabsProps = {
  sections: Section[];
  activeSectionIndex: number;
  onChange: (event: React.SyntheticEvent, newValue: number | string) => void;
};

function SectionTabsComponent({
  sections,
  activeSectionIndex,
  onChange,
}: SectionTabsProps) {
  const { openModal } = useModal();

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",

      }}
    >
      <Tabs
        value={activeSectionIndex}
        onChange={onChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          minHeight: 36,
          borderBottom: "1px solid",
          borderColor: "divider",
          "& .MuiTab-root": {
            minHeight: 36,
            textTransform: "uppercase",
            fontWeight: 700,
            fontSize: "0.78rem",
            color: "#64748B",
            px: 2,

          },
          "& .MuiTabs-indicator": {
            bgcolor: "#0F172A",
            height: 2.5,
            borderRadius: 99,
          },
        }}
      >
        {sections.map((section, index) => (
          <Tab
            key={section.id}
            value={index}
            label={section.name}
          />
        ))}
      </Tabs>

      <Button
        variant="outlined"
        size="small"
        sx={{
          color: "#FF8A3D",
          fontWeight: 700,
          fontSize: "0.78rem",
          textTransform: "none",
          whiteSpace: "nowrap",
          ml: 1,
          "&:hover": { backgroundColor: "rgba(255, 138, 61, 0.08)" },
        }}
        onClick={() => {
          openEntityFormModal<AddEditZoneRef>({
            openModal,
            entityLabel: "Zone",
            width: 400,
            FormComponent: AddEditZone,
          });
        }}
      >
        + Add Zone
      </Button>
    </Box>
  );
}

export const SectionTabs = memo(SectionTabsComponent);
