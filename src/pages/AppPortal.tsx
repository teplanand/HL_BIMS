import React, { useState, useMemo } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  IconButton,
  Grid,
  useTheme,
  Container,
  alpha,
  Tooltip,
} from "@mui/material";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";

// Icons
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import StoreIcon from "@mui/icons-material/Store";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import PeopleIcon from "@mui/icons-material/People";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import SettingsIcon from "@mui/icons-material/Settings";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import TimelineIcon from "@mui/icons-material/Timeline";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import PrecisionManufacturingIcon from "@mui/icons-material/PrecisionManufacturing";

// Components
import UserDropdown from "../components/header/UserDropdown";
import ThemeToggleButton from "../components/header/ThemeToggleButton";
import NotificationDropdown from "../components/header/NotificationDropdown";
import logo from "../assets/logo1.png"; // reusing existing logo
import AdvaceVoucher from "../assets/advace_voucher.png";
// Mock App Data
const INITIAL_APPS = [
  {
    id: 1,
    name: "Advance Voucher",
    icon: AdvaceVoucher,
    path: "/advance-voucher/dashboard", // Navigate to existing dashboard
    notifications: 0,
    hasAccess: true,
    color: "#F37440", // Primary Orange
  },
  
  {
    id: 2,
    name: "Purchase Order",
    icon: ShoppingCartIcon,
    path: "/purchase-order/dashboard",
    notifications: 0,
    hasAccess: true,
    color: "#3B82F6", // Blue
  },
  {
    id: 3,
    name: "Supplier Portal",
    icon: StoreIcon,
    path: "/supplier-portal/dashboard",
    notifications: 0,
    hasAccess: true,
    color: "#10B981", // Green
  },
  {
    id: 4,
    name: "Warehouse",
    icon: Inventory2Icon,
    path: "/Warehouse/dashboard",
    notifications: 0,
    hasAccess: true,
    color: "#8B5CF6", // Purple
  },
  {
    id: 5,
    name: "HR Management",
    icon: PeopleIcon,
    path: "/hr-management/dashboard",
    notifications: 0,
    hasAccess: true,
    color: "#EC4899", // Pink
  },
  {
    id: 6,
    name: "Finance",
    icon: AccountBalanceIcon,
    path: "/",
    notifications: 0,
    hasAccess: false, // No Access
    color: "#64748B", // Slate
  },
  {
    id: 7,
    name: "Settings",
    icon: SettingsIcon,
    path: "/",
    notifications: 0,
    hasAccess: false, // No Access
    color: "#64748B",
  },
  {
    id: 8,
    name: "Order Tracking",
    icon: TimelineIcon,
    path: "/order-tracking/dashboard", // Navigate to existing dashboard
    notifications: 0,
    hasAccess: true,
    color: "#0F766E",
  },
  {
    id: 9,
    name: "PBL Barcode",
    icon: QrCode2Icon,
    path: "/barcode/dashboard", // Navigate to existing dashboard
    notifications: 0,
    hasAccess: true,
    color: "#1D4ED8",
  },
  {
    id: 10,
    name: "Evidance Collection",
    icon: FactCheckIcon,
    path: "/evidance/client-dashboard",
    notifications: 0,
    hasAccess: true,
    color: "#7C3AED",
  },
  {
    id: 11,
    name: "Gearbox Monitoring",
    icon: PrecisionManufacturingIcon,
    path: "/monitoring/dashboard", // Navigate to existing dashboard
    notifications: 0,
    hasAccess: true,
    color: "#B45309",
  },
];

