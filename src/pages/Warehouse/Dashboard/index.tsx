import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Button, Card, Chip, InputAdornment, Stack, TextField, Typography } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import QrCodeScannerOutlinedIcon from "@mui/icons-material/QrCodeScannerOutlined";

import { buildWarehouseHierarchy } from "./data";
import { RackGrid } from "./components/RackGrid";
import { SectionTabs } from "./components/SectionTabs";
import { WarehouseSidebar } from "./components/WarehouseSidebar";
import { RackDetailsPanel } from "./components/RackDetailsPanel";
import { Pallet,     Shelf } from "./types";
import { useModal } from "../../../hooks/useModal";
import { useToast } from "../../../hooks/useToast";
 import { openEntityFormModal } from "../shared/openEntityFormModal";
import {
  buildWarehouseItemFormData,
  useCreatePalletMutation,
  useCreateRackMutation,
  useCreateWarehouseItemMutation,
  useCreateWarehouseMutation,
  useCreateZoneMutation,
  useDeletePalletMutation,
  useDeleteRackMutation,
  useDeleteWarehouseItemMutation,
  useDeleteWarehouseMutation,
  useDeleteZoneMutation,
  useListPalletsQuery,
  useListRacksQuery,
  useListWarehouseItemsQuery,
  useListWarehousesQuery,
  useListZonesQuery,
  useUpdatePalletMutation,
  useUpdateRackMutation,
  useUpdateWarehouseItemMutation,
  useUpdateWarehouseMutation,
  useUpdateZoneMutation,
} from "../../../redux/api/warehouse";
import { useAppSelector } from "../../../redux/hooks";
import {
  AddEditWarehouse,
  AddEditWarehouseRef,
  type WarehouseSubmitPayload,
} from "../Warehouselist/addeditwarehouse";
import {
  AddEditZone,
  AddEditZoneRef,
  type ZoneSubmitPayload,
} from "../Zonelist/addeditzone";
import {
  AddEditRack,
  AddEditRackRef,
  type RackSubmitPayload,
} from "../Racklist/addeditrack";
import {
  AddEditItem,
  AddEditItemRef,
  type ItemSubmitPayload,
} from "../Itemlist/addedititem";
import type { PalletSubmitPayload } from "../Palletlist/addeditpallet";

const DEFAULT_ORG_ID = "";

const toWarehouseCode = (value: string) => {
  const cleaned = value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return cleaned ? `WH-${cleaned}` : "WH-001";
};

