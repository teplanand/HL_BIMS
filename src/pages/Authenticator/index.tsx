import React from "react";
import {
  Alert,
  alpha,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import ApartmentRoundedIcon from "@mui/icons-material/ApartmentRounded";
import DomainRoundedIcon from "@mui/icons-material/DomainRounded";
import PendingActionsRoundedIcon from "@mui/icons-material/PendingActionsRounded";
import type {
  GridColDef,
  GridFilterModel,
  GridPaginationModel,
  GridSortModel,
} from "@mui/x-data-grid";
import ReusableDataGrid from "../../components/common/ReusableDataGrid";
import {
  useGetAuthenticatorDivisionsQuery,
  useGetAuthenticatorOrganizationsQuery,
  useGetAuthenticatorUsersQuery,
} from "../../redux/api/authenticator";
import { useAuthenticatorSession } from "./useAuthenticatorSession";

const cardSurface = {
  borderRadius: 2,
  border: "1px solid",
  borderColor: "divider",
  
};

const EmptyState = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <Box
    sx={{
      borderRadius: 3,
      border: "1px dashed",
      borderColor: "divider",
      p: 3,
      textAlign: "center",
      bgcolor: alpha("#F8FAFC", 0.75),
    }}
  >
    <Typography fontWeight={800}>{title}</Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.8 }}>
      {subtitle}
    </Typography>
  </Box>
);

