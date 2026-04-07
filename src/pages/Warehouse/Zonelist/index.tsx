import React, { useState } from "react";
import { Box } from "@mui/material";
import { GridColDef, GridPaginationModel, GridSortModel, GridFilterModel } from "@mui/x-data-grid";
import { Page } from "../../../components/common/Page";
import ReusableDataGrid from "../../../components/common/ReusableDataGrid";
import { useModal } from "../../../hooks/useModal";
import { AddEditZone, AddEditZoneRef } from "./addeditzone";
import { openEntityFormModal } from "../shared/openEntityFormModal";

const DUMMY_ZONES = [
    { id: "WH1-SEC-A", warehouseName: "Warehouse 1", name: "A - Electronics", color: "#FF8A3D", rackCount: 5, shelfCount: 12, prefix: "EA" },
    { id: "WH1-SEC-B", warehouseName: "Warehouse 1", name: "B - Appliances", color: "#FFA726", rackCount: 5, shelfCount: 10, prefix: "AP" },
    { id: "WH1-SEC-C", warehouseName: "Warehouse 1", name: "C - Home Decor", color: "#4CAF50", rackCount: 5, shelfCount: 5, prefix: "HD" },
    { id: "WH1-SEC-D", warehouseName: "Warehouse 1", name: "D - Sports", color: "#F44336", rackCount: 5, shelfCount: 5, prefix: "SP" },
    { id: "WH2-SEC-1", warehouseName: "Warehouse 2", name: "Zone 1", color: "#FF8A3D", rackCount: 5, shelfCount: 5, prefix: "W2S1" },
];

const ZonelistPage: React.FC = () => {
    const { openModal } = useModal();

    const handleAddZone = () => {
        openEntityFormModal<AddEditZoneRef>({
            openModal,
            entityLabel: "Zone",
            width: 400,
            FormComponent: AddEditZone,
        });
    };

    const handleEditZone = (row: any) => {
        openEntityFormModal<AddEditZoneRef>({
            openModal,
            entityLabel: "Zone",
            width: 400,
            FormComponent: AddEditZone,
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
        { field: "warehouseName", headerName: "Warehouse Name", flex: 1.3, minWidth: 180 },
        { field: "name", headerName: "Name", flex: 1.5, minWidth: 200 },
        { field: "rackCount", headerName: "No. of Racks", flex: 1, minWidth: 120, type: 'number' },
        { field: "prefix", headerName: "Prefix", flex: 0.8, minWidth: 100 },
    ];

    return (
        <Page module="Warehouse">
            <Box className="p-0">
                <ReusableDataGrid
                    rows={DUMMY_ZONES}
                    columns={columns}
                    totalCount={DUMMY_ZONES.length}
                    loading={false}
                    paginationModel={paginationModel}
                    setPaginationModel={setPaginationModel}
                    sortModel={sortModel}
                    setSortModel={setSortModel}
                    filterModel={filterModel}
                    setFilterModel={setFilterModel}
                    title="Zone List"
                    permissions={{
                        create: true,
                        edit: true,
                        delete: true,
                        download: true,
                        view: true,
                    }}
                    onAdd={handleAddZone}
                    onRowClick={handleEditZone}

                />
            </Box>
        </Page>
    );
};

export default ZonelistPage;