export default function InventoryDashboard() {
  const { openModal } = useModal();
  const { showToast } = useToast();
  const authUserId = useAppSelector((state) => state.auth.id);

  const [activeWarehouseIndex, setActiveWarehouseIndex] = useState(0);
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [itemSearchText, setItemSearchText] = useState("");
  const [warehouseSearchText, setWarehouseSearchText] = useState("");
  const [qrSearchText, setQrSearchText] = useState("");

  const {
    data: warehousesResponse,
    error: warehousesError,
    isLoading: isWarehousesLoading,
    isFetching: isWarehousesFetching,
  } = useListWarehousesQuery();
  const {
    data: zonesResponse,
    error: zonesError,
    isLoading: isZonesLoading,
    isFetching: isZonesFetching,
  } = useListZonesQuery();
  const {
    data: racksResponse,
    error: racksError,
    isLoading: isRacksLoading,
    isFetching: isRacksFetching,
  } = useListRacksQuery();
  const {
    data: palletsResponse,
    error: palletsError,
    isLoading: isPalletsLoading,
    isFetching: isPalletsFetching,
  } = useListPalletsQuery();
  const {
    data: itemsResponse,
    error: itemsError,
    isLoading: isItemsLoading,
    isFetching: isItemsFetching,
  } = useListWarehouseItemsQuery();

  const [createWarehouse, { isLoading: isCreatingWarehouse }] = useCreateWarehouseMutation();
  const [updateWarehouse, { isLoading: isUpdatingWarehouse }] = useUpdateWarehouseMutation();
  const [deleteWarehouse, { isLoading: isDeletingWarehouse }] = useDeleteWarehouseMutation();

  const [createZone, { isLoading: isCreatingZone }] = useCreateZoneMutation();
  const [updateZone, { isLoading: isUpdatingZone }] = useUpdateZoneMutation();
  const [deleteZone, { isLoading: isDeletingZone }] = useDeleteZoneMutation();

  const [createRack, { isLoading: isCreatingRack }] = useCreateRackMutation();
  const [updateRack, { isLoading: isUpdatingRack }] = useUpdateRackMutation();
  const [deleteRack, { isLoading: isDeletingRack }] = useDeleteRackMutation();

  const [createPallet, { isLoading: isCreatingPallet }] = useCreatePalletMutation();
  const [updatePallet, { isLoading: isUpdatingPallet }] = useUpdatePalletMutation();
  const [deletePallet, { isLoading: isDeletingPallet }] = useDeletePalletMutation();

  const [createItem, { isLoading: isCreatingItem }] = useCreateWarehouseItemMutation();
  const [updateItem, { isLoading: isUpdatingItem }] = useUpdateWarehouseItemMutation();
  const [deleteItem, { isLoading: isDeletingItem }] = useDeleteWarehouseItemMutation();

  const warehouseData = useMemo(
    () =>
      buildWarehouseHierarchy({
        warehousesResponse,
        zonesResponse,
        racksResponse,
        palletsResponse,
        itemsResponse,
      }),
    [itemsResponse, palletsResponse, racksResponse, warehousesResponse, zonesResponse]
  );

  const handleSubmitWarehouse = useCallback(
    async (payload: WarehouseSubmitPayload) => {
      try {
        const warehouseCode = payload.warehouseCode || toWarehouseCode(payload.warehouseName);

        if (payload.id) {
          await updateWarehouse({
            id: payload.id,
            warehouse_code: warehouseCode,
            warehouse_name: payload.warehouseName,
            manager_name: payload.managerName,
            contact_number: payload.contactNumber,
            email: payload.email,
            location: payload.location,
            address: payload.address,
            storage_capacity: Number(payload.storageCapacity),
            notes: payload.notes,
            status: payload.status,
            is_active: payload.status === "ACTIVE",
          }).unwrap();
          return;
        }

        await createWarehouse({
          org_id: payload.orgId || DEFAULT_ORG_ID,
          warehouse_code: warehouseCode,
          warehouse_name: payload.warehouseName,
          manager_name: payload.managerName,
          contact_number: payload.contactNumber,
          email: payload.email,
          location: payload.location,
          address: payload.address,
          storage_capacity: Number(payload.storageCapacity),
          notes: payload.notes,
          status: payload.status,
          created_by: authUserId ? String(authUserId) : "admin",
        }).unwrap();
      } catch (error: any) {
        showToast(
          error?.data?.message || error?.message || "Failed to save warehouse",
          "error"
        );
        throw error;
      }
    },
    [authUserId, createWarehouse, showToast, updateWarehouse]
  );

  const handleDeleteWarehouse = useCallback(
    async (id: string | number) => {
      try {
        await deleteWarehouse(id).unwrap();
      } catch (error: any) {
        showToast(
          error?.data?.message || error?.message || "Failed to delete warehouse",
          "error"
        );
        throw error;
      }
    },
    [deleteWarehouse, showToast]
  );

  const handleSubmitZone = useCallback(
    async (payload: ZoneSubmitPayload) => {
      try {
        if (payload.id) {
          await updateZone({
            id: payload.id,
            zone_code: payload.zone_code,
            zone_title: payload.zone_title,
            zone_description: payload.zone_description,
            status: payload.status,
          }).unwrap();
          return;
        }

        await createZone({
          warehouse_id: Number(payload.warehouse_id),
          zone_code: payload.zone_code,
          zone_title: payload.zone_title,
          zone_description: payload.zone_description,
          status: payload.status,
          created_by: authUserId ? String(authUserId) : "admin",
        }).unwrap();
      } catch (error: any) {
        showToast(error?.data?.message || error?.message || "Failed to save zone", "error");
        throw error;
      }
    },
    [authUserId, createZone, showToast, updateZone]
  );

  const handleDeleteZone = useCallback(
    async (id: string | number) => {
      try {
        await deleteZone(id).unwrap();
      } catch (error: any) {
        showToast(error?.data?.message || error?.message || "Failed to delete zone", "error");
        throw error;
      }
    },
    [deleteZone, showToast]
  );

  const handleSubmitRack = useCallback(
    async (payload: RackSubmitPayload) => {
      try {
        if (payload.id) {
          await updateRack({
            id: payload.id,
            warehouse_id: payload.warehouse_id,
            zone_id: payload.zone_id,
            rack_code: payload.rack_code,
            rack_description: payload.rack_description,
            status: payload.status,
          }).unwrap();
          return;
        }

        await createRack({
          warehouse_id: Number(payload.warehouse_id),
          zone_id: payload.zone_id,
          rack_code: payload.rack_code,
          rack_description: payload.rack_description,
          status: payload.status,
          created_by: authUserId ? String(authUserId) : "admin",
        }).unwrap();
      } catch (error: any) {
        showToast(error?.data?.message || error?.message || "Failed to save rack", "error");
        throw error;
      }
    },
    [authUserId, createRack, showToast, updateRack]
  );

  const handleDeleteRack = useCallback(
    async (id: string | number) => {
      try {
        await deleteRack(id).unwrap();
      } catch (error: any) {
        showToast(error?.data?.message || error?.message || "Failed to delete rack", "error");
        throw error;
      }
    },
    [deleteRack, showToast]
  );

  const handleSubmitPallet = useCallback(
    async (payload: PalletSubmitPayload) => {
      try {
        if (payload.id) {
          await updatePallet({
            id: payload.id,
            zone_id: payload.zone_id,
            rack_id: payload.rack_id,
            pallet_name: payload.pallet_name,
            max_capacity: payload.max_capacity,
            status: payload.status,
          }).unwrap();
          return;
        }

        await createPallet({
          warehouse_id: Number(payload.warehouse_id),
          zone_id: payload.zone_id,
          rack_id: payload.rack_id,
          pallet_name: payload.pallet_name,
          max_capacity: payload.max_capacity,
          status: payload.status,
          created_by: authUserId ? String(authUserId) : "admin",
        }).unwrap();
      } catch (error: any) {
        showToast(error?.data?.message || error?.message || "Failed to save pallet", "error");
        throw error;
      }
    },
    [authUserId, createPallet, showToast, updatePallet]
  );

  const handleDeletePallet = useCallback(
    async (id: string | number) => {
      try {
        await deletePallet(id).unwrap();
      } catch (error: any) {
        showToast(error?.data?.message || error?.message || "Failed to delete pallet", "error");
        throw error;
      }
    },
    [deletePallet, showToast]
  );

  const handleSubmitItem = useCallback(
    async (payload: ItemSubmitPayload) => {
      try {
        if (payload.id !== undefined && payload.id !== null) {
          const { id, ...updatePayload } = payload;
          return await updateItem({
            id,
            body: buildWarehouseItemFormData(updatePayload),
          }).unwrap();
        }

        const createPayload = { ...payload } as Omit<ItemSubmitPayload, "id">;
        delete (createPayload as Partial<ItemSubmitPayload>).id;
        return await createItem(
          buildWarehouseItemFormData(createPayload, ["qty", "detail_qty", "file_name"])
        ).unwrap();
      } catch (error: any) {
        showToast(error?.data?.message || error?.message || "Failed to save item", "error");
        throw error;
      }
    },
    [createItem, showToast, updateItem]
  );

  const handleDeleteItem = useCallback(
    async (id: string | number) => {
      try {
        await deleteItem(id).unwrap();
      } catch (error: any) {
        showToast(error?.data?.message || error?.message || "Failed to delete item", "error");
        throw error;
      }
    },
    [deleteItem, showToast]
  );

  const normalizedWarehouseSearch = warehouseSearchText.trim().toLowerCase();

  const filteredWarehouses = useMemo(() => {
    if (!normalizedWarehouseSearch) {
      return warehouseData;
    }

    return warehouseData.filter(
      (warehouse) =>
        warehouse.name.toLowerCase().includes(normalizedWarehouseSearch) ||
        warehouse.location.toLowerCase().includes(normalizedWarehouseSearch)
    );
  }, [normalizedWarehouseSearch, warehouseData]);

  useEffect(() => {
    if (activeWarehouseIndex < filteredWarehouses.length) {
      return;
    }

    setActiveWarehouseIndex(0);
  }, [activeWarehouseIndex, filteredWarehouses.length]);

  const currentWarehouse = filteredWarehouses[activeWarehouseIndex] || filteredWarehouses[0] || null;

  useEffect(() => {
    if (!currentWarehouse) {
      return;
    }

    if (activeSectionIndex < currentWarehouse.sections.length) {
      return;
    }

    setActiveSectionIndex(0);
  }, [activeSectionIndex, currentWarehouse]);

  const currentSection =
    currentWarehouse?.sections[activeSectionIndex] || currentWarehouse?.sections[0] || null;
  const normalizedItemSearch = itemSearchText.trim().toLowerCase();

  const visibleSection = useMemo(() => {
    if (!currentSection || !normalizedItemSearch) {
      return currentSection;
    }

    return {
      ...currentSection,
      racks: currentSection.racks.filter((rack) => {
        const rackMatch =
          rack.name.toLowerCase().includes(normalizedItemSearch) ||
          rack.id.toLowerCase().includes(normalizedItemSearch);
        const itemMatch = rack.shelves.some((shelf) =>
          shelf.pallets.some(
            (item) =>
              item.product.toLowerCase().includes(normalizedItemSearch) ||
              (item.oracle_code || "").toLowerCase().includes(normalizedItemSearch)
          )
        );

        return rackMatch || itemMatch;
      }),
    };
  }, [currentSection, normalizedItemSearch]);

  const handleWarehouseSelect = useCallback((index: number) => {
    setActiveWarehouseIndex(index);
    setActiveSectionIndex(0);
  }, []);

  const handleSectionTabChange = useCallback(
    (_event: React.SyntheticEvent, newValue: number | string) => {
      if (typeof newValue !== "number") {
        return;
      }

      setActiveSectionIndex(newValue);
    },
    []
  );

  const handleOpenAddWarehouse = useCallback(() => {
    openEntityFormModal<AddEditWarehouseRef>({
      openModal,
      entityLabel: "Warehouse",
      width: 720,
      FormComponent: AddEditWarehouse,
      extraProps: {
        onSubmitWarehouse: handleSubmitWarehouse,
        onDeleteWarehouse: handleDeleteWarehouse,
      },
    });
  }, [handleDeleteWarehouse, handleSubmitWarehouse, openModal]);

  const handleOpenAddZone = useCallback(() => {
    if (!currentWarehouse?.recordId) {
      return;
    }

    openEntityFormModal<AddEditZoneRef>({
      openModal,
      entityLabel: "Zone",
      width: 720,
      FormComponent: AddEditZone,
      defaultValues: {
        warehouse_id: currentWarehouse.recordId,
      },
      extraProps: {
        onSubmitZone: handleSubmitZone,
        onDeleteZone: handleDeleteZone,
      },
    });
  }, [currentWarehouse, handleDeleteZone, handleSubmitZone, openModal]);

  const handleAddRack = useCallback(() => {
    if (!currentWarehouse?.recordId || !currentSection?.recordId) {
      return;
    }

    openEntityFormModal<AddEditRackRef>({
      openModal,
      entityLabel: "Rack",
      width: 500,
      FormComponent: AddEditRack,
      defaultValues: {
        warehouse_id: currentWarehouse.recordId,
        zone_id: currentSection.recordId,
        section_id: currentSection.recordId,
      },
      extraProps: {
        onSubmitRack: handleSubmitRack,
        onDeleteRack: handleDeleteRack,
      },
    });
  }, [currentSection, currentWarehouse, handleDeleteRack, handleSubmitRack, openModal]);

  const handleQrItemOpen = useCallback(() => {
    const query = qrSearchText.trim();
    if (!query) {
      return;
    }

    openEntityFormModal<AddEditItemRef>({
      openModal,
      entityLabel: "Item",
      width: 640,
      FormComponent: AddEditItem,
      defaultValues: {
        pallet_id: "",
        oracle_code: query,
        qty: "",
        sub_loc_id: "",
      },
      extraProps: {
        onSubmitItem: handleSubmitItem,
        onDeleteItem: handleDeleteItem,
      },
    });
  }, [handleDeleteItem, handleSubmitItem, openModal, qrSearchText]);

  const handleAdjustItemQty = useCallback(
    async (shelf: Shelf, item: Pallet, direction: "in" | "out") => {
      if (!shelf.recordId || !item.recordId) {
        return;
      }

      const nextQty = direction === "in" ? item.qty + 1 : Math.max(item.qty - 1, 0);

      await handleSubmitItem({
        id: item.recordId,
        pallet_id: Number(shelf.recordId),
        rack_id: Number(item.rack_id ?? 0),
        sub_loc_id: Number(item.sub_loc_id ?? 1),
        oracle_code: item.oracle_code || item.product,
        qty: nextQty,
        item_desc: item.item_desc || item.description || "",
        item_category: item.item_category || "",
        locator: item.locator || "",
        sub_inventory: item.sub_inventory || "",
        detail_qty: item.qty,
        in_qty: direction === "in" ? 1 : 0,
        out_qty: direction === "out" ? 1 : 0,
        has_expiry: Boolean(item.has_expiry_date),
        expiry_date: item.expiry_date || null,
        item_image_document_id: item.item_image_document_id ?? null,
        item_image_path: item.item_image_path || null,
        qr_code: item.qr_code,
      });
    },
    [handleSubmitItem]
  );

  const handleSelectRack = useCallback(
    (rackId: string) => {
      const rack = visibleSection?.racks.find((rackItem) => rackItem.id === rackId) || null;
      if (!rack || !currentWarehouse || !currentSection) {
        return;
      }

      openModal({
        title: `Rack Details - ${rack.name}`,
        width: 560,
        askDataChangeConfirm: false,
        component: (modalProps: any) => (
          <RackDetailsPanel
            warehouse={currentWarehouse}
            section={currentSection}
            selectedRack={rack}
            onSubmitWarehouse={handleSubmitWarehouse}
            onDeleteWarehouse={handleDeleteWarehouse}
            onSubmitZone={handleSubmitZone}
            onDeleteZone={handleDeleteZone}
            onSubmitRack={handleSubmitRack}
            onDeleteRack={handleDeleteRack}
            onSubmitPallet={handleSubmitPallet}
            onDeletePallet={handleDeletePallet}
            onSubmitItem={handleSubmitItem}
            onDeleteItem={handleDeleteItem}
            onAdjustItemQty={handleAdjustItemQty}
            {...modalProps}
          />
        ),
      });
    },
    [
      currentSection,
      currentWarehouse,
      handleAdjustItemQty,
      handleDeleteItem,
      handleDeletePallet,
      handleDeleteRack,
      handleDeleteWarehouse,
      handleDeleteZone,
      handleSubmitItem,
      handleSubmitPallet,
      handleSubmitRack,
      handleSubmitWarehouse,
      handleSubmitZone,
      openModal,
      visibleSection,
    ]
  );

  const totalRacks = currentWarehouse
    ? currentWarehouse.sections.reduce((sum, section) => sum + section.racks.length, 0)
    : 0;

  const loading =
    isWarehousesLoading ||
    isZonesLoading ||
    isRacksLoading ||
    isPalletsLoading ||
    isItemsLoading ||
    isWarehousesFetching ||
    isZonesFetching ||
    isRacksFetching ||
    isPalletsFetching ||
    isItemsFetching ||
    isCreatingWarehouse ||
    isUpdatingWarehouse ||
    isDeletingWarehouse ||
    isCreatingZone ||
    isUpdatingZone ||
    isDeletingZone ||
    isCreatingRack ||
    isUpdatingRack ||
    isDeletingRack ||
    isCreatingPallet ||
    isUpdatingPallet ||
    isDeletingPallet ||
    isCreatingItem ||
    isUpdatingItem ||
    isDeletingItem;

  useEffect(() => {
    const firstError = [
      warehousesError,
      zonesError,
      racksError,
      palletsError,
      itemsError,
    ].find(Boolean) as any;

    if (!firstError) {
      return;
    }

    showToast(
      firstError?.data?.message || firstError?.message || "Failed to fetch warehouse dashboard",
      "error"
    );
  }, [itemsError, palletsError, racksError, showToast, warehousesError, zonesError]);

  if (!currentWarehouse) {
    return (
      <Card sx={{ display: "flex", height: "calc(100vh - 64px)", overflow: "hidden" }}>
        <WarehouseSidebar
          warehouses={filteredWarehouses}
          selectedIndex={activeWarehouseIndex}
          onSelect={handleWarehouseSelect}
          searchValue={warehouseSearchText}
          onSearchChange={setWarehouseSearchText}
          onAddWarehouse={handleOpenAddWarehouse}
        />
        <Box
          sx={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            p: 4,
          }}
        >
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="h6" color="text.secondary">
              {loading ? "Loading warehouse dashboard..." : "No warehouse records found"}
            </Typography>
            <Typography color="text.disabled">
              {loading
                ? "Fetching warehouses, zones, racks, pallets, and items."
                : "Create a warehouse to start working from the dashboard."}
            </Typography>
          </Box>
        </Box>
      </Card>
    );
  }

  return (
    <Card sx={{ display: "flex", height: "calc(100vh - 64px)", overflow: "hidden" }}>
      <WarehouseSidebar
        warehouses={filteredWarehouses}
        selectedIndex={activeWarehouseIndex}
        onSelect={handleWarehouseSelect}
        searchValue={warehouseSearchText}
        onSearchChange={setWarehouseSearchText}
        onAddWarehouse={handleOpenAddWarehouse}
      />

      <Box
        sx={{
          flex: 1,
          overflow: "auto",
          px: 2,
          py: 2,
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              {currentWarehouse.name}  
            </Typography>
           
          </Box>

          <Stack direction="row" alignItems="center" spacing={1.25}>
            <Stack direction="row" alignItems="center" spacing={0.75}>
              <TextField
                size="small"
                placeholder="Scan QR..."
                value={qrSearchText}
                onChange={(event) => setQrSearchText(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key !== "Enter") {
                    return;
                  }
                  event.preventDefault();
                  handleQrItemOpen();
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <QrCodeScannerOutlinedIcon sx={{ color: "#94A3B8", fontSize: 18 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  width: 180,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2.5,
                    bgcolor: "#F8FAFC",
                    "& fieldset": { borderColor: "rgba(15,23,42,0.12)" },
                    "&.Mui-focused fieldset": { borderColor: "#FF8A3D" },
                  },
                  "& .MuiInputBase-input": {
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    py: 0.8,
                  },
                }}
              />
              <Button
                variant="contained"
                size="small"
                
                onClick={handleQrItemOpen}
                disabled={!qrSearchText.trim()}
                sx={{
                  textTransform: "none",
                  borderRadius: 1.5,
                  bgcolor: "#FF8A3D",
                  color: "#FFF",
                  height: 36,
                  minWidth: 80,
                  fontWeight: 700,
                  boxShadow: "0 4px 12px rgba(255, 138, 61, 0.18)",
                  "&:hover": {
                    bgcolor: "#df6f22",
                  },
                }}
              >
                Get Item
              </Button>
            </Stack>

            <TextField
              size="small"
              placeholder="Search Item / Rack..."
              value={itemSearchText}
              onChange={(event) => setItemSearchText(event.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: "#94A3B8", fontSize: 18 }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                width: 240,
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2.5,
                  bgcolor: "#F8FAFC",
                  "& fieldset": { borderColor: "rgba(15,23,42,0.12)" },
                  "&.Mui-focused fieldset": { borderColor: "#FF8A3D" },
                },
                "& .MuiInputBase-input": {
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  py: 0.8,
                },
              }}
            />

            <Chip
              label={`${totalRacks} racks · ${currentWarehouse.sections.length} zones`}
              size="small"
              sx={{
                bgcolor: "#FF8A3D",
                color: "#FFF",
                fontWeight: 700,
                fontSize: "0.75rem",
                height: 32,
                borderRadius: 2,
                px: 1,
                boxShadow: "0 2px 8px rgba(255, 138, 61, 0.2)",
              }}
            />
          </Stack>
        </Stack>

        {currentWarehouse.sections.length > 0 && currentSection ? (
          <>
            <SectionTabs
              sections={currentWarehouse.sections}
              activeSectionIndex={activeSectionIndex}
              onChange={handleSectionTabChange}
              onAddZone={handleOpenAddZone}
            />

            <Box sx={{ pt: 2 }}>
              <RackGrid
                section={visibleSection || currentSection}
                selectedRackId={null}
                itemSearchText={itemSearchText}
                onSelectRack={handleSelectRack}
                onAddRack={handleAddRack}
              />
            </Box>
          </>
        ) : (
          <Box
            sx={{
              p: 6,
              textAlign: "center",
              bgcolor: "#FFF",
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography variant="h6" color="text.secondary">
              {currentWarehouse.name}
            </Typography>
            <Typography color="text.disabled">No zones available in this warehouse.</Typography>
          </Box>
        )}
      </Box>
    </Card>
  );
}
