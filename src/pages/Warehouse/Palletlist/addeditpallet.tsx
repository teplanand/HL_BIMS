import { forwardRef, memo, useCallback, useEffect, useImperativeHandle, type Ref } from "react";
import { useForm } from "react-hook-form";
import { Stack, Box } from "@mui/material";

import ConfirmDeleteButton from "../../../components/common/ConfirmDeleteButton";
import { MuiSelect, MuiTextField } from "../../../components/mui/input";
import { FormStackGrid } from "../../../components/ui/form/stack";
import FormSection from "../../../components/ui/form/FormSection";
import { useModal } from "../../../hooks/useModal";
import { useToast } from "../../../hooks/useToast";
import ViewStreamOutlinedIcon from "@mui/icons-material/ViewStreamOutlined";

type PalletFormValues = {
  rack_id: string;
  palletName: string;
  capacity: number | string;
};

type AddEditPalletProps = {
  defaultValues?: Partial<PalletFormValues> & { id?: string };
  onSubmitPallet?: (payload: PalletFormValues & { id?: string; capacity: number }) => void | Promise<void>;
  setDisplayTitle?: (title: string) => void;
  setDataChanged?: (changed: boolean) => void;
  setHideFooter?: (hidden: boolean) => void;
  setWidth?: (width: number | string) => void;
};

export type AddEditPalletRef = {
  submit: () => Promise<void>;
};

const RACK_OPTIONS = [
  { value: "R1", label: "Rack 1" },
  { value: "R2", label: "Rack 2" },
  { value: "R3", label: "Rack 3" },
  { value: "R4", label: "Rack 4" },
  { value: "R5", label: "Rack 5" },
];

function Index({
  defaultValues,
  onSubmitPallet,
  setDisplayTitle,
  setDataChanged,
  setHideFooter,
  setWidth,
}: AddEditPalletProps, ref: Ref<AddEditPalletRef>) {
  const { closeModal } = useModal();
  const { showToast } = useToast();
  const isEditMode = Boolean(defaultValues && Object.keys(defaultValues).length > 0);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<PalletFormValues>({
    defaultValues: {
      rack_id: defaultValues?.rack_id || "",
      palletName: defaultValues?.palletName || "",
      capacity: defaultValues?.capacity || "",
    },
    mode: "onBlur",
  });

  useEffect(() => {
    setDisplayTitle?.(isEditMode ? "Edit Pallet" : "Add Pallet");
    setHideFooter?.(false);
    setWidth?.(500);
  }, [isEditMode, setDisplayTitle, setHideFooter, setWidth]);

  useEffect(() => {
    setDataChanged?.(isDirty);
  }, [isDirty, setDataChanged]);

  const onSubmit = useCallback(async (data: PalletFormValues) => {
    const payload = {
      ...(defaultValues?.id ? { id: defaultValues.id } : {}),
      rack_id: data.rack_id.trim().toUpperCase(),
      palletName: data.palletName.trim(),
      capacity: Number(data.capacity),
    };

    if (onSubmitPallet) {
      await onSubmitPallet(payload);
    } else {
      console.log("pallet-payload", payload);
    }

    showToast("Pallet details ready for posting", "success");
    setDataChanged?.(false);
    closeModal();
  }, [closeModal, onSubmitPallet, setDataChanged, showToast]);

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
          description="Pallet rack assignment and capacity configuration"
          icon={<ViewStreamOutlinedIcon fontSize="small" />}
        >
          <FormStackGrid columns={1}>
            <MuiSelect
              id="rack_id"
              label="Rack Name"
              placeholder="Select rack"
              displayEmpty
              defaultValue={defaultValues?.rack_id || ""}
              options={RACK_OPTIONS}
              {...register("rack_id", { required: "Rack is required" })}
              error={!!errors.rack_id}
              helperText={errors.rack_id?.message}
            />
            <MuiTextField
              id="palletName"
              label="Pallet Name"
              placeholder="Pallet A"
              {...register("palletName", { required: "Pallet name is required" })}
              error={!!errors.palletName}
              helperText={errors.palletName?.message}
            />
            <MuiTextField
              id="capacity"
              type="number"
              label="Capacity"
              placeholder="100"
              {...register("capacity", {
                required: "Capacity is required",
                valueAsNumber: true,
                min: { value: 1, message: "Must be at least 1" },
              })}
              error={!!errors.capacity}
              helperText={errors.capacity?.message}
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
            entityLabel="Pallet"
            successMessage="Pallet deleted successfully"
            onDelete={() => {
                console.log("Delete pallet", defaultValues);
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
