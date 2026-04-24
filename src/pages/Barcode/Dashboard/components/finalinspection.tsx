import { memo } from "react";
import { Box, Button, Divider, Stack, Typography } from "@mui/material";
import { useForm } from "react-hook-form";
import {
  MuiTextField,
  MuiRadioGroup,
  MuiSelect,
} from "../../../../components/mui/input";
import { FormStackGrid, PageHeader } from "../../../../components/ui/form/stack";
import FormSection from "../../../../components/ui/form/FormSection";
import CheckboxGrid, {
  CheckboxField,
} from "../../../../components/ui/form/CheckboxGrid";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import BuildOutlinedIcon from "@mui/icons-material/BuildOutlined";
import NotesOutlinedIcon from "@mui/icons-material/NotesOutlined";
import { useToast } from "../../../../hooks/useToast";
import {
  useLazyGetQualityCheckDetailsQuery,
  useLazyGetUnderAssemblyDetailsQuery,
} from "../../../../redux/api/barcode";
import { mapSerialLookup } from "../barcodeAdapters";

const mountTypeOptions = [
  "Foot Mount",
  "Flange Mount",
  "B3",
  "B5",
  "B6",
  "B7",
  "B8",
  "V1",
  "V3",
  "V5",
  "V6",
  "H1",
  "1",
  "2",
  "3",
  "4",
  "5",
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "B6 I",
  "B8 I",
  "B3 I",
  "B6 II",
  "V5 I",
  "B5 I",
  "B5 II",
  "B5 III",
  "V1 I",
].map((value) => ({ value, label: value }));

const poleOptions = ["2", "4", "6", "8"].map((value) => ({ value, label: value }));

const electricMotorMakeOptions = ["PBL", "BBL", "Megha", "Simens", "Crompton"].map(
  (value) => ({ value, label: value })
);

const defaultValues = {
  gearedMotorSerialNumber: "",
  mountType: "",
  model: "",
  workOrderNumber: "",
  rpm: "",
  motorSerialNumber: "",
  pole: "",
  electricMotorMake: "",
  remarks: "",
  accessories: {
    additionalReq: false,
    breatherPlug: false,
    oilLevelIndicator: false,
    stickerOilLevel: false,
    stickerCaution: false,
    namePlate: false,
    shaftProtector: false,
    adaptorCover: false,
    eyeBolt: false,
    torqueBrush: false,
    endCover: false,
    springWasher: false,
    circlip: false,
    hexBolt: false,
    washer: false,
    outputFlange: false,
    singleExeShaft: false,
    doubleExeShaft: false,
    torqueArm: false,
    motorMountingRing: false,
    mountingFeet: false,
  },
  holdBack: {
    type: "",
    options: ["CW", "ACW"],
  },
  boreSize: "",
};

const accessoryFields: CheckboxField[] = [
  { name: "additionalReq", label: "Additional Req" },
  { name: "breatherPlug", label: "Breather Plug" },
  { name: "oilLevelIndicator", label: "Oil Level Indicator" },
  { name: "stickerOilLevel", label: "Sticker Oil Level" },
  { name: "stickerCaution", label: "Sticker Caution" },
  { name: "namePlate", label: "Name Plate" },
  { name: "shaftProtector", label: "Shaft Protector" },
  { name: "adaptorCover", label: "Adaptor Cover" },
  { name: "eyeBolt", label: "Eye Bolt" },
  { name: "torqueBrush", label: "Torque Brush" },
  { name: "endCover", label: "End Cover" },
  { name: "springWasher", label: "Spring Washer" },
  { name: "circlip", label: "Circlip" },
  { name: "hexBolt", label: "Hex Bolt" },
  { name: "washer", label: "Washer" },
  { name: "outputFlange", label: "Output Flange" },
  { name: "singleExeShaft", label: "Single Exe Shaft" },
  { name: "doubleExeShaft", label: "Double Exe Shaft" },
  { name: "torqueArm", label: "Torque Arm" },
  { name: "motorMountingRing", label: "Motor Mounting Ring" },
  { name: "mountingFeet", label: "Mounting Feet" },
];

