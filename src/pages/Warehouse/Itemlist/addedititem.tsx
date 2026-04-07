import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
  type KeyboardEvent,
  type Ref,
} from "react";
import dayjs, { type Dayjs } from "dayjs";
import { Controller, useForm } from "react-hook-form";
import { Stack, Box, Button, Paper, Typography } from "@mui/material";
import { QRCodeSVG } from "qrcode.react";

import ConfirmDeleteButton from "../../../components/common/ConfirmDeleteButton";
import { MuiCheckbox, MuiDatePicker, MuiSelect, MuiTextField } from "../../../components/mui/input";
import { FormStackGrid } from "../../../components/ui/form/stack";
import FormSection from "../../../components/ui/form/FormSection";
import { useModal } from "../../../hooks/useModal";
import { useToast } from "../../../hooks/useToast";
import WidgetsOutlinedIcon from "@mui/icons-material/WidgetsOutlined";

type ItemFormValues = {
  pallet_id: string;
  product: string;
  inQty: number | string;
  outQty: number | string;
  qty: number | string;
  oracle_code: string;
  description: string;
  sub_inventory: string;
  has_expiry_date: boolean;
  expiry_date: Dayjs | null;
  qr_code: string;
};

type AddEditItemProps = {
  defaultValues?: Partial<Omit<ItemFormValues, "expiry_date">> & {
    id?: string;
    palletName?: string;
    expiry_date?: string | Date | Dayjs | null;
  };
  onSubmitItem?: (
    payload: Omit<ItemFormValues, "expiry_date"> & {
      qty: number;
      inQty: number;
      outQty: number;
      expiry_date: string | null;
    }
  ) => void | Promise<void>;
  setDisplayTitle?: (title: string) => void;
  setDataChanged?: (changed: boolean) => void;
  setHideFooter?: (hidden: boolean) => void;
  setWidth?: (width: number | string) => void;
};

export type AddEditItemRef = {
  submit: () => Promise<void>;
};

const PALLET_OPTIONS = [
  { value: "EA1-1", label: "Pallet A" },
  { value: "EA1-2", label: "Pallet B" },
  { value: "EA1-3", label: "Pallet C" },
  { value: "EA2-1", label: "Pallet D" },
  { value: "EA2-2", label: "Pallet F" },
];

const toDayjsValue = (value: string | Date | Dayjs | null | undefined) => {
  if (!value) {
    return null;
  }

  const parsed = dayjs(value);
  return parsed.isValid() ? parsed : null;
};

const sanitizeQrPart = (value: string) =>
  value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const buildQrCodeValue = ({
  oracle_code,
  pallet_id,
  sub_inventory,
}: Pick<ItemFormValues, "oracle_code" | "pallet_id" | "sub_inventory">) => {
  const segments = [
    sanitizeQrPart(oracle_code),
    sanitizeQrPart(pallet_id),
    sanitizeQrPart(sub_inventory),
  ].filter(Boolean);

  return segments.length ? `ITEM|${segments.join("|")}` : "";
};