const AuthenticatorPage = () => {
  const [selectedOrgId, setSelectedOrgId] = React.useState("");
  const [selectedDivisionId, setSelectedDivisionId] = React.useState("");
  const { sessionReady, bootstrapping, autoLoginError } = useAuthenticatorSession();

  const [paginationModel, setPaginationModel] = React.useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });
  const [sortModel, setSortModel] = React.useState<GridSortModel>([
    { field: "name", sort: "asc" },
  ]);
  const [filterModel, setFilterModel] = React.useState<GridFilterModel>({
    items: [],
    quickFilterValues: [],
  });

  const {
    data: organizationsResponse,
    isLoading: isOrganizationsLoading,
    isFetching: isOrganizationsFetching,
    isError: isOrganizationsError,
  } = useGetAuthenticatorOrganizationsQuery(undefined, { skip: !sessionReady });
  const {
    data: divisionsResponse,
    isLoading: isDivisionsLoading,
    isFetching: isDivisionsFetching,
    isError: isDivisionsError,
  } = useGetAuthenticatorDivisionsQuery(selectedOrgId, {
    skip: !sessionReady || !selectedOrgId,
  });
  const {
    data: usersResponse,
    isLoading: isUsersLoading,
    isFetching: isUsersFetching,
    isError: isUsersError,
  } = useGetAuthenticatorUsersQuery(
    { orgId: selectedOrgId, divId: selectedDivisionId },
    { skip: !sessionReady || !selectedOrgId || !selectedDivisionId },
  );

  const organizations = React.useMemo(
    () => organizationsResponse?.data ?? [],
    [organizationsResponse?.data],
  );
  const divisions = React.useMemo(() => divisionsResponse?.data ?? [], [divisionsResponse?.data]);
  const scopedUsers = React.useMemo(() => usersResponse?.data ?? [], [usersResponse?.data]);

  React.useEffect(() => {
    setSelectedDivisionId("");
    setPaginationModel((current) => ({ ...current, page: 0 }));
  }, [selectedOrgId]);

  React.useEffect(() => {
    if (!selectedDivisionId) {
      return;
    }

    const hasSelectedDivision = divisions.some((division) => division.divId === selectedDivisionId);
    if (!hasSelectedDivision) {
      setSelectedDivisionId("");
    }
  }, [divisions, selectedDivisionId]);

  React.useEffect(() => {
    setPaginationModel((current) => ({ ...current, page: 0 }));
  }, [selectedDivisionId]);

  const selectedOrganization = React.useMemo(
    () => organizations.find((item) => item.orgId === selectedOrgId) ?? null,
    [organizations, selectedOrgId],
  );
  const selectedDivision = React.useMemo(
    () => divisions.find((item) => item.divId === selectedDivisionId) ?? null,
    [divisions, selectedDivisionId],
  );

  const userRows = React.useMemo(
    () =>
      scopedUsers.map((user, index) => ({
        id: user.userId || `${user.hrmsId}-${index}`,
        srNo: index + 1,
        name: user.name ?? "",
        hrmsId: user.hrmsId ?? "",
        userId: user.userId ?? "",
        organization: selectedOrganization?.orgTitle ?? "",
        division: selectedDivision?.divName ?? "",
      })),
    [scopedUsers, selectedDivision?.divName, selectedOrganization?.orgTitle],
  );

  const userColumns = React.useMemo<GridColDef[]>(
    () => [
      {
        field: "srNo",
        headerName: "No.",
        minWidth: 90,
        flex: 0.5,
      },
      {
        field: "name",
        headerName: "User Name",
        minWidth: 220,
        flex: 1.2,
      },
      {
        field: "hrmsId",
        headerName: "HRMS ID",
        minWidth: 160,
        flex: 0.9,
      },
      {
        field: "organization",
        headerName: "Organization",
        minWidth: 220,
        flex: 1.15,
      },
      {
        field: "division",
        headerName: "Division",
        minWidth: 180,
        flex: 0.95,
      },
    ],
    [],
  );

  const loadingUsers = isUsersLoading || isUsersFetching;
  const loadingOrganizations = isOrganizationsLoading || isOrganizationsFetching;
  const loadingDivisions = isDivisionsLoading || isDivisionsFetching;
  const gridTitle = selectedOrganization && selectedDivision
    ? `Eligible Users - ${selectedOrganization.orgTitle} / ${selectedDivision.divName}`
    : "Eligible Users";

  return (
    <Box sx={{ minHeight: "calc(100vh - 120px)", color: "text.primary", pb: 4 }}>
      {bootstrapping && <LinearProgress sx={{ mb: 2, borderRadius: 999 }} />}

      {autoLoginError && (
        <Alert severity="warning" sx={{ borderRadius: 3 }}>
          {autoLoginError}
        </Alert>
      )}

      {isOrganizationsError && (
        <Alert severity="warning" sx={{ mt: autoLoginError ? 2 : 0, borderRadius: 3 }}>
          Unable to load organizations.
        </Alert>
      )}

      <Box
        sx={{
          mb: 2,
          display: "grid",
          gridTemplateColumns: { xs: "1fr", xl: "0.9fr 1.1fr" },
          gap: 2,
        }}
      >
        <Card sx={cardSurface}>
          <CardContent sx={{ p: 3 }}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.5}
              justifyContent="space-between"
              sx={{ mb: 2.5 }}
            >
              <Box>
                <Typography variant="h6" fontWeight={800}>
                  Organization Selection
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.6 }}>
                  Default selection has been removed. Please select an organization manually.
                </Typography>
              </Box>
              <Button
               
                startIcon={<ApartmentRoundedIcon />}
                disabled
                sx={{ borderRadius: 999 }}
              >
                Add Organization
              </Button>
            </Stack>

            {loadingOrganizations && <LinearProgress sx={{ mb: 2 }} />}

            {organizations.length > 0 ? (
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                {organizations.map((organization) => (
                  <Chip
                    key={organization.orgId}
                    label={organization.orgTitle}
                    onClick={() => setSelectedOrgId(organization.orgId)}
                    color={selectedOrgId === organization.orgId ? "primary" : "default"}
                    variant={selectedOrgId === organization.orgId ? "filled" : "outlined"}
                  />
                ))}
              </Stack>
            ) : (
              !loadingOrganizations && (
                <EmptyState
                  title="No organizations found"
                  subtitle="Organization choices will appear here when the API returns data."
                />
              )
            )}
          </CardContent>
        </Card>

        <Card sx={cardSurface}>
          <CardContent sx={{ p: 3 }}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.5}
              justifyContent="space-between"
              sx={{ mb: 2.5 }}
            >
              <Box>
                <Typography variant="h6" fontWeight={800}>
                  Division Selection
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.6 }}>
                  Divisions will load only for the selected organization.
                </Typography>
              </Box>
              <Button
              
                startIcon={<DomainRoundedIcon />}
                disabled
                sx={{ borderRadius: 999 }}
              >
                Add Division
              </Button>
            </Stack>

            {!selectedOrgId ? (
              <EmptyState
                title="Select organization first"
                subtitle="Choose an organization first to load its divisions here."
              />
            ) : (
              <>
                {loadingDivisions && <LinearProgress sx={{ mb: 2 }} />}

                {isDivisionsError && (
                  <Alert severity="warning" sx={{ mb: 2, borderRadius: 3 }}>
                    Unable to load divisions.
                  </Alert>
                )}

                {divisions.length > 0 ? (
                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                    {divisions.map((division) => (
                      <Chip
                        key={division.divId}
                        label={division.divName}
                        onClick={() => setSelectedDivisionId(division.divId)}
                        color={selectedDivisionId === division.divId ? "primary" : "default"}
                        variant={selectedDivisionId === division.divId ? "filled" : "outlined"}
                      />
                    ))}
                  </Stack>
                ) : (
                  !loadingDivisions && (
                    <EmptyState
                      title="No divisions found"
                      subtitle="No division data is available for the selected organization."
                    />
                  )
                )}
              </>
            )}
          </CardContent>
        </Card>
      </Box>



      <ReusableDataGrid
              rows={userRows}
              columns={userColumns}
              totalCount={userRows.length}
              loading={loadingUsers}
              paginationModel={paginationModel}
              setPaginationModel={setPaginationModel}
              sortModel={sortModel}
              setSortModel={setSortModel}
              filterModel={filterModel}
              setFilterModel={setFilterModel}
              title={gridTitle}
              height={560}
              rowHeight={52}
              pageSizeOptions={[10, 25, 50]}
              searchableFields={["name", "hrmsId", "organization", "division"]}
              noRowsMessage="No users were found for the selected scope."
              showFilterButton
            />

       
    </Box>
  );
};

export default AuthenticatorPage;
