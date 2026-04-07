import React from "react";
import {
  Box,
  Typography,
  IconButton,
  Divider,
  Chip,
  Button,
  Menu,
  MenuItem,
  TextField,
  InputAdornment,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  GridToolbarContainer,
  ColumnsPanelTrigger,
  FilterPanelTrigger,
  ExportPrint,
  ExportCsv,
  QuickFilter,
  QuickFilterControl,
  QuickFilterClear,
  GridToolbarProps,
} from "@mui/x-data-grid";
import Tooltip from "@mui/material/Tooltip";
import Badge from "@mui/material/Badge";
import ViewColumnIcon from "@mui/icons-material/ViewColumn";
import FilterListIcon from "@mui/icons-material/FilterList";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import AddIcon from "@mui/icons-material/Add";
import CancelIcon from "@mui/icons-material/Cancel";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { styled } from "@mui/material/styles";

// Module augmentation to allow custom props in slotProps.toolbar
declare module "@mui/x-data-grid" {
  interface ToolbarPropsOverrides {
    title?: string;
    onAdd?: () => void;
    addButtonLabel?: string;
    refetch?: () => void;
    showExport?: boolean;
    headerControls?: React.ReactNode;
    activeFilters?: Array<{ field: string; value: string }>;
    onRemoveFilter?: (field: string) => void;
    onClearFilters?: () => void;
    isGridView?: boolean;
  }
}

const StyledQuickFilter = styled(QuickFilter)({
  display: "flex",
  alignItems: "center",
});

const StyledTextField = styled(TextField)(({ theme }) => ({
  overflowX: "clip",
  width: 260,
  [theme.breakpoints.down("sm")]: {
    width: "100%",
  },
}));

export interface DataGridToolbarProps extends GridToolbarProps {
  title?: string;
  onAdd?: () => void;
  addButtonLabel?: string;
  refetch?: () => void;
  showExport?: boolean;
  headerControls?: React.ReactNode;
  activeFilters?: Array<{ field: string; value: string }>;
  onRemoveFilter?: (field: string) => void;
  onClearFilters?: () => void;
  isGridView?: boolean;
}

