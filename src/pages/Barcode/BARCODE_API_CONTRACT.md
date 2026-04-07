# Barcode API  
 
## Common Conventions

### Standard success response

```json
{
  "success": true,
  "message": "Data fetched successfully",
  "data": {}
}
```

### Standard paginated response

```json
{
  "success": true,
  "message": "Data fetched successfully",
  "data": {
    "items": [],
    "page": 1,
    "pageSize": 10,
    "totalItems": 0,
    "totalPages": 0
  }
}
```


 

### GET `/api/v1/barcode/master-data`

```json
{
  "success": true,
  "data": {
    "salesOrderStatuses": [
      "New Sales Order",
      "HOD Review",
      "Planning",
      "Dispatched"
    ],
    "lineItemStatuses": [
      "BOOKED",
      "PL",
      "SH",
      "MI",
      "PK",
      "Hold",
      "Planning",
      "Sortage",
      "Actual Release",
      "Cancel"
    ],
    "mountTypes": [
      "Foot Mount",
      "Flange Mount",
      "B3",
      "B5"
    ],
    "poles": ["2", "4", "6", "8"],
    "electricMotorMakes": ["PBL", "BBL", "Megha", "Simens", "Crompton"],
    "orderCompletionStatuses": ["PK", "PI"],
    "holdBackTypes": ["CW", "ACW"],
    "noiseLevelsDb": ["60", "61", "62", "63", "64", "65"],
    "paintOptions": [
      "Accreylated Alkyd Gear Blue Semi Glossy",
      "GOOD"
    ]
  }
}
```




## 1. Dashboard APIs

### GET `/api/v1/barcode/dashboard/summary`

Used for top cards:

- New Sales Order
- HOD
- Planning
- Dispatch This Month

Response:

```json
{
  "success": true,
  "data": {
    "newSalesOrderCount": 12,
    "hodCount": 4,
    "planningCount": 9,
    "dispatchThisMonthCount": 15
  }
}
```
 
 
### 2. GET `/api/v1/barcode/sales-orders/import`




## 3. Sales Orders List APIs

### GET `/api/v1/barcode/sales-orders`

 

