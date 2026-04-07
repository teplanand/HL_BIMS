import React, { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Card,
  Chip,
  Divider,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import RestartAltOutlinedIcon from '@mui/icons-material/RestartAltOutlined';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import dayjs, { Dayjs } from 'dayjs';
import { endOfWeek, startOfWeek } from 'date-fns';
import {
  MuiAutocomplete,
  MuiButtonGroup,
  MuiCheckbox,
  MuiDatePicker,
  MuiDateRangePicker,
  MuiFab,
  MuiRadioGroup,
  MuiSelect,
  MuiSwitch,
  MuiTextField,
  MuiToggleButtonGroup,
} from '../../../components/mui/input';
import type { DateRange } from '../../../components/common/DateRangePicker';
import { useForm } from '../../../hooks/useForm';

type Option = {
  label: string;
  value: string;
};

type MuiFormValues = {
  fullName: string;
  email: string;
  department: string;
  location: Option | null;
  skills: Option[];
  gender: string;
  workMode: string;
  startDate: Dayjs | null;
  reportingRange: DateRange;
  notes: string;
  notifications: boolean;
  terms: boolean;
};

const departmentOptions: Option[] = [
  { label: 'Engineering', value: 'engineering' },
  { label: 'Design', value: 'design' },
  { label: 'Operations', value: 'operations' },
  { label: 'Finance', value: 'finance' },
];

const locationOptions: Option[] = [
  { label: 'Ahmedabad', value: 'ahmedabad' },
  { label: 'Vadodara', value: 'vadodara' },
  { label: 'Surat', value: 'surat' },
  { label: 'Mumbai', value: 'mumbai' },
];

const skillOptions: Option[] = [
  { label: 'React', value: 'react' },
  { label: 'TypeScript', value: 'typescript' },
  { label: 'Material UI', value: 'mui' },
  { label: 'Testing', value: 'testing' },
  { label: 'Design Systems', value: 'design-systems' },
];

const initialValues: MuiFormValues = {
  fullName: '',
  email: '',
  department: '',
  location: null,
  skills: [],
  gender: '',
  workMode: '',
  startDate: null,
  reportingRange: {
    startDate: null,
    endDate: null,
  },
  notes: '',
  notifications: true,
  terms: false,
};

export default function MuiSampleForm() {
  const [formMessage, setFormMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  const {
    values,
    handleChange,
    handleBlur,
    validateAll,
    handleSubmit,
    register,
    resetForm,
    setErrors,
    setTouched,
    setValues,
  } = useForm(initialValues);

  const previewValues = useMemo(
    () => ({
      ...values,
      location: values.location?.label || null,
      skills: values.skills.map((skill) => skill.label),
      startDate: values.startDate ? values.startDate.format('DD/MM/YYYY') : null,
      reportingRange:
        values.reportingRange.startDate && values.reportingRange.endDate
          ? `${dayjs(values.reportingRange.startDate).format('DD/MM/YYYY')} - ${dayjs(
            values.reportingRange.endDate,
          ).format('DD/MM/YYYY')}`
          : null,
    }),
    [values],
  );

  const applyDemoValues = () => {
    setErrors({});
    setTouched({});
    setValues({
      fullName: 'Nirav Patel',
      email: 'nirav.patel@elecon.com',
      department: 'engineering',
      location: locationOptions[0],
      skills: [skillOptions[0], skillOptions[1], skillOptions[2]],
      gender: 'male',
      workMode: 'hybrid',
      startDate: dayjs(),
      reportingRange: {
        startDate: startOfWeek(new Date(), { weekStartsOn: 1 }),
        endDate: endOfWeek(new Date(), { weekStartsOn: 1 }),
      },
      notes: 'This sample showcases all MUI input wrappers with validation.',
      notifications: true,
      terms: true,
    });

    setFormMessage({
      type: 'info',
      text: 'Demo values filled. You can now tweak fields or submit the form.',
    });
  };

  const validateForm = () => {
    const isValid = validateAll();
    setFormMessage({
      type: isValid ? 'success' : 'error',
      text: isValid
        ? 'Validation passed. The sample form is ready to submit.'
        : 'Validation failed. Check the highlighted fields below.',
    });
  };

  const submitForm = handleSubmit(async (formValues) => {
    console.log('MUI Form Payload:', formValues);
    setFormMessage({
      type: 'success',
      text: 'Form submitted successfully. Payload is logged in the console.',
    });
  });

  return (
    <Box className=" max-w-6xl mx-auto">
      <Stack spacing={1}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            MUI Wrapper Form Sample
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            This page demonstrates all components from `src/components/mui/input`
            with validation, a single date picker, and a date range picker with
            presets like Today, Yesterday, This Week, This Month, Last 7 Days,
            Last Month, Current FY, and Custom Range.
          </Typography>
        </Box>

        {formMessage ? <Alert severity={formMessage.type}>{formMessage.text}</Alert> : null}

        <Card sx={{ p: 3 }}>
          <form onSubmit={submitForm}>
            <Stack spacing={1}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                  gap: 3,
                }}
              >
                <MuiTextField
                  label="Full Name"
                  placeholder="Enter employee full name"
                  {...register('fullName', {
                    required: 'Full name is required.',
                    minLength: {
                      value: 3,
                      message: 'Full name must be at least 3 characters.',
                    },
                  })}
                />

                <MuiTextField
                  label="Email"
                  type="email"
                  placeholder="name@elecon.com"
                  {...register('email', {
                    required: 'Email is required.',
                    pattern: {
                      value: /^\S+@\S+\.\S+$/,
                      message: 'Enter a valid email address.',
                    },
                  })}
                />

                <MuiSelect
                  label="Department"
                  options={departmentOptions}
                  placeholder="Select Department"
                  displayEmpty
                  {...register('department', {
                    required: 'Please select a department.',
                  })}
                />

                <MuiDatePicker
                  label="Joining Date"
                  value={values.startDate}
                  onChange={(value) => handleChange('startDate', value)}
                  onClose={() => handleBlur('startDate')}
                  {...register('startDate', {
                    validate: (value) => (!value ? 'Joining date is required.' : null),
                  })}
                />

                <MuiAutocomplete
                  {...register('location', {
                    validate: (value) => (!value ? 'Please choose a location.' : null),
                  })}
                  options={locationOptions}
                  value={values.location}
                  onChange={(_, value) => handleChange('location', value)}
                  onBlur={() => handleBlur('location')}
                  isOptionEqualToValue={(option, value) => option.value === value.value}
                  getOptionLabel={(option) => option.label}
                  label="Location"
                  placeholder="Search office location"
                />

                <MuiAutocomplete
                  {...register('skills', {
                    validate: (value) =>
                      !value?.length ? 'Select at least one skill.' : null,
                  })}
                  multiple
                  options={skillOptions}
                  value={values.skills}
                  onChange={(_, value) => handleChange('skills', value)}
                  onBlur={() => handleBlur('skills')}
                  isOptionEqualToValue={(option, value) => option.value === value.value}
                  getOptionLabel={(option) => option.label}
                  label="Skills"
                  placeholder="Select multiple skills"
                />

                <MuiDateRangePicker
                  {...register('reportingRange', {
                    validate: (value) =>
                      !value?.startDate || !value?.endDate
                        ? 'Please select a complete reporting range.'
                        : null,
                  })}
                  label="Reporting Range"
                  value={values.reportingRange}
                  onChange={(range) => {
                    handleChange('reportingRange', range);
                    if (range.startDate && range.endDate) {
                      handleBlur('reportingRange');
                    }
                  }}
                />

                <Stack spacing={1}>
                  <MuiRadioGroup
                    {...register('gender', {
                      required: 'Please select gender.',
                    })}
                    label="Gender"
                    name="gender"
                    value={values.gender}
                    onChange={(event) => handleChange('gender', event.target.value)}
                    onBlur={() => handleBlur('gender')}
                    options={[
                      { label: 'Male', value: 'male' },
                      { label: 'Female', value: 'female' },
                      { label: 'Other', value: 'other' },
                    ]}
                  />

                  <MuiToggleButtonGroup
                    {...register('workMode', {
                      validate: (value) =>
                        !value ? 'Choose your preferred work mode.' : null,
                    })}
                    label="Work Mode"
                    value={values.workMode}
                    exclusive
                    fullWidth
                    onChange={(_, value) => {
                      handleChange('workMode', value || '');
                      handleBlur('workMode');
                    }}
                    options={[
                      { label: 'Office', value: 'office' },
                      { label: 'Hybrid', value: 'hybrid' },
                      { label: 'Remote', value: 'remote' },
                    ]}
                  />

                  <MuiSwitch
                    label="Enable Notifications"
                    {...register('notifications')}
                    helperText="Receive review reminders and status updates."
                  />

                  <MuiCheckbox
                    label="I agree to the internal review policy"
                    {...register('terms', {
                      validate: (value) =>
                        !value ? 'Please accept the policy before submitting.' : null,
                    })}
                  />
                </Stack>
              </Box>

              <MuiTextField
                label="Notes"
                placeholder="Add onboarding or handover notes"
                multiline
                minRows={4}
                {...register('notes', {
                  required: 'Notes are required.',
                  minLength: {
                    value: 10,
                    message: 'Notes must be at least 10 characters.',
                  },
                })}
              />

              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 2,
                  pt: 1,
                }}
              >


                <Stack direction="row" spacing={1.5} alignItems="center">
                  <MuiFab
                    type="button"
                    variant="extended"
                    size="medium"
                    onClick={applyDemoValues}
                  >
                    <AutoAwesomeOutlinedIcon sx={{ mr: 1 }} />
                    Quick Fill
                  </MuiFab>

                  <MuiButtonGroup
                    buttons={[
                      {
                        label: (
                          <>
                            <RestartAltOutlinedIcon sx={{ mr: 1 }} />
                            Reset
                          </>
                        ),
                        onClick: () => {
                          resetForm();
                          setFormMessage(null);
                        },
                        type: 'button',
                      },
                      {
                        label: 'Validate',
                        onClick: validateForm,
                        type: 'button',
                      },
                      {
                        label: (
                          <>
                            <SendOutlinedIcon sx={{ mr: 1 }} />
                            Submit
                          </>
                        ),
                        type: 'submit',
                      },
                    ]}
                  />
                </Stack>
              </Box>
            </Stack>
          </form>
        </Card>

        <Paper sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Typography variant="h6" fontWeight={700}>
              Live Preview
            </Typography>
            <Typography variant="body2">
              Below payload helps verify that every MUI sample component is connected
              to the form state.
            </Typography>
            <Box
              component="pre"
              sx={{
                m: 0,
                p: 2,
                borderRadius: 1,
                bgcolor: 'grey.100',
                color: 'text.primary',
                overflowX: 'auto',
                fontSize: '0.8rem',
              }}
            >
              {JSON.stringify(previewValues, null, 2)}
            </Box>
          </Stack>
        </Paper>
      </Stack>
    </Box>
  );
}
