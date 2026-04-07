import { Pallet, Warehouse } from "./types";

type SectionSeed = {
  id: string;
  name: string;
  color: string;
  rackCount: number;
  shelfCount: number;
  products: string[];
  prefix: string;
};

const buildPallets = (
  rackIndex: number,
  shelfIndex: number,
  prefix: string,
  products: string[]
): Pallet[] => {
  const palletCount = ((rackIndex + shelfIndex) % 3) + 1;

  return Array.from({ length: palletCount }).map((_, palletIndex) => ({
    id: `${prefix}-${rackIndex + 1}${shelfIndex + 1}-${palletIndex + 1}`,
    product: products[(rackIndex + shelfIndex + palletIndex) % products.length],
    qty: 8 + (((rackIndex + 1) * (shelfIndex + 2) * (palletIndex + 1)) % 18),
  }));
};

const createSection = (seed: SectionSeed, rackStart = 1) => ({
  id: seed.id,
  name: seed.name,
  color: seed.color,
  racks: Array.from({ length: seed.rackCount }).map((_, rackIndex) => ({
    id: `R${rackStart + rackIndex}`,
    name: `Rack ${rackStart + rackIndex}`,
    shelves: Array.from({ length: seed.shelfCount }).map((_, shelfIndex) => {
      const pallets = buildPallets(rackIndex, shelfIndex, seed.prefix, seed.products);
      const used = pallets.reduce((total, pallet) => total + pallet.qty, 0);

      return {
        id: `${seed.prefix}${rackIndex + 1}-${shelfIndex + 1}`,
        capacity: 100,
        used,
        pallets,
      };
    }),
  })),
});

const createEmptyWarehouse = (
  warehouseId: string,
  name: string,
  location: string,
  color: string
): Warehouse => ({
  id: warehouseId,
  name,
  location,
  sections: Array.from({ length: 2 }).map((_, sectionIndex) => ({
    id: `${warehouseId}-SEC-${sectionIndex + 1}`,
    name: `Zone ${sectionIndex + 1}`,
    color,
    racks: Array.from({ length: 5 }).map((_, rackIndex) => ({
      id: `R${rackIndex + 1}`,
      name: `Rack ${rackIndex + 1}`,
      shelves: Array.from({ length: 5 }).map((_, shelfIndex) => ({
        id: `S${sectionIndex + 1}-${rackIndex + 1}-${shelfIndex + 1}`,
        capacity: 100,
        used: 0,
        pallets: [],
      })),
    })),
  })),
});

const warehouseOneSections: SectionSeed[] = [
  {
    id: "WH1-SEC-A",
    name: "A - Electronics",
    color: "#FF8A3D",
    rackCount: 5,
    shelfCount: 12,
    prefix: "EA",
    products: ["TV", "AC", "PC", "Cam"],
  },
  {
    id: "WH1-SEC-B",
    name: "B - Appliances",
    color: "#FFA726",
    rackCount: 5,
    shelfCount: 10,
    prefix: "AP",
    products: ["Mic", "Fan", "Mix", " Oven"],
  },
  {
    id: "WH1-SEC-C",
    name: "C - Home Decor",
    color: "#4CAF50",
    rackCount: 5,
    shelfCount: 5,
    prefix: "HD",
    products: ["Lamp", " Rug", "Vase", "Clock"],
  },
  {
    id: "WH1-SEC-D",
    name: "D - Sports",
    color: "#F44336",
    rackCount: 5,
    shelfCount: 5,
    prefix: "SP",
    products: ["Ball", "Bat", "Mat", "Bike"],
  },
];

export const warehouses: Warehouse[] = [
  {
    id: "WH1",
    name: "Warehouse 1",
    location: "Ahmedabad",
    sections: warehouseOneSections.map((section, index) =>
      createSection(section, 1 + index * section.rackCount)
    ),
  },
  createEmptyWarehouse("WH2", "Warehouse 2", "Surat", "#FF8A3D"),
  createEmptyWarehouse("WH3", "Warehouse 3", "Vadodara", "#FF8A3D"),
  createEmptyWarehouse("WH4", "Warehouse 4", "Rajkot", "#FF8A3D"),
  createEmptyWarehouse("WH5", "Warehouse 5", "Mumbai", "#FF8A3D"),
];
