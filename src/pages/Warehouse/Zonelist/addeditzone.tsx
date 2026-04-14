import { forwardRef, memo, useCallback, useEffect, useImperativeHandle, useMemo, type Ref } from "react";
import { useForm } from "react-hook-form";
import { Box, Stack } from "@mui/material";

import ConfirmDeleteButton from "../../../components/common/ConfirmDeleteButton";
import { MuiSelect, MuiTextField } from "../../../components/mui/input";
import { FormStackGrid } from "../../../components/ui/form/stack";
import FormSection from "../../../components/ui/form/FormSection";
import { useModal } from "../../../hooks/useModal";
import { useToast } from "../../../hooks/useToast";
import { useListWarehousesQuery } from "../../../redux/api/warehouse";
import { extractApiRows } from "../shared/gridApiHelpers";
import ViewInArOutlinedIcon from "@mui/icons-material/ViewInArOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";

type ZoneFormValues = {
  warehouse_id: string;
  zone_code: string;
  zone_title: string;
  zone_description: string;
  status: "ACTIVE" | "INACTIVE";
};

export type ZoneSubmitPayload = {
  id?: string | number;
  warehouse_id: number;
  zone_code: string;
  zone_title: string;
  zone_description?: string | null;
  status: "ACTIVE" | "INACTIVE";
};

type AddEditZoneProps = {
  defaultValues?: Partial<ZoneFormValues> & {
    id?: string | number;
    name?: string;
    warehouseName?: string;
    warehouse_id?: number | string;
    zone_code?: string;
    zone_title?: string;
    zone_description?: string | null;
  };
  onSubmitZone?: (payload: ZoneSubmitPayload) => void | Promise<void>;
  onDeleteZone?: (id: string | number) => Promise<void>;
  setDisplayTitle?: (title: string) => void;
  setDataChanged?: (changed: boolean) => void;
  setHideFooter?: (hidden: boolean) => void;
  setWidth?: (width: number | string) => void;
};

export type AddEditZoneRef = {
  submit: () => Promise<void>;
};

function Index({
  defaultValues,
  onSubmitZone,
  onDeleteZone,
  setDisplayTitle,
  setDataChanged,
  setHideFooter,
  setWidth,
}: AddEditZoneProps, ref: Ref<AddEditZoneRef>) {
  const { closeModal } = useModal();
  const { showToast } = useToast();
  const isEditMode = Boolean(defaultValues?.id);
  const { data: warehousesData } = useListWarehousesQuery();

  const warehouseOptions = useMemo(
    () =>
      extractApiRows(warehousesData).map((warehouse: any) => ({
        value: String(warehouse.id),
        label:
          warehouse.warehouse_name ||
          warehouse.warehouseName ||
          warehouse.name ||
          `Warehouse ${warehouse.id}`,
      })),
    [warehousesData]
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ZoneFormValues>({
    defaultValues: {
      warehouse_id: String(defaultValues?.warehouse_id || ""),
      zone_code: defaultValues?.zone_code || "",
      zone_title: defaultValues?.zone_title || defaultValues?.name || "",
      zone_description: defaultValues?.zone_description || "",
      status: defaultValues?.status || "ACTIVE",
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
    const payload: ZoneSubmitPayload = {
      ...(defaultValues?.id ? { id: defaultValues.id } : {}),
      warehouse_id: Number(data.warehouse_id),
      zone_code: data.zone_code.trim().toUpperCase(),
      zone_title: data.zone_title.trim(),
      zone_description: data.zone_description.trim() || null,
      status: data.status,
    };

    if (onSubmitZone) {
      await onSubmitZone(payload);
    }

    showToast(
      isEditMode ? "Zone updated successfully" : "Zone created successfully",
      "success"
    );
    setDataChanged?.(false);
    closeModal();
  }, [closeModal, defaultValues?.id, isEditMode, onSubmitZone, setDataChanged, showToast]);

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
        <FormSection
          title="Zone Identity"
          description="Warehouse mapping and zone identification"
          icon={<ViewInArOutlinedIcon fontSize="small" />}
        >
          <FormStackGrid columns={2}>
            <MuiSelect
              id="warehouse_id"
              label="Warehouse"
              placeholder="Select warehouse"
              displayEmpty
              defaultValue={String(defaultValues?.warehouse_id || "")}
              options={warehouseOptions}
              {...register("warehouse_id", {
                required: "Warehouse is required",
              })}
              error={!!errors.warehouse_id}
              helperText={errors.warehouse_id?.message}
            />
            <MuiTextField
              id="zone_code"
              label="Zone Code"
              placeholder="ZONE-A"
              {...register("zone_code", {
                required: "Zone code is required",
              })}
              error={!!errors.zone_code}
              helperText={errors.zone_code?.message}
            />
            <MuiTextField
              id="zone_title"
              label="Zone Title"
              placeholder="Zone A"
              {...register("zone_title", {
                required: "Zone title is required",
              })}
              error={!!errors.zone_title}
              helperText={errors.zone_title?.message}
            />
            <MuiSelect
              id="status"
              label="Status"
              defaultValue={defaultValues?.status || "ACTIVE"}
              options={[
                { value: "ACTIVE", label: "Active" },
                { value: "INACTIVE", label: "Inactive" },
              ]}
              {...register("status", {
                required: "Status is required",
              })}
              error={!!errors.status}
              helperText={errors.status?.message}
            />
          </FormStackGrid>
        </FormSection>

        <FormSection
          title="Description"
          description="Additional zone notes"
          icon={<SettingsOutlinedIcon fontSize="small" />}
          accentColor="#1D4ED8"
        >
          <FormStackGrid columns={1}>
            <MuiTextField
              id="zone_description"
              label="Zone Description"
              multiline
              minRows={4}
              placeholder="Fast moving items zone"
              {...register("zone_description")}
              fullWidth
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
            onDelete={async () => {
              if (!defaultValues?.id || !onDeleteZone) {
                return;
              }

              await onDeleteZone(defaultValues.id);
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
