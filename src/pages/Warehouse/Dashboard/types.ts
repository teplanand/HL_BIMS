export type Pallet = {
  id: string;
  product: string;
  qty: number;
  inQty?: number;
  outQty?: number;
  oracle_code?: string;
  description?: string;
  sub_inventory?: string;
  has_expiry_date?: boolean;
  expiry_date?: string | null;
  qr_code?: string;
};

export type Shelf = {
  id: string;
  capacity: number;
  used: number;
  pallets: Pallet[];
};

export type Rack = {
  id: string;
  name: string;
  shelves: Shelf[];
};

export type Section = {
  id: string;
  name: string;
  color: string;
  racks: Rack[];
};

export type Warehouse = {
  id: string;
  name: string;
  location: string;
  sections: Section[];
};
