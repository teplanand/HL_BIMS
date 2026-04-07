import { useEffect, useMemo, useState } from "react";
import dayjs, { Dayjs } from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import CloudDownloadOutlinedIcon from "@mui/icons-material/CloudDownloadOutlined";
import RestartAltOutlinedIcon from "@mui/icons-material/RestartAltOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import { Controller, useForm, useWatch } from "react-hook-form";

import { MuiDatePicker, MuiTextField } from "../../components/mui/input";
import { useToast } from "../../hooks/useToast";

dayjs.extend(customParseFormat);

type AddressPayload = {
  city: string;
  addressLine1: string;
  addressLine2: string;
  state: string;
  pincode: string;
};

type OrderPayload = {
  orderNumber: string;
  orderType: string;
  dateOfOrder: string;
  priceList: string;
  salesPerson: string;
  status: string;
  currency: string;
  taxCategory: string;
  subTotal: number;
  tax: number;
  total: number;
};

type SalesOrderPayload = {
  customer: string;
  customerNumber: string;
  customerPO: string;
  customerContact: string;
  shipToLocation: AddressPayload;
  billToLocation: AddressPayload;
  order: OrderPayload;
};

type AddressFormValues = {
  city: string;
  addressLine1: string;
  addressLine2: string;
  state: string;
  pincode: string;
};

type SalesOrderFormValues = {
  customer: string;
  customerNumber: string;
  customerPO: string;
  customerContact: string;
  shipToLocation: AddressFormValues;
  billToLocation: AddressFormValues;
  order: {
    orderNumber: string;
    orderType: string;
    dateOfOrder: Dayjs | null;
    priceList: string;
    salesPerson: string;
    status: string;
    currency: string;
    taxCategory: string;
    subTotal: number | "";
    tax: number | "";
    total: number | "";
  };
};

const STORAGE_KEY = "sample-pages-formpost-sales-order";

const samplePayload: SalesOrderPayload = {
  customer: "KHUSHI OVERSEAS",
  customerNumber: "108743",
  customerPO: "KO/24-25/PO-32",
  customerContact: "",
  shipToLocation: {
    city: "INDORE",
    addressLine1: "G-11 SHEKHAR CENTRAL, GROUND FLOOR",
    addressLine2: "",
    state: "MADHYA PRADESH",
    pincode: "452001",
  },
  billToLocation: {
    city: "INDORE",
    addressLine1: "G-11 SHEKHAR CENTRAL GROUND FLOOR",
    addressLine2: "",
    state: "MADHYA PRADESH",
    pincode: "452001",
  },
  order: {
    orderNumber: "2153",
    orderType: "DBPRIS-PSV",
    dateOfOrder: "29/5/2024",
    priceList: "PBL Swift Centre Products Price List-2024",
    salesPerson: "EMTCI-INDORE (PBL)",
    status: "BOOKED",
    currency: "INR",
    taxCategory: "",
    subTotal: 17628,
    tax: 0,
    total: 17628,
  },
};

const wait = (ms: number) =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });

const getStoredPayload = (): SalesOrderPayload => {
  const rawValue = window.localStorage.getItem(STORAGE_KEY);

  if (!rawValue) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(samplePayload));
    return samplePayload;
  }

  try {
    return JSON.parse(rawValue) as SalesOrderPayload;
  } catch {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(samplePayload));
    return samplePayload;
  }
};

const mockGetSalesOrder = async (): Promise<SalesOrderPayload> => {
  await wait(500);
  return getStoredPayload();
};

const mockPostSalesOrder = async (
  payload: SalesOrderPayload,
): Promise<SalesOrderPayload> => {
  await wait(700);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  return payload;
};

const parseOrderDate = (value: string | null | undefined) => {
  if (!value) {
    return null;
  }

  const parsed = dayjs(value, ["D/M/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"], true);
  return parsed.isValid() ? parsed : null;
};

const createEmptyFormValues = (): SalesOrderFormValues => ({
  customer: "",
  customerNumber: "",
  customerPO: "",
  customerContact: "",
  shipToLocation: {
    city: "",
    addressLine1: "",
    addressLine2: "",
    state: "",
    pincode: "",
  },
  billToLocation: {
    city: "",
    addressLine1: "",
    addressLine2: "",
    state: "",
    pincode: "",
  },
  order: {
    orderNumber: "",
    orderType: "",
    dateOfOrder: null,
    priceList: "",
    salesPerson: "",
    status: "",
    currency: "INR",
    taxCategory: "",
    subTotal: "",
    tax: 0,
    total: 0,
  },
});

