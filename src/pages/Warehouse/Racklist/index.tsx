import React, { useState } from "react";
import { Box } from "@mui/material";
import { GridColDef, GridPaginationModel, GridSortModel, GridFilterModel } from "@mui/x-data-grid";
import { Page } from "../../../components/common/Page";
import ReusableDataGrid from "../../../components/common/ReusableDataGrid";
import { useModal } from "../../../hooks/useModal";
import { AddEditRack, AddEditRackRef } from "./addeditrack";
import { openEntityFormModal } from "../shared/openEntityFormModal";

const DUMMY_RACKS = [
    { id: "R1", name: "Rack 1", section_id: "WH1-SEC-A", zoneName: "A - Electronics", shelves_count: 12 },
    { id: "R2", name: "Rack 2", section_id: "WH1-SEC-A", zoneName: "A - Electronics", shelves_count: 12 },
    { id: "R3", name: "Rack 3", section_id: "WH1-SEC-B", zoneName: "B - Appliances", shelves_count: 12 },
    { id: "R4", name: "Rack 4", section_id: "WH1-SEC-C", zoneName: "C - Home Decor", shelves_count: 12 },
    { id: "R5", name: "Rack 5", section_id: "WH1-SEC-D", zoneName: "D - Sports", shelves_count: 12 },
];

const RacklistPage: React.FC = () => {
    const { openModal } = useModal();

    const handleAddRack = () => {
        openEntityFormModal<AddEditRackRef>({
            openModal,
            entityLabel: "Rack",
            width: 500,
            FormComponent: AddEditRack,
        });
    };

    const handleEditRack = (row: any) => {
        openEntityFormModal<AddEditRackRef>({
            openModal,
            entityLabel: "Rack",
            width: 500,
            FormComponent: AddEditRack,
            defaultValues: row,
        });
    };

    const handleDeleteRack = (row: any) => {
        console.log("Delete Rack:", row);
    };

    const handleViewRack = (row: any) => {
        openEntityFormModal<AddEditRackRef>({
            openModal,
            entityLabel: "Rack",
            width: 500,
            FormComponent: AddEditRack,
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
        { field: "name", headerName: "Name", flex: 1, minWidth: 200 },
        { field: "zoneName", headerName: "Zone Name", flex: 1, minWidth: 180 },
        { field: "shelves_count", headerName: "Pallet Count", flex: 1, minWidth: 150, type: 'number' },
    ];

    return (
        <Page module="Warehouse">
            <Box className="p-0">
                <ReusableDataGrid
                    rows={DUMMY_RACKS}
                    columns={columns}
                    totalCount={DUMMY_RACKS.length}
                    loading={false}
                    paginationModel={paginationModel}
                    setPaginationModel={setPaginationModel}
                    sortModel={sortModel}
                    setSortModel={setSortModel}
                    filterModel={filterModel}
                    setFilterModel={setFilterModel}
                    title="Rack List"
                    permissions={{
                        create: true,
                        edit: true,
                        delete: true,
                        download: true,
                        view: true,
                    }}
                    onAdd={handleAddRack}
                    onRowClick={handleEditRack}

                />
            </Box>
        </Page>
    );
};

export default RacklistPage;
