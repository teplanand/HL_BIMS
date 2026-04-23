import {
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ReactElement,
} from "react";
import {
  alpha,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  InputAdornment,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useTheme as useMuiTheme } from "@mui/material/styles";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import CollectionsRoundedIcon from "@mui/icons-material/CollectionsRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import FolderOpenRoundedIcon from "@mui/icons-material/FolderOpenRounded";
import CategoryRoundedIcon from "@mui/icons-material/CategoryRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ImageRoundedIcon from "@mui/icons-material/ImageRounded";
import MovieRoundedIcon from "@mui/icons-material/MovieRounded";
import AudiotrackRoundedIcon from "@mui/icons-material/AudiotrackRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import LockOpenRoundedIcon from "@mui/icons-material/LockOpenRounded";
import { toast } from "react-toastify";

import { Page } from "../../../components/common/Page";
import {
  useCheckTransactionMutation,
  useFilterReferenceNoMutation,
  useGetAudioMutation,
  useGetImagesMutation,
  useGetRefreneceNumbersListMutation,
  useGetUserCategoriesMutation,
  useGetUserDataMutation,
  useGetVideosMutation,
  useLazyGetRemarksListQuery,
  useSaveImagesMutation,
} from "../../../redux/api/evidancecollection";
import {
  getDecodedToken,
  getToken,
} from "../../../utils/auth";
import {
  buildUploadRemarksPayload,
  extractMessage,
  extractSuccess,
  formatBytes,
  formatMediaDate,
  getNumericCategoryId,
  normalizeCategories,
  normalizeMediaItems,
  normalizeReferences,
  normalizeRemarks,
  normalizeViewerProfile,
} from "./selectors";
import type {
  EvidenceCategoryOption,
  EvidenceMediaItem,
  EvidenceMediaKind,
  EvidenceViewerProfile,
  EvidenceWorkspaceMode,
  UploadPreviewItem,
} from "./types";

const workspaceTabs: { value: EvidenceWorkspaceMode; label: string }[] = [
  { value: "upload", label: "Collector workspace" },
  { value: "view", label: "Client viewer" },
];

const mediaTabs: { value: EvidenceMediaKind; label: string; icon: ReactElement }[] = [
  { value: "image", label: "Images", icon: <ImageRoundedIcon fontSize="small" /> },
  { value: "video", label: "Videos", icon: <MovieRoundedIcon fontSize="small" /> },
  { value: "audio", label: "Audio", icon: <AudiotrackRoundedIcon fontSize="small" /> },
];

const mediaIconMap: Record<EvidenceMediaKind, ReactElement> = {
  image: <ImageRoundedIcon />,
  video: <MovieRoundedIcon />,
  audio: <AudiotrackRoundedIcon />,
  file: <DescriptionRoundedIcon />,
};

const emptyViewerProfile: EvidenceViewerProfile = {
  name: "Authorized User",
  hrmsId: "",
  role: "Authorized User",
  company: "",
  division: "",
  canUpload: true,
  canView: true,
};

const pickPreviewKind = (file: File): EvidenceMediaKind => {
  if (file.type.startsWith("image/")) {
    return "image";
  }
  if (file.type.startsWith("video/")) {
    return "video";
  }
  if (file.type.startsWith("audio/")) {
    return "audio";
  }
  return "file";
};

