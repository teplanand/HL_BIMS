import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  DataGrid,
  GridCellParams,
  GridColDef,
  GridColumnVisibilityModel,
  GridFilterModel,
  GridPaginationModel,
  GridSortModel,
  GridRenderCellParams,
} from "@mui/x-data-grid";
import {
  Box,
  Card,
  Typography,
  Grid,
  Pagination,
  Tooltip,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  CardContent,
  Button,
} from "@mui/material";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import HeightIcon from '@mui/icons-material/Height';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DataGridToolbar from "./DataGridToolbar";
import Loader from "../Loader/loader";
import ActionButtonsEdit from "./ActionButtonsEdit";
import ActionButtonsDelete from "./ActionButtonsDelete";
// Assuming you might want a View button later, or reuse Edit for view if read-only
// import ActionButtonsView from "./ActionButtonsView";

// Define Permission Interface
export interface GridPermissions {
  create: boolean;
  edit: boolean;
  delete: boolean;
  view?: boolean;
  download: boolean;
}

export interface ReusableDataGridProps {
  // Data
  rows: any[];
  columns: GridColDef[];
  totalCount: number;
  loading: boolean;

  // Pagination & Sorting State (Controlled)
  paginationModel: GridPaginationModel;
  setPaginationModel: (model: GridPaginationModel) => void;
  sortModel: GridSortModel;
  setSortModel: (model: GridSortModel) => void;
  filterModel: GridFilterModel;
  setFilterModel: (model: GridFilterModel) => void;

  // Actions
  onAdd?: () => void;
  onEdit?: (row: any) => void;
  onDelete?: (row: any) => void;
  onView?: (row: any) => void;
  refetch?: () => void;
  onRowClick?: (row: any) => void;
  onCellClick?: (params: GridCellParams) => void;

  // Config
  title?: string;
  addButtonLabel?: string;
  uniqueIdField?: string;
  rowHeight?: number | "auto";
  compact?: boolean;

  // Permissions
  permissions?: GridPermissions;

  // Custom Controls
  headerControls?: React.ReactNode;

  // View Mode (Table / Grid)
  enableViewToggle?: boolean;
  defaultViewMode?: "table" | "grid";
  onViewModeChange?: (mode: "table" | "grid") => void;

  // Card View Rendering
  renderRowCard?: (row: any) => React.ReactNode;
  cardViewGridProps?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
  };
}

