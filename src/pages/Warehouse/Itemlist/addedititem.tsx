import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type Ref,
} from "react";
import dayjs, { type Dayjs } from "dayjs";
import { Controller, useForm } from "react-hook-form";
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import QrCode2OutlinedIcon from "@mui/icons-material/QrCode2Outlined";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import LocalPrintshopOutlinedIcon from "@mui/icons-material/LocalPrintshopOutlined";
import { QRCodeCanvas } from "qrcode.react";

import ConfirmDeleteButton from "../../../components/common/ConfirmDeleteButton";
import { MuiCheckbox, MuiDatePicker, MuiSelect, MuiTextField } from "../../../components/mui/input";
import { FormStackGrid } from "../../../components/ui/form/stack";
import FormSection from "../../../components/ui/form/FormSection";
import { useModal } from "../../../hooks/useModal";
import { useToast } from "../../../hooks/useToast";
import { useLazyListWarehouseItemsQuery, useListPalletsQuery } from "../../../redux/api/warehouse";
import { extractApiRows } from "../shared/gridApiHelpers";
import WidgetsOutlinedIcon from "@mui/icons-material/WidgetsOutlined";

type ItemFormValues = {
  oracle_code: string;
  item_desc: string;
  item_category: string;
  locator: string;
  sub_inventory: string;
  detail_qty: number | string;
  sub_loc_id: number | string;
  pallet_id: string;
  rack_id: number | string;
  has_expiry: boolean;
  expiry_date: Dayjs | null;
  in_qty: number | string;
  out_qty: number | string;
};

export type ItemSubmitPayload = {
  id?: string | number;
  pallet_id: number;
  rack_id: number;
  sub_loc_id: number;
  oracle_code: string;
  qty: number;
  has_expiry: boolean;
  expiry_date: string | null;
  item_desc?: string;
  item_category?: string;
  locator?: string;
  sub_inventory?: string;
  detail_qty?: number;
  in_qty?: number;
  out_qty?: number;
  item_image_document_id?: number | null;
  item_image_name?: string | null;
  item_image_path?: string | null;
  file_name?: string | null;
  item_image_file?: File | null;
  qr_code?: string;
};

type AddEditItemProps = {
  defaultValues?: Partial<ItemFormValues> & {
    id?: string | number;
    has_expiry_date?: boolean;
    exp_date?: string | Date | Dayjs | null;
    expiry_date?: string | Date | Dayjs | null;
    description?: string;
    item_description?: string;
    item_desc?: string;
    item_category?: string;
    category?: string;
    locator?: string;
    rack_id?: number | string;
    sub_inventory?: string;
    subInventory?: string;
    qty?: number | string;
    inQty?: number | string;
    outQty?: number | string;
    in_qty?: number | string;
    out_qty?: number | string;
    item_image_document_id?: number | null;
    item_image_name?: string | null;
    item_image_path?: string | null;
    image_path?: string | null;
    path?: string | null;
  };
  onSubmitItem?: (payload: ItemSubmitPayload) => void | Promise<void>;
  onDeleteItem?: (id: string | number) => Promise<void>;
  setDisplayTitle?: (title: string) => void;
  setDataChanged?: (changed: boolean) => void;
  setHideFooter?: (hidden: boolean) => void;
  setWidth?: (width: number | string) => void;
};

export type AddEditItemRef = {
  submit: () => Promise<void>;
};

type UploadedItemImage = {
  documentId: number | null;
  path: string | null;
  name: string | null;
};

const firstString = (...values: unknown[]) =>
  values.find((value) => typeof value === "string" && value.trim().length > 0) as
    | string
    | undefined;

const firstNumber = (...values: unknown[]) => {
  for (const value of values) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return undefined;
};

const normalizeOracleCode = (value: string) => value.trim().toUpperCase();

const toDayjsValue = (value: string | Date | Dayjs | null | undefined) => {
  if (!value) {
    return null;
  }

  const parsed =
    typeof value === "string"
      ? dayjs(value, ["DD-MM-YYYY", "D-M-YYYY", "DD/MM/YYYY", "D/M/YYYY", "YYYY-MM-DD"], true)
      : dayjs(value);
  return parsed.isValid() ? parsed : null;
};

