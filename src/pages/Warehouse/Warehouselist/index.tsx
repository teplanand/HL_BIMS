import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Chip } from "@mui/material";
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
import { useToast } from "../../../hooks/useToast";
import {
    useCreateWarehouseMutation,
    useDeleteWarehouseMutation,
    useListWarehousesQuery,
    useUpdateWarehouseMutation,
} from "../../../redux/api/warehouse";
import { useAppSelector } from "../../../redux/hooks";
import {
    AddEditWarehouse,
    AddEditWarehouseRef,
    type WarehouseSubmitPayload,
} from "./addeditwarehouse";
import { openEntityFormModal } from "../shared/openEntityFormModal";

const DEFAULT_ORG_ID = "";

const toWarehouseCode = (value: string) => {
    const cleaned = value
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

    return cleaned ? `WH-${cleaned}` : "WH-001";
};

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
    const { showToast } = useToast();
    const authUserId = useAppSelector((state) => state.auth.id);
    const [createWarehouse, { isLoading: isCreating }] = useCreateWarehouseMutation();
    const [updateWarehouse, { isLoading: isUpdating }] = useUpdateWarehouseMutation();
    const [deleteWarehouse, { isLoading: isDeleting }] = useDeleteWarehouseMutation();

    const handleSubmitWarehouse = useCallback(async (payload: WarehouseSubmitPayload) => {
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
            } else {
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
            }
        } catch (error: any) {
            showToast(
                error?.data?.message || error?.message || "Failed to save warehouse",
                "error"
            );
            throw error;
        }
    }, [authUserId, createWarehouse, showToast, updateWarehouse]);

    const handleDeleteWarehouse = useCallback(async (id: string | number) => {
        try {
            await deleteWarehouse(id).unwrap();
        } catch (error: any) {
            showToast(
                error?.data?.message || error?.message || "Failed to delete warehouse",
                "error"
            );
            throw error;
        }
    }, [deleteWarehouse, showToast]);

    const handleAddWarehouse = () => {
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
    };

    const handleEditWarehouse = (row: any) => {
        openEntityFormModal<AddEditWarehouseRef>({
            openModal,
            entityLabel: "Warehouse",
            width: 720,
            FormComponent: AddEditWarehouse,
            defaultValues: row,
            extraProps: {
                onSubmitWarehouse: handleSubmitWarehouse,
                onDeleteWarehouse: handleDeleteWarehouse,
            },
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
        error,
        isLoading,
        isFetching,
        refetch,
    } = useListWarehousesQuery(apiParams);

    const rows = useMemo(
        () =>
            extractWarehouseRows(data).map((warehouse: any, index: number) => ({
                ...warehouse,
                id: warehouse.id ?? warehouse.warehouse_id ?? warehouse.wh_id ?? index + 1,
                orgId: warehouse.orgId ?? warehouse.org_id ?? DEFAULT_ORG_ID,
                warehouseCode:
                    warehouse.warehouseCode ??
                    warehouse.warehouse_code ??
                    toWarehouseCode(
                        warehouse.name ??
                        warehouse.warehouse_name ??
                        warehouse.warehouseName ??
                        ""
                    ),
                name:
                    warehouse.name ??
                    warehouse.warehouse_name ??
                    warehouse.warehouseName ??
                    "",
                warehouseName:
                    warehouse.warehouseName ??
                    warehouse.warehouse_name ??
                    warehouse.name ??
                    "",
                managerName:
                    warehouse.managerName ??
                    warehouse.manager_name ??
                    "",
                contactNumber:
                    warehouse.contactNumber ??
                    warehouse.contact_number ??
                    "",
                email:
                    warehouse.email ??
                    "",
                location:
                    warehouse.location ??
                    warehouse.city ??
                    warehouse.address ??
                    "",
                address:
                    warehouse.address ??
                    "",
                storageCapacity: Number(
                    warehouse.storageCapacity ??
                    warehouse.storage_capacity ??
                    0
                ),
                notes:
                    warehouse.notes ??
                    "",
                status: warehouse.status ?? (warehouse.is_active === false ? "INACTIVE" : "ACTIVE"),
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

    const loading = isLoading || isFetching || isCreating || isUpdating || isDeleting;

    useEffect(() => {
        if (!error) {
            return;
        }

        const message =
            (error as any)?.data?.message ||
            (error as any)?.message ||
            "Failed to fetch warehouses";

        showToast(message, "error");
    }, [error, showToast]);

    const columns: GridColDef[] = useMemo(
        () => [
            { field: "warehouseCode", headerName: "Code", flex: 0.9, minWidth: 140 },
            { field: "name", headerName: "Name", flex: 1, minWidth: 200 },
            { field: "location", headerName: "Location", flex: 1, minWidth: 150 },
            {
                field: "status",
                headerName: "Status",
                flex: 0.8,
                minWidth: 140,
                renderCell: (params) => {
                    const isActive = params.value === "ACTIVE";

                    return (
                        <Chip
                            label={isActive ? "Active" : "Inactive"}
                            size="small"
                            sx={{
                                fontWeight: 700,
                                color: isActive ? "#166534" : "#991B1B",
                                bgcolor: isActive ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
                                borderRadius: "999px",
                            }}
                        />
                    );
                },
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
                    loading={loading}
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
