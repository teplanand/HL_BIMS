import { memo, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Box,
  Breadcrumbs,
  Card,
  IconButton,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import RemoveOutlinedIcon from "@mui/icons-material/RemoveOutlined";

import { Pallet, Rack, Section, Shelf, Warehouse } from "../types";
import { getRackTotals, getShelfUsagePercent, getStatusColor } from "../utils";
import { useModal } from "../../../../hooks/useModal";
import { useToast } from "../../../../hooks/useToast";
import IconActionButton from "../../../../components/common/IconActionButton";
import QuantityControl from "../../../../components/common/QuantityControl";
import CompactAccordion from "../../../../components/common/CompactAccordion";
import { openEntityFormModal } from "../../shared/openEntityFormModal";
import { AddEditItem, AddEditItemRef } from "../../Itemlist/addedititem";
import { AddEditWarehouse, AddEditWarehouseRef } from "../../Warehouselist/addeditwarehouse";
import { AddEditZone, AddEditZoneRef } from "../../Zonelist/addeditzone";
import { AddEditRack, AddEditRackRef } from "../../Racklist/addeditrack";
import { AddEditPallet, AddEditPalletRef } from "../../Palletlist/addeditpallet";

type Props = {
  warehouse: Warehouse;
  section: Section | null;
  selectedRack: Rack | null;
  setDisplayTitle?: (title: string) => void;
  onWarehouseUpdate?: (warehouseId: string, payload: any) => void;
  onSectionUpdate?: (warehouseId: string, sectionId: string, payload: any) => void;
  onRackUpdate?: (warehouseId: string, sourceSectionId: string, rackId: string, payload: any) => void;
  onAddPallet?: (warehouseId: string, sectionId: string, rackId: string, payload: any) => void;
  onUpdatePallet?: (warehouseId: string, sectionId: string, rackId: string, palletId: string, payload: any) => void;
  onRackReplace?: (warehouseId: string, sectionId: string, nextRack: Rack) => void;
};

type PalletRowProps = {
  shelf: Shelf;
  expanded: boolean;
  onToggle: () => void;
  onEditPallet: (shelf: Shelf) => void;
  onAddItem: (shelf: Shelf) => void;
  onEditItem: (shelf: Shelf, item: Pallet) => void;
  onAdjustItemQty: (shelfId: string, itemId: string, direction: "in" | "out") => void;
};

type DetailFieldProps = {
  label: string;
  value: string | number;
  onEdit?: () => void;
  tooltip?: string;
};

type ActionCardProps = {
  title: string;
  value?: string | number;
  action?: ReactNode;
};

type ItemRowProps = {
  item: Pallet;
  name: string;
  inQty: number;
  outQty: number;
  totalQty: number;
  onEdit: () => void;
  onIncrementIn: () => void;
  onIncrementOut: () => void;
};

const getShelfUsed = (shelf: Shelf) => shelf.pallets.reduce((total, item) => total + item.qty, 0);
const getSectionPrefix = (name: string, seed?: string) =>
  seed?.match(/^[A-Z]+/i)?.[0]?.toUpperCase() ||
  name.split(" - ")[0]?.replace(/[^A-Z0-9]/gi, "").toUpperCase() ||
  "PL";
const createShelf = (id: string, capacity = 100): Shelf => ({ id, capacity, used: 0, pallets: [] });
const createRack = (warehouse: Warehouse, sectionName: string): Rack => {
  const next =
    warehouse.sections
      .flatMap((sectionItem) => sectionItem.racks)
      .reduce((max, rackItem) => Math.max(max, Number(rackItem.id.match(/\d+/)?.[0] || 0)), 0) + 1;
  const prefix = getSectionPrefix(sectionName);

  return {
    id: `R${next}`,
    name: `Rack ${next}`,
    shelves: Array.from({ length: 5 }).map((_, index) => createShelf(`${prefix}-${index + 1}`)),
  };
};
const nextItemId = (shelf: Shelf) =>
  `ITEM-${
    shelf.pallets.reduce(
      (max, item) => Math.max(max, Number(item.id.match(/\d+/)?.[0] || 0)),
      0
    ) + 1
  }`;

function ActionCard({ title, value, action }: ActionCardProps) {
  return (
    <Card
      variant="outlined"
      sx={{
        p: 1,
        borderRadius: 2,
        backgroundColor: "#F8FAFC",
        borderColor: "rgba(15,23,42,0.06)",
        boxShadow: "none",
      }}
    >
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
        <Typography variant="caption" color="text.secondary">
          {title}
        </Typography>
        {action ? <Box sx={{ display: "flex", alignItems: "center", mt: -0.5, mr: -0.5 }}>{action}</Box> : null}
      </Stack>
      <Typography variant="body2" sx={{ mt: 0.375, fontWeight: 700, color: "#334155" }}>
        {value}
      </Typography>
    </Card>
  );
}

function DetailField({ label, value, onEdit, tooltip = "Edit" }: DetailFieldProps) {
  return (
    <ActionCard
      title={label}
      value={value}
      action={
        onEdit ? (
          <IconActionButton
            ariaLabel={`Edit ${label}`}
            tooltip={tooltip}
            onClick={(event) => {
              event.stopPropagation();
              onEdit();
            }}
          >
            <EditOutlinedIcon fontSize="small" />
          </IconActionButton>
        ) : undefined
      }
    />
  );
}

function ItemRow({
  item,
  name,
  inQty,
  outQty,
  totalQty,
  onEdit,
  onIncrementIn,
  onIncrementOut,
}: ItemRowProps) {
  return (
    <Box
      sx={{
        px: 0.875,
        py: 0.75,
        borderRadius: 1.5,
        backgroundColor: "#FFFFFF",
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={1}
        useFlexGap
        flexWrap="wrap"
      >
        <Typography variant="body2" sx={{ fontWeight: 700, color: "#0F172A", minWidth: 0 }}>
          {name}
        </Typography>
        <Stack direction="row" spacing={0.75} alignItems="center" useFlexGap flexWrap="wrap">
          <QuantityControl
            label="In"
            value={inQty}
            icon={<AddOutlinedIcon sx={{ fontSize: 14 }} />}
            onClick={(event) => {
              event.stopPropagation();
              onIncrementIn();
            }}
            color="#15803D"
            backgroundColor="rgba(34,197,94,0.08)"
          />
          <QuantityControl
            label="Out"
            value={outQty}
            icon={<RemoveOutlinedIcon sx={{ fontSize: 14 }} />}
            onClick={(event) => {
              event.stopPropagation();
              onIncrementOut();
            }}
            disabled={totalQty <= 0}
            color="#DC2626"
            backgroundColor="rgba(248,113,113,0.08)"
          />
          <Box
            sx={{
              px: 0.85,
              py: 0.55,
              borderRadius: 99,
              backgroundColor: "rgba(255,138,61,0.12)",
            }}
          >
            <Typography variant="caption" sx={{ color: "#9A3412", fontWeight: 700 }}>
              Total: <Box component="span" sx={{ color: "#C2410C", fontWeight: 800 }}>{totalQty}</Box>
            </Typography>
          </Box>
          <IconActionButton
            ariaLabel={`Edit item ${item.id}`}
            tooltip="Edit"
            onClick={(event) => {
              event.stopPropagation();
              onEdit();
            }}
            sx={{ ml: 0.25 }}
          >
            <EditOutlinedIcon fontSize="small" />
          </IconActionButton>
        </Stack>
      </Stack>
    </Box>
  );
}

const PalletRow = memo(function PalletRow({
  shelf,
  expanded,
  onToggle,
  onEditPallet,
  onAddItem,
  onEditItem,
  onAdjustItemQty,
}: PalletRowProps) {
  const usage = getShelfUsagePercent(shelf.used, shelf.capacity);
  const status = getStatusColor(shelf.used, shelf.capacity);

  return (
    <CompactAccordion
      expanded={expanded}
      onToggle={onToggle}
      header={
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
          <Stack direction="row" spacing={0.75} alignItems="center" sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 700, color: "#0F172A", minWidth: 72 }}>
              {shelf.id}
            </Typography>
            <Box sx={{ flex: 1 }}>
              <LinearProgress
                variant="determinate"
                value={usage}
                sx={{
                  height: 6,
                  borderRadius: 999,
                  backgroundColor: "#E2E8F0",
                  "& .MuiLinearProgress-bar": {
                    backgroundColor: status,
                    borderRadius: 999,
                  },
                }}
              />
            </Box>
            <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 700, minWidth: 40 }}>
              {Math.round(usage)}%
            </Typography>
          </Stack>
          <Stack direction="row" spacing={0.25} alignItems="center">
            <IconActionButton
              ariaLabel={`Edit pallet ${shelf.id}`}
              tooltip="Edit"
              onClick={(event) => {
                event.stopPropagation();
                onEditPallet(shelf);
              }}
            >
              <EditOutlinedIcon fontSize="small" />
            </IconActionButton>
            <IconButton size="small" sx={{ p: 0.5 }}>
              {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            </IconButton>
          </Stack>
        </Stack>
      }
    >
      <Box sx={{ px: 0.25 }}>
        <Stack direction="row" justifyContent="space-between" spacing={1} sx={{ mb: 0.75 }}>
          <Typography variant="caption" color="text.secondary">
            Capacity: {shelf.used} / {shelf.capacity}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Items: {shelf.pallets.length}
          </Typography>
        </Stack>

        <Box
          sx={{
            p: 0.875,
            borderRadius: 1.75,
            backgroundColor: "#F8FAFC",
          }}
        >
          <Stack spacing={0.5}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
              <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 700 }}>
                Items
              </Typography>
              <IconActionButton
                ariaLabel={`Add item to ${shelf.id}`}
                tooltip="Add Item"
                onClick={(event) => {
                  event.stopPropagation();
                  onAddItem(shelf);
                }}
              >
                <AddOutlinedIcon fontSize="small" />
              </IconActionButton>
            </Stack>
            {shelf.pallets.length ? (
              shelf.pallets.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  name={item.product}
                  inQty={item.inQty ?? item.qty}
                  outQty={item.outQty ?? 0}
                  totalQty={item.qty}
                  onEdit={() => onEditItem(shelf, item)}
                  onIncrementIn={() => onAdjustItemQty(shelf.id, item.id, "in")}
                  onIncrementOut={() => onAdjustItemQty(shelf.id, item.id, "out")}
                />
              ))
            ) : (
              <Typography variant="caption" color="text.disabled">
                No items in this pallet.
              </Typography>
            )}
          </Stack>
        </Box>
      </Box>
    </CompactAccordion>
  );
});