const toPreviewUrl = (path: string | null | undefined) => {
  if (!path) {
    return "";
  }

  if (/^https?:\/\//i.test(path) || path.startsWith("data:")) {
    return path;
  }

  return `${import.meta.env.VITE_API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
};

function Index({
  defaultValues,
  onSubmitItem,
  onDeleteItem,
  setDisplayTitle,
  setDataChanged,
  setHideFooter,
  setWidth,
}: AddEditItemProps, ref: Ref<AddEditItemRef>) {
  const { closeModal } = useModal();
  const { showToast } = useToast();
  const isEditMode = Boolean(defaultValues?.id);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const qrCanvasWrapperRef = useRef<HTMLDivElement | null>(null);
  const { data: palletsData } = useListPalletsQuery();
  const [fetchItemDetails, { isFetching: isFetchingItemDetails }] =
    useLazyListWarehouseItemsQuery();
  const defaultImagePath =
    defaultValues?.item_image_path || defaultValues?.image_path || defaultValues?.path || null;
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(toPreviewUrl(defaultImagePath));
  const [uploadedItemImage, setUploadedItemImage] = useState<UploadedItemImage>({
    documentId: defaultValues?.item_image_document_id ?? null,
    path: defaultImagePath,
    name:
      defaultValues?.item_image_name ||
      (defaultImagePath ? defaultImagePath.split("/").pop() || "Uploaded Image" : null),
  });

  const palletOptions = useMemo(
    () =>
      extractApiRows(palletsData).map((pallet: any) => ({
        value: String(pallet.id),
        label: firstString(pallet.pallet_name, pallet.pallet_code, pallet.name) || `Pallet ${pallet.id}`,
      })),
    [palletsData]
  );

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    clearErrors,
    formState: { errors, isDirty },
  } = useForm<ItemFormValues>({
    defaultValues: {
      oracle_code: defaultValues?.oracle_code || "",
      item_desc:
        defaultValues?.item_desc ||
        defaultValues?.item_description ||
        defaultValues?.description ||
        "",
      item_category: defaultValues?.item_category || defaultValues?.category || "",
      locator: defaultValues?.locator || "",
      sub_inventory: defaultValues?.sub_inventory || defaultValues?.subInventory || "",
      detail_qty: defaultValues?.detail_qty || defaultValues?.qty || "",
      sub_loc_id: defaultValues?.sub_loc_id || "",
      pallet_id: String(defaultValues?.pallet_id || ""),
      rack_id: defaultValues?.rack_id || "",
      has_expiry: Boolean(defaultValues?.has_expiry ?? defaultValues?.has_expiry_date),
      expiry_date: toDayjsValue(defaultValues?.expiry_date ?? defaultValues?.exp_date),
      in_qty: defaultValues?.in_qty ?? defaultValues?.inQty ?? "",
      out_qty: defaultValues?.out_qty ?? defaultValues?.outQty ?? "",
    },
    mode: "onBlur",
  });

  const hasExpiry = watch("has_expiry");
  const watchedOracleCode = watch("oracle_code");
  const watchedItemDesc = watch("item_desc");
  const watchedItemCategory = watch("item_category");
  const watchedLocator = watch("locator");
  const watchedSubInventory = watch("sub_inventory");
   
  const watchedPalletId = watch("pallet_id");
  const watchedRackId = watch("rack_id");
 
   const normalizedOracleCode = useMemo(() => normalizeOracleCode(watchedOracleCode || ""), [watchedOracleCode]);
 
  const resolvedRackId = useMemo(() => {
    if (watchedRackId) {
      return Number(watchedRackId);
    }

    const selectedPallet = extractApiRows(palletsData).find(
      (pallet: any) => String(pallet.id) === String(watchedPalletId)
    );

    return Number(selectedPallet?.rack_id || 0);
  }, [palletsData, watchedPalletId, watchedRackId]);
 
  const selectedPalletMeta = useMemo(() => {
    const selectedPallet = extractApiRows(palletsData).find(
      (pallet: any) => String(pallet.id) === String(watchedPalletId)
    );

    if (!selectedPallet) {
      return {
        palletName: "",
        rackName: resolvedRackId ? `Rack ${resolvedRackId}` : "",
        palletCapacity: "",
      };
    }

    const palletName =
      firstString(
        selectedPallet.pallet_name,
        selectedPallet.pallet_code,
        selectedPallet.name
      ) || `Pallet ${selectedPallet.id}`;
    const rackName =
      firstString(
        selectedPallet.rack_name,
        selectedPallet.rackName,
        selectedPallet.rack_code,
        selectedPallet.rackCode
      ) || (resolvedRackId ? `Rack ${resolvedRackId}` : "");
    const palletCapacity = firstNumber(
      selectedPallet.max_capacity,
      selectedPallet.capacity
    );

    return {
      palletName,
      rackName,
      palletCapacity: palletCapacity ? String(palletCapacity) : "",
    };
  }, [palletsData, resolvedRackId, watchedPalletId]);
  const qrPayload = useMemo(
    () =>
      [
        ["Oracle Code", normalizedOracleCode],
        ["Item Description", watchedItemDesc?.trim()],
        ["Item Category", watchedItemCategory?.trim()],
        ["Locator", watchedLocator?.trim()],
        ["Sub Inventory", watchedSubInventory?.trim()],
        ["Pallet Name", selectedPalletMeta.palletName],
        ["Pallet", watchedPalletId],
        ["Rack Name", selectedPalletMeta.rackName],
        ["Rack", resolvedRackId ? String(resolvedRackId) : ""],
        ["Pallet Capacity", selectedPalletMeta.palletCapacity]
      ]
        .filter(([, value]) => value && String(value).trim().length > 0)
        .map(([label, value]) => `${label}: ${value}`)
        .join("\n"),
    [
      normalizedOracleCode,
      resolvedRackId,
      watchedItemCategory,
      watchedItemDesc,
      watchedLocator,
      watchedPalletId,
      selectedPalletMeta,
      watchedSubInventory,
    ]
  );

  useEffect(() => {
    if (!hasExpiry) {
      setValue("expiry_date", null, { shouldDirty: false, shouldValidate: true });
      clearErrors("expiry_date");
    }
  }, [clearErrors, hasExpiry, setValue]);

  useEffect(() => {
    setDisplayTitle?.(isEditMode ? "Edit Item" : "Add Item");
    setHideFooter?.(false);
    setWidth?.(860);
  }, [isEditMode, setDisplayTitle, setHideFooter, setWidth]);

  useEffect(() => {
    setDataChanged?.(isDirty || Boolean(selectedImageFile));
  }, [isDirty, selectedImageFile, setDataChanged]);

  const handleLookupItemDetails = useCallback(async () => {
    if (!normalizedOracleCode) {
      showToast("Oracle code is required", "warning");
      return;
    }

    try {
      const response = await fetchItemDetails({
        oracle_code: normalizedOracleCode,
        limit: 10,
      }).unwrap();
      const rows = extractApiRows(response);
      const match =
        rows.find((row: any) => normalizeOracleCode(String(row.oracle_code || "")) === normalizedOracleCode) ||
        rows[0];

      if (!match) {
        showToast("Item detail not found for this Oracle code", "warning");
        return;
      }

      const resolvedSubLocId = firstNumber(match.sub_loc_id, match.sub_loc, match.locator_id);
      const resolvedRackIdValue = firstNumber(match.rack_id, match.rackId);
      setValue("oracle_code", normalizedOracleCode, { shouldDirty: true, shouldValidate: true });
      setValue("item_desc", firstString(match.item_desc, match.item_description, match.description) || "", { shouldDirty: true });
      setValue("item_category", firstString(match.item_category, match.category, match.item_group) || "", { shouldDirty: true });
      setValue("locator", firstString(match.locator, match.locator_code, match.loc_code) || (resolvedSubLocId ? String(resolvedSubLocId) : ""), { shouldDirty: true });
      setValue("sub_inventory", firstString(match.sub_inventory, match.subInventory) || "", { shouldDirty: true });
      setValue("detail_qty", firstNumber(match.qty, match.quantity, match.item_qty, match.available_qty) ?? "", { shouldDirty: true });
      setValue("sub_loc_id", resolvedSubLocId ? String(resolvedSubLocId) : "", { shouldDirty: true });
      setValue("rack_id", resolvedRackIdValue ? String(resolvedRackIdValue) : "", { shouldDirty: true });

      if (match.has_expiry !== undefined || match.has_expiry_date !== undefined) {
        setValue("has_expiry", Boolean(match.has_expiry ?? match.has_expiry_date), { shouldDirty: true });
      }

      if (match.expiry_date || match.exp_date) {
        setValue("expiry_date", toDayjsValue(match.expiry_date ?? match.exp_date), { shouldDirty: true });
      }

      const resolvedImagePath = firstString(match.item_image_path, match.image_path, match.path) || null;
      if (resolvedImagePath) {
        setImagePreviewUrl(toPreviewUrl(resolvedImagePath));
        setUploadedItemImage({
          documentId: firstNumber(match.item_image_document_id, match.document_id) ?? null,
          path: resolvedImagePath,
          name: resolvedImagePath.split("/").pop() || "Uploaded Image",
        });
      }

      showToast("Item detail fetched successfully", "success");
    } catch (error: any) {
      showToast(error?.data?.message || error?.message || "Failed to fetch item detail", "error");
    }
  }, [fetchItemDetails, normalizedOracleCode, setValue, showToast]);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImageFile(file);
      setImagePreviewUrl(String(reader.result || ""));
      setUploadedItemImage({ documentId: null, path: null, name: file.name });
    };
    reader.readAsDataURL(file);
  }, []);

  const handlePrintQr = useCallback(() => {
    const canvas = qrCanvasWrapperRef.current?.querySelector("canvas") as HTMLCanvasElement | null;
    if (!canvas || !qrPayload) {
      showToast("QR code is not ready to print", "warning");
      return;
    }

    const qrDataUrl = canvas.toDataURL("image/png");
    const printWindow = window.open("", "_blank", "width=900,height=700");

    if (!printWindow) {
      showToast("Please allow popups to print the QR code", "warning");
      return;
    }

    const sanitizeHtml = (value: string) =>
      value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    const printablePayload = qrPayload
      .split("\n")
      .map((line) => `<div class="qr-print-line">${sanitizeHtml(line)}</div>`)
      .join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>QR Print</title>
          <style>
            body {
              margin: 0;
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              background: #fff;
              font-family: Arial, sans-serif;
            }
            .qr-print-wrap {
              display: flex;
              align-items: flex-start;
              gap: 24px;
              padding: 24px;
            }
            .qr-print-qr-box {
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 20px;
              border: 1px solid #e5e7eb;
              border-radius: 12px;
              background: #fff;
              box-sizing: border-box;
            }
            .qr-print-image {
              width: 320px;
              height: 320px;
              object-fit: contain;
              display: block;
            }
            .qr-print-content {
              min-width: 260px;
              max-width: 420px;
              color: #111827;
              font-size: 14px;
              line-height: 1.5;
              padding: 20px;
              border: 1px solid #e5e7eb;
              border-radius: 12px;
              background: #fff;
              box-sizing: border-box;
            }
            .qr-print-title {
              font-size: 18px;
              font-weight: 700;
              margin-bottom: 12px;
            }
            .qr-print-line {
              margin-bottom: 6px;
              word-break: break-word;
            }
            @media print {
              body {
                min-height: auto;
              }
            }
          </style>
        </head>
        <body>
          <div class="qr-print-wrap">
            <div class="qr-print-qr-box">
              <img id="qr-print-image" class="qr-print-image" src="${qrDataUrl}" alt="QR Code" />
            </div>
            <div class="qr-print-content">
              
              ${printablePayload}
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();

    const triggerPrint = () => {
      printWindow.focus();
      printWindow.print();
    };

    const printImage = printWindow.document.getElementById("qr-print-image") as HTMLImageElement | null;

    if (printImage) {
      if (printImage.complete) {
        triggerPrint();
        return;
      }

      printImage.onload = () => {
        triggerPrint();
      };
      printImage.onerror = () => {
        showToast("Failed to load QR image for printing", "error");
      };
      return;
    }

    triggerPrint();
  }, [qrPayload, showToast]);

  const onSubmit = useCallback(async (data: ItemFormValues) => {
    const inQty = Number(data.in_qty || 0);
    const outQty = Number(data.out_qty || 0);
    const subLocId = Number(data.sub_loc_id);
    const palletId = Number(data.pallet_id);
    const rackId = Number(data.rack_id || resolvedRackId || 0);
    const baseQty = Number(data.detail_qty || 0);

    if (!palletId) {
      showToast("Pallet is required", "warning");
      return;
    }

    // if (!rackId) {
    //   showToast("Rack details not found for selected pallet", "warning");
    //   return;
    // }

    // if (!subLocId) {
    //   showToast("Click 'Get Item Detail' to load locator details", "warning");
    //   return;
    // }

    // if (inQty > 0 && outQty > 0) {
    //   showToast("Only one of In Quantity or Out Quantity can be filled", "warning");
    //   return;
    // }

    // if (!inQty && !outQty) {
    //   showToast("Enter In Quantity or Out Quantity", "warning");
    //   return;
    // }

    // if (outQty > baseQty) {
    //   showToast("Out quantity cannot be greater than current quantity", "warning");
    //   return;
    // }

    // if (selectedImageFile) {
    //   showToast("Please upload the selected image before saving", "warning");
    //   return;
    // }

    const uploadedImage = uploadedItemImage;
    const selectedImageName = selectedImageFile?.name || uploadedImage.name || null;
    const selectedImagePath = selectedImageFile ? imagePreviewUrl || null : uploadedImage.path;
    const payload: ItemSubmitPayload = {
      ...(defaultValues?.id ? { id: defaultValues.id } : {}),
      pallet_id: palletId,
      rack_id: rackId,
      sub_loc_id: subLocId,
      oracle_code: normalizeOracleCode(data.oracle_code),
      qty: baseQty + inQty - outQty,
      has_expiry: Boolean(data.has_expiry),
      expiry_date: data.has_expiry && data.expiry_date ? data.expiry_date.format("YYYY-MM-DD") : null,
      item_desc: data.item_desc.trim(),
      item_category: data.item_category.trim(),
      locator: data.locator.trim(),
      sub_inventory: data.sub_inventory.trim(),
      detail_qty: baseQty,
      in_qty: inQty,
      out_qty: outQty,
      item_image_document_id: selectedImageFile ? null : uploadedImage.documentId,
      item_image_name: selectedImageName,
      item_image_path: selectedImagePath,
      file_name: selectedImageName,
      item_image_file: selectedImageFile,
      qr_code: qrPayload || undefined,
    };

    if (onSubmitItem) {
      await onSubmitItem(payload);
    }

    showToast(isEditMode ? "Item updated successfully" : "Item created successfully", "success");
    setDataChanged?.(false);
    closeModal();
  }, [closeModal, defaultValues?.id, imagePreviewUrl, isEditMode, onSubmitItem, qrPayload, resolvedRackId, selectedImageFile, setDataChanged, showToast, uploadedItemImage]);

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
      <input type="hidden" {...register("sub_loc_id")} />
      <input type="hidden" {...register("rack_id")} />
      <Stack spacing={1}>
        <FormSection
          title="Item Lookup"
          description="Get item details from Oracle code"
          icon={<WidgetsOutlinedIcon fontSize="small" />}
        >
          <FormStackGrid columns={3}>
            <Box sx={{ gridColumn: { xs: "1 / -1", md: "span 2" } }}>
              <MuiTextField
                id="oracle_code"
                label="Oracle Code"
                placeholder="ITEM-001"
                {...register("oracle_code", { required: "Oracle code is required" })}
                error={!!errors.oracle_code}
                helperText={errors.oracle_code?.message}
              />
            </Box>
            <Box>
              <Button
                type="button"
                fullWidth
                variant="contained"
                onClick={handleLookupItemDetails}
                disabled={!normalizedOracleCode || isFetchingItemDetails}
                startIcon={
                  isFetchingItemDetails ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <SearchOutlinedIcon />
                  )
                }
                sx={{ minHeight: 40, textTransform: "none", fontWeight: 700 }}
              >
                Get Item Detail
              </Button>
            </Box>
          </FormStackGrid>
        </FormSection>

        <FormSection
          title="Item Details"
          description="Read-only item master fields"
          icon={<Inventory2OutlinedIcon fontSize="small" />}
          accentColor="#1D4ED8"
        >
          <FormStackGrid columns={2}>
            <Box sx={{ gridColumn: "1 / -1" }}>
              <MuiTextField
                id="item_desc"
                label="Item Description"
                multiline
                minRows={2}
                {...register("item_desc")}
                InputProps={{ readOnly: true }}
              />
            </Box>
            <MuiTextField
              id="item_category"
              label="Item Category"
              {...register("item_category")}
              InputProps={{ readOnly: true }}
            />
            <MuiTextField
              id="locator"
              label="Locator"
              {...register("locator")}
              InputProps={{ readOnly: true }}
            />
            <MuiTextField
              id="sub_inventory"
              label="Sub Inventory"
              {...register("sub_inventory")}
              InputProps={{ readOnly: true }}
            />
            <MuiTextField
              id="detail_qty"
              label="Quantity"
              {...register("detail_qty")}
              InputProps={{ readOnly: true }}
            />
          </FormStackGrid>
        </FormSection>

        <FormSection
          title="Warehouse Entry"
          description="Posting details for pallet, expiry, image and movement"
          icon={<UploadFileOutlinedIcon fontSize="small" />}
          accentColor="#059669"
        >
          <FormStackGrid columns={2}>
            <MuiSelect
              id="pallet_id"
              label="Pallet"
              placeholder="Select pallet"
              displayEmpty
              defaultValue={String(defaultValues?.pallet_id || "")}
              options={palletOptions}
              {...register("pallet_id", { required: "Pallet is required" })}
              error={!!errors.pallet_id}
              helperText={errors.pallet_id?.message}
            />
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Controller
                name="has_expiry"
                control={control}
                render={({ field }) => (
                  <MuiCheckbox
                    label="Item expiry applicable"
                    checked={Boolean(field.value)}
                    onChange={(event) => field.onChange(event.target.checked)}
                  />
                )}
              />
            </Box>
            <MuiTextField
              id="in_qty"
              type="number"
              label="In Quantity"
              placeholder="0"
              {...register("in_qty", {
                valueAsNumber: true,
                min: { value: 1, message: "Quantity must be greater than 0" },
                onChange: (event) => {
                  if (event.target.value) {
                    setValue("out_qty", "", { shouldDirty: true, shouldValidate: true });
                  }
                },
              })}
              error={!!errors.in_qty}
              helperText={errors.in_qty?.message}
              inputProps={{ min: 1 }}
            />
            <MuiTextField
              id="out_qty"
              type="number"
              label="Out Quantity"
              placeholder="0"
              {...register("out_qty", {
                valueAsNumber: true,
                min: { value: 1, message: "Quantity must be greater than 0" },
                onChange: (event) => {
                  if (event.target.value) {
                    setValue("in_qty", "", { shouldDirty: true, shouldValidate: true });
                  }
                },
              })}
              error={!!errors.out_qty}
              helperText={errors.out_qty?.message}
              inputProps={{ min: 1 }}
            />
            {hasExpiry ? (
              <Controller
                name="expiry_date"
                control={control}
                defaultValue={toDayjsValue(defaultValues?.expiry_date ?? defaultValues?.exp_date)}
                rules={{
                  validate: (value) =>
                    !hasExpiry || value ? true : "Expiry date is required when checkbox is selected",
                }}
                render={({ field }) => (
                  <MuiDatePicker
                    label="Expiry Date"
                    format="DD-MM-YYYY"
                    value={field.value}
                    onChange={field.onChange}
                    onClose={field.onBlur}
                    error={!!errors.expiry_date}
                    helperText={errors.expiry_date?.message}
                    required
                  />
                )}
              />
            ) : <Box />}
            <Box sx={{ gridColumn: "1 / -1" }}>
              <Divider sx={{ my: 0.5 }} />
            </Box>
            <Box sx={{ gridColumn: "1 / -1" }}>
              <Stack spacing={1.25}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Item Image Upload
                </Typography>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleFileChange}
                />
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                  <Button
                    type="button"
                    variant="outlined"
                    startIcon={<UploadFileOutlinedIcon />}
                    onClick={() => fileInputRef.current?.click()}
                    sx={{ textTransform: "none", fontWeight: 700 }}
                  >
                    Upload Item Image
                  </Button>
                  {uploadedItemImage.name ? (
                    <Typography variant="body2" color="text.secondary" sx={{ alignSelf: "center" }}>
                      {uploadedItemImage.name}
                    </Typography>
                  ) : null}
                </Stack>
                {imagePreviewUrl ? (
                  <Stack spacing={1}>
                    <Box
                      component="img"
                      src={imagePreviewUrl}
                      alt="Item preview"
                      sx={{
                        width: 180,
                        height: 180,
                        objectFit: "cover",
                        borderRadius: 2,
                        border: "1px solid",
                        borderColor: "divider",
                      }}
                    />
                    {selectedImageFile ? (
                      <Typography variant="body2" color="text.secondary">
                        Image will be uploaded when you save the item.
                      </Typography>
                    ) : null}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No item image selected.
                  </Typography>
                )}
               
              </Stack>
            </Box>
          </FormStackGrid>
        </FormSection>

        <FormSection
          title="QR Code"
          description="Generated from the current item details"
          icon={<QrCode2OutlinedIcon fontSize="small" />}
          accentColor="#7C3AED"
        >
          <Stack spacing={1.5}>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "flex-start" }}>
              <Box
                ref={qrCanvasWrapperRef}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  backgroundColor: "#FFFFFF",
                }}
              >
                {qrPayload ? (
                  <QRCodeCanvas value={qrPayload} size={180} includeMargin />
                ) : (
                  <Box sx={{ width: 180, height: 180, display: "flex", alignItems: "center", justifyContent: "center", color: "text.secondary" }}>
                    QR preview will appear here
                  </Box>
                )}
              </Box>
              <Box
                sx={{
                  flex: 1,
                  minWidth: 260,
                  p: 1.5,
                  borderRadius: 2,
                  backgroundColor: "#F8FAFC",
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                 
                <Typography component="pre" sx={{ m: 0, whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: "0.8rem", color: "#334155", fontFamily: "monospace" }}>
                  {qrPayload || "Fill item details to generate QR code."}
                </Typography>
              </Box>
            </Box>
            <Box>
              <Button
                type="button"
                variant="contained"
                startIcon={<LocalPrintshopOutlinedIcon />}
                onClick={handlePrintQr}
                disabled={!qrPayload}
                sx={{ textTransform: "none", fontWeight: 700 }}
              >
                Print QR
              </Button>
            </Box>
          </Stack>
        </FormSection>
      </Stack>

      {isEditMode ? (
        <Box sx={{ mt: 3 }}>
          <ConfirmDeleteButton
            entityLabel="Item"
            successMessage="Item deleted successfully"
            onDelete={async () => {
              if (!defaultValues?.id || !onDeleteItem) {
                return;
              }

              await onDeleteItem(defaultValues.id);
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

export const AddEditItem = memo(forwardRef(Index));