const AppPortal = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  // Favorites State (Persisted in localStorage ideally, plain state for now)
  const [favorites, setFavorites] = useState<number[]>([]);

  const toggleFavorite = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((fid) => fid !== id) : [...prev, id],
    );
  };

  // Sort Apps: Favorites first, then accessible, then others
  const sortedApps = useMemo(() => {
    return [...INITIAL_APPS].sort((a, b) => {
      const aFav = favorites.includes(a.id);
      const bFav = favorites.includes(b.id);
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;

      // Secondary sort: Access
      if (a.hasAccess && !b.hasAccess) return -1;
      if (!a.hasAccess && b.hasAccess) return 1;

      return 0; // Maintain original order otherwise
    });
  }, [favorites]);

  const handleAppClick = (app: (typeof INITIAL_APPS)[0]) => {
    if (!app.hasAccess) return;
    navigate(app.path);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        display: "flex",
        flexDirection: "column",
        transition: "background-color 0.3s ease",
      }}
    >
      {/* --- Header --- */}
      <Box
        sx={{
          height: 64,
          px: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          bgcolor: alpha(theme.palette.background.paper, 0.8),
          backdropFilter: "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 100,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <img src={logo} alt="Logo" className="h-8" />

        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <NotificationDropdown />
          <ThemeToggleButton />
          <UserDropdown />
        </Box>
      </Box>

      {/* --- Main Content --- */}
      <Container maxWidth="lg" sx={{ flex: 1, py: 6 }}>
        {/* Welcome Section */}
        <Box sx={{ mb: 6 }}>
          <Typography
            variant="h4"
            fontWeight={800}
            sx={{ mb: 1, letterSpacing: "-0.02em" }}
          >
            Welcome Back
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Select an application to launch. You have access to{" "}
            <Box component="span" fontWeight="bold" color="primary.main">
              5
            </Box>{" "}
            applications.
          </Typography>
        </Box>

        {/* Apps Grid */}
        <Grid container spacing={3}>
          <AnimatePresence>
            {sortedApps.map((app) => (
              <Grid
                size={{ xs: 6, sm: 6, md: 4, lg: 3 }}
                key={app.id}
                component={motion.div}
                layout
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <Card
                  onClick={() => handleAppClick(app)}
                  sx={{
                    height: "100%",
                    cursor: app.hasAccess ? "pointer" : "not-allowed",
                    borderRadius: 4,
                    position: "relative",
                    overflow: "hidden",
                    border: "1px solid",
                    borderColor: "divider",
                    transition: "all 0.3s ease",
                    opacity: app.hasAccess ? 1 : 0.6,
                    bgcolor:
                      theme.palette.mode === "dark"
                        ? "rgba(30, 41, 59, 0.5)"
                        : "#fff",
                    filter: app.hasAccess ? "none" : "grayscale(100%)",
                    "&:hover": app.hasAccess
                      ? {
                        transform: "translateY(-5px)",
                        boxShadow:
                          theme.palette.mode === "dark"
                            ? "0 20px 40px -10px rgba(0,0,0,0.5)"
                            : "0 20px 40px -10px rgba(0,0,0,0.1)",
                        borderColor: alpha(app.color, 0.5),
                      }
                      : {},
                  }}
                >
                  {/* Favorite Button */}
                  <Tooltip
                    title={
                      favorites.includes(app.id)
                        ? "Unpin App"
                        : "Pin App to Top"
                    }
                  >
                    <IconButton
                      onClick={(e) => toggleFavorite(e, app.id)}
                      sx={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        zIndex: 2,
                        color: favorites.includes(app.id)
                          ? "error.main"
                          : "text.disabled",
                        "&:hover": {
                          color: "error.main",
                          bgcolor: alpha(theme.palette.error.main, 0.1),
                        },
                      }}
                    >
                      {favorites.includes(app.id) ? (
                        <FavoriteIcon fontSize="small" />
                      ) : (
                        <FavoriteBorderIcon fontSize="small" />
                      )}
                    </IconButton>
                  </Tooltip>

                  {/* Notification Badge */}
                  {app.hasAccess && app.notifications > 0 && (
                    <Box
                      sx={{
                        position: "absolute",
                        top: 12,
                        left: 12,
                        bgcolor: "error.main",
                        color: "white",
                        fontSize: "0.7rem",
                        fontWeight: "bold",
                        px: 1,
                        py: 0.2,
                        borderRadius: 10,
                        zIndex: 2,
                        boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                      }}
                    >
                      {app.notifications} New
                    </Box>
                  )}

                  <CardContent
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      pt: 6,
                      pb: 4,
                    }}
                  >
                    {/* Icon Circle */}
                    <Box
                      sx={{
                        width: 80,
                        height: 80,
                        borderRadius: "24px",
                        bgcolor: alpha(app.color, 0.1),
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        mb: 2,
                        color: app.color,
                        transition: "transform 0.3s ease",
                        ".MuiCard-root:hover &": app.hasAccess
                          ? {
                            transform: "scale(1.1)",
                            bgcolor: alpha(app.color, 0.2),
                          }
                          : {},
                      }}
                    >
                      {typeof app.icon === "string" ? (
                        <Box
                          component="img"
                          src={app.icon}
                          alt={app.name}
                          sx={{ width: 40, height: 40, objectFit: "contain" }}
                        />
                      ) : (
                        <app.icon sx={{ fontSize: 40 }} />
                      )}
                    </Box>

                    <Typography
                      variant="h6"
                      fontWeight={700}
                      align="center"
                      gutterBottom
                    >
                      {app.name}
                    </Typography>

                    {app.hasAccess ? (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        align="center"
                      >
                        Launch Application
                      </Typography>
                    ) : (
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                          mt: 0.5,
                        }}
                      >
                        <LockOutlinedIcon
                          sx={{ fontSize: 16, color: "text.disabled" }}
                        />
                        <Typography variant="body2" color="text.disabled">
                          Access Restricted
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </AnimatePresence>
        </Grid>
      </Container>
    </Box>
  );
};

export default AppPortal;
