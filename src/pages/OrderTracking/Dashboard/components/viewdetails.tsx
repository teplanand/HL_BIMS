import { forwardRef, memo, useCallback, useEffect, useImperativeHandle, useMemo, useState } from "react";
import { Box, CircularProgress, Stack, Tab, Tabs, Typography } from "@mui/material";
import dayjs from "dayjs";
import { Controller, useForm, useWatch } from "react-hook-form";
import { MuiDatePicker, MuiTextField } from "../../../../components/mui/input";
import { FormStackGrid } from "../../../../components/ui/form/stack";
import FormSection from "../../../../components/ui/form/FormSection";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import TimelineOutlinedIcon from "@mui/icons-material/TimelineOutlined";
import { useToast } from "../../../../hooks/useToast";
import { useGetOrderByIdMutation, useUpdateOrderMutation } from "../../../../redux/api/ordertracking";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const ORDER_INFORMATION_FIELDS = [
  "line_id",
  "division",
  "sub_division",
  "cust_po_no",
  "end_cust_name",
  "branch_name",
  "qty",
  "uom",
  "item_desc_cust_po",
  "ora_item_desc",
  
  "po_value",
  "cust_po_date",
  "cust_po_tech_clear_date",
  "delivery_date_po",
    
  "ga_dim_no",
    "po_received_date_to_ga_drw_submission_days",
  "ga_drawing_submission_to_final_approval_received_days",
  "ga_dim_drw_submission_design_plan",
  "ga_dim_drw_submission_design_actual",
  "final_drg_approval_received_date_plan",
  "final_drg_approval_received_date_actual",

  "work_order_no",
  "work_order_date",
  "commited_ex_works_delivery_date",
 
  "remarks",
] as const;

const CALCULATED_FIELD_KEYS = new Set([
  "delivery_days_frm_po_date",
  "days_in_drawing_approval",
  "perc_time_taken_of_total_po_delivery",
    "on_time_delivery",
]);

const DATE_INPUT_FIELDS = new Set([
  "cust_po_date",
  "cust_po_tech_clear_date",
  "delivery_date_po",
 
  "ga_dim_drw_submission_design_plan",
  "ga_dim_drw_submission_design_actual",
  "final_drg_approval_received_date_plan",
  "final_drg_approval_received_date_actual",
  "work_order_date",
  "commited_ex_works_delivery_date",
  
]);

const EDITABLE_ORDER_FIELDS = new Set([
  "ga_dim_no",
  "ga_dim_drw_submission_design_plan",
  "ga_dim_drw_submission_design_actual",
  "final_drg_approval_received_date_plan",
  "final_drg_approval_received_date_actual",
  "po_received_date_to_ga_drw_submission_days",
  "ga_drawing_submission_to_final_approval_received_days",
]);
const MULTILINE_FIELDS = new Set(["item_desc_cust_po", "ora_item_desc", "remarks"]);
const DOUBLE_WIDTH_FIELDS = new Set(["item_desc_cust_po", "ora_item_desc"]);

const LABEL_OVERRIDES: Record<string, string> = {
  id: "ID",
  po: "PO",
  ga: "GA",
  uom: "UOM",
};

