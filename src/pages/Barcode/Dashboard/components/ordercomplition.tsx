import { memo } from "react";
import { Box, Button, Divider, Stack, Typography } from "@mui/material";
import { useForm } from "react-hook-form";
import { MuiRadioGroup, MuiSelect, MuiTextField } from "../../../../components/mui/input";
import { FormStackGrid, PageHeader } from "../../../../components/ui/form/stack";
import FormSection from "../../../../components/ui/form/FormSection";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import SpeedOutlinedIcon from "@mui/icons-material/SpeedOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { useToast } from "../../../../hooks/useToast";
import { getGearMotorLookup } from "./gearMotorLookup";

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

const poleOptions = [
  "2",
  "4",
  "6",
  "8",
].map((value) => ({ value, label: value }));

const electricMotorMakeOptions = [
  "PBL",
  "BBL",
  "Megha",
  "Simens",
  "Crompton",
].map((value) => ({ value, label: value }));

const statusOptions = [
  "PK",
  "PI",
].map((value) => ({ value, label: value }));

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

function Index() {
  const { showToast } = useToast();
  const { register, handleSubmit, getValues, setValue } = useForm({
    defaultValues,
  });

  const onSubmit = (data: any) => {
    console.log("Order Completion Payload:", data);
  };

  const handleGetDetails = () => {
    const serialNumber = getValues("gearedMotorSerialNumber");
    const lookup = getGearMotorLookup(serialNumber);

    if (!lookup) {
      showToast("Enter geared motor serial number first", "warning");
      return;
    }

    setValue("gearedMotorSerialNumber", lookup.gearedMotorSerialNumber, { shouldDirty: true });
    setValue("mountType", lookup.orderCompletion.mountType, { shouldDirty: true });
    setValue("model", lookup.orderCompletion.model, { shouldDirty: true });
    setValue("workOrderNumber", lookup.orderCompletion.workOrderNumber, { shouldDirty: true });
    setValue("rpm", lookup.orderCompletion.rpm, { shouldDirty: true });
    setValue("motorSerialNumber", lookup.orderCompletion.motorSerialNumber, { shouldDirty: true });
    setValue("electricMotorMake", lookup.orderCompletion.electricMotorMake, { shouldDirty: true });
    setValue("inputRpm", lookup.orderCompletion.inputRpm, { shouldDirty: true });
    setValue("actualRatio", lookup.orderCompletion.actualRatio, { shouldDirty: true });
    setValue("pole", lookup.orderCompletion.pole, { shouldDirty: true });
    setValue("noiseLevelDb", lookup.orderCompletion.noiseLevelDb, { shouldDirty: true });
    setValue("paint", lookup.orderCompletion.paint, { shouldDirty: true });
    setValue("status", lookup.orderCompletion.status, { shouldDirty: true });

    showToast("Order completion details loaded", "success");
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
      <PageHeader title="Order Completion" />

      <Stack spacing={1} >
        {/* ══════════ Motor Identification ══════════ */}
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
              <Typography variant="caption" sx={{ color: "#B45309", display: "block", mb: 1.25 }}>
                Enter geared motor serial number and click Get to load all completion details.
              </Typography>
              <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
                <MuiTextField label="Geared Motor Serial Number" {...register("gearedMotorSerialNumber")} fullWidth />
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

        {/* ══════════ Performance & Quality ══════════ */}
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

        {/* ══════════ Completion Status ══════════ */}
        <FormSection
          title="Completion Status"
          description="Current order completion status"
          icon={<CheckCircleOutlineIcon fontSize="small" />}
          accentColor="#059669"
        >
          <FormStackGrid columns={1}>
            <MuiRadioGroup
              label="Status"
              row
              options={statusOptions}
              {...register("status")}
            />
          </FormStackGrid>
        </FormSection>

        {/* ══════════ Submit ══════════ */}
        <Box  >
          <Button
            type="submit"
            variant="contained"
            size="large"
            
          >
            Update Order Completion
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}

export const OrderComplition = memo(Index);
