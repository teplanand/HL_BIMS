import React, { useState } from "react";
import { Box } from "@mui/material";
import { GridColDef, GridPaginationModel, GridSortModel, GridFilterModel } from "@mui/x-data-grid";
import { Page } from "../../../components/common/Page";
import ReusableDataGrid from "../../../components/common/ReusableDataGrid";
import { useModal } from "../../../hooks/useModal";
import { AddEditItem, AddEditItemRef } from "./addedititem";
import { openEntityFormModal } from "../shared/openEntityFormModal";

const DUMMY_ITEMS = [
    {
        id: "EA-11-1",
        pallet_id: "EA1-1",
        palletName: "Pallet A",
        product: "TV",
        qty: 26,
        oracle_code: "ORC-100245",
        description: "55 inch smart TV stock for export dispatch",
        sub_inventory: "FG-MAIN",
        has_expiry_date: false,
        expiry_date: null,
        qr_code: "ITEM|ORC-100245|EA1-1|FG-MAIN",
    },
    {
        id: "EA-11-2",
        pallet_id: "EA1-1",
        palletName: "Pallet A",
        product: "AC",
        qty: 28,
        oracle_code: "ORC-100246",
        description: "Split AC indoor units reserved for dealer order",
        sub_inventory: "FG-RESERVE",
        has_expiry_date: false,
        expiry_date: null,
        qr_code: "ITEM|ORC-100246|EA1-1|FG-RESERVE",
    },
    {
        id: "EA-12-1",
        pallet_id: "EA1-2",
        palletName: "Pallet B",
        product: "PC",
        qty: 27,
        oracle_code: "ORC-100247",
        description: "Industrial panel PC batch",
        sub_inventory: "RM-STORE",
        has_expiry_date: false,
        expiry_date: null,
        qr_code: "ITEM|ORC-100247|EA1-2|RM-STORE",
    },
    {
        id: "EA-21-1",
        pallet_id: "EA2-1",
        palletName: "Pallet D",
        product: "Cam",
        qty: 29,
        oracle_code: "ORC-100248",
        description: "Warehouse CCTV camera set",
        sub_inventory: "MRO-CAM",
        has_expiry_date: true,
        expiry_date: "2026-12-31",
        qr_code: "ITEM|ORC-100248|EA2-1|MRO-CAM",
    },
    {
        id: "EA-22-1",
        pallet_id: "EA2-2",
        palletName: "Pallet F",
        product: "TV",
        qty: 45,
        oracle_code: "ORC-100249",
        description: "Spare display units for retail samples",
        sub_inventory: "FG-MAIN",
        has_expiry_date: false,
        expiry_date: null,
        qr_code: "ITEM|ORC-100249|EA2-2|FG-MAIN",
    },
];

const ItemlistPage: React.FC = () => {
    const { openModal } = useModal();

    const handleAddItem = () => {
        openEntityFormModal<AddEditItemRef>({
            openModal,
            entityLabel: "Item",
            width: 500,
            FormComponent: AddEditItem,
        });
    };

    const handleEditItem = (row: any) => {
        openEntityFormModal<AddEditItemRef>({
            openModal,
            entityLabel: "Item",
            width: 500,
            FormComponent: AddEditItem,
            defaultValues: row,
        });
    };

    const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
        page: 0,
        pageSize: 15,
    });
    const [sortModel, setSortModel] = useState<GridSortModel>([]);
    const [filterModel, setFilterModel] = useState<GridFilterModel>({
        items: [],
        quickFilterValues: [],
    });

    const columns: GridColDef[] = [
        { field: "palletName", headerName: "Pallet Name", flex: 1.1, minWidth: 160 },
        { field: "oracle_code", headerName: "Oracle Code", flex: 1.1, minWidth: 150 },
        { field: "product", headerName: "Item Name", flex: 1.5, minWidth: 200 },
        { field: "sub_inventory", headerName: "Sub Inventory", flex: 1.1, minWidth: 150 },
        { field: "qty", headerName: "Quantity", flex: 1, minWidth: 120, type: 'number' },
    ];

    return (
        <Page module="Warehouse">
            <Box className="p-0">
                <ReusableDataGrid
                    rows={DUMMY_ITEMS}
                    columns={columns}
                    totalCount={DUMMY_ITEMS.length}
                    loading={false}
                    paginationModel={paginationModel}
                    setPaginationModel={setPaginationModel}
                    sortModel={sortModel}
                    setSortModel={setSortModel}
                    filterModel={filterModel}
                    setFilterModel={setFilterModel}
                    title="Item List"
                    permissions={{
                        create: true,
                        edit: true,
                        delete: true,
                        download: true,
                        view: true,
                    }}
                    onAdd={handleAddItem}
                    onRowClick={handleEditItem}

                />
            </Box>
        </Page>
    );
};

export default ItemlistPage;
