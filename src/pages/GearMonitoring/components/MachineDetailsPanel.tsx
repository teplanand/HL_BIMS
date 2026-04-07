import { memo, useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Stack,
  Divider,
  IconButton,
  Breadcrumbs,
  Chip,
} from "@mui/material";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import CloseIcon from "@mui/icons-material/Close";
import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";
import SensorsIcon from "@mui/icons-material/Sensors";

import { Machine } from "../data";
import { useMachineData } from "../context/MachineDataContext";
import { MiniChart } from "./MiniChart";

type MachineDetailsPanelProps = {
  machineId: string | null;
  onClose?: () => void;
};

const HISTORY_LENGTH = 20;

function createSeedHistory(baseValue: number | null) {
  const base = baseValue ?? 0;
  const variance = Math.max(Math.abs(base) * 0.04, 0.35);

  return Array.from({ length: HISTORY_LENGTH }, (_, index) => {
    const drift = Math.sin(index * 0.7) * variance;
    return Number((base + drift).toFixed(2));
  });
}

function getPrimaryMetric(machine: Machine) {
  return machine.monitoringParams.find((param) => typeof param.value === "number") ?? machine.monitoringParams[0] ?? null;
}

function getVisualSeverity(machine: Machine): "normal" | "warning" | "critical" {
  if (machine.alertCount >= 8) return "critical";
  if (machine.status === "warning" || machine.alertCount > 0) return "warning";
  return "normal";
}

function getSeverityStyles(severity: "normal" | "warning" | "critical") {
  if (severity === "critical") {
    return {
      label: "critical",
      color: "#BE123C",
      background: "#FFF1F2",
      accent: "#E11D48",
    };
  }

  if (severity === "warning") {
    return {
      label: "warning",
      color: "#B45309",
      background: "#FFF7ED",
      accent: "#F59E0B",
    };
  }

  return {
    label: "normal",
    color: "#0F766E",
    background: "#ECFDF5",
    accent: "#10B981",
  };
}

function formatMetricSummary(value: number | null, unit: string) {
  if (value === null) return `No ${unit} feed`;
  return `${value.toFixed(value >= 10 ? 1 : 2)} ${unit}`;
}

