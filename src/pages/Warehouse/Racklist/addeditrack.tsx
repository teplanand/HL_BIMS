import { forwardRef, memo, useCallback, useEffect, useImperativeHandle, type Ref } from "react";
import { useForm } from "react-hook-form";
import { Stack, Box } from "@mui/material";

import ConfirmDeleteButton from "../../../components/common/ConfirmDeleteButton";
import { MuiSelect, MuiTextField } from "../../../components/mui/input";
import { FormStackGrid } from "../../../components/ui/form/stack";
import FormSection from "../../../components/ui/form/FormSection";
import { useModal } from "../../../hooks/useModal";
import { useToast } from "../../../hooks/useToast";
import ViewModuleOutlinedIcon from "@mui/icons-material/ViewModuleOutlined";

type RackFormValues = {
  name: string;
  section_id: string;
};

type AddEditRackProps = {
  defaultValues?: Partial<RackFormValues> & { id?: string };
  onSubmitRack?: (payload: RackFormValues & { id?: string }) => void | Promise<void>;
  setDisplayTitle?: (title: string) => void;
  setDataChanged?: (changed: boolean) => void;
  setHideFooter?: (hidden: boolean) => void;
  setWidth?: (width: number | string) => void;
};

export type AddEditRackRef = {
  submit: () => Promise<void>;
};

const ZONE_OPTIONS = [
  { value: "WH1-SEC-A", label: "A - Electronics" },
  { value: "WH1-SEC-B", label: "B - Appliances" },
  { value: "WH1-SEC-C", label: "C - Home Decor" },
  { value: "WH1-SEC-D", label: "D - Sports" },
  { value: "WH2-SEC-1", label: "Zone 1" },
];

function Index({
  defaultValues,
  onSubmitRack,
  setDisplayTitle,
  setDataChanged,
  setHideFooter,
  setWidth,
}: AddEditRackProps, ref: Ref<AddEditRackRef>) {
  const { closeModal } = useModal();
  const { showToast } = useToast();
  const isEditMode = Boolean(defaultValues && Object.keys(defaultValues).length > 0);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<RackFormValues>({
    defaultValues: {
      name: defaultValues?.name || "",
      section_id: defaultValues?.section_id || "",
    },
    mode: "onBlur",
  });

  useEffect(() => {
    setDisplayTitle?.(isEditMode ? "Edit Rack" : "Add Rack");
    setHideFooter?.(false);
    setWidth?.(500);
  }, [isEditMode, setDisplayTitle, setHideFooter, setWidth]);

  useEffect(() => {
    setDataChanged?.(isDirty);
  }, [isDirty, setDataChanged]);

  const onSubmit = useCallback(async (data: RackFormValues) => {
    const payload = {
      ...(defaultValues?.id ? { id: defaultValues.id } : {}),
      name: data.name.trim(),
      section_id: data.section_id.trim().toUpperCase(),
    };

    if (onSubmitRack) {
      await onSubmitRack(payload);
    } else {
      console.log("rack-payload", payload);
    }

    showToast("Rack details ready for posting", "success");
    setDataChanged?.(false);
    closeModal();
  }, [closeModal, onSubmitRack, setDataChanged, showToast]);

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
          <FormStackGrid columns={1}>
            <MuiTextField
              id="name"
              label="Rack Name"
              placeholder="Rack 1"
              {...register("name", { required: "Rack Name is required" })}
              error={!!errors.name}
              helperText={errors.name?.message}
            />
            <MuiSelect
              id="section_id"
              label="Zone"
              placeholder="Select zone"
              displayEmpty
              defaultValue={defaultValues?.section_id || ""}
              options={ZONE_OPTIONS}
              {...register("section_id", { required: "Zone is required" })}
              error={!!errors.section_id}
              helperText={errors.section_id?.message}
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
            entityLabel="Rack"
            successMessage="Rack deleted successfully"
            onDelete={() => {
                console.log("Delete rack", defaultValues);
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
