import React from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Drawer,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import {
  useCreateAuthenticatorRoleMutation,
  useGetAuthenticatorDashboardAppsQuery,
  useGetAuthenticatorRolesByAppQuery,
} from "../../redux/api/authenticator";
import { useToast } from "../../hooks/useToast";
import { useAuthenticatorSession } from "./useAuthenticatorSession";

const DEFAULT_APP_ID = "57da4534-8269-455a-a741-98710709fa60";

const cardSurface = {
  borderRadius: 2,
  border: "1px solid",
  borderColor: "divider",
};

const AddAuthenticatorRolePage = () => {
  const { showToast } = useToast();
  const { sessionReady, bootstrapping, autoLoginError } = useAuthenticatorSession();
  const [selectedAppId, setSelectedAppId] = React.useState("");
  const [roleName, setRoleName] = React.useState("");
  const [roleDesc, setRoleDesc] = React.useState("");
  const [formError, setFormError] = React.useState("");
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const {
    data: appsResponse,
    isLoading: isAppsLoading,
    isFetching: isAppsFetching,
    isError: isAppsError,
  } = useGetAuthenticatorDashboardAppsQuery(undefined, { skip: !sessionReady });
  const {
    data: rolesResponse,
    isLoading: isRolesLoading,
    isFetching: isRolesFetching,
    isError: isRolesError,
  } = useGetAuthenticatorRolesByAppQuery(selectedAppId, {
    skip: !sessionReady || !selectedAppId,
  });
  const [createAuthenticatorRole, { isLoading: isSubmitting }] =
    useCreateAuthenticatorRoleMutation();

  const applications = React.useMemo(() => appsResponse?.data ?? [], [appsResponse?.data]);
  const roles = React.useMemo(() => rolesResponse?.data ?? [], [rolesResponse?.data]);

  React.useEffect(() => {
    if (applications.length === 0) {
      return;
    }

    const hasSelectedApp = applications.some((app) => app.appId === selectedAppId);
    if (hasSelectedApp) {
      return;
    }

    const matchedApp =
      applications.find((app) => app.appId === DEFAULT_APP_ID) ||
      applications.find((app) =>
        `${app.appTitle} ${app.appDesc}`.toLowerCase().includes("authenticator"),
      ) ||
      applications[0];

    if (matchedApp) {
      setSelectedAppId(matchedApp.appId);
    }
  }, [applications, selectedAppId]);

  const selectedApp = React.useMemo(
    () => applications.find((app) => app.appId === selectedAppId) ?? null,
    [applications, selectedAppId],
  );
  const relatedRolesHeading = selectedApp
    ? `${selectedApp.appTitle} Roles`
    : "Related Roles";

  const resetForm = React.useCallback(() => {
    setRoleName("");
    setRoleDesc("");
    setFormError("");
  }, []);

  const handleDrawerClose = React.useCallback(() => {
    setDrawerOpen(false);
    resetForm();
  }, [resetForm]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedRoleName = roleName.trim();
    const trimmedRoleDesc = roleDesc.trim();

    if (!selectedAppId) {
      setFormError("Please select an application.");
      return;
    }

    if (!trimmedRoleName) {
      setFormError("Role name is required.");
      return;
    }

    if (!trimmedRoleDesc) {
      setFormError("Role description is required.");
      return;
    }

    setFormError("");

    try {
      const response = await createAuthenticatorRole({
        appId: selectedAppId,
        roleName: trimmedRoleName,
        roleDesc: trimmedRoleDesc,
      }).unwrap();

      showToast(response?.message || "Role created successfully.", "success");
      handleDrawerClose();
    } catch (error: any) {
      const message = error?.data?.message || error?.message || "Failed to create role.";
      setFormError(message);
      showToast(message, "error");
    }
  };

  return (
    <Box sx={{ minHeight: "calc(100vh - 120px)", color: "text.primary", pb: 4 }}>
      {bootstrapping && <LinearProgress sx={{ mb: 2, borderRadius: 999 }} />}

      {autoLoginError && (
        <Alert severity="warning" sx={{ borderRadius: 3 }}>
          {autoLoginError}
        </Alert>
      )}

      {isAppsError && (
        <Alert severity="warning" sx={{ mt: autoLoginError ? 2 : 0, borderRadius: 3 }}>
          Unable to load applications.
        </Alert>
      )}

      <Card sx={{ ...cardSurface, mt: autoLoginError || isAppsError ? 2 : 0 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={800}>
            Selected Application
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.6 }}>
            Select an application to view its related roles and add a new role from the drawer.
          </Typography>

          {(isAppsLoading || isAppsFetching) && <LinearProgress sx={{ mt: 2, mb: 2 }} />}

          <Stack spacing={1.2} sx={{ mt: 2 }}>
            {applications.length > 0 ? (
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                {applications.map((app) => {
                  const isSelected = app.appId === selectedAppId;

                  return (
                    <Chip
                      key={app.appId}
                      label={app.appTitle}
                      onClick={() => setSelectedAppId(app.appId)}
                      color={isSelected ? "primary" : "default"}
                      variant={isSelected ? "filled" : "outlined"}
                      sx={{ fontWeight: 700 }}
                    />
                  );
                })}
              </Stack>
            ) : (
              !isAppsLoading &&
              !isAppsFetching && (
                <Alert severity="info">No applications were returned from the dashboard API.</Alert>
              )
            )}
          </Stack>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            justifyContent="space-between"
            alignItems={{ sm: "center" }}
            sx={{ mt: 4, mb: 2 }}
          >
            <Box>
              <Typography variant="h6" fontWeight={800}>
                {relatedRolesHeading}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.6 }}>
                The role list below is loaded for the selected application.
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddRoundedIcon />}
              onClick={() => setDrawerOpen(true)}
              disabled={!selectedAppId}
              sx={{ borderRadius: 999, px: 2.5 }}
            >
              Add Role
            </Button>
          </Stack>

          {(isRolesLoading || isRolesFetching) && <LinearProgress sx={{ mb: 2 }} />}

          {isRolesError && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Unable to load roles for the selected application.
            </Alert>
          )}

          {roles.length > 0 ? (
            <Stack spacing={1.2}>
              {roles.map((role) => (
                <Box
                  key={String(role.roleId)}
                  sx={{
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    p: 2,
                  }}
                >
                  <Typography fontWeight={700}>{role.roleName}</Typography>
                 
                </Box>
              ))}
            </Stack>
          ) : (
            !isRolesLoading &&
            !isRolesFetching && (
              <Alert severity="info">No roles found for the selected application.</Alert>
            )
          )}
        </CardContent>
      </Card>

      <Drawer anchor="right" open={drawerOpen} onClose={handleDrawerClose}>
        <Box sx={{ width: { xs: 360, sm: 420 }, p: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h6" fontWeight={800}>
              Add Role
            </Typography>
            <Chip label={selectedApp?.appTitle || "No app selected"} color="primary" />
          </Stack>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create a role for the selected application. The currently selected application stays prefilled here.
          </Typography>

          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <TextField
                label="Selected Application"
                value={selectedApp?.appTitle || ""}
                fullWidth
                InputProps={{ readOnly: true }}
              />

              <TextField
                label="Role Name"
                value={roleName}
                onChange={(event) => setRoleName(event.target.value)}
                fullWidth
                placeholder="Enter role name"
              />

              <TextField
                label="Role Description"
                value={roleDesc}
                onChange={(event) => setRoleDesc(event.target.value)}
                fullWidth
                multiline
                minRows={4}
                placeholder="Enter role description"
              />

              {formError && <Alert severity="warning">{formError}</Alert>}

              <Stack direction="row" spacing={1.2}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting || !sessionReady || !selectedAppId}
                  sx={{ borderRadius: 999, px: 3 }}
                >
                  {isSubmitting ? "Creating..." : "Create Role"}
                </Button>
                <Button variant="outlined" onClick={handleDrawerClose} sx={{ borderRadius: 999 }}>
                  Cancel
                </Button>
              </Stack>
            </Stack>
          </Box>
        </Box>
      </Drawer>
    </Box>
  );
};

export default AddAuthenticatorRolePage;
