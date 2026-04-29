import { memo } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import { useForm } from "react-hook-form";
import {
  MuiRadioGroup,
  MuiSelect,
  MuiTextField,
} from "../../../../components/mui/input";
import { FormStackGrid, PageHeader } from "../../../../components/ui/form/stack";
import FormSection from "../../../../components/ui/form/FormSection";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import SpeedOutlinedIcon from "@mui/icons-material/SpeedOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { useToast } from "../../../../hooks/useToast";
import { BarcodeCompletionStage } from "../../../../redux/api/barcode";
import { getMockGearMotorLookup } from "../mockBarcodeService";

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

const noiseLevelOptions = [
  "60",
  "61",
  "62",
  "63",
  "64",
  "65",
  "66",
  "67",
  "68",
  "69",
  "70",
  "71",
  "72",
  "73",
  "74",
  "75",
  "76",
  "77",
  "78",
  "79",
].map((value) => ({ value, label: value }));

const paintOptions = [
  "Accreylated Alkyd Gear Blue Semi Glossy",
  "GOOD",
].map((value) => ({ value, label: value }));

const poleOptions = ["2", "4", "6", "8"].map((value) => ({ value, label: value }));

const electricMotorMakeOptions = ["PBL", "BBL", "Megha", "Simens", "Crompton"].map(
  (value) => ({ value, label: value })
);

const statusOptions = ["PK", "PI"].map((value) => ({ value, label: value }));

const defaultValues = {
  gearedMotorSerialNumber: "",
  mountType: "Foot Mount",
  model: "",
  workOrderNumber: "",
  rpm: "",
  motorSerialNumber: "",
  noiseLevelDb: "60",
  paint: "GOOD",
  pole: "",
  electricMotorMake: "",
  inputRpm: "",
  actualRatio: "",
  status: "",
};

const toNumeric = (value: unknown) => {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
};

const resolveStage = (status: string): BarcodeCompletionStage => {
  if (status === "PI") {
    return "painting";
  }

  if (status === "PK") {
    return "packing";
  }

  return "completion";
};

function Index() {
  const { showToast } = useToast();
  const { register, handleSubmit, getValues, setValue } = useForm({
    defaultValues,
  });

  const onSubmit = async (data: any) => {
    const stage = resolveStage(String(data.status || ""));
    const submissionPreview = {
      stage,
      model: String(data.model || ""),
      ratio: toNumeric(data.actualRatio),
      wo_no: String(data.workOrderNumber || ""),
      status: String(data.status || ""),
      serial_no: String(data.gearedMotorSerialNumber || ""),
      rpm: toNumeric(data.rpm),
    };

    console.log("barcode-order-completion-static-submit", submissionPreview);
    showToast("Temporary static mode: order completion saved locally", "success");
  };

  const handleGetDetails = async () => {
    const serialNumber = String(getValues("gearedMotorSerialNumber") || "").trim();

    if (!serialNumber) {
      showToast("Enter geared motor serial number first", "warning");
      return;
    }

    try {
      const lookup = getMockGearMotorLookup(serialNumber)?.orderCompletion;
      if (!lookup) {
        showToast("No static order completion data found", "warning");
        return;
      }

      setValue("gearedMotorSerialNumber", serialNumber, { shouldDirty: true });
      setValue("mountType", lookup.mountType, { shouldDirty: true });
      setValue("model", lookup.model, { shouldDirty: true });
      setValue("workOrderNumber", lookup.workOrderNumber, { shouldDirty: true });
      setValue("rpm", lookup.rpm, { shouldDirty: true });
      setValue("motorSerialNumber", lookup.motorSerialNumber, { shouldDirty: true });
      setValue("pole", lookup.pole, { shouldDirty: true });
      setValue("electricMotorMake", lookup.electricMotorMake, { shouldDirty: true });
      setValue("inputRpm", lookup.inputRpm, { shouldDirty: true });
      setValue("actualRatio", lookup.actualRatio, { shouldDirty: true });
      setValue("noiseLevelDb", lookup.noiseLevelDb, { shouldDirty: true });
      setValue("paint", lookup.paint, { shouldDirty: true });
      setValue("status", lookup.status, { shouldDirty: true });

      showToast("Order completion details loaded", "success");
    } catch (error: any) {
      const message =
        error?.data?.message || error?.error || "Unable to load order completion details";
      showToast(message, "error");
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
      <PageHeader title="Order Completion" />

      <Stack spacing={1}>
        <FormSection
          title="Motor Identification"
          description="Gearbox and motor serial details"
          icon={<SettingsOutlinedIcon fontSize="small" />}
        >
          <FormStackGrid>
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
                Enter geared motor serial number and click Get to load completion
                details from temporary static barcode data.
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
              fullWidth
            />
            <MuiTextField label="Model" {...register("model")} fullWidth />
            <MuiTextField label="Work Order Number" {...register("workOrderNumber")} fullWidth />
            <MuiTextField label="Motor Serial Number" {...register("motorSerialNumber")} fullWidth />
            <MuiSelect
              label="Electric Motor Make"
              placeholder="Select electric motor make"
              displayEmpty
              defaultValue={defaultValues.electricMotorMake}
              options={electricMotorMakeOptions}
              {...register("electricMotorMake")}
              fullWidth
            />
          </FormStackGrid>
        </FormSection>

        <FormSection
          title="Performance & Quality"
          description="Test measurements and quality checks"
          icon={<SpeedOutlinedIcon fontSize="small" />}
          accentColor="#1D4ED8"
        >
          <FormStackGrid>
            <MuiTextField label="RPM" {...register("rpm")} fullWidth />
            <MuiTextField label="Input RPM" {...register("inputRpm")} fullWidth />
            <MuiTextField label="Actual Ratio" {...register("actualRatio")} fullWidth />
            <MuiSelect
              label="Pole"
              placeholder="Select pole"
              displayEmpty
              defaultValue={defaultValues.pole}
              options={poleOptions}
              {...register("pole")}
              fullWidth
            />
            <MuiSelect
              label="Noise Level (dB)"
              placeholder="Select noise level"
              displayEmpty
              defaultValue={defaultValues.noiseLevelDb}
              options={noiseLevelOptions}
              {...register("noiseLevelDb")}
              fullWidth
            />
            <MuiSelect
              label="Paint"
              placeholder="Select paint"
              displayEmpty
              defaultValue={defaultValues.paint}
              options={paintOptions}
              {...register("paint")}
              fullWidth
            />
          </FormStackGrid>
        </FormSection>

        <FormSection
          title="Completion Status"
          description="Current order completion status"
          icon={<CheckCircleOutlineIcon fontSize="small" />}
          accentColor="#059669"
        >
          <FormStackGrid columns={1}>
            <MuiRadioGroup label="Status" row options={statusOptions} {...register("status")} />
          </FormStackGrid>
        </FormSection>

        <Box>
          <Button type="submit" variant="contained" size="large">
            Update Order Completion
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}

export const OrderComplition = memo(Index);