function FinalInspectionForm() {
  const { showToast } = useToast();
  const [triggerUnderAssembly] = useLazyGetUnderAssemblyDetailsQuery();
  const [triggerQualityCheck] = useLazyGetQualityCheckDetailsQuery();
  const { register, handleSubmit, getValues, setValue } = useForm({ defaultValues });

  const onSubmit = () => {
    showToast(
      "Final inspection lookup API is integrated. Save endpoint is not present in current Apidog spec.",
      "info"
    );
  };

  const handleGetDetails = async () => {
    const serialNumber = String(getValues("gearedMotorSerialNumber") || "").trim();

    if (!serialNumber) {
      showToast("Enter geared motor serial number first", "warning");
      return;
    }

    try {
      let response: any;

      try {
        response = await triggerQualityCheck({ serial_no: serialNumber }).unwrap();
      } catch {
        response = await triggerUnderAssembly({ serial_no: serialNumber }).unwrap();
      }

      const lookup = mapSerialLookup(response?.data, serialNumber);

      setValue("gearedMotorSerialNumber", serialNumber, { shouldDirty: true });
      setValue("model", lookup.model, { shouldDirty: true });
      setValue("workOrderNumber", lookup.workOrderNumber, { shouldDirty: true });
      setValue("rpm", lookup.rpm, { shouldDirty: true });
      setValue("motorSerialNumber", lookup.motorSerialNumber, { shouldDirty: true });

      showToast("Final inspection details loaded", "success");
    } catch (error: any) {
      const message =
        error?.data?.message || error?.error || "Unable to load final inspection details";
      showToast(message, "error");
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
      <PageHeader title="Final Inspection" />

      <Stack spacing={1}>
        <FormSection
          title="General Information"
          description="Motor and gearbox identification details"
          icon={<InfoOutlinedIcon fontSize="small" />}
        >
          <FormStackGrid columns={3}>
            <Box
              sx={{
                gridColumn: "1 / -1",
                p: 1.5,
                borderRadius: 2,
                border: "1px solid",
                borderColor: "warning.main",
                bgcolor: "rgba(245, 158, 11, 0.08)",
              }}
            >
              <Typography variant="subtitle2" fontWeight={700} sx={{ color: "#92400E", mb: 0.5 }}>
                Start Here
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: "#B45309", display: "block", mb: 1.25 }}
              >
                Enter geared motor serial number and click Get to load inspection details
                from the barcode APIs.
              </Typography>
              <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
                <MuiTextField
                  label="Geared Motor Serial Number"
                  {...register("gearedMotorSerialNumber")}
                  fullWidth
                />
                <Button variant="outlined" onClick={handleGetDetails} sx={{ minWidth: 72, height: 35 }}>
                  Get
                </Button>
              </Box>
            </Box>
            <MuiSelect
              label="Mount Type"
              placeholder="Select mount type"
              displayEmpty
              defaultValue={defaultValues.mountType}
              options={mountTypeOptions}
              {...register("mountType")}
            />
            <MuiTextField label="Model" {...register("model")} />
            <MuiTextField label="Work Order Number" {...register("workOrderNumber")} />
            <MuiTextField label="RPM" {...register("rpm")} />
            <MuiTextField label="Motor Serial Number" {...register("motorSerialNumber")} />
            <MuiSelect
              label="Pole"
              placeholder="Select pole"
              displayEmpty
              defaultValue={defaultValues.pole}
              options={poleOptions}
              {...register("pole")}
            />
            <MuiSelect
              label="Electric Motor Make"
              placeholder="Select electric motor make"
              displayEmpty
              defaultValue={defaultValues.electricMotorMake}
              options={electricMotorMakeOptions}
              {...register("electricMotorMake")}
            />
            <MuiTextField label="Bore Size" {...register("boreSize")} />
          </FormStackGrid>

          <Divider sx={{ my: 2 }} />

          <MuiRadioGroup
            label="Hold Back Type"
            row
            options={defaultValues.holdBack.options.map((opt) => ({
              value: opt,
              label: opt,
            }))}
            {...register("holdBack.type")}
          />
        </FormSection>

        <FormSection
          title="Accessories"
          description="Select all applicable accessories for this unit"
          icon={<BuildOutlinedIcon fontSize="small" />}
          accentColor="#1D4ED8"
        >
          <CheckboxGrid
            fields={accessoryFields}
            register={register}
            prefix="accessories"
          />
        </FormSection>

        <FormSection
          title="Other Details"
          description="Additional remarks or observations"
          icon={<NotesOutlinedIcon fontSize="small" />}
          accentColor="#059669"
        >
          <MuiTextField
            label="Remarks"
            multiline
            rows={3}
            {...register("remarks")}
            fullWidth
          />
        </FormSection>

        <Box>
          <Button type="submit" variant="contained" size="large">
            Update Final Inspection
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}

export const FinalInspection = memo(FinalInspectionForm);