function Index({
  defaultValues,
  onSubmitItem,
  setDisplayTitle,
  setDataChanged,
  setHideFooter,
  setWidth,
}: AddEditItemProps, ref: Ref<AddEditItemRef>) {
  const { closeModal } = useModal();
  const { showToast } = useToast();
  const isEditMode = Boolean(defaultValues && Object.keys(defaultValues).length > 0);

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    clearErrors,
    formState: { errors, isDirty, dirtyFields },
  } = useForm<ItemFormValues>({
    defaultValues: {
      pallet_id: defaultValues?.pallet_id || "",
      product: defaultValues?.product || "",
      inQty: defaultValues?.inQty ?? defaultValues?.qty ?? 0,
      outQty: defaultValues?.outQty ?? 0,
      qty:
        defaultValues?.qty ??
        Math.max(Number(defaultValues?.inQty ?? 0) - Number(defaultValues?.outQty ?? 0), 0),
      oracle_code: defaultValues?.oracle_code || "",
      description: defaultValues?.description || "",
      sub_inventory: defaultValues?.sub_inventory || "",
      has_expiry_date: Boolean(defaultValues?.has_expiry_date || defaultValues?.expiry_date),
      expiry_date: toDayjsValue(defaultValues?.expiry_date),
      qr_code: defaultValues?.qr_code || "",
    },
    mode: "onBlur",
  });

  const hasExpiryDate = watch("has_expiry_date");
  const palletId = watch("pallet_id");
  const oracleCode = watch("oracle_code");
  const subInventory = watch("sub_inventory");
  const qrCodeValue = watch("qr_code");
  const inQty = Number(watch("inQty") || 0);
  const outQty = Number(watch("outQty") || 0);
  const totalQty = Number(watch("qty") || 0);
  const [inInput, setInInput] = useState("");
  const [outInput, setOutInput] = useState("");
  const [quantityMessage, setQuantityMessage] = useState("");
  const [flashTotal, setFlashTotal] = useState(false);

  useEffect(() => {
    if (!hasExpiryDate) {
      setValue("expiry_date", null, { shouldDirty: false, shouldValidate: true });
      clearErrors("expiry_date");
    }
  }, [clearErrors, hasExpiryDate, setValue]);

  useEffect(() => {
    if (dirtyFields.qr_code) {
      return;
    }

    const nextQrCode = buildQrCodeValue({
      oracle_code: oracleCode,
      pallet_id: palletId,
      sub_inventory: subInventory,
    });

    setValue("qr_code", nextQrCode, { shouldDirty: false, shouldValidate: true });
  }, [dirtyFields.qr_code, oracleCode, palletId, setValue, subInventory]);

  useEffect(() => {
    setDisplayTitle?.(isEditMode ? "Edit Item" : "Add Item");
    setHideFooter?.(false);
    setWidth?.(640);
  }, [isEditMode, setDisplayTitle, setHideFooter, setWidth]);

  useEffect(() => {
    setDataChanged?.(isDirty);
  }, [isDirty, setDataChanged]);

  const flashQuantityUpdate = useCallback(() => {
    setFlashTotal(true);
    window.setTimeout(() => setFlashTotal(false), 500);
  }, []);

  const applyQuantityChange = useCallback((direction: "in" | "out") => {
    const rawValue = direction === "in" ? inInput : outInput;
    const parsedValue = Number(rawValue);

    if (!rawValue.trim() || !Number.isFinite(parsedValue) || parsedValue <= 0) {
      setQuantityMessage("Enter a valid positive quantity.");
      setError(direction === "in" ? "inQty" : "outQty", {
        type: "manual",
        message: "Enter a valid positive quantity",
      });
      return;
    }

    clearErrors(["inQty", "outQty"]);

    if (direction === "in") {
      setValue("inQty", inQty + parsedValue, { shouldDirty: true, shouldValidate: true });
      setValue("qty", totalQty + parsedValue, { shouldDirty: true, shouldValidate: true });
      setInInput("");
      setQuantityMessage(`Added ${parsedValue} to total quantity.`);
      flashQuantityUpdate();
      return;
    }

    const safeOutValue = Math.min(parsedValue, totalQty);
    if (safeOutValue <= 0) {
      setQuantityMessage("Total quantity is already 0.");
      return;
    }

    setValue("outQty", outQty + safeOutValue, { shouldDirty: true, shouldValidate: true });
    setValue("qty", Math.max(totalQty - safeOutValue, 0), { shouldDirty: true, shouldValidate: true });
    setOutInput("");
    setQuantityMessage(
      safeOutValue !== parsedValue
        ? `Only ${safeOutValue} removed because total cannot go below 0.`
        : `Removed ${safeOutValue} from total quantity.`
    );
    flashQuantityUpdate();
  }, [clearErrors, flashQuantityUpdate, inInput, inQty, outInput, outQty, setError, setValue, totalQty]);

  const handleQuantityKeyDown = useCallback(
    (direction: "in" | "out") => (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key !== "Enter") {
        return;
      }

      event.preventDefault();
      applyQuantityChange(direction);
    },
    [applyQuantityChange]
  );

  const onSubmit = useCallback(async (data: ItemFormValues) => {
    const nextInQty = Number(data.inQty);
    const nextOutQty = Number(data.outQty);
    const nextQty = Math.max(nextInQty - nextOutQty, 0);

    const payload = {
      ...(defaultValues?.id ? { id: defaultValues.id } : {}),
      pallet_id: data.pallet_id.trim().toUpperCase(),
      product: data.product.trim(),
      oracle_code: data.oracle_code.trim().toUpperCase(),
      description: data.description.trim(),
      sub_inventory: data.sub_inventory.trim().toUpperCase(),
      has_expiry_date: data.has_expiry_date,
      expiry_date: data.has_expiry_date && data.expiry_date ? data.expiry_date.format("YYYY-MM-DD") : null,
      qr_code: (data.qr_code || buildQrCodeValue(data)).trim().toUpperCase(),
      inQty: nextInQty,
      outQty: nextOutQty,
      qty: nextQty,
    };

    if (onSubmitItem) {
      await onSubmitItem(payload);
    } else {
      console.log("item-payload", payload);
    }

    showToast("Item details ready for posting", "success");
    setDataChanged?.(false);
    closeModal();
  }, [closeModal, onSubmitItem, setDataChanged, showToast]);

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
          title="Item Details"
          description="Item identification, storage info and scan code setup"
          icon={<WidgetsOutlinedIcon fontSize="small" />}
        >
          <FormStackGrid columns={2}>
            <MuiSelect
              id="pallet_id"
              label="Pallet Name"
              placeholder="Select pallet"
              displayEmpty
              defaultValue={defaultValues?.pallet_id || ""}
              options={PALLET_OPTIONS}
              {...register("pallet_id", { required: "Pallet is required" })}
              error={!!errors.pallet_id}
              helperText={errors.pallet_id?.message}
            />
            <MuiTextField
              id="product"
              label="Item Name"
              placeholder="TV"
              {...register("product", { required: "Item name is required" })}
              error={!!errors.product}
              helperText={errors.product?.message}
            />
            <MuiTextField
              id="oracle_code"
              label="Oracle Code"
              placeholder="ORC-100245"
              {...register("oracle_code", { required: "Oracle code is required" })}
              error={!!errors.oracle_code}
              helperText={errors.oracle_code?.message}
            />
            <MuiTextField
              id="sub_inventory"
              label="Sub Inventory"
              placeholder="FG-MAIN"
              {...register("sub_inventory", { required: "Sub inventory is required" })}
              error={!!errors.sub_inventory}
              helperText={errors.sub_inventory?.message}
            />
            <Box sx={{ gridColumn: "1 / -1" }}>
              <Paper
                variant="outlined"
                sx={{
                  px: 2,
                  py: 1.5,
                  bgcolor: "grey.50",
                  borderRadius: 2,
                }}
              >
                <Stack spacing={1}>
                  <Typography variant="subtitle2" fontWeight={700}>
                    Quantity Manager
                  </Typography>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1} useFlexGap>
                    <MuiTextField
                      id="inQtyInput"
                      type="number"
                      label="In Quantity"
                      placeholder="e.g. 10"
                      value={inInput}
                      onChange={(event) => setInInput(event.target.value)}
                      onKeyDown={handleQuantityKeyDown("in")}
                      error={!!errors.inQty}
                      helperText={getQuantityHelperText("in", errors.inQty?.message, quantityMessage)}
                      inputProps={{ min: 1, step: 1 }}
                      sx={{ flex: 1 }}
                    />
                    <Button
                      variant="contained"
                      onClick={() => applyQuantityChange("in")}
                      sx={{ minWidth: 96, alignSelf: { xs: "stretch", sm: "flex-start" } }}
                    >
                      Add
                    </Button>
                  </Stack>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1} useFlexGap>
                    <MuiTextField
                      id="outQtyInput"
                      type="number"
                      label="Out Quantity"
                      placeholder="e.g. 5"
                      value={outInput}
                      onChange={(event) => setOutInput(event.target.value)}
                      onKeyDown={handleQuantityKeyDown("out")}
                      error={!!errors.outQty}
                      helperText={getQuantityHelperText("out", errors.outQty?.message, quantityMessage)}
                      inputProps={{ min: 1, step: 1 }}
                      sx={{ flex: 1 }}
                    />
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => applyQuantityChange("out")}
                      disabled={totalQty <= 0}
                      sx={{ minWidth: 96, alignSelf: { xs: "stretch", sm: "flex-start" } }}
                    >
                      Remove
                    </Button>
                  </Stack>
                  <Paper
                    variant="outlined"
                    sx={{
                      px: 1.5,
                      py: 1,
                      borderRadius: 2,
                      bgcolor: flashTotal ? "rgba(255, 138, 61, 0.12)" : "common.white",
                      borderColor: flashTotal ? "rgba(255, 138, 61, 0.35)" : "divider",
                      transition: "background-color 0.2s ease, border-color 0.2s ease",
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" spacing={1} useFlexGap flexWrap="wrap">
                      <Typography variant="caption" color="text.secondary">
                        Total Quantity
                      </Typography>
                      <Typography variant="body2" fontWeight={700}>
                        {totalQty}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={2} sx={{ mt: 0.5 }} useFlexGap flexWrap="wrap">
                      <Typography variant="caption" sx={{ color: "#64748B" }}>
                        In Total: <Box component="span" sx={{ color: "#334155", fontWeight: 700 }}>{inQty}</Box>
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#64748B" }}>
                        Out Total: <Box component="span" sx={{ color: "#334155", fontWeight: 700 }}>{outQty}</Box>
                      </Typography>
                    </Stack>
                  </Paper>
                </Stack>
              </Paper>
            </Box>
            <Box sx={{ display: "none" }}>
              <MuiTextField
                id="qty"
                type="number"
                label="Quantity"
                {...register("qty", {
                  valueAsNumber: true,
                  min: { value: 0, message: "Quantity cannot be negative" },
                })}
              />
              <MuiTextField
                id="inQty"
                type="number"
                label="In Qty"
                {...register("inQty", {
                  valueAsNumber: true,
                  min: { value: 0, message: "In quantity cannot be negative" },
                })}
              />
              <MuiTextField
                id="outQty"
                type="number"
                label="Out Qty"
                {...register("outQty", {
                  valueAsNumber: true,
                  min: { value: 0, message: "Out quantity cannot be negative" },
                })}
              />
            </Box>
            <Box sx={{ gridColumn: "1 / -1" }}>
              <MuiTextField
                id="description"
                label="Description"
                placeholder="Item description, specs or remarks"
                multiline
                minRows={3}
                {...register("description", { required: "Description is required" })}
                error={!!errors.description}
                helperText={errors.description?.message}
              />
            </Box>
            <Box sx={{ gridColumn: "1 / -1" }}>
              <Controller
                name="has_expiry_date"
                control={control}
                render={({ field }) => (
                  <MuiCheckbox
                    label="Item expiry date applicable"
                    checked={Boolean(field.value)}
                    onChange={(event) => field.onChange(event.target.checked)}
                  />
                )}
              />
            </Box>
            {hasExpiryDate ? (
              <Controller
                name="expiry_date"
                control={control}
                rules={{
                  validate: (value) => (
                    !hasExpiryDate || value ? true : "Expiry date is required when checkbox is selected"
                  ),
                }}
                render={({ field }) => (
                  <MuiDatePicker
                    label="Expiry Date"
                    value={field.value}
                    onChange={field.onChange}
                    onClose={field.onBlur}
                    error={!!errors.expiry_date}
                    helperText={errors.expiry_date?.message}
                    required
                  />
                )}
              />
            ) : null}
            <Box sx={{ gridColumn: "1 / -1" }}>
              <MuiTextField
                id="qr_code"
                label="QR Code"
                placeholder="Auto-generated scan value"
                {...register("qr_code", { required: "QR code is required" })}
                error={!!errors.qr_code}
                helperText={errors.qr_code?.message || "Aa value QR scanner thi item in/out identify karva mate use thase."}
              />
            </Box>
            <Box sx={{ gridColumn: "1 / -1" }}>
              <Paper
                variant="outlined"
                sx={{
                  px: 2,
                  py: 1.5,
                  bgcolor: "grey.50",
                }}
              >
                <Typography variant="subtitle2" fontWeight={700}>
                  QR Preview
                </Typography>
                <Box
                  sx={{
                    mt: 1.5,
                    mb: 1.5,
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  {qrCodeValue ? (
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: "common.white",
                        boxShadow: 1,
                      }}
                    >
                      <QRCodeSVG
                        value={qrCodeValue}
                        size={168}
                        marginSize={2}
                        bgColor="#FFFFFF"
                        fgColor="#111111"
                        level="M"
                      />
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        width: 168,
                        height: 168,
                        borderRadius: 2,
                        border: "1px dashed",
                        borderColor: "divider",
                        color: "text.secondary",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        textAlign: "center",
                        px: 2,
                      }}
                    >
                      <Typography variant="body2">
                        QR preview mate required fields bharo.
                      </Typography>
                    </Box>
                  )}
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    mt: 0.5,
                    fontFamily: "monospace",
                    wordBreak: "break-all",
                  }}
                >
                  {qrCodeValue || "Oracle code, pallet ane sub inventory bharso etle QR value auto-generate thase."}
                </Typography>
              </Paper>
            </Box>
          </FormStackGrid>
        </FormSection>
      </Stack>

      {isEditMode ? (
         <ConfirmDeleteButton
            entityLabel="Item"
            successMessage="Item deleted successfully"
            onDelete={() => {
                console.log("Delete item", defaultValues);
                closeModal();
            }}
          >
            Delete
          </ConfirmDeleteButton>
      ) : null}
    </form>
  );
}

function getQuantityHelperText(
  direction: "in" | "out",
  fieldError?: string,
  quantityMessage?: string
) {
  if (fieldError) {
    return fieldError;
  }

  if (!quantityMessage) {
    return direction === "in"
      ? "Type a positive value and press Enter or Add."
      : "Type a positive value and press Enter or Remove.";
  }

  const isDirectionMatch =
    (direction === "in" && quantityMessage.toLowerCase().includes("add")) ||
    (direction === "out" &&
      (quantityMessage.toLowerCase().includes("remove") ||
        quantityMessage.toLowerCase().includes("below 0") ||
        quantityMessage.toLowerCase().includes("already 0")));

  return isDirectionMatch
    ? quantityMessage
    : direction === "in"
      ? "Type a positive value and press Enter or Add."
      : "Type a positive value and press Enter or Remove.";
}

export const AddEditItem = memo(forwardRef(Index));