const PreviewDialog = ({
  item,
  open,
  onClose,
}: {
  item: EvidenceMediaItem | null;
  open: boolean;
  onClose: () => void;
}) => {
  const theme = useMuiTheme();

  if (!item) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
      PaperProps={{
        className: "overflow-hidden rounded-2xl",
      }}
    >
      <DialogTitle className="flex items-center justify-between gap-4">
        <Box className="min-w-0">
          <Typography variant="h6" fontWeight={800} noWrap>
            {item.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            {item.remark || item.sourceLabel || "Evidence preview"}
          </Typography>
        </Box>
        <IconButton onClick={onClose}>
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent
        className="p-0"
        sx={{ bgcolor: theme.palette.mode === "dark" ? "#020617" : "#0F172A" }}
      >
        {item.kind === "image" ? (
          <Box
            component="img"
            src={item.url}
            alt={item.title}
            className="block max-h-[78vh] w-full object-contain"
          />
        ) : null}
        {item.kind === "video" ? (
          <Box className="p-2">
            <Box
              component="video"
              src={item.url}
              controls
              className="max-h-[74vh] w-full rounded-xl bg-black"
            />
          </Box>
        ) : null}
        {item.kind === "audio" ? (
          <Stack
            spacing={2}
            alignItems="center"
            justifyContent="center"
            className="min-h-80 p-4 text-white"
          >
            <AudiotrackRoundedIcon className="!text-[56px]" />
            <Typography variant="h6" fontWeight={700}>
              {item.title}
            </Typography>
            <audio controls src={item.url} style={{ width: "100%", maxWidth: 560 }} />
          </Stack>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

const buildSparklinePath = (values: number[], width = 320, height = 96) => {
  const safeValues = values.length > 1 ? values : [0, values[0] ?? 0];
  const minValue = Math.min(...safeValues);
  const maxValue = Math.max(...safeValues);
  const range = maxValue - minValue || 1;

  const points = safeValues.map((value, index) => {
    const x = (index / (safeValues.length - 1)) * width;
    const y = 14 + ((maxValue - value) / range) * (height - 28);
    return { x, y };
  });

  const linePath = points.reduce((path, point, index) => {
    if (index === 0) {
      return `M ${point.x} ${point.y}`;
    }

    const previous = points[index - 1];
    const controlX = (previous.x + point.x) / 2;
    return `${path} C ${controlX} ${previous.y}, ${controlX} ${point.y}, ${point.x} ${point.y}`;
  }, "");

  return {
    linePath,
    latestPoint: points[points.length - 1],
    width,
    height,
  };
};

const buildTrendSeries = (primary: number, secondary = 0) => {
  const base = Math.max(primary, 1);
  const pattern = [1.04, 1.1, 0.94, 0.76, 0.7, 0.9, 1.08, 1.03, 0.82, 0.88, 1.06];

  return pattern.map((multiplier, index) =>
    Number((base * multiplier + secondary * (index % 3 === 0 ? 0.6 : 0.25)).toFixed(2)),
  );
};

const EvidenceTrendCard = ({
  title,
  value,
  subtitle,
  series,
}: {
  title: string;
  value: string;
  subtitle: string;
  series: number[];
}) => {
  const theme = useMuiTheme();
  const isDark = theme.palette.mode === "dark";
  const { linePath, latestPoint, width, height } = buildSparklinePath(series);

  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 3,
        borderColor: theme.palette.divider,
        bgcolor: theme.palette.background.paper,
        p: 2,
      }}
    >
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
        <Box>
          <Typography
            variant="caption"
            sx={{ color: theme.palette.text.secondary, fontWeight: 800, letterSpacing: "0.12em" }}
          >
            {title}
          </Typography>
          <Typography
            variant="h6"
            sx={{ mt: 0.75, fontWeight: 800, color: theme.palette.text.primary }}
          >
            {value}
          </Typography>
        </Box>
        <Typography
          variant="caption"
          sx={{ color: theme.palette.text.secondary, fontWeight: 700, pt: 0.5 }}
        >
          {subtitle}
        </Typography>
      </Stack>

      <Box sx={{ mt: 1.5 }}>
        <svg viewBox={`0 0 ${width} ${height}`} className="h-[92px] w-full">
          <defs>
            <linearGradient id={`trend-${title}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#22C55E" />
              <stop offset="100%" stopColor="#3B82F6" />
            </linearGradient>
          </defs>
          <path
            d={`M 0 ${height * 0.35} L ${width} ${height * 0.35}`}
            stroke={isDark ? "#7F1D1D" : "#F8B4B4"}
            strokeWidth="1.2"
            strokeDasharray="5 8"
            fill="none"
            opacity={isDark ? 0.7 : 0.45}
          />
          <path
            d={`M 0 ${height * 0.7} L ${width} ${height * 0.7}`}
            stroke={isDark ? "#334155" : "#C7D2FE"}
            strokeWidth="1.2"
            strokeDasharray="5 8"
            fill="none"
            opacity={isDark ? 0.85 : 0.7}
          />
          <path
            d={linePath}
            fill="none"
            stroke={`url(#trend-${title})`}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle
            cx={latestPoint.x}
            cy={latestPoint.y}
            r="5"
            fill={theme.palette.background.paper}
            stroke={`url(#trend-${title})`}
            strokeWidth="3"
          />
        </svg>
      </Box>
    </Paper>
  );
};

const EvidenceDashboard = () => {
  const theme = useMuiTheme();
  const isDark = theme.palette.mode === "dark";

  const [getUserData] = useGetUserDataMutation();
  const [getUserCategories] = useGetUserCategoriesMutation();
  const [getReferenceNumbers] = useGetRefreneceNumbersListMutation();
  const [filterReferenceNumbers] = useFilterReferenceNoMutation();
  const [getImages] = useGetImagesMutation();
  const [getVideos] = useGetVideosMutation();
  const [getAudio] = useGetAudioMutation();
  const [checkTransaction] = useCheckTransactionMutation();
  const [saveImages, { isLoading: isUploading }] = useSaveImagesMutation();
  const [triggerRemarks] = useLazyGetRemarksListQuery();

  const [sessionReady, setSessionReady] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [workspaceMode, setWorkspaceMode] =
    useState<EvidenceWorkspaceMode>("upload");
  const [viewerProfile, setViewerProfile] =
    useState<EvidenceViewerProfile>(emptyViewerProfile);
  const [categories, setCategories] = useState<EvidenceCategoryOption[]>([]);
  const [categorySearch, setCategorySearch] = useState("");

  const [uploadCategoryId, setUploadCategoryId] = useState("");
  const [uploadReferenceNo, setUploadReferenceNo] = useState("");
  const [uploadRemarks, setUploadRemarks] = useState("");
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadPreviews, setUploadPreviews] = useState<UploadPreviewItem[]>([]);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  const [viewCategoryId, setViewCategoryId] = useState("");
  const [referenceSearch, setReferenceSearch] = useState("");
  const deferredReferenceSearch = useDeferredValue(referenceSearch);
  const [referenceOptions, setReferenceOptions] = useState(
    normalizeReferences([]),
  );
  const [referencesLoading, setReferencesLoading] = useState(false);
  const [selectedReferenceNo, setSelectedReferenceNo] = useState("");
  const [remarkOptions, setRemarkOptions] = useState(normalizeRemarks([]));
  const [selectedRemark, setSelectedRemark] = useState("");
  const [activeMediaTab, setActiveMediaTab] = useState<EvidenceMediaKind>("image");
  const [mediaItems, setMediaItems] = useState<EvidenceMediaItem[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [selectedMediaItem, setSelectedMediaItem] = useState<EvidenceMediaItem | null>(
    null,
  );
  const [transactionStatus, setTransactionStatus] = useState({
    checked: false,
    valid: false,
    message: "",
  });

  const filteredCategories = useMemo(() => {
    const normalizedQuery = categorySearch.trim().toLowerCase();
    if (!normalizedQuery) {
      return categories;
    }

    return categories.filter((category) =>
      `${category.label} ${category.subtitle}`.toLowerCase().includes(normalizedQuery),
    );
  }, [categories, categorySearch]);

  const uploadCategory = useMemo(
    () => categories.find((category) => category.id === uploadCategoryId) ?? null,
    [categories, uploadCategoryId],
  );
  const viewCategory = useMemo(
    () => categories.find((category) => category.id === viewCategoryId) ?? null,
    [categories, viewCategoryId],
  );
  const selectedReferenceOption = useMemo(
    () =>
      referenceOptions.find((reference) => reference.refNo === selectedReferenceNo) ?? null,
    [referenceOptions, selectedReferenceNo],
  );
  const selectedHeroItem = useMemo(
    () =>
      selectedMediaItem ??
      mediaItems.find((item) => item.kind === "image") ??
      mediaItems[0] ??
      null,
    [mediaItems, selectedMediaItem],
  );
  const uploadSummary = useMemo(
    () => ({
      files: uploadFiles.length,
      totalSize: formatBytes(uploadFiles.reduce((total, file) => total + file.size, 0)),
    }),
    [uploadFiles],
  );
  const dashboardStatus = useMemo(() => {
    if (!selectedReferenceNo) {
      return {
        label: "Standby",
        color: theme.palette.text.secondary,
        background: isDark ? alpha(theme.palette.background.default, 0.5) : "#F8FAFC",
      };
    }

    if (transactionStatus.checked && transactionStatus.valid) {
      return {
        label: "Verified",
        color: "#0F766E",
        background: isDark ? alpha("#10B981", 0.16) : "#ECFDF5",
      };
    }

    return {
      label: mediaItems.length ? "Review" : "Pending",
      color: mediaItems.length ? "#B45309" : "#BE123C",
      background: mediaItems.length
        ? (isDark ? alpha("#F59E0B", 0.16) : "#FFF7ED")
        : isDark
          ? alpha("#FB7185", 0.16)
          : "#FFF1F2",
    };
  }, [
    isDark,
    mediaItems.length,
    selectedReferenceNo,
    theme.palette.background.default,
    theme.palette.text.secondary,
    transactionStatus.checked,
    transactionStatus.valid,
  ]);
  const metricsCards = useMemo(
    () => [
      {
        title: "MEDIA LOAD",
        value: `${mediaItems.length} ${activeMediaTab}${mediaItems.length === 1 ? "" : "s"}`,
        subtitle: selectedReferenceNo || "No reference",
        series: buildTrendSeries(mediaItems.length || 1, selectedRemark ? 2 : 1),
      },
      {
        title: "REFERENCE COVERAGE",
        value: `${referenceOptions.length} refs`,
        subtitle: viewCategory?.label || "No category",
        series: buildTrendSeries(referenceOptions.length || 1, categories.length || 1),
      },
    ],
    [
      activeMediaTab,
      categories.length,
      mediaItems.length,
      referenceOptions.length,
      selectedReferenceNo,
      selectedRemark,
      viewCategory?.label,
    ],
  );
  const evidenceHighlights = useMemo(
    () =>
      [
        transactionStatus.message || "Reference validation updates will appear here.",
        selectedRemark
          ? `Remark filter active: ${selectedRemark}`
          : "Showing all remarks for the selected reference.",
        mediaItems.length
          ? `${mediaItems.length} ${activeMediaTab} item(s) loaded for preview.`
          : `No ${activeMediaTab} evidence has been returned yet.`,
      ].filter(Boolean),
    [activeMediaTab, mediaItems.length, selectedRemark, transactionStatus.message],
  );
  const ui = useMemo(
    () => ({
      shell: theme.palette.background.paper,
      panel: theme.palette.background.paper,
      panelAlt: isDark ? alpha(theme.palette.background.default, 0.5) : "#F8FAFC",
      workspace: isDark ? alpha(theme.palette.primary.main, 0.08) : "#F8FBFF",
      selectedWarm: isDark ? alpha("#FB923C", 0.14) : "#FFF7F0",
      selectedSuccess: isDark ? alpha("#10B981", 0.14) : "#F2FBF7",
      softDanger: isDark ? alpha("#FB7185", 0.12) : "#FFF7F8",
      chipDanger: isDark ? alpha("#FB7185", 0.16) : "#FFF1F2",
      verified: isDark ? alpha("#10B981", 0.16) : "#ECFDF5",
      invalid: isDark ? alpha("#EF4444", 0.14) : "#FEF2F2",
      textStrong: theme.palette.text.primary,
      textMuted: theme.palette.text.secondary,
      textSoft: isDark ? alpha(theme.palette.text.secondary, 0.82) : "#334155",
      border: theme.palette.divider,
      searchBg: isDark ? alpha(theme.palette.background.default, 0.78) : "#F8FAFC",
      heroFallback: isDark
        ? "linear-gradient(135deg, rgba(30,41,59,0.98) 0%, rgba(15,23,42,1) 100%)"
        : "linear-gradient(135deg, rgba(226,232,240,0.95) 0%, rgba(248,250,252,1) 100%)",
      heroOverlay: isDark
        ? "linear-gradient(180deg, rgba(2,6,23,0.08) 0%, rgba(2,6,23,0.88) 100%)"
        : "linear-gradient(180deg, rgba(15,23,42,0.02) 0%, rgba(15,23,42,0.74) 100%)",
      mediaFallback: isDark
        ? "linear-gradient(135deg, rgba(2,6,23,0.98) 0%, rgba(30,41,59,0.92) 100%)"
        : "linear-gradient(135deg, rgba(15,23,42,0.98) 0%, rgba(30,58,138,0.82) 100%)",
      shadowWarm: isDark
        ? "0 18px 32px -28px rgba(251,146,60,0.45)"
        : "0 14px 28px -24px rgba(251,146,60,0.55)",
      shadowSuccess: isDark
        ? "0 18px 32px -28px rgba(16,185,129,0.35)"
        : "0 14px 28px -24px rgba(16,185,129,0.45)",
      shadowSoft: isDark
        ? "0 18px 36px -30px rgba(2,6,23,0.7)"
        : "0 10px 24px -28px rgba(15,23,42,0.22)",
    }),
    [isDark, theme],
  );

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      try {
        if (!isMounted) {
          return;
        }

        const token = getToken();

        if (!token) {
          throw new Error("Authentication token not found.");
        }

        const tokenPayload = getDecodedToken<Record<string, unknown>>();
        const [userResponse, categoryResponse] = await Promise.all([
          getUserData({}).unwrap().catch(() => null),
          getUserCategories({}).unwrap(),
        ]);

        if (!isMounted) {
          return;
        }

        const normalizedProfile = normalizeViewerProfile(tokenPayload, userResponse);
        const normalizedCategories = normalizeCategories(categoryResponse);

        setViewerProfile(normalizedProfile);
        setCategories(normalizedCategories);

        if (normalizedCategories.length) {
          setUploadCategoryId((current) => current || normalizedCategories[0].id);
          setViewCategoryId((current) => current || normalizedCategories[0].id);
        }

        if (!normalizedProfile.canUpload) {
          setWorkspaceMode("view");
        }

        setSessionReady(true);
      } catch (error) {
        console.error("Failed to initialize evidence collection", error);
        toast.error("Evidence collection token missing or category loading failed.");
      } finally {
        if (isMounted) {
          setBootstrapping(false);
        }
      }
    };

    void bootstrap();

    return () => {
      isMounted = false;
    };
  }, [getUserCategories, getUserData]);

  useEffect(() => {
    const previewEntries = uploadFiles.map((file, index) => ({
      id: `${file.name}-${file.lastModified}-${index}`,
      name: file.name,
      sizeLabel: formatBytes(file.size),
      mimeType: file.type || "application/octet-stream",
      isImage: file.type.startsWith("image/"),
      previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : "",
    }));

    setUploadPreviews(previewEntries);

    return () => {
      previewEntries.forEach((entry) => {
        if (entry.previewUrl) {
          URL.revokeObjectURL(entry.previewUrl);
        }
      });
    };
  }, [uploadFiles]);

  useEffect(() => {
    if (!sessionReady || !viewCategory) {
      return;
    }

    const numericCategoryId = getNumericCategoryId(viewCategory);
    if (!numericCategoryId) {
      return;
    }

    let isMounted = true;
    setReferencesLoading(true);
    setSelectedReferenceNo("");
    setRemarkOptions(normalizeRemarks([]));
    setSelectedRemark("");
    setMediaItems([]);
    setTransactionStatus({ checked: false, valid: false, message: "" });

    const loadReferences = async () => {
      try {
        const payload =
          deferredReferenceSearch.trim().length >= 2
            ? await filterReferenceNumbers({
                CategoryId: numericCategoryId,
                RefNo: deferredReferenceSearch.trim(),
              }).unwrap()
            : await getReferenceNumbers({
                CategoryId: numericCategoryId,
                PageNo: 0,
              }).unwrap();

        if (!isMounted) {
          return;
        }

        setReferenceOptions(normalizeReferences(payload));
      } catch (error) {
        console.error("Failed to fetch evidence references", error);
        if (isMounted) {
          setReferenceOptions([]);
        }
      } finally {
        if (isMounted) {
          setReferencesLoading(false);
        }
      }
    };

    void loadReferences();

    return () => {
      isMounted = false;
    };
  }, [
    deferredReferenceSearch,
    filterReferenceNumbers,
    getReferenceNumbers,
    sessionReady,
    viewCategory,
  ]);

  useEffect(() => {
    if (!sessionReady || !selectedReferenceNo || !viewCategory) {
      return;
    }

    const numericCategoryId = getNumericCategoryId(viewCategory);
    if (!numericCategoryId) {
      return;
    }

    let isMounted = true;

    const loadReferenceMetadata = async () => {
      try {
        const [remarksResponse, transactionResponse] = await Promise.all([
          triggerRemarks(selectedReferenceNo, true).unwrap().catch(() => []),
          checkTransaction({
            RefNo: selectedReferenceNo,
            CatId: numericCategoryId,
          }).unwrap().catch(() => null),
        ]);

        if (!isMounted) {
          return;
        }

        setRemarkOptions(normalizeRemarks(remarksResponse));
        setTransactionStatus({
          checked: true,
          valid: Boolean(transactionResponse) && extractSuccess(transactionResponse),
          message:
            extractMessage(transactionResponse) ||
            "Reference checked against evidence transactions.",
        });
      } catch (error) {
        console.error("Failed to fetch reference metadata", error);
      }
    };

    void loadReferenceMetadata();

    return () => {
      isMounted = false;
    };
  }, [checkTransaction, selectedReferenceNo, sessionReady, triggerRemarks, viewCategory]);

  useEffect(() => {
    if (!sessionReady || !selectedReferenceNo || !viewCategory) {
      return;
    }

    const numericCategoryId = getNumericCategoryId(viewCategory);
    if (!numericCategoryId) {
      return;
    }

    let isMounted = true;
    setMediaLoading(true);

    const loadMedia = async () => {
      try {
        const payload = {
          RefNo: selectedReferenceNo,
          CatId: numericCategoryId,
          ...(selectedRemark ? { Remarks: selectedRemark } : {}),
        };

        const response =
          activeMediaTab === "video"
            ? await getVideos(payload).unwrap()
            : activeMediaTab === "audio"
              ? await getAudio(payload).unwrap()
              : await getImages(payload).unwrap();

        if (!isMounted) {
          return;
        }

        setMediaItems(normalizeMediaItems(response, activeMediaTab));
      } catch (error) {
        console.error("Failed to fetch evidence media", error);
        if (isMounted) {
          setMediaItems([]);
        }
      } finally {
        if (isMounted) {
          setMediaLoading(false);
        }
      }
    };

    void loadMedia();

    return () => {
      isMounted = false;
    };
  }, [
    activeMediaTab,
    getAudio,
    getImages,
    getVideos,
    selectedReferenceNo,
    selectedRemark,
    sessionReady,
    viewCategory,
  ]);

  const handleFileSelection = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    setUploadFiles((currentFiles) => [...currentFiles, ...files]);
    event.target.value = "";
  };

  const openFilePicker = () => {
    uploadInputRef.current?.click();
  };

  const handleUpload = async () => {
    const numericCategoryId = getNumericCategoryId(uploadCategory);

    if (!numericCategoryId || !uploadReferenceNo.trim() || uploadFiles.length === 0) {
      toast.error("Category, reference number and files are required.");
      return;
    }

    try {
      const response = await saveImages({
        CategoryId: numericCategoryId,
        ReferenceNo: uploadReferenceNo.trim(),
        Remarks: buildUploadRemarksPayload(uploadRemarks),
        Files: uploadFiles,
      }).unwrap();

      toast.success(extractMessage(response) || "Evidence uploaded successfully.");

      setUploadFiles([]);
      setUploadRemarks("");
      setReferenceSearch(uploadReferenceNo.trim());
      setSelectedReferenceNo(uploadReferenceNo.trim());
      setWorkspaceMode("view");
    } catch (error) {
      console.error("Failed to upload evidence", error);
      toast.error("Evidence upload failed. Please verify category and files.");
    }
  };

  return (
    <Page module="evidance">
      <Card
        sx={{
          display: "flex",
          minHeight: "calc(100vh - 96px)",
          overflow: "hidden",
          borderRadius: 3,
          border: `1px solid ${ui.border}`,
          boxShadow: "none",
          bgcolor: ui.shell,
        }}
      >
        <Box
          sx={{
            width: { xs: "100%", lg: 270 },
            minWidth: { lg: 270 },
            borderRight: { lg: `1px solid ${ui.border}` },
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <Stack spacing={2} sx={{ px: 2, pt: 2, pb: 1.5, borderBottom: `1px solid ${ui.border}` }}>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {["Apps", "Evidence Collection", "Dashboard"].map((crumb) => (
                <Typography key={crumb} variant="caption" sx={{ color: ui.textMuted, fontWeight: 700 }}>
                  {crumb}
                </Typography>
              ))}
            </Stack>

            <TextField
              size="small"
              placeholder="Search location..."
              value={categorySearch}
              onChange={(event) => setCategorySearch(event.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon fontSize="small" sx={{ color: "#94A3B8" }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  bgcolor: ui.searchBg,
                },
              }}
            />
          </Stack>

          {bootstrapping ? <LinearProgress /> : null}

          <Stack spacing={1.25} sx={{ p: 1.5, overflowY: "auto", flex: 1 }}>
            {filteredCategories.map((category) => {
              const selected = category.id === uploadCategoryId || category.id === viewCategoryId;

              return (
                <Paper
                  key={category.id}
                  variant="outlined"
                  onClick={() => {
                    setUploadCategoryId(category.id);
                    setViewCategoryId(category.id);
                    setReferenceSearch("");
                  }}
                  sx={{
                    p: 1.75,
                    borderRadius: 2.5,
                    cursor: "pointer",
                    borderColor: selected ? "rgba(251,146,60,0.42)" : "rgba(15,23,42,0.06)",
                    borderLeftWidth: 3,
                    borderLeftStyle: "solid",
                    borderLeftColor: selected ? "#FB923C" : "transparent",
                    bgcolor: selected ? ui.selectedWarm : ui.panel,
                    boxShadow: selected ? ui.shadowWarm : ui.shadowSoft,
                  }}
                >
                  <Typography variant="body1" sx={{ fontWeight: 800, color: ui.textSoft }} noWrap>
                    {category.label}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5, color: ui.textMuted }}>
                    {category.subtitle}
                  </Typography>
                  <Typography variant="caption" sx={{ mt: 0.75, display: "block", color: alpha(ui.textMuted, 0.8) }}>
                    {referenceOptions.length} references available
                  </Typography>
                </Paper>
              );
            })}

            {!bootstrapping && !filteredCategories.length ? (
              <Paper variant="outlined" sx={{ borderRadius: 2.5, p: 3, textAlign: "center", color: ui.textMuted }}>
                No category data available.
              </Paper>
            ) : null}
          </Stack>
        </Box>

        <Box
          sx={{
            width: { xs: "100%", lg: 290 },
            minWidth: { lg: 290 },
            borderRight: { lg: `1px solid ${ui.border}` },
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <Box sx={{ px: 2.5, pt: 2.5, pb: 1.5, borderBottom: `1px solid ${ui.border}` }}>
            <Typography variant="h5" sx={{ fontWeight: 800, color: "#1E3A8A" }}>
              {viewCategory?.label || "Evidence Hub"}
            </Typography>
            <Typography variant="body2" sx={{ color: ui.textMuted, mt: 0.5, mb: 1.75 }}>
              {viewCategory?.subtitle || viewerProfile.company || "Assigned evidence categories"}
            </Typography>

            <TextField
              fullWidth
              size="small"
              placeholder={workspaceMode === "upload" ? "Reference for upload..." : "Search reference..."}
              value={workspaceMode === "upload" ? uploadReferenceNo : referenceSearch}
              onChange={(event) =>
                workspaceMode === "upload"
                  ? setUploadReferenceNo(event.target.value)
                  : setReferenceSearch(event.target.value)
              }
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon fontSize="small" sx={{ color: "#94A3B8" }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  bgcolor: ui.searchBg,
                },
              }}
            />
          </Box>

          <Box sx={{ px: 1.25, py: 1.25, overflowY: "auto", flex: 1 }}>
            {workspaceMode === "upload" ? (
              <Stack spacing={1.5}>
                <Paper
                  variant="outlined"
                  sx={{
                    borderRadius: 2.5,
                    borderColor: "rgba(59,130,246,0.18)",
                    bgcolor: ui.workspace,
                    p: 1.75,
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Box
                      sx={{
                        display: "grid",
                        placeItems: "center",
                        width: 42,
                        height: 42,
                        borderRadius: 2,
                        bgcolor: alpha("#2563EB", 0.12),
                        color: "#2563EB",
                      }}
                    >
                      <UploadFileRoundedIcon fontSize="small" />
                    </Box>
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 800, color: ui.textSoft }}>
                        Collector workspace
                      </Typography>
                      <Typography variant="body2" sx={{ color: ui.textMuted }}>
                        Prepare category, reference and upload batch.
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>

                {uploadPreviews.map((preview, index) => (
                  <Paper
                    key={preview.id}
                    variant="outlined"
                    sx={{
                      overflow: "hidden",
                      borderRadius: 2.5,
                      borderColor: ui.border,
                    }}
                  >
                    <Box
                      sx={{
                        height: 126,
                        display: "grid",
                        placeItems: "center",
                        color: ui.textMuted,
                        bgcolor:
                          preview.isImage && preview.previewUrl
                            ? undefined
                            : alpha(theme.palette.text.primary, isDark ? 0.08 : 0.04),
                        backgroundImage:
                          preview.isImage && preview.previewUrl ? `url(${preview.previewUrl})` : "none",
                        backgroundPosition: "center",
                        backgroundSize: "cover",
                      }}
                    >
                      {!preview.isImage ? mediaIconMap[pickPreviewKind(uploadFiles[index])] : null}
                    </Box>
                    <Stack spacing={0.5} sx={{ p: 1.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 800 }} noWrap>
                        {preview.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: ui.textMuted }}>
                        {preview.sizeLabel} | {preview.mimeType || "Unknown type"}
                      </Typography>
                      <Button
                        size="small"
                        color="inherit"
                        sx={{ alignSelf: "flex-start", px: 0, minWidth: 0 }}
                        onClick={() =>
                          setUploadFiles((currentFiles) =>
                            currentFiles.filter((_, fileIndex) => fileIndex !== index),
                          )
                        }
                      >
                        Remove
                      </Button>
                    </Stack>
                  </Paper>
                ))}

                {!uploadPreviews.length ? (
                  <Paper
                    variant="outlined"
                    sx={{
                      borderRadius: 2.5,
                      p: 3,
                      textAlign: "center",
                      color: ui.textMuted,
                      borderStyle: "dashed",
                      borderColor: "rgba(59,130,246,0.25)",
                    }}
                  >
                    Queue is empty. Add files from the workspace panel.
                  </Paper>
                ) : null}
              </Stack>
            ) : (
              <Stack spacing={1}>
                {referencesLoading ? <LinearProgress /> : null}

                {referenceOptions.map((reference) => {
                  const isSelected = selectedReferenceNo === reference.refNo;

                  return (
                    <Paper
                      key={reference.id}
                      variant="outlined"
                      onClick={() => setSelectedReferenceNo(reference.refNo)}
                      sx={{
                        p: 1.75,
                        borderRadius: 2.5,
                        cursor: "pointer",
                        borderColor: isSelected
                          ? "rgba(16,185,129,0.3)"
                          : ui.border,
                        bgcolor: isSelected ? ui.selectedSuccess : ui.panel,
                        boxShadow: isSelected ? ui.shadowSuccess : ui.shadowSoft,
                      }}
                    >
                      <Stack direction="row" justifyContent="space-between" spacing={1} alignItems="flex-start">
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="body1" sx={{ fontWeight: 800, color: ui.textStrong }} noWrap>
                            {reference.label}
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 0.35, color: "#2563EB", fontWeight: 700 }}>
                            {reference.refNo}
                          </Typography>
                        </Box>
                        <Chip
                          label={isSelected ? dashboardStatus.label : "Ready"}
                          size="small"
                          sx={{
                            height: 26,
                            bgcolor: isSelected ? dashboardStatus.background : ui.panelAlt,
                            color: isSelected ? dashboardStatus.color : ui.textMuted,
                            fontWeight: 800,
                          }}
                        />
                      </Stack>
                      <Typography variant="caption" sx={{ mt: 1, display: "block", color: ui.textMuted }}>
                        {reference.subtitle}
                      </Typography>
                    </Paper>
                  );
                })}

                {!referencesLoading && !referenceOptions.length ? (
                  <Paper
                    variant="outlined"
                    sx={{
                      borderRadius: 2.5,
                      p: 3,
                      textAlign: "center",
                      color: ui.textMuted,
                    }}
                  >
                    No matching reference numbers found.
                  </Paper>
                ) : null}
              </Stack>
            )}
          </Box>
        </Box>

        <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
          <Box sx={{ px: { xs: 2, lg: 2.5 }, pt: 2.5, pb: 1.5, borderBottom: `1px solid ${ui.border}` }}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", md: "flex-start" }}
              spacing={2}
            >
              <Box sx={{ minWidth: 0 }}>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Typography variant="body2" sx={{ color: ui.textMuted }}>
                    Evidence Collection
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#94A3B8" }}>
                    {">"}
                  </Typography>
                  <Typography variant="body2" sx={{ color: ui.textMuted }}>
                    {viewCategory?.label || "Category"}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#94A3B8" }}>
                    {">"}
                  </Typography>
                  <Typography variant="body2" sx={{ color: ui.textSoft, fontWeight: 800 }}>
                    {selectedReferenceNo || (workspaceMode === "upload" ? "Collector workspace" : "Dashboard")}
                  </Typography>
                </Stack>

                <Typography variant="h4" sx={{ mt: 1, fontWeight: 800, color: "#1E3A8A" }}>
                  {workspaceMode === "upload"
                    ? "Evidence Intake"
                    : selectedReferenceOption?.label || "Evidence Dashboard"}
                </Typography>

                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                  <Chip
                    label={dashboardStatus.label}
                    sx={{
                      bgcolor: dashboardStatus.background,
                      color: dashboardStatus.color,
                      fontWeight: 800,
                    }}
                  />
                  <Typography variant="body2" sx={{ color: ui.textMuted, alignSelf: "center" }}>
                    Managed by {viewerProfile.company || viewerProfile.name || "Evidence Team"}
                  </Typography>
                </Stack>
              </Box>

              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                {workspaceTabs.map((tab) => (
                  <Button
                    key={tab.value}
                    variant={workspaceMode === tab.value ? "contained" : "outlined"}
                    disabled={tab.value === "upload" && !viewerProfile.canUpload}
                    onClick={() => {
                      if (tab.value === "upload" && !viewerProfile.canUpload) {
                        return;
                      }
                      setWorkspaceMode(tab.value);
                    }}
                    sx={{
                      borderRadius: 999,
                      px: 2,
                      boxShadow: "none",
                      textTransform: "none",
                      ...(workspaceMode === tab.value
                        ? { bgcolor: "#1E3A8A" }
                        : { borderColor: ui.border, color: ui.textMuted }),
                    }}
                  >
                    {tab.label}
                  </Button>
                ))}
              </Stack>
            </Stack>
          </Box>

          <Box sx={{ p: { xs: 2, lg: 2.5 }, overflowY: "auto", flex: 1, bgcolor: ui.panelAlt }}>
            {workspaceMode === "upload" ? (
              <Grid container spacing={2.5}>
                <Grid size={{ xs: 12, xl: 7 }}>
                  <Stack spacing={2.5}>
                    <Paper
                      variant="outlined"
                      sx={{
                        borderRadius: 3,
                        borderColor: ui.border,
                        p: 2.5,
                        bgcolor: ui.panel,
                      }}
                    >
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 6 }}>
                          <TextField
                            select
                            fullWidth
                            label="Category"
                            value={uploadCategoryId}
                            onChange={(event) => setUploadCategoryId(event.target.value)}
                          >
                            {categories.map((category) => (
                              <MenuItem key={category.id} value={category.id}>
                                {category.label}
                              </MenuItem>
                            ))}
                          </TextField>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                          <TextField
                            fullWidth
                            label="Reference number"
                            placeholder="Ex. TRF-00045"
                            value={uploadReferenceNo}
                            onChange={(event) => setUploadReferenceNo(event.target.value)}
                          />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <TextField
                            fullWidth
                            multiline
                            minRows={3}
                            label="Remarks"
                            placeholder="Upload note, shift remark, issue summary..."
                            value={uploadRemarks}
                            onChange={(event) => setUploadRemarks(event.target.value)}
                          />
                        </Grid>
                      </Grid>
                    </Paper>

                    <Paper
                      variant="outlined"
                      onClick={openFilePicker}
                      sx={{
                        borderRadius: 3,
                        borderStyle: "dashed",
                        borderWidth: 2,
                        borderColor: alpha("#0A84FF", 0.26),
                        background: isDark
                          ? "linear-gradient(180deg, rgba(10,132,255,0.12) 0%, rgba(15,23,42,0.92) 100%)"
                          : "linear-gradient(180deg, rgba(10,132,255,0.06) 0%, rgba(255,255,255,1) 100%)",
                        p: 4,
                        cursor: "pointer",
                      }}
                    >
                      <Stack spacing={1.5} alignItems="center" textAlign="center">
                        <CloudUploadRoundedIcon className="!text-[42px] text-sky-600" />
                        <Typography variant="h5" fontWeight={800}>
                          Drop or choose evidence files
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Image, video, audio or PDF files can be attached in one evidence batch.
                        </Typography>
                        <Button
                          variant="contained"
                          startIcon={<UploadFileRoundedIcon />}
                          onClick={(event) => {
                            event.stopPropagation();
                            openFilePicker();
                          }}
                          sx={{ borderRadius: 999, px: 2.5, boxShadow: "none" }}
                        >
                          Choose files
                        </Button>
                        <input
                          hidden
                          multiple
                          ref={uploadInputRef}
                          type="file"
                          accept="image/*,video/*,audio/*,.pdf"
                          onChange={handleFileSelection}
                        />
                      </Stack>
                    </Paper>
                  </Stack>
                </Grid>

                <Grid size={{ xs: 12, xl: 5 }}>
                  <Stack spacing={2.5}>
                    <Paper
                      variant="outlined"
                      sx={{
                        borderRadius: 3,
                        borderColor: ui.border,
                        p: 2,
                        bgcolor: ui.panel,
                      }}
                    >
                      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                        <Chip label={`${uploadSummary.files} files`} />
                        <Chip label={uploadSummary.totalSize} />
                        <Chip label={uploadCategory?.label || "No category"} />
                      </Stack>

                      <Button
                        fullWidth
                        variant="contained"
                        size="large"
                        sx={{ mt: 2, borderRadius: 999, boxShadow: "none" }}
                        startIcon={
                          isUploading ? (
                            <CircularProgress size={18} color="inherit" />
                          ) : (
                            <UploadFileRoundedIcon />
                          )
                        }
                        disabled={
                          isUploading ||
                          !uploadCategory ||
                          !uploadReferenceNo.trim() ||
                          uploadFiles.length === 0
                        }
                        onClick={() => void handleUpload()}
                      >
                        {isUploading ? "Uploading..." : "Upload evidence"}
                      </Button>
                    </Paper>

                    <Grid container spacing={2}>
                      {uploadPreviews.map((preview, index) => (
                        <Grid key={preview.id} size={{ xs: 12, sm: 6 }}>
                          <Paper
                            variant="outlined"
                            sx={{
                              overflow: "hidden",
                              borderRadius: 3,
                              borderColor: ui.border,
                              bgcolor: ui.panel,
                            }}
                          >
                            <Box
                              sx={{
                                height: 164,
                                display: "grid",
                                placeItems: "center",
                                color: ui.textMuted,
                                bgcolor:
                                  preview.isImage && preview.previewUrl
                                    ? undefined
                                    : alpha(theme.palette.text.primary, isDark ? 0.08 : 0.04),
                                backgroundImage:
                                  preview.isImage && preview.previewUrl ? `url(${preview.previewUrl})` : "none",
                                backgroundPosition: "center",
                                backgroundSize: "cover",
                              }}
                            >
                              {!preview.isImage ? mediaIconMap[pickPreviewKind(uploadFiles[index])] : null}
                            </Box>
                            <Stack spacing={0.75} sx={{ p: 1.5 }}>
                              <Typography variant="body2" fontWeight={800} noWrap>
                                {preview.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {preview.sizeLabel} | {preview.mimeType || "Unknown type"}
                              </Typography>
                            </Stack>
                          </Paper>
                        </Grid>
                      ))}

                      {!uploadPreviews.length ? (
                        <Grid size={{ xs: 12 }}>
                          <Paper
                            variant="outlined"
                            sx={{
                              borderRadius: 3,
                              p: 4,
                              textAlign: "center",
                              color: ui.textMuted,
                              bgcolor: ui.panel,
                            }}
                          >
                            Selected files will appear here for quick review.
                          </Paper>
                        </Grid>
                      ) : null}
                    </Grid>
                  </Stack>
                </Grid>
              </Grid>
            ) : (
              <Stack spacing={2.5}>
                <Grid container spacing={2.5}>
                  <Grid size={{ xs: 12, xl: 7 }}>
                    <Paper
                      variant="outlined"
                      sx={{
                        overflow: "hidden",
                        borderRadius: 3,
                        borderColor: ui.border,
                        bgcolor: ui.panel,
                      }}
                    >
                      <Box
                        sx={{
                          position: "relative",
                          minHeight: 380,
                          display: "flex",
                          alignItems: "flex-end",
                          background:
                            selectedHeroItem?.kind === "image" && selectedHeroItem.previewUrl
                              ? `center / cover no-repeat url(${selectedHeroItem.previewUrl})`
                              : ui.heroFallback,
                        }}
                      >
                        {selectedHeroItem?.kind && selectedHeroItem.kind !== "image" ? (
                          <Box
                            sx={{
                              position: "absolute",
                              inset: 0,
                              display: "grid",
                              placeItems: "center",
                              color: ui.textStrong,
                            }}
                          >
                            {mediaIconMap[selectedHeroItem.kind]}
                          </Box>
                        ) : null}
                        <Box
                          sx={{
                            width: "100%",
                            p: 2.25,
                            background: ui.heroOverlay,
                            color: "#fff",
                          }}
                        >
                          <Typography variant="h6" sx={{ fontWeight: 800 }}>
                            {selectedHeroItem?.title || "Pick a reference to load evidence"}
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 0.5, color: "rgba(255,255,255,0.82)" }}>
                            {selectedHeroItem?.remark ||
                              selectedReferenceOption?.subtitle ||
                              "Media is fetched only on demand to keep the module responsive."}
                          </Typography>
                          {selectedHeroItem ? (
                            <Button
                              variant="contained"
                              startIcon={<VisibilityRoundedIcon />}
                              sx={{
                                mt: 1.5,
                                borderRadius: 999,
                                boxShadow: "none",
                                bgcolor: isDark ? alpha("#FFFFFF", 0.12) : "#FFFFFF",
                                color: isDark ? "#FFFFFF" : "#0F172A",
                                backdropFilter: isDark ? "blur(8px)" : undefined,
                                "&:hover": {
                                  bgcolor: isDark ? alpha("#FFFFFF", 0.18) : "#FFFFFF",
                                },
                              }}
                              onClick={() => setSelectedMediaItem(selectedHeroItem)}
                            >
                              Open preview
                            </Button>
                          ) : null}
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>

                  <Grid size={{ xs: 12, xl: 5 }}>
                    <Stack spacing={2}>
                      {metricsCards.map((metric) => (
                        <EvidenceTrendCard
                          key={metric.title}
                          title={metric.title}
                          value={metric.value}
                          subtitle={metric.subtitle}
                          series={metric.series}
                        />
                      ))}

                      <Paper
                        variant="outlined"
                        sx={{
                          borderRadius: 3,
                          borderColor: ui.border,
                          bgcolor: ui.panel,
                          p: 2,
                        }}
                      >
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Box
                            sx={{
                              display: "grid",
                              placeItems: "center",
                              width: 46,
                              height: 46,
                              borderRadius: 2,
                              bgcolor: transactionStatus.valid ? ui.verified : ui.invalid,
                              color: transactionStatus.valid ? "#059669" : "#DC2626",
                            }}
                          >
                            {transactionStatus.valid ? <VerifiedRoundedIcon /> : <LockOpenRoundedIcon />}
                          </Box>
                          <Box>
                            <Typography variant="body1" sx={{ fontWeight: 800 }}>
                              {transactionStatus.valid ? "Transaction verified" : "Awaiting validation"}
                            </Typography>
                            <Typography variant="body2" sx={{ color: ui.textMuted }}>
                              {transactionStatus.message || "Select a reference to validate evidence mapping."}
                            </Typography>
                          </Box>
                        </Stack>
                      </Paper>
                    </Stack>
                  </Grid>
                </Grid>

                <Paper
                  variant="outlined"
                  sx={{
                    borderRadius: 3,
                    borderColor: ui.border,
                    overflow: "hidden",
                    bgcolor: ui.panel,
                  }}
                >
                  <Box
                    sx={{
                      px: 2.5,
                      py: 2,
                      borderBottom: `1px solid ${ui.border}`,
                    }}
                  >
                    <Stack
                      direction={{ xs: "column", md: "row" }}
                      spacing={1.5}
                      justifyContent="space-between"
                      alignItems={{ xs: "flex-start", md: "center" }}
                    >
                      <Typography variant="h5" sx={{ fontWeight: 800, color: ui.textStrong }}>
                        Alerts & Evidence Feed
                      </Typography>
                      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                        <Chip
                          label={`${mediaItems.length} loaded`}
                          sx={{ bgcolor: ui.chipDanger, color: "#BE123C", fontWeight: 800 }}
                        />
                        <TextField
                          select
                          size="small"
                          label="Remarks"
                          value={selectedRemark}
                          onChange={(event) => setSelectedRemark(event.target.value)}
                          disabled={!selectedReferenceNo}
                          sx={{ minWidth: 220 }}
                        >
                          {remarkOptions.map((remark) => (
                            <MenuItem key={remark.id} value={remark.value}>
                              {remark.label}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Stack>
                    </Stack>
                  </Box>

                  <Stack spacing={1.5} sx={{ p: 2.5 }}>
                    {evidenceHighlights.map((highlight) => (
                      <Paper
                        key={highlight}
                        variant="outlined"
                        sx={{
                          borderRadius: 2.5,
                          px: 1.75,
                          py: 1.35,
                          borderColor: "rgba(244,63,94,0.10)",
                          bgcolor: ui.softDanger,
                        }}
                      >
                        <Typography variant="body2" sx={{ color: "#BE123C", fontWeight: 700 }}>
                          {highlight}
                        </Typography>
                      </Paper>
                    ))}

                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                      {mediaTabs.map((tab) => (
                        <Button
                          key={tab.value}
                          variant={activeMediaTab === tab.value ? "contained" : "outlined"}
                          startIcon={tab.icon}
                          disabled={!selectedReferenceNo}
                          onClick={() => setActiveMediaTab(tab.value)}
                          sx={{
                            borderRadius: 999,
                            textTransform: "none",
                            boxShadow: "none",
                            ...(activeMediaTab === tab.value
                              ? { bgcolor: "#1E3A8A" }
                              : { borderColor: ui.border, color: ui.textMuted }),
                          }}
                        >
                          {tab.label}
                        </Button>
                      ))}
                    </Stack>

                    {mediaLoading ? <LinearProgress /> : null}

                    {selectedReferenceNo ? (
                      <Grid container spacing={2}>
                        {mediaItems.map((item) => (
                          <Grid key={item.id} size={{ xs: 12, sm: 6, xl: 4 }}>
                            <Paper
                              variant="outlined"
                              sx={{
                                height: "100%",
                                overflow: "hidden",
                                borderRadius: 3,
                                borderColor: ui.border,
                              }}
                            >
                              <Box
                                sx={{
                                  height: 220,
                                  display: "grid",
                                  placeItems: "center",
                                  color: "#FFFFFF",
                                  background:
                                    item.kind === "image" && item.previewUrl
                                      ? `center / cover no-repeat url(${item.previewUrl})`
                                      : ui.mediaFallback,
                                }}
                              >
                                {item.kind !== "image" ? mediaIconMap[item.kind] : null}
                              </Box>
                              <Stack spacing={0.85} sx={{ p: 1.75 }}>
                                <Typography variant="body2" fontWeight={800} noWrap>
                                  {item.title}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" noWrap>
                                  {item.remark || "No remark supplied"}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {formatMediaDate(item.createdAt)}
                                </Typography>
                                <Button
                                  variant="outlined"
                                  startIcon={<VisibilityRoundedIcon />}
                                  sx={{ alignSelf: "flex-start", borderRadius: 999 }}
                                  onClick={() => setSelectedMediaItem(item)}
                                >
                                  Open
                                </Button>
                              </Stack>
                            </Paper>
                          </Grid>
                        ))}

                        {!mediaLoading && !mediaItems.length ? (
                          <Grid size={{ xs: 12 }}>
                            <Paper
                              variant="outlined"
                              sx={{
                                borderRadius: 3,
                                p: 5,
                                textAlign: "center",
                                color: ui.textMuted,
                              }}
                            >
                              <CollectionsRoundedIcon className="mb-1 !text-[42px]" />
                              <Typography variant="h6" fontWeight={800}>
                                No {activeMediaTab}s found
                              </Typography>
                              <Typography variant="body2">
                                No media was returned for this reference on the selected tab,
                                or the API response did not contain a usable file path.
                              </Typography>
                            </Paper>
                          </Grid>
                        ) : null}
                      </Grid>
                    ) : (
                      <Paper
                        variant="outlined"
                        sx={{
                          borderRadius: 3,
                          p: 5,
                          textAlign: "center",
                          color: ui.textMuted,
                        }}
                      >
                        <FolderOpenRoundedIcon className="mb-1 !text-[40px]" />
                        <Typography variant="h6" fontWeight={800}>
                          Pick a reference to load evidence
                        </Typography>
                        <Typography variant="body2">
                          Search and select a reference from the middle panel to populate the dashboard.
                        </Typography>
                      </Paper>
                    )}
                  </Stack>
                </Paper>
              </Stack>
            )}
          </Box>
        </Box>
      </Card>

      <PreviewDialog
        item={selectedMediaItem}
        open={Boolean(selectedMediaItem)}
        onClose={() => setSelectedMediaItem(null)}
      />
    </Page>
  );
};

export default EvidenceDashboard;
