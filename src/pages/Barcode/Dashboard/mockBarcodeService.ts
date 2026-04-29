import {
  barcodeGearMotorLookups,
  barcodeImportedSalesOrders,
  barcodeMockData,
  barcodeSalesOrderRows,
  type BarcodeGearMotorLookup,
} from "./data";
import {
  mapSalesOrderDetails,
  type BarcodeRecentOrderRow,
  type BarcodeSalesOrderDetailsViewModel,
  type BarcodeSerialLookupViewModel,
} from "./barcodeAdapters";

const cloneLookup = (
  lookup: BarcodeGearMotorLookup
): BarcodeGearMotorLookup => ({
  gearedMotorSerialNumber: lookup.gearedMotorSerialNumber,
  finalInspection: {
    ...lookup.finalInspection,
    accessories: { ...lookup.finalInspection.accessories },
  },
  orderCompletion: {
    ...lookup.orderCompletion,
  },
});

const salesOrderIndex = new Map(
  Object.entries(barcodeMockData.salesOrderDetailsByNumber).map(([orderNumber, salesOrder]) => [
    orderNumber.toUpperCase(),
    salesOrder,
  ])
);

const lookupIndex = new Map(
  Object.entries(barcodeGearMotorLookups).map(([serialNumber, lookup]) => [
    serialNumber.toUpperCase(),
    lookup,
  ])
);

export const getMockSalesOrders = (): BarcodeRecentOrderRow[] =>
  barcodeSalesOrderRows.map((row) => ({
    ...row,
    id: String(row.id),
  }));

export const getMockSalesOrderDetails = (
  orderNumber?: string | null
): BarcodeSalesOrderDetailsViewModel | null => {
  if (!orderNumber) {
    return null;
  }

  const salesOrder = salesOrderIndex.get(orderNumber.trim().toUpperCase());
  return salesOrder ? mapSalesOrderDetails(salesOrder) : null;
};

export const getMockGearMotorLookup = (
  serialNumber?: string | null
): BarcodeGearMotorLookup | null => {
  if (!serialNumber) {
    return null;
  }

  const normalizedSerial = serialNumber.trim().toUpperCase();
  if (!normalizedSerial) {
    return null;
  }

  const directMatch = lookupIndex.get(normalizedSerial);
  if (directMatch) {
    return cloneLookup(directMatch);
  }

  const fallbackTemplate = Object.values(barcodeGearMotorLookups)[0];
  if (!fallbackTemplate) {
    return null;
  }

  return {
    gearedMotorSerialNumber: normalizedSerial,
    finalInspection: {
      ...fallbackTemplate.finalInspection,
      model: `GM-${normalizedSerial.slice(-4) || normalizedSerial}`,
      workOrderNumber: `WO-${normalizedSerial.slice(-6) || normalizedSerial}`,
      motorSerialNumber: `MS-${normalizedSerial}`,
      remarks: `Temporary static lookup loaded for ${normalizedSerial}.`,
      accessories: {
        ...fallbackTemplate.finalInspection.accessories,
      },
    },
    orderCompletion: {
      ...fallbackTemplate.orderCompletion,
      model: `GM-${normalizedSerial.slice(-4) || normalizedSerial}`,
      workOrderNumber: `WO-${normalizedSerial.slice(-6) || normalizedSerial}`,
      motorSerialNumber: `MS-${normalizedSerial}`,
    },
  };
};

export const getMockSerialLookup = (
  serialNumber?: string | null
): BarcodeSerialLookupViewModel => {
  const lookup = getMockGearMotorLookup(serialNumber);

  return {
    rpm: lookup?.orderCompletion.rpm || "",
    motorSerialNumber: lookup?.orderCompletion.motorSerialNumber || "",
    model: lookup?.orderCompletion.model || "",
    workOrderNumber: lookup?.orderCompletion.workOrderNumber || "",
  };
};

export const getMockImportedSalesOrders = () =>
  barcodeImportedSalesOrders.map((order) => ({
    ...order,
  }));
