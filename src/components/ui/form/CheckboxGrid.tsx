import { memo } from "react";
import { Box, SxProps, Theme } from "@mui/material";
import { UseFormRegister } from "react-hook-form";
import MuiCheckbox from "../../mui/input/MuiCheckbox";

export type CheckboxField = {
  name: string;
  label: string;
};

export type CheckboxGridProps = {
  fields: CheckboxField[];
  /** react-hook-form register function */
  register: UseFormRegister<any>;
  /** Dot-notation prefix, e.g. "accessories" → registers "accessories.fieldName" */
  prefix?: string;
  /** Grid columns per breakpoint — defaults: xs=2, sm=3, md=4 */
  columns?: { xs?: number; sm?: number; md?: number };
  sx?: SxProps<Theme>;
};

const CheckboxGrid: React.FC<CheckboxGridProps> = ({
  fields,
  register,
  prefix,
  columns = { xs: 2, sm: 3, md: 4 },
  sx,
}) => {
  const getFieldPath = (name: string) =>
    prefix ? (`${prefix}.${name}` as any) : name;

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: `repeat(${columns.xs ?? 2}, 1fr)`,
          sm: `repeat(${columns.sm ?? 3}, 1fr)`,
          md: `repeat(${columns.md ?? 4}, 1fr)`,
        },
        gap: 1,
        ...sx,
      }}
    >
      {fields.map((field) => (
        <Box
          key={field.name}
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 1.5,
            px: 1,
            py: 0.25,
            transition: "all 0.15s ease",
            "&:hover": {
              borderColor: "primary.main",
              backgroundColor: "action.hover",
            },
          }}
        >
          <MuiCheckbox
            label={field.label}
            {...register(getFieldPath(field.name))}
            size="small"
            sx={{
              "& .MuiFormControlLabel-label": {
                fontSize: "0.8125rem",
              },
            }}
          />
        </Box>
      ))}
    </Box>
  );
};

export default memo(CheckboxGrid);