Response:

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "orderId": "SO-4879",
        "orderNumber": "4879",
        "customerName": "MA POWER SOLUTIONS",
        "customerId": "1408566",
        "status": "HOD Review",
        "createdAt": "2026-03-09"
      }
    ],
    "page": 1,
    "pageSize": 10,
    "totalItems": 1,
    "totalPages": 1
  }
}
```

## 4. Sales Order Detail APIs

### GET `/api/v1/barcode/sales-orders/{salesOrderNumber}`

 
Response:

```json
{
  "success": true,
  "data": {
    "order": {
      "order_number": "4879",
      "order_type": "DBPRLS-PSC",
      "status": "BOOKED",
      "order_date": "2026-03-09",
      "currency": "INR",
      "tax_category": ""
    },
    "order_information": {
      "main": {
        "customer": {
          "name": "MA POWER SOLUTIONS",
          "customer_number": "1408566",
          "customer_po": "1992_B_R1",
          "contact": "procurement@mapowersolutions.in"
        },
        "addresses": {
          "shipping": {
            "location": "CHENNAI",
            "address_line_1": "Plot No 57, Aishwarya Nagar Extension",
            "address_line_2": "Vanagaram Road",
            "city": "Chennai",
            "pincode": "600095",
            "state": "Tamil Nadu"
          },
          "billing": {
            "location": "CHENNAI",
            "address_line_1": "Plot No 57, Aishwarya Nagar Extension",
            "address_line_2": "Vanagaram Road",
            "city": "Chennai",
            "pincode": "600095",
            "state": "Tamil Nadu"
          }
        },
        "sales": {
          "sales_person": "EMTICI-CHENNAI-2 (PBL)",
          "price_list": "PBL Swift Centre Products Price List-2025"
        },
        "amount": {
          "sub_total": 101032,
          "tax": 0,
          "total": 101032
        },
        "bank_details": {
          "context_value": "Bank Details",
          "bank_address": "Elecon Engineering Co. Ltd., Vallabh Vidyanagar",
          "lc_no": "",
          "delivery_condition": "EX-WORKS",
          "destination": "Chennai",
          "group_proj_ref": "MAPS-PSC-2026",
          "proj_title": "South Region Gear Motor Requirement",
          "insurance_by": "BYCUSTOMER",
          "bank_name": "HDFC Bank",
          "contact_name": "Accounts Desk",
          "email_address_and_phone": "accounts@elecon.com / +91-2692-123456"
        }
      },
      "other_details": {
        "payment_terms": "100-EX OF DOC",
        "warehouse": "PSC",
        "line_set": "",
        "fob": "EX-WORKS (DOMESTIC)",
        "shipping_instructions": "Dispatch after packing approval mail.",
        "tax_handling": "S",
        "exempt_reason": "",
        "amount": "",
        "credit_card_type": "",
        "card_holder": "",
        "approval_code": "",
        "order_source": "Branch Sales",
        "sales_channel": "BRANCH",
        "shipping_method": "Any Reliable Transporter",
        "freight_terms": "TO PAY",
        "shipment_priority": "Standard",
        "packing_instruction": "Use wooden crate for gear motors.",
        "tax_exempt_number": "",
        "payment_type": "",
        "cheque_number": "",
        "credit_card_number": "",
        "card_expiry_date": "",
        "prepaid_amount": "",
        "order_source_reference": "EMTICI-CHN-2026-0309"
      }
    }
  }
}
```

## 5. Sales Order Update APIs

### PUT `/api/v1/barcode/sales-orders/{salesOrderNumber}/basic-info`

Request:

```json
{
  "customer": {
    "name": "MA POWER SOLUTIONS",
    "customer_number": "1408566",
    "customer_po": "1992_B_R1",
    "contact": "procurement@mapowersolutions.in"
  },
  "addresses": {
    "shipping": {
      "location": "CHENNAI",
      "address_line_1": "Plot No 57, Aishwarya Nagar Extension",
      "address_line_2": "Vanagaram Road",
      "city": "Chennai",
      "pincode": "600095",
      "state": "Tamil Nadu"
    },
    "billing": {
      "location": "CHENNAI",
      "address_line_1": "Plot No 57, Aishwarya Nagar Extension",
      "address_line_2": "Vanagaram Road",
      "city": "Chennai",
      "pincode": "600095",
      "state": "Tamil Nadu"
    }
  },
  "sameAsShipping": true,
  "order": {
    "order_number": "4879",
    "order_type": "DBPRLS-PSC",
    "order_date": "2026-03-09",
    "currency": "INR",
    "status": "BOOKED",
    "tax_category": ""
  },
  "sales": {
    "sales_person": "EMTICI-CHENNAI-2 (PBL)",
    "price_list": "PBL Swift Centre Products Price List-2025"
  }
}
```

### PUT `/api/v1/barcode/sales-orders/{salesOrderNumber}/other-info`

Request:

```json
{
  "payment_terms": "100-EX OF DOC",
  "warehouse": "PSC",
  "line_set": "",
  "fob": "EX-WORKS (DOMESTIC)",
  "sales_channel": "BRANCH",
  "order_source": "Branch Sales",
  "order_source_reference": "EMTICI-CHN-2026-0309",
  "shipping_method": "Any Reliable Transporter",
  "freight_terms": "TO PAY",
  "shipment_priority": "Standard",
  "shipping_instructions": "Dispatch after packing approval mail.",
  "packing_instruction": "Use wooden crate for gear motors.",
  "tax_handling": "S",
  "tax_exempt_number": "",
  "amount": "",
  "exempt_reason": "",
  "credit_card_type": "",
  "credit_card_number": "",
  "card_holder": "",
  "card_expiry_date": "",
  "approval_code": "",
  "payment_type": "",
  "cheque_number": "",
  "prepaid_amount": ""
}
```

### PUT `/api/v1/barcode/sales-orders/{salesOrderNumber}/bank-details`

Request:

```json
{
  "context_value": "Bank Details",
  "bank_name": "HDFC Bank",
  "bank_address": "Elecon Engineering Co. Ltd., Vallabh Vidyanagar",
  "contact_name": "Accounts Desk",
  "email_address_and_phone": "accounts@elecon.com / +91-2692-123456",
  "lc_no": "",
  "delivery_condition": "EX-WORKS",
  "destination": "Chennai",
  "insurance_by": "BYCUSTOMER",
  "group_proj_ref": "MAPS-PSC-2026",
  "proj_title": "South Region Gear Motor Requirement"
}
```

## 6. Line Items APIs

### GET `/api/v1/barcode/sales-orders/{salesOrderNumber}/line-items`

Query params:

- `search`
- `status`
- `location`
- `deliveryDateFrom`
- `deliveryDateTo`
- `page`
- `pageSize`

Response:

```json
{
  "success": true,
  "data": {
    "summary": {
      "totalGearQty": 4,
      "serialsCreated": 3,
      "readyForIssue": 2,
      "readyForLabel": 1,
      "orderValue": 60775
    },
    "items": [
      {
        "id": "4879-1.1",
        "line_no": "1.1",
        "item_code": "DB.09M.022.36_BGCHI_7.5A",
        "description": "Helical geared motor with compact housing",
        "quantity": 1,
        "list_price": 123208,
        "discount_percent": 59,
        "selling_price": 50516,
        "amount": 50516,
        "ship_to_location": "CHENNAI",
        "road_permit": false,
        "wo_no": "10136601",
        "wo_date": "2026-03-09",
        "client_delivery_date": "2026-03-28",
        "delivery_month": "2603",
        "con_auth": "EMTICI",
        "status": "PL",
        "mail_status": "Issue Material",
        "actions": {
          "workOrder": { "visible": true, "enabled": true, "label": "Work Order", "mode": "create" },
          "serialNumber": { "visible": true, "enabled": false, "label": "Serial Number", "mode": "manage" },
          "issueMaterial": { "visible": true, "enabled": false, "label": "Issue Material", "mode": "issue" },
          "printLabel": { "visible": true, "enabled": false, "label": "Print Label", "mode": "print" },
          "edit": { "visible": true, "enabled": true, "label": "Edit", "mode": "edit" }
        }
      }
    ],
    "page": 1,
    "pageSize": 10,
    "totalItems": 1,
    "totalPages": 1
  }
}
```

### GET `/api/v1/barcode/sales-orders/{salesOrderNumber}/line-items/{lineNo}`

Used when opening one line item details if needed.

### PATCH `/api/v1/barcode/sales-orders/{salesOrderNumber}/line-items/{lineNo}`

Used by Edit Line Item modal.

Request:

```json
{
  "road_permit": true,
  "delivery_month": "2604",
  "status": "Planning"
}
```

Suggested response:

```json
{
  "success": true,
  "message": "Line item updated successfully",
  "data": {
    "line_no": "1.1",
    "status": "Planning"
  }
}
```

## 7. Serial Number APIs

### GET `/api/v1/barcode/sales-orders/{salesOrderNumber}/line-items/{lineNo}/serials`

Response:

```json
{
  "success": true,
  "data": [
    {
      "serial_no": "SC30584",
      "ass_rel_date": "2026-03-12",
      "ac_ua_date": "2026-03-14",
      "ac_comp_date": null,
      "ac_pk_date": null,
      "ac_ds_date": null,
      "tent_rel_date": "2026-03-24",
      "status": "SH",
      "sh_type": "GM",
      "sh_item": "Stage-2",
      "rpm": "1440",
      "motor_serial_no": "MS-480527",
      "ac_ho_date": null,
      "ac_ca_date": null
    }
  ]
}
```

### POST `/api/v1/barcode/sales-orders/{salesOrderNumber}/line-items/{lineNo}/serials`

Suggested for serial number generation.

Request:

```json
{
  "quantity": 1,
  "generationMode": "auto",
  "prefix": "SC"
}
```

## 8. Work Order APIs

### POST `/api/v1/barcode/sales-orders/{salesOrderNumber}/line-items/{lineNo}/work-order`

Request:

```json
{
  "work_order_number": "10136601",
  "work_order_date": "2026-03-09",
  "planned_delivery_date": "2026-03-28",
  "quantity": 1,
  "notes": ""
}
```

### GET `/api/v1/barcode/work-orders/{workOrderNumber}`

## 9. Material Issue APIs

### POST `/api/v1/barcode/work-orders/{workOrderNumber}/issue-material`

Request:

```json
{
  "issue_date": "2026-03-15",
  "issued_by": "EMP001",
  "items": [
    {
      "item_code": "RM-0001",
      "required_qty": 2,
      "issued_qty": 2,
      "uom": "NOS"
    }
  ]
}
```

## 10. Label / Print APIs

### POST `/api/v1/barcode/labels/print`

Request:

```json
{
  "sales_order_number": "4879",
  "line_no": "1.1",
  "work_order_number": "10136601",
  "serial_numbers": ["SC30584"],
  "print_type": "packing_label"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "printJobId": "PRN-10001",
    "status": "queued"
  }
}
```

## 11. Final Inspection APIs

### GET `/api/v1/barcode/final-inspection/lookup/{serialNumber}`

Purpose: auto-fill form after pressing `Get`.

Response:

```json
{
  "success": true,
  "data": {
    "gearedMotorSerialNumber": "M480527",
    "finalInspection": {
      "mountType": "Foot Mount",
      "model": "EDR-FM-90L",
      "workOrderNumber": "WO-240527",
      "rpm": "1440",
      "motorSerialNumber": "MS-480527",
      "pole": "4",
      "electricMotorMake": "PBL",
      "boreSize": "40",
      "holdBackType": "CW",
      "remarks": "Inspected and ready for dispatch.",
      "accessories": {
        "additionalReq": false,
        "breatherPlug": true,
        "oilLevelIndicator": true,
        "stickerOilLevel": true,
        "stickerCaution": true,
        "namePlate": true,
        "shaftProtector": true,
        "adaptorCover": false,
        "eyeBolt": true,
        "torqueBrush": false,
        "endCover": true,
        "springWasher": true,
        "circlip": true,
        "hexBolt": true,
        "washer": true,
        "outputFlange": false,
        "singleExeShaft": true,
        "doubleExeShaft": false,
        "torqueArm": false,
        "motorMountingRing": false,
        "mountingFeet": true
      }
    }
  }
}
```

### POST `/api/v1/barcode/final-inspection`

Request:

```json
{
  "gearedMotorSerialNumber": "M480527",
  "mountType": "Foot Mount",
  "model": "EDR-FM-90L",
  "workOrderNumber": "WO-240527",
  "rpm": "1440",
  "motorSerialNumber": "MS-480527",
  "pole": "4",
  "electricMotorMake": "PBL",
  "boreSize": "40",
  "holdBackType": "CW",
  "remarks": "Inspected and ready for dispatch.",
  "accessories": {
    "additionalReq": false,
    "breatherPlug": true,
    "oilLevelIndicator": true,
    "stickerOilLevel": true,
    "stickerCaution": true,
    "namePlate": true,
    "shaftProtector": true,
    "adaptorCover": false,
    "eyeBolt": true,
    "torqueBrush": false,
    "endCover": true,
    "springWasher": true,
    "circlip": true,
    "hexBolt": true,
    "washer": true,
    "outputFlange": false,
    "singleExeShaft": true,
    "doubleExeShaft": false,
    "torqueArm": false,
    "motorMountingRing": false,
    "mountingFeet": true
  }
}
```

## 12. Order Completion APIs

### GET `/api/v1/barcode/order-completion/lookup/{serialNumber}`

Purpose: auto-fill order completion form after pressing `Get`.

Response:

```json
{
  "success": true,
  "data": {
    "gearedMotorSerialNumber": "M480527",
    "orderCompletion": {
      "mountType": "Foot Mount",
      "model": "EDR-FM-90L",
      "workOrderNumber": "WO-240527",
      "rpm": "1440",
      "motorSerialNumber": "MS-480527",
      "pole": "4",
      "electricMotorMake": "PBL",
      "inputRpm": "1440",
      "actualRatio": "20",
      "noiseLevelDb": "64",
      "paint": "GOOD",
      "status": "PK"
    }
  }
}
```

### POST `/api/v1/barcode/order-completion`

Request:

```json
{
  "gearedMotorSerialNumber": "M480527",
  "mountType": "Foot Mount",
  "model": "EDR-FM-90L",
  "workOrderNumber": "WO-240527",
  "rpm": "1440",
  "motorSerialNumber": "MS-480527",
  "electricMotorMake": "PBL",
  "inputRpm": "1440",
  "actualRatio": "20",
  "pole": "4",
  "noiseLevelDb": "64",
  "paint": "GOOD",
  "status": "PK"
}
```

## 13. Reports APIs

### GET `/api/v1/barcode/reports`

Purpose: report directory with category grouping.

Response:

```json
{
  "success": true,
  "data": [
    {
      "category": "Order Booking",
      "reports": [
        {
          "id": "branch-wise-order-booking",
          "name": "Branch Wise Order Booking",
          "formats": ["xls", "pdf"]
        }
      ]
    }
  ]
}
```

### POST `/api/v1/barcode/reports/export`

Request:

```json
{
  "reportId": "branch-wise-order-booking",
  "format": "xls",
 
}
```

Response:

```json
{
  "success": true,
  "data": {
    "downloadUrl": "/downloads/reports/branch-wise-order-booking.xls",
    "fileName": "branch-wise-order-booking.xls"
  }
}
```

  
