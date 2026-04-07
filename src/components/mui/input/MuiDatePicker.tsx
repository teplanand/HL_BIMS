import React from 'react';
import { DatePicker, DatePickerProps } from '@mui/x-date-pickers/DatePicker';
import { SxProps, Theme } from '@mui/material/styles';
 

export type MuiDatePickerProps = Omit<DatePickerProps<any>, 'slotProps'> & {
  helperText?: React.ReactNode;
  error?: boolean;
  required?: boolean;
  textFieldSx?: SxProps<Theme>;
};

const MuiDatePicker: React.FC<MuiDatePickerProps> = ({
  helperText,
  error,
  required,
  textFieldSx,
  ...props
}) => {
  const compactTextFieldSx: SxProps<Theme> = {
    width: 190,
    '& .MuiInputBase-root': {
      minHeight: 34,
    },
    '& .MuiInputBase-input': {
      padding: '7px 10px',
      fontSize: '0.8125rem',
    },
    '& .MuiInputLabel-root': {
      fontSize: '0.8125rem',
    },
  };

  return (
    <DatePicker
      format="DD/MM/YYYY"
      {...props}
      slotProps={{
        textField: {
          fullWidth: false,
          size: 'small',
          error,
          helperText,
          required,
          sx: [compactTextFieldSx, textFieldSx] as any,
        },
      }}
    />
  );
};

export default MuiDatePicker;
