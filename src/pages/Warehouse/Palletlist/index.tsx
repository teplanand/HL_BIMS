import React, { useState } from "react";
import { Box } from "@mui/material";
import { GridColDef, GridPaginationModel, GridSortModel, GridFilterModel } from "@mui/x-data-grid";
import { Page } from "../../../components/common/Page";
import ReusableDataGrid from "../../../components/common/ReusableDataGrid";
import { useModal } from "../../../hooks/useModal";
import { AddEditPallet, AddEditPalletRef } from "./addeditpallet";
import { openEntityFormModal } from "../shared/openEntityFormModal";

const DUMMY_PALLETS = [
    { id: "EA1-1", rack_id: "R1", rackName: "Rack 1", palletName: "Pallet A", capacity: 100, used: 45, pallets_count: 3 },
    { id: "EA1-2", rack_id: "R1", rackName: "Rack 1", palletName: "Pallet B", capacity: 100, used: 20, pallets_count: 1 },
    { id: "EA1-3", rack_id: "R1", rackName: "Rack 1", palletName: "Pallet C", capacity: 100, used: 80, pallets_count: 4 },
    { id: "EA2-1", rack_id: "R2", rackName: "Rack 2", palletName: "Pallet D", capacity: 100, used: 0, pallets_count: 0 },
    { id: "EA3-1", rack_id: "R3", rackName: "Rack 3", palletName: "Pallet E", capacity: 100, used: 100, pallets_count: 5 },
];

const PalletlistPage: React.FC = () => {
    const { openModal } = useModal();

    const handleAddPallet = () => {
        openEntityFormModal<AddEditPalletRef>({
            openModal,
            entityLabel: "Pallet",
            width: 500,
            FormComponent: AddEditPallet,
        });
    };

    const handleEditPallet = (row: any) => {
        openEntityFormModal<AddEditPalletRef>({
            openModal,
            entityLabel: "Pallet",
            width: 500,
            FormComponent: AddEditPallet,
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
        { field: "rackName", headerName: "Rack Name", flex: 1, minWidth: 160 },
        { field: "palletName", headerName: "Pallet Name", flex: 1, minWidth: 160 },
        { field: "capacity", headerName: "Capacity", flex: 1, minWidth: 120, type: 'number' },
        { field: "used", headerName: "Used", flex: 1, minWidth: 120, type: 'number' },
        { field: "pallets_count", headerName: "Items Count", flex: 1, minWidth: 120, type: 'number' },
    ];

    return (
        <Page module="Warehouse">
            <Box className="p-0">
                <ReusableDataGrid
                    rows={DUMMY_PALLETS}
                    columns={columns}
                    totalCount={DUMMY_PALLETS.length}
                    loading={false}
                    paginationModel={paginationModel}
                    setPaginationModel={setPaginationModel}
                    sortModel={sortModel}
                    setSortModel={setSortModel}
                    filterModel={filterModel}
                    setFilterModel={setFilterModel}
                    title="Pallet List"
                    permissions={{
                        create: true,
                        edit: true,
                        delete: true,
                        download: true,
                        view: true,
                    }}
                    onAdd={handleAddPallet}
                    onRowClick={handleEditPallet}

                />
            </Box>
        </Page>
    );
};

export default PalletlistPage;
