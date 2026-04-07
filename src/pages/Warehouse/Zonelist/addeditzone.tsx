import { forwardRef, memo, useCallback, useEffect, useImperativeHandle, type Ref } from "react";
import { useForm } from "react-hook-form";
import { Box, Stack } from "@mui/material";

import ConfirmDeleteButton from "../../../components/common/ConfirmDeleteButton";
import { MuiSelect, MuiTextField } from "../../../components/mui/input";
import { FormStackGrid } from "../../../components/ui/form/stack";
import FormSection from "../../../components/ui/form/FormSection";
import { useModal } from "../../../hooks/useModal";
import { useToast } from "../../../hooks/useToast";
import ViewInArOutlinedIcon from "@mui/icons-material/ViewInArOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";

type SectionFormValues = {
  warehouseName: string;
  name: string;
  color: string;
  rackCount: number | string;
  prefix: string;
};

type ZoneFormValues = {
  warehouseName: string;
  name: string;
  color: string;
  rackCount: number | string;
  prefix: string;
};

type AddEditZoneProps = {
  defaultValues?: Partial<ZoneFormValues> & { id?: string };
  onSubmitSection?: (
    payload: Omit<ZoneFormValues, "products"> & {
      rackCount: number;
    }
  ) => void | Promise<void>;
  setDisplayTitle?: (title: string) => void;
  setDataChanged?: (changed: boolean) => void;
  setHideFooter?: (hidden: boolean) => void;
  setWidth?: (width: number | string) => void;
};

export type AddEditZoneRef = {
  submit: () => Promise<void>;
};

const WAREHOUSE_OPTIONS = [
  { value: "Warehouse 1", label: "Warehouse 1" },
  { value: "Warehouse 2", label: "Warehouse 2" },
  { value: "Warehouse 3", label: "Warehouse 3" },
  { value: "Warehouse 4", label: "Warehouse 4" },
  { value: "Warehouse 5", label: "Warehouse 5" },
];

function Index({
  defaultValues,
  onSubmitSection,
  setDisplayTitle,
  setDataChanged,
  setHideFooter,
  setWidth,
}: AddEditZoneProps, ref: Ref<AddEditZoneRef>) {
  const { closeModal } = useModal();
  const { showToast } = useToast();
  const isEditMode = Boolean(defaultValues && Object.keys(defaultValues).length > 0);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ZoneFormValues>({
    defaultValues: {
      warehouseName: defaultValues?.warehouseName || "",
      name: defaultValues?.name || "",
      color: defaultValues?.color || "#A5D6A7",
      rackCount: defaultValues?.rackCount || "",
      prefix: defaultValues?.prefix || "",
    },
    mode: "onBlur",
  });

  useEffect(() => {
    setDisplayTitle?.(isEditMode ? "Edit Zone" : "Add Zone");
    setHideFooter?.(false);
    setWidth?.(720);
  }, [isEditMode, setDisplayTitle, setHideFooter, setWidth]);

  useEffect(() => {
    setDataChanged?.(isDirty);
  }, [isDirty, setDataChanged]);

  const onSubmit = useCallback(async (data: ZoneFormValues) => {
    const payload = {
      ...(defaultValues?.id ? { id: defaultValues.id } : {}),
      warehouseName: data.warehouseName.trim(),
      name: data.name.trim(),
      color: data.color,
      rackCount: Number(data.rackCount),
      prefix: data.prefix.trim().toUpperCase(),
    };

    if (onSubmitSection) {
      await onSubmitSection(payload);
    } else {
      console.log("zone-payload", payload);
    }

    showToast("Zone details ready for posting", "success");
    setDataChanged?.(false);
    closeModal();
  }, [closeModal, onSubmitSection, setDataChanged, showToast]);

  useImperativeHandle(
    ref,
    () => ({
      submit: async () => {
        await handleSubmit(onSubmit)();
      },
    }),
    [handleSubmit, onSubmit]
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={1}>
        {/* ══════════ Section Identity ══════════ */}
        <FormSection
          title="Zone Identity"
          description="Unique identifier, name"
          icon={<ViewInArOutlinedIcon fontSize="small" />}
        >
          <FormStackGrid columns={1}>
            <MuiSelect
              id="warehouseName"
              label="Warehouse"
              placeholder="Select warehouse"
              displayEmpty
              defaultValue={defaultValues?.warehouseName || ""}
              options={WAREHOUSE_OPTIONS}
              {...register("warehouseName", {
                required: "Warehouse is required",
              })}
              error={!!errors.warehouseName}
              helperText={errors.warehouseName?.message}
            />
            <MuiTextField
              id="name"
              label="Zone Name"
              placeholder="A - Electronics"
              {...register("name", {
                required: "Zone name is required",
              })}
              error={!!errors.name}
              helperText={errors.name?.message}
            />
          </FormStackGrid>
        </FormSection>

        {/* ══════════ Storage Configuration ══════════ */}
        <FormSection
          title="Storage Configuration"
          description="Rack and pallet setup for this zone"
          icon={<SettingsOutlinedIcon fontSize="small" />}
          accentColor="#1D4ED8"
        >
          <FormStackGrid columns={2}>
            <MuiTextField
              id="prefix"
              label="Pallet Prefix"
              placeholder="EA"
              {...register("prefix", {
                required: "Prefix is required",
                minLength: {
                  value: 2,
                  message: "Prefix must be at least 2 characters",
                },
              })}
              error={!!errors.prefix}
              helperText={errors.prefix?.message}
            />
            <MuiTextField
              id="rackCount"
              type="number"
              label="Rack Count"
              placeholder="5"
              {...register("rackCount", {
                required: "Rack count is required",
                valueAsNumber: true,
                min: {
                  value: 1,
                  message: "Rack count must be at least 1",
                },
              })}
              error={!!errors.rackCount}
              helperText={errors.rackCount?.message}
              inputProps={{ min: 1 }}
            />
          </FormStackGrid>
        </FormSection>
      </Stack>

      {isEditMode ? (
        <Box
          sx={{
            mt: 3,
            pt: 2,
            borderTop: "1px solid",
            borderColor: "divider",
          }}
        >
          <ConfirmDeleteButton
            entityLabel="Zone"
            successMessage="Zone deleted successfully"
            onDelete={() => {
              console.log("Delete zone", defaultValues);
              closeModal();
            }}
          >
            Delete
          </ConfirmDeleteButton>
        </Box>
      ) : null}
    </form>
  );
}

export const AddEditZone = memo(forwardRef(Index));
