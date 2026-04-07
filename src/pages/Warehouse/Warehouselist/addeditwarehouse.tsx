import { forwardRef, memo, useCallback, useEffect, useImperativeHandle, type Ref } from "react";
import { useForm } from "react-hook-form";
import { Box, Stack } from "@mui/material";

import ConfirmDeleteButton from "../../../components/common/ConfirmDeleteButton";
import { MuiSelect, MuiTextField } from "../../../components/mui/input";
import { FormStackGrid } from "../../../components/ui/form/stack";
import FormSection from "../../../components/ui/form/FormSection";
import { useModal } from "../../../hooks/useModal";
import { useToast } from "../../../hooks/useToast";
import WarehouseOutlinedIcon from "@mui/icons-material/WarehouseOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";

type WarehouseFormValues = {
  warehouseName: string;
  managerName: string;
  contactNumber: string;
  email: string;
  location: string;
  address: string;
  storageCapacity: number | string;
  status: "active" | "inactive" | "maintenance";
  notes: string;
};

type AddEditWarehouseProps = {
  defaultValues?: Partial<WarehouseFormValues> & { id?: string; name?: string };
  onSubmitWarehouse?: (
    payload: WarehouseFormValues & { storageCapacity: number }
  ) => void | Promise<void>;
  setDisplayTitle?: (title: string) => void;
  setDataChanged?: (changed: boolean) => void;
  setHideFooter?: (hidden: boolean) => void;
  setWidth?: (width: number | string) => void;
};

export type AddEditWarehouseRef = {
  submit: () => Promise<void>;
};

