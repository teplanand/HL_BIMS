import {
  alpha,
  InputAdornment,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Chip,
} from "@mui/material";
import { useEffect, useState } from "react";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import GridViewRoundedIcon from "@mui/icons-material/GridViewRounded";
import ViewListRoundedIcon from "@mui/icons-material/ViewListRounded";

import type { EvidenceUser, EvidenceViewMode } from "../types";

interface FilterBarProps {
  search: string;
  userId: string;
  dateFrom: string;
  dateTo: string;
  viewMode: EvidenceViewMode;
  summaryLabel: string;
  users: EvidenceUser[];
  onSearchChange: (value: string) => void;
  onUserChange: (value: string) => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onViewModeChange: (value: EvidenceViewMode) => void;
  onClearFilters: () => void;
}

const formatIsoDateToDisplay = (value: string) => {
  if (!value) {
    return "";
  }

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return value;
  }

  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
};

const normalizeDisplayDateInput = (value: string) => {
  const digitsOnly = value.replace(/\D/g, "").slice(0, 8);

  if (digitsOnly.length <= 2) {
    return digitsOnly;
  }

  if (digitsOnly.length <= 4) {
    return `${digitsOnly.slice(0, 2)}/${digitsOnly.slice(2)}`;
  }

  return `${digitsOnly.slice(0, 2)}/${digitsOnly.slice(2, 4)}/${digitsOnly.slice(4)}`;
};

const parseDisplayDateToIso = (value: string) => {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) {
    return null;
  }

  const [, day, month, year] = match;
  const isoValue = `${year}-${month}-${day}`;
  const parsedDate = new Date(`${isoValue}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  if (
    parsedDate.getFullYear() !== Number(year) ||
    parsedDate.getMonth() + 1 !== Number(month) ||
    parsedDate.getDate() !== Number(day)
  ) {
    return null;
  }

  return isoValue;
};

export const FilterBar = ({
  search,
  userId,
  dateFrom,
  dateTo,
  viewMode,
  summaryLabel,
  users,
  onSearchChange,
  onUserChange,
  onDateFromChange,
  onDateToChange,
  onViewModeChange,
  onClearFilters,
}: FilterBarProps) => {
  const [dateFromInput, setDateFromInput] = useState(formatIsoDateToDisplay(dateFrom));
  const [dateToInput, setDateToInput] = useState(formatIsoDateToDisplay(dateTo));

  useEffect(() => {
    setDateFromInput(formatIsoDateToDisplay(dateFrom));
  }, [dateFrom]);

  useEffect(() => {
    setDateToInput(formatIsoDateToDisplay(dateTo));
  }, [dateTo]);

  const handleDateInputChange = (
    nextValue: string,
    setValue: (value: string) => void,
    onChange: (value: string) => void,
  ) => {
    const normalizedValue = normalizeDisplayDateInput(nextValue);
    setValue(normalizedValue);

    if (!normalizedValue) {
      onChange("");
      return;
    }

    const isoValue = parseDisplayDateToIso(normalizedValue);
    if (isoValue) {
      onChange(isoValue);
    }
  };

  const handleDateBlur = (
    currentValue: string,
    setValue: (value: string) => void,
    onChange: (value: string) => void,
  ) => {
    if (!currentValue) {
      onChange("");
      return;
    }

    const isoValue = parseDisplayDateToIso(currentValue);
    if (!isoValue) {
      setValue("");
      onChange("");
      return;
    }

    setValue(formatIsoDateToDisplay(isoValue));
  };

  return (
    <Stack
      direction={{ xs: "column", xl: "row" }}
      alignItems={{ xs: "stretch", xl: "center" }}
      justifyContent="flex-end"
      spacing={1.25}
      useFlexGap
    >
      <Stack direction="row" spacing={0.75} alignItems="center">
        <TextField
          size="small"
          placeholder="Search Evidence..."
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon sx={{ color: "text.secondary", fontSize: 18 }} />
              </InputAdornment>
            ),
          }}
          sx={{
            width: { xs: "100%", xl: 240 },
            "& .MuiOutlinedInput-root": {
              borderRadius: 2.5,
              bgcolor: "background.paper",
              "& fieldset": { borderColor: "divider" },
              "&.Mui-focused fieldset": { borderColor: "primary.main" },
            },
            "& .MuiInputBase-input": {
              fontSize: "0.8rem",
              fontWeight: 600,
              py: 0.8,
            },
          }}
        />

        {/* <TextField
          size="small"
          placeholder="DD/MM/YYYY"
          value={dateFromInput}
          onChange={(event) =>
            handleDateInputChange(event.target.value, setDateFromInput, onDateFromChange)
          }
          onBlur={() => handleDateBlur(dateFromInput, setDateFromInput, onDateFromChange)}
          inputProps={{
            inputMode: "numeric",
            maxLength: 10,
          }}
          sx={{
            width: 148,
            "& .MuiOutlinedInput-root": {
              borderRadius: 2.5,
              bgcolor: "background.paper",
              "& fieldset": { borderColor: "divider" },
              "&.Mui-focused fieldset": { borderColor: "primary.main" },
            },
            "& .MuiInputBase-input": {
              fontSize: "0.8rem",
              fontWeight: 600,
              py: 0.8,
            },
          }}
        />

        <TextField
          size="small"
          placeholder="DD/MM/YYYY"
          value={dateToInput}
          onChange={(event) =>
            handleDateInputChange(event.target.value, setDateToInput, onDateToChange)
          }
          onBlur={() => handleDateBlur(dateToInput, setDateToInput, onDateToChange)}
          inputProps={{
            inputMode: "numeric",
            maxLength: 10,
          }}
          sx={{
            width: 148,
            "& .MuiOutlinedInput-root": {
              borderRadius: 2.5,
              bgcolor: "background.paper",
              "& fieldset": { borderColor: "divider" },
              "&.Mui-focused fieldset": { borderColor: "primary.main" },
            },
            "& .MuiInputBase-input": {
              fontSize: "0.8rem",
              fontWeight: 600,
              py: 0.8,
            },
          }}
        /> */}
      </Stack>

      <ToggleButtonGroup
        value={viewMode}
        exclusive
        size="small"
        onChange={(_, nextValue: EvidenceViewMode | null) => {
          if (nextValue) {
            onViewModeChange(nextValue);
          }
        }}
        sx={{
          p: 0.25,
          backgroundColor: "background.paper",
          borderRadius: 2.5,
          border: "1px solid",
          borderColor: "divider",
          "& .MuiToggleButton-root": {
            border: 0,
            color: "text.secondary",
            borderRadius: 2,
            px: 1.25,
            "&.Mui-selected": {
              color: "text.primary",
              backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.12),
            },
          },
        }}
      >
        <ToggleButton value="grid" aria-label="Grid view">
          <GridViewRoundedIcon />
        </ToggleButton>
        <ToggleButton value="list" aria-label="List view">
          <ViewListRoundedIcon />
        </ToggleButton>
      </ToggleButtonGroup>

      <Chip
        label={summaryLabel}
        size="small"
        sx={{
          bgcolor: "primary.main",
          color: "primary.contrastText",
          fontWeight: 700,
          fontSize: "0.75rem",
          height: 32,
          borderRadius: 2,
          px: 1,
          boxShadow: (theme) => `0 2px 8px ${alpha(theme.palette.primary.main, 0.24)}`,
        }}
      />
    </Stack>
  );
};