const toFieldLabel = (key: string) =>
  key
    .split("_")
    .filter(Boolean)
    .map((word) => {
      const normalizedWord = word.toLowerCase();
      if (LABEL_OVERRIDES[normalizedWord]) {
        return LABEL_OVERRIDES[normalizedWord];
      }

      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");

const formatInputDate = (val: string | null | undefined) => {
  if (!val) return "";
  return String(val).split("T")[0];
};

const getDateOnlyTimestamp = (value: unknown) => {
  if (!value) return null;

  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return Date.UTC(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
};

const getAbsoluteDateDiffInDays = (start: unknown, end: unknown) => {
  const startTimestamp = getDateOnlyTimestamp(start);
  const endTimestamp = getDateOnlyTimestamp(end);

  if (startTimestamp === null || endTimestamp === null) {
    return null;
  }

  return Math.abs((endTimestamp - startTimestamp) / DAY_IN_MS);
};

const getOnTimeDeliveryScore = (requestDate: unknown, deliveryDateActual: unknown) => {
  const requestTimestamp = getDateOnlyTimestamp(requestDate);
  const deliveryActualTimestamp = getDateOnlyTimestamp(deliveryDateActual);

  if (requestTimestamp === null || deliveryActualTimestamp === null) {
    return null;
  }

  return deliveryActualTimestamp >= requestTimestamp ? 100 : 0;
};

const formatMetricValue = (value: number | null, suffix = "") => {
  if (value === null || Number.isNaN(value)) {
    return "-";
  }

  return `${value.toFixed(2)}${suffix}`;
};

const getPlanActualDisplayColor = (plan: unknown, actual: unknown) => {
  if (!plan && !actual) return "#9CA3AF";
  if ((!plan && actual) || (plan && !actual)) return "#9CA3AF";

  const planDate = new Date(String(plan));
  const actualDate = new Date(String(actual));

  if (!Number.isNaN(planDate.getTime()) && !Number.isNaN(actualDate.getTime())) {
    return planDate.getTime() >= actualDate.getTime() ? "#22C55E" : "#EF4444";
  }

  const planNumber = Number(plan);
  const actualNumber = Number(actual);

  if (!Number.isNaN(planNumber) && !Number.isNaN(actualNumber)) {
    return planNumber >= actualNumber ? "#22C55E" : "#EF4444";
  }

  return "#2563EB";
};

const isOrderFieldReadOnly = (field: string) => !EDITABLE_ORDER_FIELDS.has(field);
const getFieldHighlightSx = (field: string) =>
  isOrderFieldReadOnly(field)
    ? undefined
    : {
        "& .MuiOutlinedInput-notchedOutline": {
          borderColor: "#EAB308",
          borderWidth: 1.5,
        },
        "& .MuiInputLabel-root": {
          color: "#A16207",
          fontWeight: 600,
        },
      };

interface ViewDetailsProps {
  defaultValues?: Record<string, any>;
  onClose?: () => void;
}

export type ViewDetailsRef = {
  submit: () => Promise<void>;
};

function Index(
  { defaultValues: rowData, onClose }: ViewDetailsProps,
  ref: React.Ref<ViewDetailsRef>
) {
  const [getOrderById, { isLoading: isFetching }] = useGetOrderByIdMutation();
  const [updateOrder] = useUpdateOrderMutation();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState(0);
  const [orderDetails, setOrderDetails] = useState<Record<string, any> | null>(null);

  const { register, control, handleSubmit, reset } = useForm();
  const watchedCustPoDate = useWatch({ control, name: "cust_po_date" });
  const watchedDeliveryDatePo = useWatch({ control, name: "delivery_date_po" });
  const watchedcommited_ex_works_delivery_date = useWatch({ control, name: "commited_ex_works_delivery_date" });
  const watchedDispatchDateActual = useWatch({ control, name: "dispatch_date_actual" });
  const watchedFinalApprovalActual = useWatch({
    control,
    name: "final_drg_approval_received_date_actual",
  });
  const watchedPlanActualValues = useWatch({ control });

  useEffect(() => {
    if (!rowData?.id) return;
    getOrderById(rowData.id)
      .unwrap()
      .then((result) => {
        const d = result.data?.[0] ?? rowData;
        setOrderDetails(d);
        reset({
          id: d.id ?? rowData?.id ?? "",
          line_id: d.line_id ?? "",
          division: d.division ?? "",
          sub_division: d.sub_division ?? "",
          cust_po_no: d.cust_po_no ?? "",
          end_cust_name: d.end_cust_name ?? "",
          branch_name: d.branch_name ?? "",
          item_desc_cust_po: d.item_desc_cust_po ?? "",
          ora_item_desc: d.ora_item_desc ?? "",
          qty: d.qty ?? "",
          uom: d.uom ?? "",
          po_value: d.po_value ?? "",
          cust_po_date: formatInputDate(d.cust_po_date),
          cust_po_tech_clear_date: formatInputDate(d.cust_po_tech_clear_date),
          delivery_date_po: formatInputDate(d.delivery_date_po),
          delivery_days_frm_po_date: d.delivery_days_frm_po_date ?? "",
          ga_dim_no: d.ga_dim_no ?? "",
          ga_dim_drw_submission_design_plan: formatInputDate(d.ga_dim_drw_submission_design_plan),
          ga_dim_drw_submission_design_actual: formatInputDate(d.ga_dim_drw_submission_design_actual),
          final_drg_approval_received_date_plan: formatInputDate(d.final_drg_approval_received_date_plan),
          final_drg_approval_received_date_actual: formatInputDate(d.final_drg_approval_received_date_actual),
          po_received_date_to_ga_drw_submission_days: d.po_received_date_to_ga_drw_submission_days ?? "",
          ga_drawing_submission_to_final_approval_received_days:
            d.ga_drawing_submission_to_final_approval_received_days ?? "",
          days_in_drawing_approval: d.days_in_drawing_approval ?? "",
          perc_time_taken_of_total_po_delivery: d.perc_time_taken_of_total_po_delivery ?? "",
          work_order_no: d.work_order_no ?? "",
          work_order_date: formatInputDate(d.work_order_date),
          commited_ex_works_delivery_date: formatInputDate(d.commited_ex_works_delivery_date),
           amp_plan: formatInputDate(d.amp_plan),
          amp_actual: formatInputDate(d.amp_actual),
          bom_plan: formatInputDate(d.bom_plan),
          bom_actual: formatInputDate(d.bom_actual),
          gear_case_plan: formatInputDate(d.gear_case_plan),
          gearcase_actual: formatInputDate(d.gearcase_actual),
          internal_plan: formatInputDate(d.internal_plan),
          internal_actual: formatInputDate(d.internal_actual),
          bo_plan: formatInputDate(d.bo_plan),
          bo_actual: formatInputDate(d.bo_actual),
          assembly_plan: formatInputDate(d.assembly_plan),
          assembly_actual: formatInputDate(d.assembly_actual),
          testing_plan: formatInputDate(d.testing_plan),
          testing_actual: formatInputDate(d.testing_actual),
          dispatch_date_plan: formatInputDate(d.dispatch_date_plan),
          dispatch_date_actual: formatInputDate(d.dispatch_date_actual),
          on_time_delivery: d.on_time_delivery ?? "",
          remarks: d.remarks ?? "",
        });
      })
      .catch(() => {
        /* keep form blank on error */
      });
  }, [getOrderById, reset, rowData]);

  const computedMetrics = useMemo(() => {
    const source = orderDetails ?? rowData ?? {};
    const deliveryDaysFromPoDate = getAbsoluteDateDiffInDays(
      watchedCustPoDate || source.cust_po_date,
      watchedDeliveryDatePo || source.delivery_date_po
    );
    const daysInDrawingApproval = getAbsoluteDateDiffInDays(
      watchedCustPoDate || source.cust_po_date,
      watchedFinalApprovalActual || source.final_drg_approval_received_date_actual
    );
    const onTimeDelivery = getOnTimeDeliveryScore(
      watchedcommited_ex_works_delivery_date || source.commited_ex_works_delivery_date || watchedDeliveryDatePo || source.delivery_date_po,
      watchedDispatchDateActual || source.dispatch_date_actual
    );
    const percentTimeTaken =
      deliveryDaysFromPoDate && daysInDrawingApproval !== null
        ? (daysInDrawingApproval / deliveryDaysFromPoDate) * 100
        : null;

    return {
      delivery_days_frm_po_date: deliveryDaysFromPoDate,
      days_in_drawing_approval: daysInDrawingApproval,
      perc_time_taken_of_total_po_delivery: percentTimeTaken,
      on_time_delivery: onTimeDelivery,
    };
  }, [
    orderDetails,
    rowData,
    watchedCustPoDate,
    watchedDeliveryDatePo,
    watchedcommited_ex_works_delivery_date,
    watchedDispatchDateActual,
    watchedFinalApprovalActual,
  ]);

  const onSubmit = useCallback(async (formData: any) => {
    console.log("formData", formData);

    if (!rowData?.id) return;
    try {
      await updateOrder({
        ...rowData,
        ...formData,
        id: rowData.id,
        on_time_delivery: computedMetrics.on_time_delivery,
        delivery_days_frm_po_date: computedMetrics.delivery_days_frm_po_date,
        days_in_drawing_approval: computedMetrics.days_in_drawing_approval,
        perc_time_taken_of_total_po_delivery:
          computedMetrics.perc_time_taken_of_total_po_delivery,
      }).unwrap();

      showToast("Order updated successfully", "success");
      onClose?.();
    } catch (error: any) {
      showToast(error?.data?.message || "Failed to update order", "error");
    }
  }, [computedMetrics, onClose, rowData, showToast, updateOrder]);

  useImperativeHandle(
    ref,
    () => ({
      submit: async () => {
        await handleSubmit(onSubmit)();
      },
    }),
    [handleSubmit, onSubmit]
  );

  if (isFetching) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 300, gap: 2 }}>
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">Loading details...</Typography>
      </Box>
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={1}>
        <Tabs
          value={activeTab}
          onChange={(_, value) => setActiveTab(value)}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: "divider" }}
        >
          <Tab label="Order Information" />
          <Tab label="Plan vs Actual Dates" />
        </Tabs>

        {activeTab === 0 && (
          <FormSection
            title="Order Information"
            description="Line item identification, customer, and delivery details"
            icon={<InfoOutlinedIcon fontSize="small" />}
          >
            <Stack spacing={2}>
              <Box>
                <FormStackGrid columns={4}>
                  {ORDER_INFORMATION_FIELDS.filter((field) => !CALCULATED_FIELD_KEYS.has(field)).map((field) => {
                    const label = toFieldLabel(field);

                    

                    return (
                      <Box
                        key={field}
                        sx={{
                          mb: 1,
                          gridColumn:
                            field === "remarks"
                              ? { md: "span 4" }
                              : DOUBLE_WIDTH_FIELDS.has(field)
                                ? { md: "span 2" }
                                : undefined,
                        }}
                      >
                        {DATE_INPUT_FIELDS.has(field) ? (
                          <Controller
                            name={field}
                            control={control}
                            render={({ field: dateField }) => (
                              <MuiDatePicker
                                label={label}
                                value={dateField.value ? dayjs(dateField.value) : null}
                                onChange={(value) =>
                                  dateField.onChange(
                                    value && dayjs(value).isValid()
                                      ? dayjs(value).format("YYYY-MM-DD")
                                      : ""
                                  )
                                }
                                readOnly={isOrderFieldReadOnly(field)}
                                textFieldSx={getFieldHighlightSx(field)}
                              />
                            )}
                          />
                        ) : (
                          <MuiTextField
                            label={label}
                            {...register(field)}
                            type="text"
                            multiline={MULTILINE_FIELDS.has(field)}
                            rows={field === "remarks" ? 2 : MULTILINE_FIELDS.has(field) ? 3 : undefined}
                            inputProps={
                              isOrderFieldReadOnly(field)
                                ? { readOnly: MULTILINE_FIELDS.has(field) ? false : true }
                                : undefined
                            }
                            sx={getFieldHighlightSx(field)}
                            fullWidth
                          />
                        )}
                      </Box>
                    );
                  })}
                </FormStackGrid>
              </Box>

              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
                  Calculated Values
                </Typography>
                <FormStackGrid columns={4}>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 1.5,
                      border: "1px solid",
                      borderColor: "divider",
                      backgroundColor: "background.default",
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      Delivery Days From PO Date
                    </Typography>
                    <Typography variant="h6" sx={{ mt: 0.5 }}>
                      {formatMetricValue(computedMetrics.delivery_days_frm_po_date)}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 1.5,
                      border: "1px solid",
                      borderColor: "divider",
                      backgroundColor: "background.default",
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      Days In Drawing Approval
                    </Typography>
                    <Typography variant="h6" sx={{ mt: 0.5 }}>
                      {formatMetricValue(computedMetrics.days_in_drawing_approval)}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 1.5,
                      border: "1px solid",
                      borderColor: "divider",
                      backgroundColor: "background.default",
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      Final Approval Time
                    </Typography>
                    <Typography variant="h6" sx={{ mt: 0.5 }}>
                      {formatMetricValue(
                        computedMetrics.perc_time_taken_of_total_po_delivery,
                        "%"
                      )}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 1.5,
                      border: "1px solid",
                      borderColor: "divider",
                      backgroundColor: "background.default",
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      On Time Delivery
                    </Typography>
                    <Typography variant="h6" sx={{ mt: 0.5 }}>
                      {computedMetrics.on_time_delivery ?? "-"}
                    </Typography>
                  </Box>


                </FormStackGrid>
              </Box>

            </Stack>
          </FormSection>
        )}

        {activeTab === 1 && (
          <FormSection
            title="Plan vs Actual Dates"
            description="Scheduled and actual completion dates across manufacturing stages"
            icon={<TimelineOutlinedIcon fontSize="small" />}
            accentColor="#1D4ED8"
          >
            <FormStackGrid columns={3}>
              {[
                { label: "AMP", plan: "amp_plan", actual: "amp_actual" },
                { label: "BOM", plan: "bom_plan", actual: "bom_actual" },
                { label: "Gear Case", plan: "gear_case_plan", actual: "gearcase_actual" },
                { label: "Internal", plan: "internal_plan", actual: "internal_actual" },
                { label: "BO", plan: "bo_plan", actual: "bo_actual" },
                { label: "Assembly", plan: "assembly_plan", actual: "assembly_actual" },
                { label: "Testing", plan: "testing_plan", actual: "testing_actual" },
                { label: "Dispatch", plan: "dispatch_date_plan", actual: "dispatch_date_actual" },
              ].map(({ label, plan, actual }) => (
                <Box key={label} sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 3 }}>
                  <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
                    {label}
                  </Typography>
                  <Controller
                    name={plan}
                    control={control}
                    render={({ field }) => (
                      <MuiDatePicker
                        label="Plan"
                        value={field.value ? dayjs(field.value) : null}
                        onChange={(value) =>
                          field.onChange(
                            value && dayjs(value).isValid() ? dayjs(value).format("YYYY-MM-DD") : ""
                          )
                        }
                        readOnly
                      />
                    )}
                  />
                  <Box sx={{ mt: 1 }}>
                  <Controller
                    name={actual}
                    control={control}
                    render={({ field }) => {
                      const planValue = watchedPlanActualValues?.[plan];
                      const displayColor = getPlanActualDisplayColor(
                        planValue,
                        field.value
                      );

                      return (
                        <MuiDatePicker
                          label="Actual"
                          value={field.value ? dayjs(field.value) : null}
                          onChange={(value) =>
                            field.onChange(
                              value && dayjs(value).isValid() ? dayjs(value).format("YYYY-MM-DD") : ""
                            )
                          }
                          readOnly
                          textFieldSx={{
                            "& .MuiOutlinedInput-notchedOutline": {
                              borderColor: displayColor,
                              borderWidth: 1.5,
                            },
                            "& .MuiInputLabel-root": {
                              color: displayColor,
                              fontWeight: 600,
                            },
                            "& .MuiOutlinedInput-input": {
                              color: displayColor,
                              fontWeight: 600,
                            },
                          }}
                        />
                      );
                    }}
                  />
                  </Box>
                </Box>
              ))}
            </FormStackGrid>
          </FormSection>
        )}
      </Stack>
    </Box>
  );
}

export const ViewDetails = memo(forwardRef(Index));