function RackDetailsPanelComponent({
  warehouse,
  section,
  selectedRack,
  setDisplayTitle,
  onWarehouseUpdate,
  onSectionUpdate,
  onRackUpdate,
  onAddPallet,
  onUpdatePallet,
  onRackReplace,
}: Props) {
  const { openModal } = useModal();
  const { showToast } = useToast();
  const [warehouseState, setWarehouseState] = useState(warehouse);
  const [sectionId, setSectionId] = useState<string | null>(section?.id || null);
  const [rackId, setRackId] = useState<string | null>(selectedRack?.id || null);
  const [expandedShelfId, setExpandedShelfId] = useState<string | null>(selectedRack?.shelves[0]?.id || null);

  useEffect(() => {
    setWarehouseState(warehouse);
    setSectionId(section?.id || null);
    setRackId(selectedRack?.id || null);
    setExpandedShelfId(selectedRack?.shelves[0]?.id || null);
  }, [warehouse, section, selectedRack]);

  const currentSection = useMemo(
    () => warehouseState.sections.find((sectionItem) => sectionItem.id === sectionId) || null,
    [sectionId, warehouseState.sections]
  );
  const currentRack = useMemo(
    () =>
      currentSection?.racks.find((rackItem) => rackItem.id === rackId) ||
      warehouseState.sections
        .flatMap((sectionItem) => sectionItem.racks)
        .find((rackItem) => rackItem.id === rackId) ||
      null,
    [currentSection, rackId, warehouseState.sections]
  );
  const totals = currentRack ? getRackTotals(currentRack) : null;

  useEffect(() => {
    if (currentRack) {
      setDisplayTitle?.(`Rack Details - ${currentRack.name}`);
    }
  }, [currentRack, setDisplayTitle]);

  useEffect(() => {
    if (!currentRack) {
      setExpandedShelfId(null);
      return;
    }

    if (expandedShelfId && currentRack.shelves.some((shelf) => shelf.id === expandedShelfId)) {
      return;
    }

    setExpandedShelfId(currentRack.shelves[0]?.id || null);
  }, [currentRack, expandedShelfId]);

  const replaceRackLocal = useCallback(
    (updater: (rack: Rack) => Rack) => {
      if (!sectionId || !rackId) return;
      let nextRack: Rack | null = null;

      setWarehouseState((prev) => ({
        ...prev,
        sections: prev.sections.map((sectionItem) =>
          sectionItem.id === sectionId
            ? {
                ...sectionItem,
                racks: sectionItem.racks.map((rackItem) =>
                  rackItem.id === rackId ? (nextRack = updater(rackItem), nextRack) : rackItem
                ),
              }
            : sectionItem
        ),
      }));

      if (nextRack) {
        onRackReplace?.(warehouseState.id, sectionId, nextRack);
      }
    },
    [onRackReplace, rackId, sectionId, warehouseState.id]
  );

  const editWarehouse = useCallback(() => {
    openEntityFormModal<AddEditWarehouseRef>({
      openModal,
      entityLabel: "Warehouse",
      width: 720,
      FormComponent: AddEditWarehouse,
      defaultValues: {
        id: warehouseState.id,
        warehouseName: warehouseState.name,
        managerName: "Warehouse Admin",
        contactNumber: "9876543210",
        email: `${warehouseState.name.replace(/\s+/g, "").toLowerCase()}@elecon.com`,
        location: warehouseState.location,
        address: `${warehouseState.location} central warehouse`,
        storageCapacity: warehouseState.sections.reduce(
          (sum, sectionItem) =>
            sum +
            sectionItem.racks.reduce(
              (rackSum, rackItem) => rackSum + rackItem.shelves.length * 100,
              0
            ),
          0
        ),
        status: "active",
        notes: "",
      },
      extraProps: {
        onSubmitWarehouse: async (payload: any) => {
          setWarehouseState((prev) => ({
            ...prev,
            name: payload.warehouseName.trim() || prev.name,
            location: payload.location.trim() || prev.location,
          }));
          onWarehouseUpdate?.(warehouseState.id, payload);
          showToast("Warehouse updated from rack details", "success");
        },
      },
    });
  }, [onWarehouseUpdate, openModal, showToast, warehouseState]);

  const editZone = useCallback(() => {
    if (!currentSection) return;

    openEntityFormModal<AddEditZoneRef>({
      openModal,
      entityLabel: "Zone",
      width: 720,
      FormComponent: AddEditZone,
      defaultValues: {
        id: currentSection.id,
        warehouseName: warehouseState.name,
        name: currentSection.name,
        color: currentSection.color,
        rackCount: currentSection.racks.length,
        prefix: getSectionPrefix(currentSection.name, currentSection.racks[0]?.shelves[0]?.id),
      },
      extraProps: {
        onSubmitSection: async (payload: any) => {
          setWarehouseState((prev) => ({
            ...prev,
            sections: prev.sections.map((sectionItem) => {
              if (sectionItem.id !== currentSection.id) {
                return sectionItem;
              }

              let racks = [...sectionItem.racks];
              const count = Number(payload.rackCount);

              if (Number.isFinite(count) && count > racks.length) {
                racks = [
                  ...racks,
                  ...Array.from({ length: count - racks.length }).map(() =>
                    createRack(prev, payload.name.trim() || sectionItem.name)
                  ),
                ];
              } else if (Number.isFinite(count) && count > 0 && count < racks.length) {
                racks = racks.slice(0, count);
              }

              return {
                ...sectionItem,
                name: payload.name.trim() || sectionItem.name,
                color: payload.color || sectionItem.color,
                racks,
              };
            }),
          }));
          onSectionUpdate?.(warehouseState.id, currentSection.id, payload);
          showToast("Zone updated from rack details", "success");
        },
      },
    });
  }, [currentSection, onSectionUpdate, openModal, showToast, warehouseState]);

  const editRack = useCallback(() => {
    if (!currentRack || !currentSection) return;

    openEntityFormModal<AddEditRackRef>({
      openModal,
      entityLabel: "Rack",
      width: 500,
      FormComponent: AddEditRack,
      defaultValues: { id: currentRack.id, name: currentRack.name, section_id: currentSection.id },
      extraProps: {
        onSubmitRack: async (payload: any) => {
          const target = payload.section_id || currentSection.id;

          if (target === currentSection.id) {
            setWarehouseState((prev) => ({
              ...prev,
              sections: prev.sections.map((sectionItem) =>
                sectionItem.id === currentSection.id
                  ? {
                      ...sectionItem,
                      racks: sectionItem.racks.map((rackItem) =>
                        rackItem.id === currentRack.id
                          ? { ...rackItem, name: payload.name.trim() || rackItem.name }
                          : rackItem
                      ),
                    }
                  : sectionItem
              ),
            }));
          } else {
            setWarehouseState((prev) => {
              let moving: Rack | null = null;
              const sections = prev.sections.map((sectionItem) =>
                sectionItem.id === currentSection.id
                  ? {
                      ...sectionItem,
                      racks: sectionItem.racks.filter((rackItem) => {
                        if (rackItem.id === currentRack.id) {
                          moving = {
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

              return {
                ...prev,
                sections: sections.map((sectionItem) =>
                  sectionItem.id === target && moving
                    ? { ...sectionItem, racks: [...sectionItem.racks, moving] }
                    : sectionItem
                ),
              };
            });
            setSectionId(target);
          }

          onRackUpdate?.(warehouseState.id, currentSection.id, currentRack.id, payload);
          showToast("Rack updated from details panel", "success");
        },
      },
    });
  }, [currentRack, currentSection, onRackUpdate, openModal, showToast, warehouseState.id]);

  const addPallet = useCallback(() => {
    if (!currentRack || !currentSection) return;

    openEntityFormModal<AddEditPalletRef>({
      openModal,
      entityLabel: "Pallet",
      width: 500,
      FormComponent: AddEditPallet,
      defaultValues: { rack_id: currentRack.id },
      extraProps: {
        onSubmitPallet: async (payload: any) => {
          replaceRackLocal((rackItem) => ({
            ...rackItem,
            shelves: [
              ...rackItem.shelves,
              {
                id: payload.palletName.trim() || `Pallet ${rackItem.shelves.length + 1}`,
                capacity: Number(payload.capacity) || 100,
                used: 0,
                pallets: [],
              },
            ],
          }));
          onAddPallet?.(warehouseState.id, currentSection.id, currentRack.id, payload);
          showToast("New pallet added to rack", "success");
          setExpandedShelfId(payload.palletName.trim() || `Pallet ${currentRack.shelves.length + 1}`);
        },
      },
    });
  }, [currentRack, currentSection, onAddPallet, openModal, replaceRackLocal, showToast, warehouseState.id]);

  const editPallet = useCallback(
    (shelf: Shelf) => {
      if (!currentRack || !currentSection) return;

      openEntityFormModal<AddEditPalletRef>({
        openModal,
        entityLabel: "Pallet",
        width: 500,
        FormComponent: AddEditPallet,
        defaultValues: {
          id: shelf.id,
          rack_id: currentRack.id,
          palletName: shelf.id,
          capacity: shelf.capacity,
        },
        extraProps: {
          onSubmitPallet: async (payload: any) => {
            const nextPalletId = payload.palletName.trim() || shelf.id;
            replaceRackLocal((rackItem) => ({
              ...rackItem,
              shelves: rackItem.shelves.map((entry) =>
                entry.id === shelf.id
                  ? {
                      ...entry,
                      id: nextPalletId,
                      capacity: Number(payload.capacity) || entry.capacity,
                      used: getShelfUsed(entry),
                    }
                  : entry
              ),
            }));
            onUpdatePallet?.(warehouseState.id, currentSection.id, currentRack.id, shelf.id, payload);
            showToast("Pallet updated successfully", "success");
            setExpandedShelfId(nextPalletId);
          },
        },
      });
    },
    [currentRack, currentSection, onUpdatePallet, openModal, replaceRackLocal, showToast, warehouseState.id]
  );

  const openAddItem = useCallback(
    (shelf: Shelf) => {
      openEntityFormModal<AddEditItemRef>({
        openModal,
        entityLabel: "Item",
        width: 640,
        FormComponent: AddEditItem,
        defaultValues: {
          pallet_id: shelf.id,
          palletName: shelf.id,
          inQty: 1,
          outQty: 0,
        },
        extraProps: {
          onSubmitItem: async (payload: any) => {
            replaceRackLocal((rackItem) => ({
              ...rackItem,
              shelves: rackItem.shelves.map((entry) => {
                if (entry.id !== shelf.id) return entry;
                const nextShelf = {
                  ...entry,
                  pallets: [
                    ...entry.pallets,
                    {
                      id: nextItemId(entry),
                      product: payload.product,
                      qty: payload.qty,
                      inQty: payload.inQty,
                      outQty: payload.outQty,
                      oracle_code: payload.oracle_code,
                      description: payload.description,
                      sub_inventory: payload.sub_inventory,
                      has_expiry_date: payload.has_expiry_date,
                      expiry_date: payload.expiry_date,
                      qr_code: payload.qr_code,
                    },
                  ],
                };
                return { ...nextShelf, used: getShelfUsed(nextShelf) };
              }),
            }));
            showToast("New item added in pallet", "success");
            setExpandedShelfId(shelf.id);
          },
        },
      });
    },
    [openModal, replaceRackLocal, showToast]
  );

  const openEditItem = useCallback(
    (shelf: Shelf, item: Pallet) => {
      openEntityFormModal<AddEditItemRef>({
        openModal,
        entityLabel: "Item",
        width: 640,
        FormComponent: AddEditItem,
        defaultValues: {
          id: item.id,
          pallet_id: shelf.id,
          palletName: shelf.id,
          product: item.product,
          inQty: item.inQty ?? item.qty,
          outQty: item.outQty ?? 0,
          qty: item.qty,
          oracle_code: item.oracle_code || "",
          description: item.description || "",
          sub_inventory: item.sub_inventory || "",
          has_expiry_date: item.has_expiry_date || false,
          expiry_date: item.expiry_date || null,
          qr_code: item.qr_code || "",
        },
        extraProps: {
          onSubmitItem: async (payload: any) => {
            replaceRackLocal((rackItem) => ({
              ...rackItem,
              shelves: rackItem.shelves.map((entry) => {
                if (entry.id !== shelf.id) return entry;
                const nextShelf = {
                  ...entry,
                  pallets: entry.pallets.map((existingItem) =>
                    existingItem.id === item.id
                      ? {
                          ...existingItem,
                          product: payload.product,
                          qty: payload.qty,
                          inQty: payload.inQty,
                          outQty: payload.outQty,
                          oracle_code: payload.oracle_code,
                          description: payload.description,
                          sub_inventory: payload.sub_inventory,
                          has_expiry_date: payload.has_expiry_date,
                          expiry_date: payload.expiry_date,
                          qr_code: payload.qr_code,
                        }
                      : existingItem
                  ),
                };
                return { ...nextShelf, used: getShelfUsed(nextShelf) };
              }),
            }));
            showToast("Item updated successfully", "success");
            setExpandedShelfId(shelf.id);
          },
        },
      });
    },
    [openModal, replaceRackLocal, showToast]
  );

  const adjustItemQty = useCallback(
    (shelfId: string, itemId: string, direction: "in" | "out") => {
      replaceRackLocal((rackItem) => ({
        ...rackItem,
        shelves: rackItem.shelves.map((shelf) => {
          if (shelf.id !== shelfId) return shelf;

          const pallets = shelf.pallets.map((item) => {
            if (item.id !== itemId) {
              return item;
            }

            if (direction === "in") {
              return {
                ...item,
                inQty: (item.inQty ?? item.qty) + 1,
                qty: item.qty + 1,
              };
            }

            if (item.qty <= 0) {
              return item;
            }

            return {
              ...item,
              outQty: (item.outQty ?? 0) + 1,
              qty: Math.max(item.qty - 1, 0),
            };
          });
          const nextShelf = { ...shelf, pallets };

          return { ...nextShelf, used: getShelfUsed(nextShelf) };
        }),
      }));
    },
    [replaceRackLocal]
  );

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
        "&::-webkit-scrollbar": { width: "4px" },
        "&::-webkit-scrollbar-thumb": {
          backgroundColor: "#E2E8F0",
          borderRadius: "4px",
        },
      }}
    >
      {currentRack && currentSection ? (
        <>
          <Box sx={{ px: 1, pb: 1 }}>
            <Breadcrumbs
              separator={<NavigateNextIcon fontSize="small" />}
              sx={{ "& .MuiBreadcrumbs-li": { fontSize: "0.75rem", fontWeight: 500 } }}
            >
              <Typography color="text.secondary">{warehouseState.name}</Typography>
              <Typography color="text.secondary">{currentSection.name}</Typography>
              <Typography color="text.primary">{currentRack.id}</Typography>
            </Breadcrumbs>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 1,
                mt: 1,
              }}
            >
              <DetailField label="Warehouse" value={warehouseState.name} onEdit={editWarehouse} />
              <DetailField label="Zone" value={currentSection.name} onEdit={editZone} />
              <DetailField label="Rack" value={currentRack.name} onEdit={editRack} />
              <ActionCard
                title="Pallets"
                value={currentRack.shelves.length}
                action={
                  <IconActionButton
                    ariaLabel="Add pallet"
                    tooltip="Add Pallet"
                    onClick={(event) => {
                      event.stopPropagation();
                      addPallet();
                    }}
                  >
                    <AddOutlinedIcon fontSize="small" />
                  </IconActionButton>
                }
              />
            </Box>
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Capacity Usage
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, color: "#1E293B" }}>
                {totals?.used} / {totals?.capacity} units
              </Typography>
              <LinearProgress
                variant="determinate"
                value={Math.min(((totals?.used || 0) / (totals?.capacity || 1)) * 100, 100)}
                sx={{
                  height: 6,
                  borderRadius: 999,
                  mt: 0.75,
                  backgroundColor: "#F6D3C2",
                  "& .MuiLinearProgress-bar": { backgroundColor: "#FF8A3D" },
                }}
              />
            </Box>
          </Box>

          <Box sx={{ p: 1, flex: 1 }}>
            <Stack spacing={0.75}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#334155", px: 0.25 }}>
                Pallet List
              </Typography>
              {currentRack.shelves.map((shelf) => (
                <PalletRow
                  key={shelf.id}
                  shelf={shelf}
                  expanded={expandedShelfId === shelf.id}
                  onToggle={() => setExpandedShelfId((prev) => (prev === shelf.id ? null : shelf.id))}
                  onEditPallet={editPallet}
                  onAddItem={openAddItem}
                  onEditItem={openEditItem}
                  onAdjustItemQty={adjustItemQty}
                />
              ))}
            </Stack>
          </Box>
        </>
      ) : (
        <Box sx={{ p: 4, textAlign: "center", mt: 10 }}>
          <Typography color="text.secondary">Select a rack from the grid to view details</Typography>
        </Box>
      )}
    </Box>
  );
}

export const RackDetailsPanel = memo(RackDetailsPanelComponent);