function MachineDetailsPanelComponent({
  machineId,
  onClose,
}: MachineDetailsPanelProps) {
  const { allMachines } = useMachineData();
  const machine = allMachines.find(m => m.id === machineId) || null;

  if (!machine) {
    return (
      <Box sx={{ p: 4, textAlign: "center", mt: 10 }}>
        <Typography color="text.secondary">Select a machine to view details</Typography>
      </Box>
    );
  }

  const severity = getVisualSeverity(machine);
  const severityStyles = getSeverityStyles(severity);
  const statusColor = severityStyles.color;
  const primaryMetric = getPrimaryMetric(machine);
  const primaryValue = typeof primaryMetric?.value === "number" ? primaryMetric.value : null;

  const [history, setHistory] = useState<number[]>(() => createSeedHistory(primaryValue));

  useEffect(() => {
    if (primaryValue === null) return;

    setHistory((previous) => {
      const lastValue = previous[previous.length - 1];
      if (lastValue === primaryValue) return previous;
      return [...previous.slice(-(HISTORY_LENGTH - 1)), primaryValue];
    });
  }, [primaryValue]);

  const statLine = useMemo(() => {
    if (!primaryMetric) return "Awaiting telemetry";
    return `${primaryMetric.label} • ${formatMetricSummary(primaryValue, primaryMetric.unit)}`;
  }, [primaryMetric, primaryValue]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflowY: "auto",
        "&::-webkit-scrollbar": { width: "4px" },
        "&::-webkit-scrollbar-thumb": { backgroundColor: "#E2E8F0", borderRadius: "4px" },
      }}
    >
      {/* Header */}
      <Box sx={{ px: 2.5, pt: 2, pb: 1.5 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Breadcrumbs
            separator={<NavigateNextIcon fontSize="small" />}
            sx={{ "& .MuiBreadcrumbs-li": { fontSize: "0.75rem", fontWeight: 500 } }}
          >
            <Typography color="text.secondary">Monitoring</Typography>
            <Typography color="text.secondary">{machine.locationName}</Typography>
            <Typography color="text.primary">{machine.id}</Typography>
          </Breadcrumbs>
          {onClose && (
            <IconButton size="small" onClick={onClose}>
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
        </Stack>
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>
          {machine.name}
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip
            label={severityStyles.label}
            size="small"
            sx={{
              bgcolor: severityStyles.background,
              color: severityStyles.color,
              fontWeight: 800,
              fontSize: "0.7rem",
              textTransform: "capitalize",
            }}
          />
          <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 500 }}>
            Managed by {machine.clientName}
          </Typography>
        </Stack>
      </Box>

      <Divider />

      {/* Machine Image */}
      <Box sx={{ p: 2.5 }}>
        <Box
          component="img"
          src={machine.image || `https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=800`}
          alt={machine.name}
          sx={{
            width: "100%",
            height: 200,
            objectFit: "cover",
            borderRadius: 3,
            border: "1px solid rgba(15,23,42,0.1)",
          }}
        />
      </Box>

      {/* Live Monitoring Parameters */}
      <Box sx={{ px: 2.5, pb: 2.5 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <SensorsIcon sx={{ color: "#0D9488", fontSize: 20 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
            Live Parameters
          </Typography>
          <Box sx={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            bgcolor: severityStyles.accent,
            animation: "pulse 2s infinite ease-in-out",
            "@keyframes pulse": {
              "0%": { opacity: 1, transform: "scale(1)" },
              "50%": { opacity: 0.4, transform: "scale(1.2)" },
              "100%": { opacity: 1, transform: "scale(1)" },
            }
          }} />
        </Stack>

        <Box
          sx={{
            mb: 2,
            p: 2,
            borderRadius: 3,
            bgcolor: "rgba(255,255,255,0.72)",
            border: "1px solid rgba(255,255,255,0.7)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9)",
            backdropFilter: "blur(14px)",
          }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="flex-start"
            spacing={2}
            sx={{ mb: 1.5 }}
          >
            <Box>
              <Typography
                variant="body2"
                sx={{ fontWeight: 800, color: statusColor }}
              >
                {statLine}
              </Typography>
            </Box>

            <Box
              sx={{
                px: 1.5,
                py: 1,
                borderRadius: 2,
                bgcolor: "rgba(15,23,42,0.04)",
                textAlign: "right",
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: "#94A3B8",
                  fontWeight: 800,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  display: "block",
                }}
              >
                Alerts
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: "#0F172A", lineHeight: 1.1 }}>
                {machine.alertCount}
              </Typography>
            </Box>
          </Stack>

          <Box sx={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 2,
            mb: 2
          }}>
            {machine.monitoringParams.map((param) => (
              <Box key={param.label}>
                <Box sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: "#F8FAFC",
                  border: "1px solid rgba(15,23,42,0.05)",
                  height: "100%"
                }}>
                  <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 600, textTransform: "uppercase" }}>
                    {param.label}
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, mt: 0.5, color: "#1E293B" }}>
                    {param.value !== null ? `${param.value}` : "--"}
                    <Typography component="span" variant="caption" sx={{ ml: 0.5, fontWeight: 700 }}>
                      {param.unit}
                    </Typography>
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>

          <MiniChart values={history} severity={severity} />
        </Box>
      </Box>

      <Divider />

      {/* Recent Alerts */}
      <Box sx={{ p: 2.5, flex: 1 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <NotificationsActiveOutlinedIcon
            sx={{
              color:
                severity === "critical"
                  ? "#E11D48"
                  : severity === "warning"
                    ? "#E97A2B"
                    : "#64748B",
              fontSize: 20,
            }}
          />
          <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
            Active Alerts ({machine.alertCount})
          </Typography>
        </Stack>

        {machine.alertCount > 0 ? (
          <Stack spacing={1.5}>
            {[...Array(Math.min(machine.alertCount, 3))].map((_, i) => (
              <Box
                key={i}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor:
                    i === 0
                      ? severity === "critical"
                        ? "#FFF1F2"
                        : severity === "warning"
                          ? "#FFF3E8"
                          : "#F1F5F9"
                      : "#F1F5F9",
                  borderLeft: "4px solid",
                  borderColor:
                    i === 0
                      ? severity === "critical"
                        ? "#E11D48"
                        : severity === "warning"
                          ? "#E97A2B"
                          : "#CBD5E1"
                      : "#CBD5E1"
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
                  {i === 0 ? "Critical Threshold Reached" : "Warning: Parameter Fluctuation"}
                </Typography>
                <Typography variant="caption" sx={{ color: "#64748B", display: "block" }}>
                  {i === 0 ? "Vibration levels exceeded 5.0 mm/s safety limit." : "Minor variance detected in sensor readings."}
                </Typography>
                <Typography variant="caption" sx={{ color: "#94A3B8", mt: 0.5, display: "block", fontSize: "0.65rem" }}>
                  {new Date().toLocaleTimeString()}
                </Typography>
              </Box>
            ))}
          </Stack>
        ) : (
          <Box sx={{ py: 4, textAlign: "center", bgcolor: "#F8FAFC", borderRadius: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
              No active alerts detected.
            </Typography>
          </Box>
        )}
      </Box>


    </Box>
  );
}

export const MachineDetailsPanel = memo(MachineDetailsPanelComponent);
