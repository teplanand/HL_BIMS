import React, { useCallback, useMemo, useState } from "react";
import { Box } from "@mui/material";
import {
    GridColDef,
    GridFilterItem,
    GridFilterModel,
    GridPaginationModel,
    GridSortModel,
} from "@mui/x-data-grid";
import { Page } from "../../../components/common/Page";
import ReusableDataGrid from "../../../components/common/ReusableDataGrid";
import { useModal } from "../../../hooks/useModal";
import { useListWarehousesQuery } from "../../../redux/api/warehouse";
import { AddEditWarehouse, AddEditWarehouseRef } from "./addeditwarehouse";
import { openEntityFormModal } from "../shared/openEntityFormModal";

const DEFAULT_WAREHOUSE_COLOR = "#FF8A3D";

const extractWarehouseRows = (response: any) => {
    if (Array.isArray(response)) {
        return response;
    }

    if (Array.isArray(response?.data)) {
        return response.data;
    }

    if (Array.isArray(response?.data?.data)) {
        return response.data.data;
    }

    if (Array.isArray(response?.rows)) {
        return response.rows;
    }

    if (Array.isArray(response?.data?.rows)) {
        return response.data.rows;
    }

    return [];
};

const extractTotalCount = (response: any, fallbackCount: number) =>
    response?.total ??
    response?.data?.total ??
    response?.count ??
    response?.data?.count ??
    fallbackCount;

const WarehouselistPage: React.FC = () => {
    const { openModal } = useModal();

    const handleAddWarehouse = () => {
        openEntityFormModal<AddEditWarehouseRef>({
            openModal,
            entityLabel: "Warehouse",
            width: 720,
            FormComponent: AddEditWarehouse,
        });
    };

    const handleEditWarehouse = (row: any) => {
        openEntityFormModal<AddEditWarehouseRef>({
            openModal,
            entityLabel: "Warehouse",
            width: 720,
            FormComponent: AddEditWarehouse,
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

    const buildApiParams = useCallback((currentFilterModel: GridFilterModel) => {
        const params: Record<string, unknown> = {};

        if (
            currentFilterModel.quickFilterValues &&
            currentFilterModel.quickFilterValues.length > 0
        ) {
            params.search = currentFilterModel.quickFilterValues.join(" ");
        }

        currentFilterModel.items.forEach((item: GridFilterItem) => {
            if (
                item.value === undefined ||
                item.value === null ||
                item.value === ""
            ) {
                return;
            }

            params[item.field] = item.value;
        });

        return params;
    }, []);

    const apiParams = useMemo(() => {
        const params = buildApiParams(filterModel);

        return {
            skip: paginationModel.page * paginationModel.pageSize,
            limit: paginationModel.pageSize,
            sort_by: sortModel.length > 0 ? String(sortModel[0].field) : "id",
            sort_order: sortModel.length > 0 ? sortModel[0].sort || "desc" : "desc",
            ...params,
        };
    }, [buildApiParams, filterModel, paginationModel, sortModel]);

    const {
        data,
        isLoading,
        isFetching,
        refetch,
    } = useListWarehousesQuery(apiParams);

    const rows = useMemo(
        () =>
            extractWarehouseRows(data).map((warehouse: any, index: number) => ({
                ...warehouse,
                id: warehouse.id ?? warehouse.warehouse_id ?? warehouse.wh_id ?? index + 1,
                name:
                    warehouse.name ??
                    warehouse.warehouse_name ??
                    warehouse.warehouseName ??
                    "",
                location: warehouse.location ?? warehouse.city ?? warehouse.address ?? "",
                color: warehouse.color ?? warehouse.colour ?? DEFAULT_WAREHOUSE_COLOR,
                sections_count: Number(
                    warehouse.sections_count ??
                    warehouse.section_count ??
                    warehouse.zones_count ??
                    warehouse.zone_count ??
                    warehouse.total_sections ??
                    warehouse.total_zones ??
                    0
                ),
            })),
        [data]
    );

    const totalCount = useMemo(() => extractTotalCount(data, rows.length), [data, rows.length]);

    const columns: GridColDef[] = useMemo(
        () => [
            { field: "name", headerName: "Name", flex: 1, minWidth: 200 },
            { field: "location", headerName: "Location", flex: 1, minWidth: 150 },
            {
                field: "color",
                headerName: "Color",
                flex: 0.8,
                minWidth: 120,
                renderCell: (params) => (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div
                            style={{
                                width: "16px",
                                height: "16px",
                                borderRadius: "4px",
                                backgroundColor: params.value || DEFAULT_WAREHOUSE_COLOR,
                            }}
                        />
                        {params.value || DEFAULT_WAREHOUSE_COLOR}
                    </div>
                ),
            },
            {
                field: "sections_count",
                headerName: "Zones Count",
                flex: 0.8,
                minWidth: 150,
                type: "number",
            },
        ],
        []
    );

    return (
        <Page module="Warehouse">
            <Box className="p-0">
                <ReusableDataGrid
                    rows={rows}
                    columns={columns}
                    totalCount={totalCount}
                    loading={isLoading || isFetching}
                    paginationModel={paginationModel}
                    setPaginationModel={setPaginationModel}
                    sortModel={sortModel}
                    setSortModel={setSortModel}
                    filterModel={filterModel}
                    setFilterModel={setFilterModel}
                    title="Warehouse List"
                    refetch={refetch}
                    permissions={{
                        create: true,
                        edit: true,
                        delete: true,
                        download: true,
                        view: true,
                    }}
                    onAdd={handleAddWarehouse}
                    onRowClick={handleEditWarehouse}

                />
            </Box>
        </Page>
    );
};

export default WarehouselistPage;
