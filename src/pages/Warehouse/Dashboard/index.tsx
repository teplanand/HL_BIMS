import React, { useCallback, useMemo, useState } from "react";
import { Box, Card, Chip, Stack, TextField, InputAdornment, Typography } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import QrCodeScannerOutlinedIcon from "@mui/icons-material/QrCodeScannerOutlined";

import { warehouses } from "./data";
import { RackGrid } from "./components/RackGrid";
import { SectionTabs } from "./components/SectionTabs";
import { WarehouseSidebar } from "./components/WarehouseSidebar";
import { RackDetailsPanel } from "./components/RackDetailsPanel";
import { Rack, Shelf, Warehouse } from "./types";
import { useModal } from "../../../hooks/useModal";
import IconActionButton from "../../../components/common/IconActionButton";
import { openEntityFormModal } from "../shared/openEntityFormModal";
import { AddEditRack, AddEditRackRef } from "../Racklist/addeditrack";
import { AddEditItem, AddEditItemRef } from "../Itemlist/addedititem";

const getShelfUsed = (shelf: Shelf) =>
  shelf.pallets.reduce((total, pallet) => total + pallet.qty, 0);

const deriveSectionPrefix = (sectionName: string) => {
  const parts = sectionName.split(" - ");
  const primary = parts[0]?.trim();
  return primary ? primary.replace(/[^A-Z0-9]/gi, "").toUpperCase() : "PL";
};

const createEmptyShelf = (shelfId: string, capacity = 100): Shelf => ({
  id: shelfId,
  capacity,
  used: 0,
  pallets: [],
});

const createEmptyRack = (warehouse: Warehouse, sectionName: string): Rack => {
  const nextRackNumber =
    warehouse.sections
      .flatMap((section) => section.racks)
      .reduce((max, rack) => {
        const match = rack.id.match(/\d+/);
        return Math.max(max, match ? Number(match[0]) : 0);
      }, 0) + 1;

  const prefix = deriveSectionPrefix(sectionName);

  return {
    id: `R${nextRackNumber}`,
    name: `Rack ${nextRackNumber}`,
    shelves: Array.from({ length: 5 }).map((_, index) =>
      createEmptyShelf(`${prefix}-${index + 1}`)
    ),
  };
};