const DataGridToolbar: React.FC<DataGridToolbarProps> = ({
  title,
  onAdd,
  addButtonLabel = "Add New",
  refetch,
  showExport = true,
  headerControls,
  activeFilters = [],
  onRemoveFilter,
  onClearFilters,
  isGridView = false,
  ...other
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [exportMenuPosition, setExportMenuPosition] = React.useState<null | { top: number; left: number }>(null);
  const isExportMenuOpen = Boolean(exportMenuPosition);

  // Mobile "More" menu state
  const [mobileMenuAnchor, setMobileMenuAnchor] =
    React.useState<null | HTMLElement>(null);
  const isMobileMenuOpen = Boolean(mobileMenuAnchor);

  const handleMobileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMobileMenuAnchor(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuAnchor(null);
  };

  const hasActiveFilters = activeFilters.length > 0;

  const ToolbarContent = () => (
    <>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          minWidth: 0,
          flex: 1,
          mr: 2,
          overflow: "hidden",
        }}
      >
        <Typography
          variant="h6"
          component="h1"
          fontWeight="700"
          sx={{ letterSpacing: "-0.02em", color: "text.primary", flexShrink: 0 }}
        >
          {title || "List"}
        </Typography>

        {hasActiveFilters && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.75,
              minWidth: 0,
              overflowX: "auto",
              overflowY: "hidden",
              whiteSpace: "nowrap",
              pr: 0.5,
              "&::-webkit-scrollbar": {
                height: 4,
              },
            }}
          >
            {activeFilters.map((filter) => (
              <Chip
                key={`${filter.field}-${filter.value}`}
                label={`${filter.field}: ${filter.value}`}
                onDelete={() => onRemoveFilter?.(filter.field)}
                size="small"
              />
            ))}
            <Button
              size="small"
              onClick={onClearFilters}
              sx={{ flexShrink: 0, whiteSpace: "nowrap" }}
            >
              Clear filters
            </Button>
          </Box>
        )}
      </Box>

      {/* Right Side Controls */}
      <Box
        sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 1 }}
      >
        {/* Custom Header Controls */}
        {headerControls && (
          <Box sx={{ mr: 1 }}>{headerControls}</Box>
        )}

        {/* Search - Default Open */}
        <StyledQuickFilter defaultExpanded>
          <QuickFilterControl
            render={({ ref, ...controlProps }, state) => (
              <StyledTextField
                {...controlProps}
                inputRef={ref}
                aria-label="Search"
                placeholder="Search..."
                size="small"
                sx={{ minWidth: { xs: 180, sm: 240 } }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <QuickFilterClear
                          edge="end"
                          size="small"
                          aria-label="Clear search"
                          material={{
                            sx: {
                              marginRight: -0.75,
                              opacity: state.value ? 1 : 0.35,
                            },
                          }}
                        >
                          <CancelIcon fontSize="small" />
                        </QuickFilterClear>
                      </InputAdornment>
                    ),
                    ...controlProps.slotProps?.input,
                  },
                  ...controlProps.slotProps,
                }}
              />
            )}
          />
        </StyledQuickFilter>

        {/* MOBILE VIEW: Add Button -> Menu */}
        {isMobile && (
          <>
            {onAdd && (
              <Tooltip title="Add New">
                <IconButton
                  onClick={onAdd}
                  size="small"
                  sx={{
                    bgcolor: "primary.main",
                    color: "white",
                    "&:hover": {
                      bgcolor: "primary.dark",
                    },
                    width: 32,
                    height: 32,
                  }}
                >
                  <AddIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <IconButton onClick={handleMobileMenuOpen} size="small">
              <MoreVertIcon />
            </IconButton>
            <Menu
              anchorEl={mobileMenuAnchor}
              open={isMobileMenuOpen}
              onClose={handleMobileMenuClose}
              PaperProps={{
                sx: { width: 200 },
              }}
            >
              <MenuItem>
                <ColumnsPanelTrigger
                  render={
                    <Box
                      sx={{
                        display: "flex",
                        width: "100%",
                        alignItems: "center",
                      }}
                    >
                      <ViewColumnIcon fontSize="small" sx={{ mr: 2 }} /> Columns
                    </Box>
                  }
                />
              </MenuItem>
              <MenuItem>
                <FilterPanelTrigger
                  render={(props, state) => (
                    <Box
                      {...props}
                      sx={{
                        display: "flex",
                        width: "100%",
                        alignItems: "center",
                      }}
                    >
                      <Badge
                        badgeContent={state.filterCount}
                        color="primary"
                        variant="dot"
                        sx={{ mr: 2 }}
                      >
                        <FilterListIcon fontSize="small" />
                      </Badge>
                      Filters
                    </Box>
                  )}
                />
              </MenuItem>

              {refetch && (
                <MenuItem
                  onClick={() => {
                    refetch();
                    handleMobileMenuClose();
                  }}
                >
                  <RefreshIcon fontSize="small" sx={{ mr: 2 }} /> Refresh
                </MenuItem>
              )}

              {showExport && (
                <MenuItem
                  onClick={() => {
                    handleMobileMenuClose();
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      width: "100%",
                    }}
                  >
                    <FileDownloadIcon fontSize="small" sx={{ mr: 2 }} /> Export
                  </Box>
                </MenuItem>
              )}
            </Menu>
          </>
        )}

        {/* DESKTOP VIEW: Divider -> Actions Box -> Add Button */}
        {!isMobile && (
          <>
            <Divider
              orientation="vertical"
              flexItem
              variant="middle"
              sx={{ height: 24, alignSelf: "center", mx: 0.5 }}
            />
            <Box
              sx={{
                display: "flex",
                bgcolor: "action.hover",
                borderRadius: "4px",
                p: 0.5,
              }}
            >
              <Tooltip title="Columns">
                <ColumnsPanelTrigger
                  render={
                    <IconButton size="small">
                      <ViewColumnIcon fontSize="small" />
                    </IconButton>
                  }
                />
              </Tooltip>
              <Tooltip title="Filters">
                <FilterPanelTrigger
                  render={(props, state) => (
                    <IconButton
                      {...props}
                      size="small"
                      color={state.filterCount > 0 ? "primary" : "default"}
                    >
                      <Badge
                        badgeContent={state.filterCount}
                        color="primary"
                        variant="dot"
                      >
                        <FilterListIcon fontSize="small" />
                      </Badge>
                    </IconButton>
                  )}
                />
              </Tooltip>
              {/* Export */}
              {showExport && (
                <>
                  <Tooltip title="Export">
                    <IconButton
                      onClick={(event) => {
                        const rect = event.currentTarget.getBoundingClientRect();
                        setExportMenuPosition({
                          top: rect.bottom + 4,
                          left: rect.left,
                        });
                      }}
                      size="small"
                    >
                      <FileDownloadIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Menu
                    anchorReference="anchorPosition"
                    anchorPosition={exportMenuPosition ?? undefined}
                    open={isExportMenuOpen}
                    onClose={() => setExportMenuPosition(null)}
                  >
                    <ExportPrint
                      render={<MenuItem />}
                      onClick={() => setExportMenuPosition(null)}
                    >
                      Print
                    </ExportPrint>
                    <ExportCsv
                      render={<MenuItem />}
                      options={{
                        fileName: title ? title.replace(/\s+/g, "_") : "data", //  module name
                      }}
                      onClick={() => setExportMenuPosition(null)}
                    >
                      Download CSV
                    </ExportCsv>
                  </Menu>
                </>
              )}
              {/* Refresh */}
              {refetch && (
                <Tooltip title="Refresh">
                  <IconButton onClick={refetch} size="small">
                    <RefreshIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>

            {/* DESKTOP ADD BUTTON: At the end */}
            {onAdd && (
              <Tooltip title="Add New">
                <IconButton
                  onClick={onAdd}
                  size="small"
                  sx={{
                    ml: 1,
                    bgcolor: "primary.main",
                    color: "white",
                    "&:hover": {
                      bgcolor: "primary.dark",
                    },
                    width: 36,
                    height: 36,
                  }}
                >
                  <AddIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </>
        )}
      </Box>
    </>
  );

  if (isGridView) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "row", // Always row
          alignItems: "center",
          justifyContent: "space-between",
          height: "auto",
          minHeight: 64, // Standard height
          px: { xs: 1, sm: 2 },
          py: { xs: 1, sm: 1 },
          width: "100%",
          borderBottom: "1px solid",
          borderColor: "divider",
          gap: 1,
        }}
      >
        <ToolbarContent />
      </Box>
    );
  }

  return (
    <GridToolbarContainer
      {...other}
      sx={{
        display: "flex",
        flexDirection: "row", // Always row
        alignItems: "center",
        justifyContent: "space-between",
        height: "auto",
        minHeight: 64, // Standard height
        px: { xs: 1, sm: 2 },
        py: { xs: 1, sm: 1 },
        width: "100%",
        borderBottom: "1px solid",
        borderColor: "divider",
        gap: 1,
      }}
    >
      <ToolbarContent />
    </GridToolbarContainer>
  );
};

export default DataGridToolbar;