const payloadToFormValues = (payload: SalesOrderPayload): SalesOrderFormValues => ({
  customer: payload.customer,
  customerNumber: payload.customerNumber,
  customerPO: payload.customerPO,
  customerContact: payload.customerContact,
  shipToLocation: {
    ...payload.shipToLocation,
  },
  billToLocation: {
    ...payload.billToLocation,
  },
  order: {
    orderNumber: payload.order.orderNumber,
    orderType: payload.order.orderType,
    dateOfOrder: parseOrderDate(payload.order.dateOfOrder),
    priceList: payload.order.priceList,
    salesPerson: payload.order.salesPerson,
    status: payload.order.status,
    currency: payload.order.currency,
    taxCategory: payload.order.taxCategory,
    subTotal: payload.order.subTotal,
    tax: payload.order.tax,
    total: payload.order.total,
  },
});

const toNumber = (value: number | string | "") => {
  if (value === "" || value === null || value === undefined) {
    return 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formValuesToPayload = (
  values: SalesOrderFormValues,
): SalesOrderPayload => {
  const subTotal = toNumber(values.order.subTotal);
  const tax = toNumber(values.order.tax);
  const total = subTotal + tax;

  return {
    customer: values.customer.trim(),
    customerNumber: values.customerNumber.trim(),
    customerPO: values.customerPO.trim(),
    customerContact: values.customerContact.trim(),
    shipToLocation: {
      city: values.shipToLocation.city.trim(),
      addressLine1: values.shipToLocation.addressLine1.trim(),
      addressLine2: values.shipToLocation.addressLine2.trim(),
      state: values.shipToLocation.state.trim(),
      pincode: values.shipToLocation.pincode.trim(),
    },
    billToLocation: {
      city: values.billToLocation.city.trim(),
      addressLine1: values.billToLocation.addressLine1.trim(),
      addressLine2: values.billToLocation.addressLine2.trim(),
      state: values.billToLocation.state.trim(),
      pincode: values.billToLocation.pincode.trim(),
    },
    order: {
      orderNumber: values.order.orderNumber.trim(),
      orderType: values.order.orderType.trim(),
      dateOfOrder: values.order.dateOfOrder
        ? values.order.dateOfOrder.format("D/M/YYYY")
        : "",
      priceList: values.order.priceList.trim(),
      salesPerson: values.order.salesPerson.trim(),
      status: values.order.status.trim(),
      currency: values.order.currency.trim(),
      taxCategory: values.order.taxCategory.trim(),
      subTotal,
      tax,
      total,
    },
  };
};

const previewPayload = (values: SalesOrderFormValues) => {
  const payload = formValuesToPayload(values);
  return {
    ...payload,
    order: {
      ...payload.order,
      total: toNumber(values.order.subTotal) + toNumber(values.order.tax),
    },
  };
};

const numberFieldValue = (value: string) => {
  if (value === "") {
    return "";
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : "";
};

const sectionTitleSx = {
  fontSize: "1rem",
  fontWeight: 700,
};

export default function FormPostPage() {
  const { showToast } = useToast();
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>({
    type: "info",
    text: "New form mode active. Use GET to load sample data for edit, then POST to save the payload.",
  });
  const [savedPayload, setSavedPayload] = useState<SalesOrderPayload | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<SalesOrderFormValues>({
    defaultValues: createEmptyFormValues(),
    mode: "onBlur",
  });

  const watchedValues = useWatch({ control });
  const watchedSubTotal = useWatch({ control, name: "order.subTotal" });
  const watchedTax = useWatch({ control, name: "order.tax" });

  useEffect(() => {
    const computedTotal = toNumber(watchedSubTotal) + toNumber(watchedTax);
    setValue("order.total", computedTotal, {
      shouldValidate: true,
      shouldDirty: isDirty,
    });
  }, [isDirty, setValue, watchedSubTotal, watchedTax]);

  const currentPreview = useMemo(
    () => previewPayload((watchedValues as SalesOrderFormValues) || createEmptyFormValues()),
    [watchedValues],
  );

  const loadExistingOrder = async () => {
    try {
      setIsFetching(true);
      const payload = await mockGetSalesOrder();
      reset(payloadToFormValues(payload));
      setSavedPayload(payload);
      setMode("edit");
      setStatusMessage({
        type: "info",
        text: "Mock GET completed. Existing order data has been loaded into the form for editing.",
      });
      showToast("Existing order fetched and form filled for edit", "info");
    } catch (error) {
      console.error(error);
      setStatusMessage({
        type: "error",
        text: "Unable to load the order from mock GET.",
      });
      showToast("Failed to fetch existing order", "error");
    } finally {
      setIsFetching(false);
    }
  };

  const resetToNewForm = () => {
    reset(createEmptyFormValues());
    setMode("create");
    setStatusMessage({
      type: "info",
      text: "Form reset for a fresh POST request.",
    });
  };

  const onSubmit = handleSubmit(async (values) => {
    const payload = formValuesToPayload(values);

    try {
      const response = await mockPostSalesOrder(payload);
      setSavedPayload(response);
      setMode("edit");
      reset(payloadToFormValues(response));
      setStatusMessage({
        type: "success",
        text: "Mock POST successful. Payload saved and the form now reflects stored server data.",
      });
      showToast("Sales order payload posted successfully", "success");
      console.log("formpost-payload", response);
    } catch (error) {
      console.error(error);
      setStatusMessage({
        type: "error",
        text: "Mock POST failed. Please try again.",
      });
      showToast("Failed to post sales order payload", "error");
    }
  });

  return (
    <Box sx={{ maxWidth: 1400, mx: "auto" }}>
      <Stack spacing={1}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Sales Order Form POST / GET Sample
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            This sample uses `react-hook-form` with your MUI wrapper inputs.
            `GET` loads an existing JSON order into the form for edit, and
            `POST` saves the updated payload back to mock storage.
          </Typography>
        </Box>

        {statusMessage ? (
          <Alert severity={statusMessage.type}>{statusMessage.text}</Alert>
        ) : null}

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", xl: "minmax(0, 2fr) minmax(320px, 1fr)" },
            gap: 3,
            alignItems: "start",
          }}
        >
          <Card sx={{ p: 3 }}>
            <form onSubmit={onSubmit}>
              <Stack spacing={1}>
                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 1.5,
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="h6" fontWeight={700}>
                      Order Entry
                    </Typography>
                    <Chip
                      label={mode === "edit" ? "Edit Mode" : "Create Mode"}
                      color={mode === "edit" ? "primary" : "default"}
                      size="small"
                    />
                  </Stack>

                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Button
                      type="button"
                      variant="outlined"
                      onClick={loadExistingOrder}
                      disabled={isFetching || isSubmitting}
                      startIcon={<CloudDownloadOutlinedIcon />}
                    >
                      {isFetching ? "Loading..." : "GET For Edit"}
                    </Button>
                    <Button
                      type="button"
                      variant="outlined"
                      color="inherit"
                      onClick={resetToNewForm}
                      disabled={isSubmitting}
                      startIcon={<RestartAltOutlinedIcon />}
                    >
                      New Form
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={isSubmitting || isFetching}
                      startIcon={<SaveOutlinedIcon />}
                    >
                      {isSubmitting ? "Posting..." : "POST Payload"}
                    </Button>
                  </Stack>
                </Box>

                <Divider />

                <Stack spacing={2}>
                  <Typography sx={sectionTitleSx}>Customer Details</Typography>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
                      gap: 2,
                    }}
                  >
                    <MuiTextField
                      label="Customer"
                      placeholder="Enter customer name"
                      {...register("customer", {
                        required: "Customer name is required",
                      })}
                      error={!!errors.customer}
                      helperText={errors.customer?.message}
                    />

                    <MuiTextField
                      label="Customer Number"
                      placeholder="Enter customer number"
                      {...register("customerNumber", {
                        required: "Customer number is required",
                      })}
                      error={!!errors.customerNumber}
                      helperText={errors.customerNumber?.message}
                    />

                    <MuiTextField
                      label="Customer PO"
                      placeholder="Enter customer PO"
                      {...register("customerPO", {
                        required: "Customer PO is required",
                      })}
                      error={!!errors.customerPO}
                      helperText={errors.customerPO?.message}
                    />

                    <MuiTextField
                      label="Customer Contact"
                      placeholder="Optional customer contact"
                      {...register("customerContact", {
                        pattern: {
                          value: /^[0-9+\-\s()]*$/,
                          message: "Only phone-friendly characters are allowed",
                        },
                      })}
                      error={!!errors.customerContact}
                      helperText={errors.customerContact?.message}
                    />
                  </Box>
                </Stack>

                <Stack spacing={2}>
                  <Typography sx={sectionTitleSx}>Ship To Location</Typography>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
                      gap: 2,
                    }}
                  >
                    <MuiTextField
                      label="Ship To City"
                      {...register("shipToLocation.city", {
                        required: "Ship to city is required",
                      })}
                      error={!!errors.shipToLocation?.city}
                      helperText={errors.shipToLocation?.city?.message}
                    />
                    <MuiTextField
                      label="Ship To State"
                      {...register("shipToLocation.state", {
                        required: "Ship to state is required",
                      })}
                      error={!!errors.shipToLocation?.state}
                      helperText={errors.shipToLocation?.state?.message}
                    />
                    <MuiTextField
                      label="Ship To Address Line 1"
                      {...register("shipToLocation.addressLine1", {
                        required: "Ship to address line 1 is required",
                      })}
                      error={!!errors.shipToLocation?.addressLine1}
                      helperText={errors.shipToLocation?.addressLine1?.message}
                    />
                    <MuiTextField
                      label="Ship To Address Line 2"
                      {...register("shipToLocation.addressLine2")}
                    />
                    <MuiTextField
                      label="Ship To Pincode"
                      {...register("shipToLocation.pincode", {
                        required: "Ship to pincode is required",
                        pattern: {
                          value: /^[1-9][0-9]{5}$/,
                          message: "Enter a valid 6 digit pincode",
                        },
                      })}
                      error={!!errors.shipToLocation?.pincode}
                      helperText={errors.shipToLocation?.pincode?.message}
                    />
                  </Box>
                </Stack>

                <Stack spacing={2}>
                  <Typography sx={sectionTitleSx}>Bill To Location</Typography>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
                      gap: 2,
                    }}
                  >
                    <MuiTextField
                      label="Bill To City"
                      {...register("billToLocation.city", {
                        required: "Bill to city is required",
                      })}
                      error={!!errors.billToLocation?.city}
                      helperText={errors.billToLocation?.city?.message}
                    />
                    <MuiTextField
                      label="Bill To State"
                      {...register("billToLocation.state", {
                        required: "Bill to state is required",
                      })}
                      error={!!errors.billToLocation?.state}
                      helperText={errors.billToLocation?.state?.message}
                    />
                    <MuiTextField
                      label="Bill To Address Line 1"
                      {...register("billToLocation.addressLine1", {
                        required: "Bill to address line 1 is required",
                      })}
                      error={!!errors.billToLocation?.addressLine1}
                      helperText={errors.billToLocation?.addressLine1?.message}
                    />
                    <MuiTextField
                      label="Bill To Address Line 2"
                      {...register("billToLocation.addressLine2")}
                    />
                    <MuiTextField
                      label="Bill To Pincode"
                      {...register("billToLocation.pincode", {
                        required: "Bill to pincode is required",
                        pattern: {
                          value: /^[1-9][0-9]{5}$/,
                          message: "Enter a valid 6 digit pincode",
                        },
                      })}
                      error={!!errors.billToLocation?.pincode}
                      helperText={errors.billToLocation?.pincode?.message}
                    />
                  </Box>
                </Stack>

                <Stack spacing={2}>
                  <Typography sx={sectionTitleSx}>Order Details</Typography>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
                      gap: 2,
                    }}
                  >
                    <MuiTextField
                      label="Order Number"
                      {...register("order.orderNumber", {
                        required: "Order number is required",
                      })}
                      error={!!errors.order?.orderNumber}
                      helperText={errors.order?.orderNumber?.message}
                    />

                    <MuiTextField
                      label="Order Type"
                      {...register("order.orderType", {
                        required: "Order type is required",
                      })}
                      error={!!errors.order?.orderType}
                      helperText={errors.order?.orderType?.message}
                    />

                    <Controller
                      name="order.dateOfOrder"
                      control={control}
                      rules={{
                        validate: (value) =>
                          value ? true : "Date of order is required",
                      }}
                      render={({ field }) => (
                        <MuiDatePicker
                          label="Date Of Order"
                          value={field.value}
                          onChange={field.onChange}
                          onClose={field.onBlur}
                          error={!!errors.order?.dateOfOrder}
                          helperText={errors.order?.dateOfOrder?.message}
                          required
                        />
                      )}
                    />

                    <MuiTextField
                      label="Price List"
                      {...register("order.priceList", {
                        required: "Price list is required",
                      })}
                      error={!!errors.order?.priceList}
                      helperText={errors.order?.priceList?.message}
                    />

                    <MuiTextField
                      label="Sales Person"
                      {...register("order.salesPerson", {
                        required: "Sales person is required",
                      })}
                      error={!!errors.order?.salesPerson}
                      helperText={errors.order?.salesPerson?.message}
                    />

                    <MuiTextField
                      label="Status"
                      {...register("order.status", {
                        required: "Status is required",
                      })}
                      error={!!errors.order?.status}
                      helperText={errors.order?.status?.message}
                    />

                    <MuiTextField
                      label="Currency"
                      {...register("order.currency", {
                        required: "Currency is required",
                        minLength: {
                          value: 3,
                          message: "Currency should be at least 3 characters",
                        },
                      })}
                      error={!!errors.order?.currency}
                      helperText={errors.order?.currency?.message}
                    />

                    <MuiTextField
                      label="Tax Category"
                      placeholder="Optional tax category"
                      {...register("order.taxCategory")}
                    />

                    <MuiTextField
                      label="Sub Total"
                      type="number"
                      inputProps={{ min: 0 }}
                      {...register("order.subTotal", {
                        required: "Sub total is required",
                        min: {
                          value: 0,
                          message: "Sub total cannot be negative",
                        },
                        setValueAs: numberFieldValue,
                      })}
                      error={!!errors.order?.subTotal}
                      helperText={errors.order?.subTotal?.message}
                    />

                    <MuiTextField
                      label="Tax"
                      type="number"
                      inputProps={{ min: 0 }}
                      {...register("order.tax", {
                        min: {
                          value: 0,
                          message: "Tax cannot be negative",
                        },
                        setValueAs: numberFieldValue,
                      })}
                      error={!!errors.order?.tax}
                      helperText={errors.order?.tax?.message}
                    />

                    <MuiTextField
                      label="Total"
                      type="number"
                      value={toNumber(watchedSubTotal) + toNumber(watchedTax)}
                      slotProps={{
                        htmlInput: { readOnly: true },
                      }}
                      helperText="Auto calculated from Sub Total + Tax"
                    />
                  </Box>
                </Stack>
              </Stack>
            </form>
          </Card>

          <Stack spacing={1}>
            <Paper sx={{ p: 3 }}>
              <Stack spacing={2}>
                <Typography variant="h6" fontWeight={700}>
                  Current Payload Preview
                </Typography>
                <Typography variant="body2">
                  `handleSubmit` sends this shaped JSON after trimming text,
                  formatting the date, and recalculating totals.
                </Typography>
                <Box
                  component="pre"
                  sx={{
                    m: 0,
                    p: 2,
                    borderRadius: 1,
                    bgcolor: "grey.100",
                    overflowX: "auto",
                    fontSize: "0.8rem",
                  }}
                >
                  {JSON.stringify(currentPreview, null, 2)}
                </Box>
              </Stack>
            </Paper>

            <Paper sx={{ p: 3 }}>
              <Stack spacing={2}>
                <Typography variant="h6" fontWeight={700}>
                  Last Saved Server Data
                </Typography>
                <Typography variant="body2">
                  Mock API data is persisted in browser `localStorage`, so GET
                  can refill the form after POST.
                </Typography>
                <Box
                  component="pre"
                  sx={{
                    m: 0,
                    p: 2,
                    borderRadius: 1,
                    bgcolor: "grey.100",
                    overflowX: "auto",
                    fontSize: "0.8rem",
                    minHeight: 220,
                  }}
                >
                  {savedPayload
                    ? JSON.stringify(savedPayload, null, 2)
                    : "No saved payload yet. Click GET For Edit or POST Payload."}
                </Box>
              </Stack>
            </Paper>
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
}
