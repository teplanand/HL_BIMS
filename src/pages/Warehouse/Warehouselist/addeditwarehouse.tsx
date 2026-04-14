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
  orgId: string;
  warehouseCode: string;
  warehouseName: string;
  managerName: string;
  contactNumber: string;
  email: string;
  location: string;
  address: string;
  storageCapacity: number | string;
  status: "ACTIVE" | "INACTIVE";
  notes: string;
};

export type WarehouseSubmitPayload = WarehouseFormValues & {
  id?: string | number;
  storageCapacity: number;
};

type AddEditWarehouseProps = {
  defaultValues?: Partial<WarehouseFormValues> & {
    id?: string | number;
    name?: string;
    warehouse_name?: string;
    warehouse_code?: string;
    org_id?: string;
    manager_name?: string;
    contact_number?: string;
    email?: string;
    location?: string;
    address?: string;
    storage_capacity?: number | string;
    notes?: string;
    status?: "ACTIVE" | "INACTIVE";
  };
  onSubmitWarehouse?: (
    payload: WarehouseSubmitPayload
  ) => void | Promise<void>;
  onDeleteWarehouse?: (id: string | number) => Promise<void>;
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
  onDeleteWarehouse,
  setDisplayTitle,
  setDataChanged,
  setHideFooter,
  setWidth,
}: AddEditWarehouseProps, ref: Ref<AddEditWarehouseRef>) {
  const { closeModal } = useModal();
  const { showToast } = useToast();
  const hasExistingWarehouse = Boolean(defaultValues?.id);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<WarehouseFormValues>({
    defaultValues: {
      orgId: defaultValues?.orgId || (defaultValues as any)?.org_id || "",
      warehouseCode:
        defaultValues?.warehouseCode ||
        (defaultValues as any)?.warehouse_code ||
        "",
      warehouseName:
        defaultValues?.warehouseName ||
        (defaultValues as any)?.warehouse_name ||
        (defaultValues as any)?.name ||
        "",
      managerName:
        defaultValues?.managerName ||
        (defaultValues as any)?.manager_name ||
        "",
      contactNumber:
        defaultValues?.contactNumber ||
        (defaultValues as any)?.contact_number ||
        "",
      email:
        defaultValues?.email ||
        (defaultValues as any)?.email ||
        "",
      location:
        defaultValues?.location ||
        (defaultValues as any)?.location ||
        "",
      address:
        defaultValues?.address ||
        (defaultValues as any)?.address ||
        "",
      storageCapacity:
        defaultValues?.storageCapacity ||
        (defaultValues as any)?.storage_capacity ||
        "",
      status: defaultValues?.status || "ACTIVE",
      notes:
        defaultValues?.notes ||
        (defaultValues as any)?.notes ||
        "",
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
    const payload: WarehouseSubmitPayload = {
      ...(defaultValues?.id ? { id: defaultValues.id } : {}),
      ...data,
      orgId: data.orgId.trim(),
      warehouseCode: data.warehouseCode.trim(),
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

    showToast(
      hasExistingWarehouse
        ? "Warehouse updated successfully"
        : "Warehouse created successfully",
      "success"
    );
    setDataChanged?.(false);
    closeModal();
  }, [closeModal, defaultValues?.id, hasExistingWarehouse, onSubmitWarehouse, setDataChanged, showToast]);

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
              id="orgId"
              label="Organization ID"
              placeholder="ORG-001"
              {...register("orgId", {
                required: "Organization ID is required",
              })}
              error={!!errors.orgId}
              helperText={errors.orgId?.message}
            />
            <MuiTextField
              id="warehouseCode"
              label="Warehouse Code"
              placeholder="WH-001"
              {...register("warehouseCode", {
                required: "Warehouse code is required",
              })}
              error={!!errors.warehouseCode}
              helperText={errors.warehouseCode?.message}
            />
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
            onDelete={async () => {
              if (!defaultValues?.id || !onDeleteWarehouse) {
                return;
              }

              await onDeleteWarehouse(defaultValues.id);
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
