import { forwardRef, memo, useCallback, useEffect, useImperativeHandle, useMemo, type Ref } from "react";
import { useForm } from "react-hook-form";
import { Stack, Box } from "@mui/material";

import ConfirmDeleteButton from "../../../components/common/ConfirmDeleteButton";
import { MuiSelect, MuiTextField } from "../../../components/mui/input";
import { FormStackGrid } from "../../../components/ui/form/stack";
import FormSection from "../../../components/ui/form/FormSection";
import { useModal } from "../../../hooks/useModal";
import { useToast } from "../../../hooks/useToast";
import { useListRacksQuery, useListZonesQuery } from "../../../redux/api/warehouse";
import { extractApiRows } from "../shared/gridApiHelpers";
import ViewStreamOutlinedIcon from "@mui/icons-material/ViewStreamOutlined";

type PalletFormValues = {
  zone_id: string;
  rack_id: string;
  pallet_name: string;
  max_capacity: number | string;
  status: "AVAILABLE" | "OCCUPIED";
};

export type PalletSubmitPayload = {
  id?: string | number;
  warehouse_id?: number;
  zone_id: number;
  rack_id: number;
  pallet_name: string;
  max_capacity: number;
  status: "AVAILABLE" | "OCCUPIED";
};

type AddEditPalletProps = {
  defaultValues?: Partial<PalletFormValues> & {
    id?: string | number;
    zone_id?: string | number;
    rack_id?: string | number;
    warehouse_id?: string | number;
    pallet_name?: string;
    palletName?: string;
    name?: string;
    max_capacity?: number;
    capacity?: number | string;
  };
  onSubmitPallet?: (payload: PalletSubmitPayload) => void | Promise<void>;
  onDeletePallet?: (id: string | number) => Promise<void>;
  setDisplayTitle?: (title: string) => void;
  setDataChanged?: (changed: boolean) => void;
  setHideFooter?: (hidden: boolean) => void;
  setWidth?: (width: number | string) => void;
};

export type AddEditPalletRef = {
  submit: () => Promise<void>;
};

function Index({
  defaultValues,
  onSubmitPallet,
  onDeletePallet,
  setDisplayTitle,
  setDataChanged,
  setHideFooter,
  setWidth,
}: AddEditPalletProps, ref: Ref<AddEditPalletRef>) {
  const { closeModal } = useModal();
  const { showToast } = useToast();
  const isEditMode = Boolean(defaultValues?.id);
  const { data: zonesData } = useListZonesQuery();
  const { data: racksData } = useListRacksQuery();

  const zones = useMemo(() => extractApiRows(zonesData), [zonesData]);
  const racks = useMemo(() => extractApiRows(racksData), [racksData]);

  const zoneOptions = useMemo(
    () =>
      zones.map((zone: any) => ({
        value: String(zone.id),
        label: zone.zone_title || zone.zone_code || `Zone ${zone.id}`,
      })),
    [zones]
  );

  const rackOptions = useMemo(
    () =>
      racks.map((rack: any) => ({
        value: String(rack.id),
        label: rack.rack_code || rack.name || `Rack ${rack.id}`,
      })),
    [racks]
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<PalletFormValues>({
    defaultValues: {
      zone_id: String(defaultValues?.zone_id || ""),
      rack_id: String(defaultValues?.rack_id || ""),
      pallet_name:
        defaultValues?.pallet_name ||
        defaultValues?.palletName ||
        defaultValues?.name ||
        "",
      max_capacity: defaultValues?.max_capacity ?? defaultValues?.capacity ?? "",
      status: defaultValues?.status || "AVAILABLE",
    },
    mode: "onBlur",
  });

  useEffect(() => {
    setDisplayTitle?.(isEditMode ? "Edit Pallet" : "Add Pallet");
    setHideFooter?.(false);
    setWidth?.(520);
  }, [isEditMode, setDisplayTitle, setHideFooter, setWidth]);

  useEffect(() => {
    setDataChanged?.(isDirty);
  }, [isDirty, setDataChanged]);

  const onSubmit = useCallback(async (data: PalletFormValues) => {
    const selectedZone = zones.find((zone: any) => String(zone.id) === data.zone_id);
    const selectedRack = racks.find((rack: any) => String(rack.id) === data.rack_id);

    const payload: PalletSubmitPayload = {
      ...(defaultValues?.id ? { id: defaultValues.id } : {}),
      warehouse_id: Number(
        defaultValues?.warehouse_id ||
        selectedZone?.warehouse_id ||
        selectedRack?.warehouse_id
      ),
      zone_id: Number(data.zone_id),
      rack_id: Number(data.rack_id),
      pallet_name: data.pallet_name.trim(),
      max_capacity: Number(data.max_capacity),
      status: data.status,
    };

    if (onSubmitPallet) {
      await onSubmitPallet(payload);
    }

    showToast(
      isEditMode ? "Pallet updated successfully" : "Pallet created successfully",
      "success"
    );
    setDataChanged?.(false);
    closeModal();
  }, [closeModal, defaultValues?.id, defaultValues?.warehouse_id, isEditMode, onSubmitPallet, racks, setDataChanged, showToast, zones]);

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
          title="Pallet Details"
          description="Rack mapping and capacity configuration"
          icon={<ViewStreamOutlinedIcon fontSize="small" />}
        >
          <FormStackGrid columns={2}>
            <MuiSelect
              id="zone_id"
              label="Zone"
              placeholder="Select zone"
              displayEmpty
              defaultValue={String(defaultValues?.zone_id || "")}
              options={zoneOptions}
              {...register("zone_id", { required: "Zone is required" })}
              error={!!errors.zone_id}
              helperText={errors.zone_id?.message}
            />
            <MuiSelect
              id="rack_id"
              label="Rack"
              placeholder="Select rack"
              displayEmpty
              defaultValue={String(defaultValues?.rack_id || "")}
              options={rackOptions}
              {...register("rack_id", { required: "Rack is required" })}
              error={!!errors.rack_id}
              helperText={errors.rack_id?.message}
            />
            <MuiTextField
              id="pallet_name"
              label="Pallet Name"
              placeholder="Pallet A1"
              {...register("pallet_name", {
                required: "Pallet name is required",
              })}
              error={!!errors.pallet_name}
              helperText={errors.pallet_name?.message}
            />
            <MuiTextField
              id="max_capacity"
              type="number"
              label="Max Capacity"
              placeholder="500"
              {...register("max_capacity", {
                required: "Capacity is required",
                valueAsNumber: true,
                min: { value: 1, message: "Must be at least 1" },
              })}
              error={!!errors.max_capacity}
              helperText={errors.max_capacity?.message}
              inputProps={{ min: 1 }}
            />
            <MuiSelect
              id="status"
              label="Status"
              defaultValue={defaultValues?.status || "AVAILABLE"}
              options={[
                { value: "AVAILABLE", label: "Available" },
                { value: "OCCUPIED", label: "Occupied" },
              ]}
              {...register("status", { required: "Status is required" })}
              error={!!errors.status}
              helperText={errors.status?.message}
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
            entityLabel="Pallet"
            successMessage="Pallet deleted successfully"
            onDelete={async () => {
              if (!defaultValues?.id || !onDeletePallet) {
                return;
              }

              await onDeletePallet(defaultValues.id);
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

export const AddEditPallet = memo(forwardRef(Index));