const ReusableDataGrid: React.FC<ReusableDataGridProps> = ({
  rows,
  columns,
  totalCount,
  loading,
  paginationModel,
  setPaginationModel,
  sortModel,
  setSortModel,
  filterModel,
  setFilterModel,
  onAdd,
  onEdit,
  onDelete,
  onView,
  refetch,
  onRowClick,
  onCellClick,
  title = "List",
  addButtonLabel = "Add New",
  uniqueIdField = "id",
  rowHeight = 40,
  compact = true,
  permissions = {
    create: true,
    edit: true,
    delete: true,
    view: true,

    download: true,
  },
  headerControls,
  enableViewToggle,
  defaultViewMode = "table",
  onViewModeChange,
  renderRowCard,
  cardViewGridProps,
}) => {
  const [viewMode, setViewMode] = useState<"table" | "grid">(defaultViewMode);
  const [columnVisibilityModel, setColumnVisibilityModel] =
    useState<GridColumnVisibilityModel>(() =>
      columns.reduce<GridColumnVisibilityModel>((acc, column) => {
        const hidden = (column as GridColDef & { hide?: boolean }).hide;
        if (hidden !== undefined) {
          acc[column.field] = !hidden;
        }
        return acc;
      }, {}),
    );
  const showViewToggle = enableViewToggle !== undefined ? enableViewToggle : Boolean(renderRowCard);

  useEffect(() => {
    setColumnVisibilityModel((current) => {
      let hasChanges = false;
      const nextModel = { ...current };

      columns.forEach((column) => {
        const hidden = (column as GridColDef & { hide?: boolean }).hide;
        if (hidden !== undefined && nextModel[column.field] === undefined) {
          nextModel[column.field] = !hidden;
          hasChanges = true;
        }
      });

      return hasChanges ? nextModel : current;
    });
  }, [columns]);

  const handleViewModeChange = useCallback(
    (_event: React.MouseEvent<HTMLElement>, newMode: "table" | "grid" | null) => {
      if (!newMode) return;
      setViewMode(newMode);
      onViewModeChange?.(newMode);
    },
    [onViewModeChange],
  );

  const effectiveHeaderControls = useMemo(() => {
    if (!showViewToggle && !headerControls) return undefined;

    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        {showViewToggle && (
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            size="small"
            onChange={handleViewModeChange}
            aria-label="view mode"
          >
            <ToggleButton value="table" aria-label="table view">
              <ViewListIcon fontSize="small" />
            </ToggleButton>
            <ToggleButton value="grid" aria-label="grid view">
              <ViewModuleIcon fontSize="small" />
            </ToggleButton>
          </ToggleButtonGroup>
        )}
        {headerControls}
      </Box>
    );
  }, [showViewToggle, viewMode, headerControls, handleViewModeChange]);

  const renderCardRow = useCallback(
    (row: any) => {
      try {
        if (renderRowCard) return renderRowCard(row);

        const displayColumns = columns
          .filter((col) => {
            const hidden = (col as GridColDef & { hide?: boolean }).hide;
            return col.field && col.field !== "actions" && !hidden;
          })
          .slice(0, 4);

        const getValue = (col: GridColDef) => {
          try {
            const rawValue = row[col.field];
            if (col.valueFormatter && typeof col.valueFormatter === "function") {
              return (col.valueFormatter as any)(rawValue, row, col, null);
            }
            return rawValue ?? "-";
          } catch {
            return "-";
          }
        };

        return (
          <Card
            sx={{
              borderRadius: "8px",
              boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
              height: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <CardContent sx={{ flexGrow: 1, pb: 1 }}>
              {displayColumns[0] && (
                <Typography variant="subtitle1" fontWeight={700} gutterBottom noWrap>
                  {getValue(displayColumns[0])}
                </Typography>
              )}
              {displayColumns[1] && (
                <Typography variant="body2" color="text.secondary" gutterBottom noWrap>
                  {getValue(displayColumns[1])}
                </Typography>
              )}
              <Box sx={{ mt: 1, display: "grid", gap: 0.5 }}>
                {displayColumns.slice(2).map((col) => (
                  <Box key={col.field} sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="caption" color="text.secondary">
                      {col.headerName || col.field}
                    </Typography>
                    <Typography variant="caption" fontWeight={500} sx={{ ml: 1 }}>
                      {getValue(col)}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>

            <Box sx={{ display: "flex", gap: 1, p: 1, justifyContent: "flex-end" }}>
              {onView && permissions.view && (
                <Tooltip title="View">
                  <IconButton size="small" onClick={() => onView(row)}>
                    <VisibilityIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              {onEdit && permissions.edit && (
                <ActionButtonsEdit
                  onEdit={() => onEdit(row)}
                  editTooltip="Edit"
                  size="small"
                />
              )}
              {onDelete && permissions.delete && (
                <ActionButtonsDelete
                  onDelete={() => onDelete(row)}
                  deleteTooltip="Delete"
                  size="small"
                />
              )}
            </Box>
          </Card>
        );
      } catch (error) {
        console.error("Error rendering card row:", error);
        return (
          <Card sx={{ borderRadius: "8px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
            <CardContent>
              <Typography color="error">Error rendering card</Typography>
            </CardContent>
          </Card>
        );
      }
    },
    [columns, onView, onEdit, onDelete, permissions, renderRowCard, uniqueIdField],
  );

  // Active filters for chips display
  const activeFilters = useMemo(() => {
    const filters: Array<{ field: string; value: string }> = [];

    // Quick filter
    if (
      filterModel.quickFilterValues &&
      filterModel.quickFilterValues.length > 0
    ) {
      filters.push({
        field: "Search",
        value: filterModel.quickFilterValues.join(" "),
      });
    }

    // Column filters
    filterModel.items.forEach((item) => {
      if (
        item.value !== undefined &&
        item.value !== null &&
        item.value !== ""
      ) {
        let displayValue = String(item.value);
        if (typeof item.value === "boolean") {
          displayValue = item.value ? "Active" : "Inactive";
        }
        filters.push({
          field: item.field,
          value: displayValue,
        });
      }
    });

    return filters;
  }, [filterModel]);

  const removeFilter = (filterType: string) => {
    if (filterType === "Search") {
      setFilterModel({ ...filterModel, quickFilterValues: [] });
    } else {
      setFilterModel({
        ...filterModel,
        items: filterModel.items.filter((item) => item.field !== filterType),
      });
    }
  };

  const clearAllFilters = () => {
    setFilterModel({ items: [], quickFilterValues: [] });
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / paginationModel.pageSize));

  const normalizedColumns = useMemo(
    () =>
      columns.map((column) => {
        if (column.field === "actions") {
          return column;
        }

        if (
          column.width !== undefined ||
          column.flex !== undefined
        ) {
          return {
            minWidth: column.minWidth ?? 90,
            ...column,
          };
        }

        return {
          minWidth: column.minWidth ?? 90,
          flex: 1,
          ...column,
        };
      }),
    [columns],
  );

  // Augment columns with Actions if needed
  const finalColumns = useMemo(() => {
    const cols = [...normalizedColumns];

    // Check if we need an actions column
    const hasEdit = !!onEdit && permissions.edit;
    const hasDelete = !!onDelete && permissions.delete;

    const hasView = !!onView && permissions.view;

    if (hasEdit || hasDelete || hasView) {
      cols.push({
        field: "actions",
        headerName: "Actions",
        flex: 1,
        minWidth: 120,
        sortable: false,
        filterable: false,
        align: "center",
        headerAlign: "center",
        renderCell: (params: GridRenderCellParams) => (
          <Box
            sx={{
              display: "flex",
              gap: 1,
              height: "100%",
              alignItems: "center",
              justifyContent: "center",

              width: "100%",
            }}
          >
            {hasView && (
              <Tooltip title="View">
                <IconButton size="small" onClick={() => onView && onView(params.row)}>
                  <VisibilityIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {hasEdit && (
              <ActionButtonsEdit
                onEdit={() => onEdit && onEdit(params.row)}
                editTooltip="Edit"
              />
            )}
            {hasDelete && (
              <ActionButtonsDelete
                onDelete={() => onDelete && onDelete(params.row)}
                deleteTooltip="Delete"
              />
            )}
          </Box>
        ),
      });
    }
    return cols;
  }, [normalizedColumns, onEdit, onDelete, onView, permissions]);

  const toolbarSlotProps = useMemo(
    () => ({
      title,
      refetch,
      onAdd: permissions.create ? onAdd : undefined,
      addButtonLabel,
      showExport: permissions.download,
      headerControls: effectiveHeaderControls,
      activeFilters,
      onRemoveFilter: removeFilter,
      onClearFilters: clearAllFilters,
    }),
    [
      title,
      refetch,
      permissions.create,
      permissions.download,
      onAdd,
      addButtonLabel,
      effectiveHeaderControls,
      activeFilters,
    ],
  );

  const sharedGridSx = {
    border: "1px solid",
    borderColor: "divider",
    borderRadius: "4px",
    backgroundColor: "background.paper",
    boxShadow: (theme: any) =>
      theme.palette.mode === "dark"
        ? "0 4px 6px -1px rgba(0,0,0,0.5)"
        : "0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px 0 rgba(0,0,0,0.06)",
    overflow: "hidden",
    "& .MuiDataGrid-main": {
      overflow: "hidden",
    },
    "& .MuiDataGrid-virtualScroller": {
      overflowY: "auto",
    },
    "& .MuiDataGrid-columnHeaders": {
      backgroundColor: "background.default",
      borderBottom: "0.5px solid",
      borderColor: "divider",
    },
    "& .MuiDataGrid-columnHeader": {
      padding: compact ? "8px 10px" : "12px 16px",
      minHeight: compact ? 42 : 48,
      "&:focus, &:focus-within": {
        outline: "none",
      },
    },
    "& .MuiDataGrid-columnHeaderTitle": {
      fontWeight: 700,
      fontSize: compact ? "0.8rem" : "0.875rem",
      color: "text.secondary",
      lineHeight: 1.3,
      overflow: "visible",
      textOverflow: "clip",
    },
    "& .MuiDataGrid-iconButtonContainer": {
      visibility: "visible",
      width: "auto",
    },
    "& .MuiDataGrid-sortIcon": {
      opacity: 0.3,
    },
    "& .MuiDataGrid-columnHeader--sorted .MuiDataGrid-sortIcon": {
      opacity: 1,
    },
    "& .MuiDataGrid-row": {
      cursor: "pointer",
      transition: "all 0.15s ease-in-out",
      borderBottom: "0.5px solid",
      borderColor: "divider",
      "&:hover": {
        backgroundColor: "action.hover",
      },
    },
    "& .MuiDataGrid-cell": {
      padding: compact ? "6px 10px" : "12px 16px",
      fontSize: compact ? "0.8rem" : "0.875rem",
      color: "text.primary",
      borderBottom: "none",
      display: "flex",
      alignItems: "center",
      "&:focus, &:focus-within": {
        outline: "none",
      },
    },
    "& .MuiDataGrid-filterForm": {
      display: "flex",
      gap: "12px",
      alignItems: "flex-end",
      padding: "10px 12px",
      flexWrap: "nowrap",
    },
    "& .MuiDataGrid-filterFormOperatorInput": {
      display: "none !important",
    },
    "& .MuiDataGrid-filterFormColumnInput": {
      flex: "0 0 auto",
      width: compact ? 140 : 160,
    },
    "& .MuiDataGrid-filterFormValueInput": {
      flex: "0 0 auto",
      width: compact ? 140 : 160,
    },
    "& .MuiDataGrid-virtualScroller::-webkit-scrollbar": {
      width: "8px",
      height: "8px",
    },
    "& .MuiDataGrid-virtualScroller::-webkit-scrollbar-track": {
      backgroundColor: "action.hover",
    },
    "& .MuiDataGrid-virtualScroller::-webkit-scrollbar-thumb": {
      backgroundColor: "action.selected",
      borderRadius: "4px",
    },
  };

  const renderSharedToolbar = () => (
    <Box sx={{ position: "relative", flexShrink: 0, height: compact ? 56 : 64, overflow: "hidden" }}>
      <DataGrid
        autoHeight
        rows={rows}
        columns={finalColumns}
        rowCount={totalCount}
        loading={loading}
        getRowId={(row) => row[uniqueIdField]}
        pagination
        paginationMode="server"
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        sortingMode="server"
        sortModel={sortModel}
        onSortModelChange={setSortModel}
        sortingOrder={["asc", "desc"]}
        density={compact ? "compact" : "standard"}
        filterMode="server"
        filterModel={filterModel}
        onFilterModelChange={setFilterModel}
        disableRowSelectionOnClick
        hideFooter
        showToolbar
        autosizeOnMount
        autosizeOptions={{
          includeHeaders: true,
          includeOutliers: true,
          expand: true,
        }}
        onRowClick={(params) => onRowClick?.(params.row)}
        onCellClick={(params) => onCellClick?.(params)}

        columnVisibilityModel={columnVisibilityModel}
        onColumnVisibilityModelChange={setColumnVisibilityModel}
        slots={{
          toolbar: DataGridToolbar,
          loadingOverlay: Loader,
          columnUnsortedIcon: HeightIcon as any,
          columnSortedAscendingIcon: ArrowUpwardIcon as any,
          columnSortedDescendingIcon: ArrowDownwardIcon as any,
        }}
        slotProps={{
          toolbar: toolbarSlotProps,
          filterPanel: {
            filterFormProps: {
              operatorInputProps: { sx: { display: "none" } },
              columnInputProps: { sx: { width: compact ? 140 : 160 } },
              valueInputProps: { sx: { width: compact ? 140 : 160 } },
            },
          },
        }}
        sx={{
          ...sharedGridSx,
          position: "absolute",
          inset: 0,
          borderBottom: "none",
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          minHeight: "0 !important",
          height: "auto !important",
          "--DataGrid-overlayHeight": "0px",
          "& .MuiDataGrid-main": {
            display: "none",
          },
          "& .MuiDataGrid-columnHeaders": {
            display: "none",
          },
          "& .MuiDataGrid-virtualScroller": {
            display: "none",
          },
          "& .MuiDataGrid-scrollbar": {
            display: "none",
          },
        }}
      />
    </Box>
  );

  return (
    <Card
      sx={{
        borderRadius: "4px",
        border: "none",
        boxShadow: "0px 6px 24px rgba(0, 0, 0, 0.06)",
        height: "calc(100vh - 240px)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {loading && <Loader />}
      {renderSharedToolbar()}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
          position: "relative",
          display: "flex",
          flexDirection: "column",

          px: 1,
        }}
      >
        <DataGrid
          rows={rows}
          columns={finalColumns}
          rowCount={totalCount}
          loading={loading}
          getRowId={(row) => row[uniqueIdField]}
          pagination
          paginationMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          sortingMode="server"
          sortModel={sortModel}
          onSortModelChange={setSortModel}
          sortingOrder={["asc", "desc"]}
          filterMode="server"
          filterModel={filterModel}
          onFilterModelChange={setFilterModel}
          disableRowSelectionOnClick
          hideFooter
          density={compact ? "compact" : "standard"}
          getRowHeight={() => rowHeight}
          columnHeaderHeight={50}
          autosizeOnMount
          autosizeOptions={{
            includeHeaders: true,
            includeOutliers: true,
            expand: true,
          }}
          columnVisibilityModel={columnVisibilityModel}
          onColumnVisibilityModelChange={setColumnVisibilityModel}
          slots={{
            loadingOverlay: Loader,
            columnUnsortedIcon: HeightIcon as any,
            columnSortedAscendingIcon: ArrowUpwardIcon as any,
            columnSortedDescendingIcon: ArrowDownwardIcon as any,
          }}
          onRowClick={(params) => onRowClick?.(params.row)}
          onCellClick={(params) => onCellClick?.(params)}
          slotProps={{
            filterPanel: {
              filterFormProps: {
                operatorInputProps: { sx: { display: "none" } },
                columnInputProps: { sx: { width: compact ? 140 : 160 } },
                valueInputProps: { sx: { width: compact ? 140 : 160 } },
              },
            },
          }}
          sx={{
            ...sharedGridSx,
            flex: 1,
            minHeight: 0,
            height: "100%",
            border: "none",
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
            "& .MuiDataGrid-columnHeaders": {
              position: "sticky",
              top: 0,
              zIndex: 3,
              backgroundColor: "background.default",
            },
            "& .MuiDataGrid-virtualScroller": {
              overflowY: "auto !important",
              overflowX: "auto",
            },
          }}
        />

        <Box
          sx={{
            position: "absolute",
            inset: 0,
            zIndex: 2,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            background: (theme) =>
              `linear-gradient(180deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
            opacity: viewMode === "grid" ? 1 : 0,
            visibility: viewMode === "grid" ? "visible" : "hidden",
            pointerEvents: viewMode === "grid" ? "auto" : "none",
            transform: viewMode === "grid" ? "translateY(0)" : "translateY(18px)",
            transition: "opacity 220ms ease, transform 220ms ease, visibility 220ms ease",
          }}
        >
          <Box sx={{ flex: 1, overflow: "auto", p: 1.25 }}>
            {rows.length === 0 ? (
              <Typography color="text.secondary" align="center" sx={{ mt: 4 }}>
                No records found
              </Typography>
            ) : (
              <Grid container spacing={1.25}>
                {rows.map((row) => {
                  try {
                    if (renderRowCard) {
                      return (
                        <React.Fragment key={row[uniqueIdField] || Math.random()}>
                          {renderRowCard(row)}
                        </React.Fragment>
                      );
                    }

                    return (
                      <Grid
                        key={row[uniqueIdField] || Math.random()}
                        size={{
                          xs: cardViewGridProps?.xs ?? 12,
                          sm: cardViewGridProps?.sm ?? 6,
                          md: cardViewGridProps?.md ?? 4,
                          lg: cardViewGridProps?.lg ?? 3,
                        }}
                      >
                        {renderCardRow(row)}
                      </Grid>
                    );
                  } catch (error) {
                    console.error("Error rendering row:", row, error);
                    return null;
                  }
                })}
              </Grid>
            )}
          </Box>
        </Box>


      </Box>
      <Box
        sx={{
          px: compact ? 1.5 : 2,
          py: compact ? 1 : 1.5,
          borderTop: "1px solid",
          borderColor: "divider",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <Typography variant="body2" color="text.secondary">
          {totalCount === 0
            ? "0 records"
            : `${paginationModel.page * paginationModel.pageSize + 1}-${Math.min(
              totalCount,
              (paginationModel.page + 1) * paginationModel.pageSize,
            )} of ${totalCount}`}
        </Typography>
        <Pagination
          count={totalPages}
          page={paginationModel.page + 1}
          onChange={(_, page) =>
            setPaginationModel({ ...paginationModel, page: page - 1 })
          }
          color="primary"
          showFirstButton
          showLastButton
          size="small"
        />
      </Box>
    </Card>
  );
};

export default ReusableDataGrid;
















