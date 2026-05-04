import { memo, useState } from "react";
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
import { useAppSelector } from "../../../../redux/hooks";
import {
  BarcodeCompletionStage,
  barcodeDefaults,
  useLazyGetCompletionGearboxDetailsQuery,
  useLazyGetQualityCheckDetailsQuery,
  useUpdateOrderCompletionStageMutation,
} from "../../../../redux/api/barcode";

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

type CompletionLookupMetadata = {
  oracle_order_no?: number | string | null;
  model_type?: string | null;
  qty?: number | string | null;
  order_header_id?: number | string | null;
  order_line_id?: number | string | null;
  kw?: number | string | null;
  input_RPM?: number | string | null;
  actual_ratio?: number | string | null;
  pole?: number | string | null;
  noiseLevel?: number | string | null;
  paintColor?: string | null;
  MotorMake?: string | null;
  OracleUserId?: number | string | null;
  P_AMB_TEMP?: string | null;
  P_GREASE_TEMP?: string | null;
  rpm?: number | string | null;
  motor_serial_no?: string | null;
  Model?: string | null;
  model?: string | null;
  wo_no?: string | null;
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
  const authUserId = useAppSelector((state) => state.auth.id);
  const { register, handleSubmit, getValues, setValue } = useForm({
    defaultValues,
  });
  const [lookupMetadata, setLookupMetadata] = useState<CompletionLookupMetadata | null>(
    null
  );
  const [triggerCompletionLookup] = useLazyGetCompletionGearboxDetailsQuery();
  const [triggerQualityCheckLookup] = useLazyGetQualityCheckDetailsQuery();
  const [updateOrderCompletionStage, { isLoading: isSubmitting }] =
    useUpdateOrderCompletionStageMutation();

  const onSubmit = async (data: any) => {
    const stage = resolveStage(String(data.status || ""));
    const oracleUserId = toNumeric(authUserId) || toNumeric(lookupMetadata?.OracleUserId) || 1;

    try {
      const response = await updateOrderCompletionStage({
        stage,
        DivisionId: String(barcodeDefaults.divisionId),
        dtPrint: {
          oracle_order_no: toNumeric(lookupMetadata?.oracle_order_no),
          model_type: String(lookupMetadata?.model_type || "GM"),
          model: String(data.model || ""),
          ratio: toNumeric(data.actualRatio),
          qty: Math.max(1, toNumeric(lookupMetadata?.qty) || 1),
          wo_no: String(data.workOrderNumber || ""),
          order_header_id: toNumeric(lookupMetadata?.order_header_id),
          order_line_id: toNumeric(lookupMetadata?.order_line_id),
          status: String(data.status || ""),
          kw: toNumeric(lookupMetadata?.kw),
          serial_no: String(data.gearedMotorSerialNumber || ""),
          rpm: toNumeric(data.rpm),
          motor_serial_no: String(data.motorSerialNumber || ""),
          input_RPM: toNumeric(data.inputRpm || lookupMetadata?.input_RPM),
          actual_ratio: toNumeric(data.actualRatio || lookupMetadata?.actual_ratio),
          pole: toNumeric(data.pole || lookupMetadata?.pole),
          noiseLevel: toNumeric(data.noiseLevelDb || lookupMetadata?.noiseLevel),
          paintColor: String(data.paint || lookupMetadata?.paintColor || ""),
          MotorMake: String(
            data.electricMotorMake || lookupMetadata?.MotorMake || ""
          ),
          OracleUserId: oracleUserId,
          P_AMB_TEMP: String(lookupMetadata?.P_AMB_TEMP || ""),
          P_GREASE_TEMP: String(lookupMetadata?.P_GREASE_TEMP || ""),
        },
      }).unwrap();

      showToast(response?.message || "Order completion updated", "success");
    } catch (error: any) {
      const message =
        error?.data?.message || error?.error || "Unable to update order completion";
      showToast(message, "error");
    }
  };

  const handleGetDetails = async () => {
    const serialNumber = String(getValues("gearedMotorSerialNumber") || "").trim();

    if (!serialNumber) {
      showToast("Enter geared motor serial number first", "warning");
      return;
    }

    try {
      let response = await triggerCompletionLookup({
        BarcodeSerialNo: serialNumber,
      }).unwrap();

      if (!response?.data) {
        response = await triggerQualityCheckLookup({
          serial_no: serialNumber,
        }).unwrap();
      }

      const lookup = response?.data as CompletionLookupMetadata | null;
      if (!lookup) {
        showToast("No order completion details found from API", "warning");
        return;
      }

      setLookupMetadata(lookup);
      setValue("gearedMotorSerialNumber", serialNumber, { shouldDirty: true });
      setValue("model", String(lookup.Model ?? lookup.model ?? ""), { shouldDirty: true });
      setValue("workOrderNumber", String(lookup.wo_no ?? ""), { shouldDirty: true });
      setValue("rpm", String(lookup.rpm ?? ""), { shouldDirty: true });
      setValue("motorSerialNumber", String(lookup.motor_serial_no ?? ""), {
        shouldDirty: true,
      });
      setValue("pole", String(lookup.pole ?? ""), { shouldDirty: true });
      setValue("electricMotorMake", String(lookup.MotorMake ?? ""), {
        shouldDirty: true,
      });
      setValue("inputRpm", String(lookup.input_RPM ?? ""), { shouldDirty: true });
      setValue("actualRatio", String(lookup.actual_ratio ?? ""), { shouldDirty: true });
      setValue("noiseLevelDb", String(lookup.noiseLevel ?? defaultValues.noiseLevelDb), {
        shouldDirty: true,
      });
      setValue("paint", String(lookup.paintColor ?? defaultValues.paint), { shouldDirty: true });
      setValue("status", String(defaultValues.status), { shouldDirty: true });

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
                details from barcode API.
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
          <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
            {isSubmitting ? "Updating..." : "Update Order Completion"}
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}

export const OrderComplition = memo(Index);
