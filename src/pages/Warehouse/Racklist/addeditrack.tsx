import { forwardRef, memo, useCallback, useEffect, useImperativeHandle, useMemo, type Ref } from "react";
import { useForm } from "react-hook-form";
import { Stack, Box } from "@mui/material";

import ConfirmDeleteButton from "../../../components/common/ConfirmDeleteButton";
import { MuiSelect, MuiTextField } from "../../../components/mui/input";
import { FormStackGrid } from "../../../components/ui/form/stack";
import FormSection from "../../../components/ui/form/FormSection";
import { useModal } from "../../../hooks/useModal";
import { useToast } from "../../../hooks/useToast";
import { useListWarehousesQuery, useListZonesQuery } from "../../../redux/api/warehouse";
import { extractApiRows } from "../shared/gridApiHelpers";
import ViewModuleOutlinedIcon from "@mui/icons-material/ViewModuleOutlined";

type RackFormValues = {
  warehouse_id: string;
  zone_id: string;
  rack_code: string;
  rack_description: string;
  status: "ACTIVE" | "INACTIVE";
};

export type RackSubmitPayload = {
  id?: string | number;
  warehouse_id?: number;
  zone_id?: number;
  rack_code: string;
  rack_description?: string;
  status: "ACTIVE" | "INACTIVE";
};

type AddEditRackProps = {
  defaultValues?: Partial<RackFormValues> & {
    id?: string | number;
    name?: string;
    zoneName?: string;
    warehouse_id?: string | number;
    zone_id?: string | number;
    section_id?: string | number;
    rack_description?: string;
    rack_code?: string;
  };
  onSubmitRack?: (payload: RackSubmitPayload) => void | Promise<void>;
  onDeleteRack?: (id: string | number) => Promise<void>;
  setDisplayTitle?: (title: string) => void;
  setDataChanged?: (changed: boolean) => void;
  setHideFooter?: (hidden: boolean) => void;
  setWidth?: (width: number | string) => void;
};

export type AddEditRackRef = {
  submit: () => Promise<void>;
};

function Index({
  defaultValues,
  onSubmitRack,
  onDeleteRack,
  setDisplayTitle,
  setDataChanged,
  setHideFooter,
  setWidth,
}: AddEditRackProps, ref: Ref<AddEditRackRef>) {
  const { closeModal } = useModal();
  const { showToast } = useToast();
  const isEditMode = Boolean(defaultValues?.id);
  const { data: warehousesData } = useListWarehousesQuery();
  const { data: zonesData } = useListZonesQuery();

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

  const zoneOptions = useMemo(
    () =>
      extractApiRows(zonesData).map((zone: any) => ({
        value: String(zone.id),
        label: zone.zone_title || zone.name || zone.zone_code || `Zone ${zone.id}`,
      })),
    [zonesData]
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<RackFormValues>({
    defaultValues: {
      warehouse_id: String(defaultValues?.warehouse_id || ""),
      zone_id: String(defaultValues?.zone_id || defaultValues?.section_id || ""),
      rack_code: defaultValues?.rack_code || defaultValues?.name || "",
      rack_description: defaultValues?.rack_description || "",
      status: defaultValues?.status || "ACTIVE",
    },
    mode: "onBlur",
  });

  useEffect(() => {
    setDisplayTitle?.(isEditMode ? "Edit Rack" : "Add Rack");
    setHideFooter?.(false);
    setWidth?.(560);
  }, [isEditMode, setDisplayTitle, setHideFooter, setWidth]);

  useEffect(() => {
    setDataChanged?.(isDirty);
  }, [isDirty, setDataChanged]);

  const onSubmit = useCallback(async (data: RackFormValues) => {
    const payload: RackSubmitPayload = {
      ...(defaultValues?.id ? { id: defaultValues.id } : {}),
      warehouse_id: data.warehouse_id ? Number(data.warehouse_id) : undefined,
      zone_id: data.zone_id ? Number(data.zone_id) : undefined,
      rack_code: data.rack_code.trim().toUpperCase(),
      rack_description: data.rack_description.trim(),
      status: data.status,
    };

    if (onSubmitRack) {
      await onSubmitRack(payload);
    }

    showToast(
      isEditMode ? "Rack updated successfully" : "Rack created successfully",
      "success"
    );
    setDataChanged?.(false);
    closeModal();
  }, [closeModal, defaultValues?.id, isEditMode, onSubmitRack, setDataChanged, showToast]);

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
          title="Rack Details"
          description="Rack identification and zone mapping"
          icon={<ViewModuleOutlinedIcon fontSize="small" />}
        >
          <FormStackGrid columns={2}>
            <MuiSelect
              id="warehouse_id"
              label="Warehouse"
              placeholder="Select warehouse"
              displayEmpty
              defaultValue={String(defaultValues?.warehouse_id || "")}
              options={warehouseOptions}
              {...register("warehouse_id", { required: "Warehouse is required" })}
              error={!!errors.warehouse_id}
              helperText={errors.warehouse_id?.message}
            />
            <MuiSelect
              id="zone_id"
              label="Zone"
              placeholder="Select zone"
              displayEmpty
              defaultValue={String(defaultValues?.zone_id || defaultValues?.section_id || "")}
              options={zoneOptions}
              {...register("zone_id", { required: "Zone is required" })}
              error={!!errors.zone_id}
              helperText={errors.zone_id?.message}
            />
            <MuiTextField
              id="rack_code"
              label="Rack Code"
              placeholder="RACK-001"
              {...register("rack_code", { required: "Rack code is required" })}
              error={!!errors.rack_code}
              helperText={errors.rack_code?.message}
            />
            <MuiSelect
              id="status"
              label="Status"
              defaultValue={defaultValues?.status || "ACTIVE"}
              options={[
                { value: "ACTIVE", label: "Active" },
                { value: "INACTIVE", label: "Inactive" },
              ]}
              {...register("status", { required: "Status is required" })}
              error={!!errors.status}
              helperText={errors.status?.message}
            />
            <Box sx={{ gridColumn: "1 / -1" }}>
              <MuiTextField
                id="rack_description"
                label="Rack Description"
                placeholder="Optional description"
                multiline
                minRows={3}
                {...register("rack_description")}
                fullWidth
              />
            </Box>
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
            entityLabel="Rack"
            successMessage="Rack deleted successfully"
            onDelete={async () => {
              if (!defaultValues?.id || !onDeleteRack) {
                return;
              }

              await onDeleteRack(defaultValues.id);
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

export const AddEditRack = memo(forwardRef(Index));