export default function InventoryDashboard() {
  const [warehouseData, setWarehouseData] = useState(warehouses);
  const [activeWarehouseIndex, setActiveWarehouseIndex] = useState(0);
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [itemSearchText, setItemSearchText] = useState("");
  const [warehouseSearchText, setWarehouseSearchText] = useState("");
  const [qrSearchText, setQrSearchText] = useState("");
  const { openModal } = useModal();

  const filteredWarehouses = useMemo(() => {
    if (!warehouseSearchText) {
      return warehouseData;
    }

    return warehouseData.filter(
      (warehouse) =>
        warehouse.name.toLowerCase().includes(warehouseSearchText.toLowerCase()) ||
        warehouse.location.toLowerCase().includes(warehouseSearchText.toLowerCase())
    );
  }, [warehouseData, warehouseSearchText]);

  const currentWarehouse =
    filteredWarehouses[activeWarehouseIndex] || filteredWarehouses[0] || warehouseData[0];
  const currentSection = currentWarehouse?.sections[activeSectionIndex] || null;
  const normalizedItemSearch = itemSearchText.trim().toLowerCase();

  const visibleSection = useMemo(() => {
    if (!currentSection || !normalizedItemSearch) {
      return currentSection;
    }

    const isRack = (rack: Rack | null): rack is Rack => Boolean(rack);

    return {
      ...currentSection,
      racks: currentSection.racks
        .filter((rack) => {
          const rackMatch =
            rack.name.toLowerCase().includes(normalizedItemSearch) ||
            rack.id.toLowerCase().includes(normalizedItemSearch);
          const itemMatch = rack.shelves.some((shelf) =>
            shelf.pallets.some((pallet) =>
              pallet.product.toLowerCase().includes(normalizedItemSearch)
            )
          );

          return rackMatch || itemMatch;
        })
        .filter(isRack),
    };
  }, [currentSection, normalizedItemSearch]);

  const handleWarehouseSelect = useCallback((index: number) => {
    setActiveWarehouseIndex(index);
    setActiveSectionIndex(0);
  }, []);

  const handleSectionTabChange = useCallback(
    (event: React.SyntheticEvent, newValue: number | string) => {
      if (typeof newValue !== "number") {
        return;
      }

      setActiveSectionIndex(newValue);
    },
    []
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
            onWarehouseUpdate={(warehouseId, payload) => {
              setWarehouseData((prev) =>
                prev.map((warehouseItem) =>
                  warehouseItem.id === warehouseId
                    ? {
                        ...warehouseItem,
                        name: payload.warehouseName.trim() || warehouseItem.name,
                        location: payload.location.trim() || warehouseItem.location,
                      }
                    : warehouseItem
                )
              );
            }}
            onSectionUpdate={(warehouseId, sectionId, payload) => {
              setWarehouseData((prev) =>
                prev.map((warehouseItem) => {
                  if (warehouseItem.id !== warehouseId) {
                    return warehouseItem;
                  }

                  return {
                    ...warehouseItem,
                    sections: warehouseItem.sections.map((sectionItem) => {
                      if (sectionItem.id !== sectionId) {
                        return sectionItem;
                      }

                      let nextRacks = [...sectionItem.racks];
                      const requestedRackCount = Number(payload.rackCount);

                      if (
                        Number.isFinite(requestedRackCount) &&
                        requestedRackCount > 0 &&
                        requestedRackCount > nextRacks.length
                      ) {
                        const missing = requestedRackCount - nextRacks.length;
                        nextRacks = [
                          ...nextRacks,
                          ...Array.from({ length: missing }).map(() =>
                            createEmptyRack(
                              warehouseItem,
                              payload.name.trim() || sectionItem.name
                            )
                          ),
                        ];
                      } else if (
                        Number.isFinite(requestedRackCount) &&
                        requestedRackCount > 0 &&
                        requestedRackCount < nextRacks.length
                      ) {
                        nextRacks = nextRacks.slice(0, requestedRackCount);
                      }

                      return {
                        ...sectionItem,
                        name: payload.name.trim() || sectionItem.name,
                        color: payload.color || sectionItem.color,
                        racks: nextRacks,
                      };
                    }),
                  };
                })
              );
            }}
            onRackUpdate={(warehouseId, sourceSectionId, rackItemId, payload) => {
              setWarehouseData((prev) =>
                prev.map((warehouseItem) => {
                  if (warehouseItem.id !== warehouseId) {
                    return warehouseItem;
                  }

                  const targetSectionId = payload.section_id || sourceSectionId;
                  if (targetSectionId === sourceSectionId) {
                    return {
                      ...warehouseItem,
                      sections: warehouseItem.sections.map((sectionItem) =>
                        sectionItem.id === sourceSectionId
                          ? {
                              ...sectionItem,
                              racks: sectionItem.racks.map((rackItem) =>
                                rackItem.id === rackItemId
                                  ? {
                                      ...rackItem,
                                      name: payload.name.trim() || rackItem.name,
                                    }
                                  : rackItem
                              ),
                            }
                          : sectionItem
                      ),
                    };
                  }

                  let movingRack: Rack | null = null;

                  const withoutRack = warehouseItem.sections.map((sectionItem) =>
                    sectionItem.id === sourceSectionId
                      ? {
                          ...sectionItem,
                          racks: sectionItem.racks.filter((rackItem) => {
                            if (rackItem.id === rackItemId) {
                              movingRack = {
                                ...rackItem,
                                name: payload.name.trim() || rackItem.name,
                              };
                              return false;
                            }

                            return true;
                          }),
                        }
                      : sectionItem
                  );

                  if (!movingRack) {
                    return warehouseItem;
                  }

                  return {
                    ...warehouseItem,
                    sections: withoutRack.map((sectionItem) =>
                      sectionItem.id === targetSectionId
                        ? {
                            ...sectionItem,
                            racks: [...sectionItem.racks, movingRack as Rack],
                          }
                        : sectionItem
                    ),
                  };
                })
              );
            }}
            onAddPallet={(warehouseId, sectionId, rackItemId, palletPayload) => {
              setWarehouseData((prev) =>
                prev.map((warehouseItem) =>
                  warehouseItem.id === warehouseId
                    ? {
                        ...warehouseItem,
                        sections: warehouseItem.sections.map((sectionItem) =>
                          sectionItem.id === sectionId
                            ? {
                                ...sectionItem,
                                racks: sectionItem.racks.map((rackItem) =>
                                  rackItem.id === rackItemId
                                    ? {
                                        ...rackItem,
                                        shelves: [
                                          ...rackItem.shelves,
                                          {
                                            id:
                                              palletPayload.palletName.trim() ||
                                              `Pallet ${rackItem.shelves.length + 1}`,
                                            capacity: Number(palletPayload.capacity) || 100,
                                            used: 0,
                                            pallets: [],
                                          },
                                        ],
                                      }
                                    : rackItem
                                ),
                              }
                            : sectionItem
                        ),
                      }
                    : warehouseItem
                )
              );
            }}
            onUpdatePallet={(warehouseId, sectionId, rackItemId, palletId, palletPayload) => {
              setWarehouseData((prev) =>
                prev.map((warehouseItem) =>
                  warehouseItem.id === warehouseId
                    ? {
                        ...warehouseItem,
                        sections: warehouseItem.sections.map((sectionItem) =>
                          sectionItem.id === sectionId
                            ? {
                                ...sectionItem,
                                racks: sectionItem.racks.map((rackItem) =>
                                  rackItem.id === rackItemId
                                    ? {
                                        ...rackItem,
                                        shelves: rackItem.shelves.map((shelfItem) =>
                                          shelfItem.id === palletId
                                            ? {
                                                ...shelfItem,
                                                id: palletPayload.palletName.trim() || shelfItem.id,
                                                capacity:
                                                  Number(palletPayload.capacity) || shelfItem.capacity,
                                                used: getShelfUsed(shelfItem),
                                              }
                                            : shelfItem
                                        ),
                                      }
                                    : rackItem
                                ),
                              }
                            : sectionItem
                        ),
                      }
                    : warehouseItem
                )
              );
            }}
            onRackReplace={(warehouseId, sectionId, nextRack) => {
              setWarehouseData((prev) =>
                prev.map((warehouseItem) =>
                  warehouseItem.id === warehouseId
                    ? {
                        ...warehouseItem,
                        sections: warehouseItem.sections.map((sectionItem) =>
                          sectionItem.id === sectionId
                            ? {
                                ...sectionItem,
                                racks: sectionItem.racks.map((rackItem) =>
                                  rackItem.id === nextRack.id ? nextRack : rackItem
                                ),
                              }
                            : sectionItem
                        ),
                      }
                    : warehouseItem
                )
              );
            }}
            {...modalProps}
          />
        ),
      });
    },
    [currentSection, currentWarehouse, openModal, visibleSection]
  );

  const handleAddRack = useCallback(() => {
    if (!currentSection) {
      return;
    }

    openEntityFormModal<AddEditRackRef>({
      openModal,
      entityLabel: "Rack",
      width: 500,
      FormComponent: AddEditRack,
      defaultValues: {
        section_id: currentSection.id,
      },
    });
  }, [currentSection, openModal]);

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
        product: "",
        oracle_code: query,
        qr_code: query,
        inQty: 0,
        outQty: 0,
        qty: 0,
      },
    });
  }, [openModal, qrSearchText]);

  const totalRacks = currentWarehouse
    ? currentWarehouse.sections.reduce((sum, section) => sum + section.racks.length, 0)
    : 0;

  if (!currentWarehouse) {
    return null;
  }

  return (
    <Card sx={{ display: "flex", height: "calc(100vh - 64px)", overflow: "hidden" }}>
      <WarehouseSidebar
        warehouses={filteredWarehouses}
        selectedIndex={activeWarehouseIndex}
        onSelect={handleWarehouseSelect}
        searchValue={warehouseSearchText}
        onSearchChange={setWarehouseSearchText}
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
              {currentWarehouse.name} — {currentWarehouse.location}
            </Typography>
            <Typography variant="body2" sx={{ color: "#94A3B8" }}>
              Select a zone tab below. Click any rack card to view its details.
            </Typography>
          </Box>

          <Stack direction="row" alignItems="center" spacing={1.25}>
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.75}
              
            >
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
              <IconActionButton
                ariaLabel="Open scanned item"
                tooltip="Open Item"
                onClick={() => handleQrItemOpen()}
                sx={{
                  color: "#64748B",
                  "&:hover": {
                    color: "#334155",
                    backgroundColor: "rgba(148, 163, 184, 0.12)",
                  },
                }}
              >
                <QrCodeScannerOutlinedIcon fontSize="small" />
              </IconActionButton>
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
