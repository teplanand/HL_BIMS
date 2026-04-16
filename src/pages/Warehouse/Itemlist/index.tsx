import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Box } from "@mui/material";
import { GridColDef, GridFilterModel, GridPaginationModel, GridSortModel } from "@mui/x-data-grid";
import { Page } from "../../../components/common/Page";
import ReusableDataGrid from "../../../components/common/ReusableDataGrid";
import { useModal } from "../../../hooks/useModal";
import { useToast } from "../../../hooks/useToast";
import {
    buildWarehouseItemFormData,
    useCreateWarehouseItemMutation,
    useDeleteWarehouseItemMutation,
    useListPalletsQuery,
    useListWarehouseItemsQuery,
    useUpdateWarehouseItemMutation,
} from "../../../redux/api/warehouse";
import { AddEditItem, AddEditItemRef, type ItemSubmitPayload } from "./addedititem";
import { openEntityFormModal } from "../shared/openEntityFormModal";
import { buildGridApiParams, extractApiRows, extractApiTotalCount } from "../shared/gridApiHelpers";

const toBoolean = (value: unknown) => value === true || value === 1 || value === "1" || value === "true";

const ItemlistPage: React.FC = () => {
    const { openModal } = useModal();
    const { showToast } = useToast();
    const [createItem, { isLoading: isCreating }] = useCreateWarehouseItemMutation();
    const [updateItem, { isLoading: isUpdating }] = useUpdateWarehouseItemMutation();
    const [deleteItem, { isLoading: isDeleting }] = useDeleteWarehouseItemMutation();

    const handleSubmitItem = useCallback(async (payload: ItemSubmitPayload) => {
        try {
            if (payload.id) {
                const { id, ...updatePayload } = payload;
                return await updateItem({
                    id,
                    body: buildWarehouseItemFormData(updatePayload),
                }).unwrap();
            } else {
                const { id, ...createPayload } = payload;
                return await createItem(
                    buildWarehouseItemFormData(createPayload, ["qty", "detail_qty", "file_name"])
                ).unwrap();
            }
        } catch (error: any) {
            showToast(error?.data?.message || error?.message || "Failed to save item", "error");
            throw error;
        }
    }, [createItem, showToast, updateItem]);

    const handleDeleteItem = useCallback(async (id: string | number) => {
        try {
            await deleteItem(id).unwrap();
        } catch (error: any) {
            showToast(error?.data?.message || error?.message || "Failed to delete item", "error");
            throw error;
        }
    }, [deleteItem, showToast]);

    const handleAddItem = () => {
        openEntityFormModal<AddEditItemRef>({
            openModal,
            entityLabel: "Item",
            width: 640,
            FormComponent: AddEditItem,
            extraProps: {
                onSubmitItem: handleSubmitItem,
                onDeleteItem: handleDeleteItem,
            },
        });
    };

    const handleEditItem = (row: any) => {
        openEntityFormModal<AddEditItemRef>({
            openModal,
            entityLabel: "Item",
            width: 640,
            FormComponent: AddEditItem,
            defaultValues: row,
            extraProps: {
                onSubmitItem: handleSubmitItem,
                onDeleteItem: handleDeleteItem,
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

    const apiParams = useMemo(
        () => buildGridApiParams({ paginationModel, sortModel, filterModel }),
        [filterModel, paginationModel, sortModel]
    );

    const { data, error, isLoading, isFetching, refetch } = useListWarehouseItemsQuery(apiParams);
    const { data: palletsData } = useListPalletsQuery();

    const palletMap = useMemo(() => {
        const entries = extractApiRows(palletsData).map((pallet: any) => [
            String(pallet.id),
            `Pallet ${pallet.id}`,
        ]);
        return new Map(entries);
    }, [palletsData]);

    const rows = useMemo(
        () =>
            extractApiRows(data).map((item: any, index: number) => ({
                ...item,
                id: item.id ?? index + 1,
                pallet_id: item.pallet_id,
                rack_id: item.rack_id ?? item.rackId ?? "",
                palletName: palletMap.get(String(item.pallet_id)) || `Pallet ${item.pallet_id ?? ""}`,
                sub_loc_id: item.sub_loc_id ?? "",
                oracle_code: item.oracle_code || "",
                qty: Number(item.qty ?? 0),
                has_expiry: toBoolean(item.has_expiry),
                expiry_date: item.expiry_date || item.exp_date || item.expiryDate || null,
                item_desc: item.item_desc || item.item_description || item.description || "",
                item_category: item.item_category || item.category || "",
                locator: item.locator || item.locator_code || item.loc_code || "",
                sub_inventory: item.sub_inventory || item.subInventory || "",
                in_qty: "",
                out_qty: "",
                item_image_document_id: item.item_image_document_id ?? item.document_id ?? null,
                item_image_name: item.item_image_name ?? item.file_name ?? null,
                item_image_path: item.item_image_path || item.image_path || item.path || null,
                qr_code: item.qr_code || null,
            })),
        [data, palletMap]
    );

    const totalCount = useMemo(() => extractApiTotalCount(data, rows.length), [data, rows.length]);
    const loading = isLoading || isFetching || isCreating || isUpdating || isDeleting;

    useEffect(() => {
        if (!error) {
            return;
        }

        showToast(
            (error as any)?.data?.message || (error as any)?.message || "Failed to fetch items",
            "error"
        );
    }, [error, showToast]);

    const columns: GridColDef[] = [
        { field: "palletName", headerName: "Pallet", flex: 1, minWidth: 150 },
        { field: "oracle_code", headerName: "Oracle Code", flex: 1.1, minWidth: 160 },
        { field: "sub_loc_id", headerName: "Sub Location ID", flex: 1, minWidth: 140 },
        { field: "qty", headerName: "Quantity", flex: 0.9, minWidth: 120, type: "number" },
        {
            field: "has_expiry",
            headerName: "Has Expiry",
            flex: 0.9,
            minWidth: 120,
            renderCell: (params) => (params.value ? "Yes" : "No"),
        },
        {
            field: "expiry_date",
            headerName: "Expiry Date",
            flex: 1,
            minWidth: 140,
            renderCell: (params) => params.row.expiry_date,
        },
    ];

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
                    title="Item List"
                    permissions={{
                        create: true,
                        edit: true,
                        delete: true,
                        download: true,
                        view: true,
                    }}
                    refetch={refetch}
                    onAdd={handleAddItem}
                    onRowClick={handleEditItem}
                />
            </Box>
        </Page>
    );
};

export default ItemlistPage;