function Index({
  defaultValues,
  onSubmitWarehouse,
  setDisplayTitle,
  setDataChanged,
  setHideFooter,
  setWidth,
}: AddEditWarehouseProps, ref: Ref<AddEditWarehouseRef>) {
  const { closeModal } = useModal();
  const { showToast } = useToast();
  const hasExistingWarehouse = Boolean(defaultValues?.warehouseName || (defaultValues as any)?.name);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<WarehouseFormValues>({
    defaultValues: {
      warehouseName: defaultValues?.warehouseName || (defaultValues as any)?.name || "",
      managerName: defaultValues?.managerName || "",
      contactNumber: defaultValues?.contactNumber || "",
      email: defaultValues?.email || "",
      location: defaultValues?.location || "",
      address: defaultValues?.address || "",
      storageCapacity: defaultValues?.storageCapacity || "",
      status: defaultValues?.status || "active",
      notes: defaultValues?.notes || "",
    },
    mode: "onBlur",
  });

  useEffect(() => {
    setDisplayTitle?.(hasExistingWarehouse ? "Edit Warehouse" : "Add Warehouse");
    setHideFooter?.(false);
    setWidth?.(720);
  }, [hasExistingWarehouse, setDisplayTitle, setHideFooter, setWidth]);

  useEffect(() => {
    setDataChanged?.(isDirty);
  }, [isDirty, setDataChanged]);

  const onSubmit = useCallback(async (data: WarehouseFormValues) => {
    const payload = {
      ...(defaultValues?.id ? { id: defaultValues.id } : {}),
      ...data,
      warehouseName: data.warehouseName.trim(),
      managerName: data.managerName.trim(),
      contactNumber: data.contactNumber.trim(),
      email: data.email.trim(),
      location: data.location.trim(),
      address: data.address.trim(),
      notes: data.notes.trim(),
      storageCapacity: Number(data.storageCapacity),
    };

    if (onSubmitWarehouse) {
      await onSubmitWarehouse(payload);
    } else {
      console.log("warehouse-payload", payload);
    }

    showToast("Warehouse details ready for posting", "success");
    setDataChanged?.(false);
    closeModal();
  }, [closeModal, onSubmitWarehouse, setDataChanged, showToast]);

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
        {/* ══════════ Warehouse Identity ══════════ */}
        <FormSection
          title="Warehouse Identity"
          description="Name, capacity, and operational status"
          icon={<WarehouseOutlinedIcon fontSize="small" />}
        >
          <FormStackGrid columns={3}>
            <MuiTextField
              id="warehouseName"
              label="Warehouse Name"
              placeholder="Warehouse"
              {...register("warehouseName", {
                required: "Warehouse name is required",
              })}
              error={!!errors.warehouseName}
              helperText={errors.warehouseName?.message}
            />
            <MuiTextField
              id="storageCapacity"
              type="number"
              label="Storage Capacity"
              placeholder="1000"
              {...register("storageCapacity", {
                required: "Storage capacity is required",
                valueAsNumber: true,
                min: {
                  value: 1,
                  message: "Storage capacity must be greater than 0",
                },
              })}
              error={!!errors.storageCapacity}
              helperText={errors.storageCapacity?.message}
              inputProps={{ min: 1 }}
            />
            <MuiSelect
              id="status"
              label="Status"
              options={[
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
                { value: "maintenance", label: "Maintenance" },
              ]}
              {...register("status", {
                required: "Status is required",
              })}
              error={!!errors.status}
              helperText={errors.status?.message}
            />
          </FormStackGrid>
        </FormSection>

        {/* ══════════ Contact Information ══════════ */}
        <FormSection
          title="Contact Information"
          description="Manager and communication details"
          icon={<PersonOutlinedIcon fontSize="small" />}
          accentColor="#1D4ED8"
        >
          <FormStackGrid columns={2}>
            <MuiTextField
              id="managerName"
              label="Manager Name"
              placeholder="Enter manager name"
              {...register("managerName", {
                required: "Manager name is required",
              })}
              error={!!errors.managerName}
              helperText={errors.managerName?.message}
            />
            <MuiTextField
              id="contactNumber"
              type="tel"
              label="Contact Number"
              placeholder="9876543210"
              {...register("contactNumber", {
                required: "Contact number is required",
                pattern: {
                  value: /^[0-9+\-\s]{8,15}$/,
                  message: "Enter a valid contact number",
                },
              })}
              error={!!errors.contactNumber}
              helperText={errors.contactNumber?.message}
            />
            <MuiTextField
              id="email"
              type="email"
              label="Email"
              placeholder="warehouse@company.com"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Enter a valid email address",
                },
              })}
              error={!!errors.email}
              helperText={errors.email?.message}
            />
          </FormStackGrid>
        </FormSection>

        {/* ══════════ Location & Notes ══════════ */}
        <FormSection
          title="Location & Notes"
          description="Physical address and additional remarks"
          icon={<LocationOnOutlinedIcon fontSize="small" />}
          accentColor="#059669"
        >
          <FormStackGrid columns={1}>
            <MuiTextField
              id="location"
              label="City / Location"
              placeholder="Ahmedabad"
              {...register("location", {
                required: "Location is required",
              })}
              error={!!errors.location}
              helperText={errors.location?.message}
            />
            <MuiTextField
              id="address"
              label="Address"
              multiline
              minRows={3}
              placeholder="Enter complete warehouse address"
              {...register("address", {
                required: "Address is required",
              })}
              error={!!errors.address}
              helperText={errors.address?.message}
              fullWidth
            />
            <MuiTextField
              id="notes"
              label="Notes"
              multiline
              minRows={4}
              placeholder="Optional notes for handling, timing, access rules, etc."
              {...register("notes")}
              fullWidth
            />
          </FormStackGrid>
        </FormSection>
      </Stack>

      {hasExistingWarehouse ? (
        <Box
          sx={{
            mt: 3,
            pt: 2,
            borderTop: "1px solid",
            borderColor: "divider",
          }}
        >
          <ConfirmDeleteButton
            entityLabel="Warehouse"
            successMessage="Warehouse deleted successfully"
            onDelete={() => {
              console.log("Delete warehouse", defaultValues);
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

export const AddEditWarehouse = memo(forwardRef(Index));
