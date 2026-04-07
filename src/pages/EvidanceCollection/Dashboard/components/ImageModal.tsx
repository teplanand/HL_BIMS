import {
  alpha,
  Avatar,
  Box,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import FavoriteBorderRoundedIcon from "@mui/icons-material/FavoriteBorderRounded";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import { format } from "date-fns";

import { CommentSection } from "./CommentSection";
import type { EvidenceItem, EvidenceUser } from "../types";

interface ImageModalProps {
  open: boolean;
  evidence: EvidenceItem | null;
  owner?: EvidenceUser;
  categoryPath: string;
  onClose: () => void;
  onToggleLike: (evidenceId: string) => void;
  onAddComment: (message: string) => void;
}

export const ImageModal = ({
  open,
  evidence,
  owner,
  categoryPath,
  onClose,
  onToggleLike,
  onAddComment,
}: ImageModalProps) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("md"));

  if (!evidence) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
      fullScreen={fullScreen}
      PaperProps={{
        sx: {
          borderRadius: fullScreen ? 0 : 3,
          overflow: "hidden",
          border: "1px solid",
          borderColor: "divider",
          boxShadow: theme.palette.mode === "dark"
            ? "0 20px 48px rgba(0,0,0,0.45)"
            : "0 20px 48px rgba(15,23,42,0.18)",
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          borderBottom: "1px solid",
          borderColor: "divider",
          backgroundColor: "background.paper",
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h6" fontWeight={800} noWrap>
            {evidence.title}
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }} noWrap>
            {categoryPath}
          </Typography>
        </Box>

        <IconButton
          onClick={onClose}
          sx={{
            color: "text.secondary",
            "&:hover": {
              backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.08),
              color: "primary.main",
            },
          }}
        >
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Stack direction={{ xs: "column", md: "row" }} sx={{ minHeight: 560 }}>
          <Box
            sx={{
              flex: 1.15,
              backgroundColor: "background.default",
              borderRight: { md: "1px solid" },
              borderColor: "divider",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: { xs: 320, md: "100%" },
            }}
          >
            <Box
              component="img"
              src={evidence.imageUrl}
              alt={evidence.title}
              sx={{
                width: "100%",
                height: "100%",
                maxHeight: { xs: 420, md: 760 },
                objectFit: "cover",
              }}
            />
          </Box>

          <Stack
            spacing={3}
            sx={{
              flex: 0.85,
              p: { xs: 2, md: 3 },
              minWidth: 0,
            }}
          >
            <Stack spacing={2}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Avatar src={owner?.avatarUrl} alt={owner?.name}>
                  {owner?.name?.slice(0, 1) ?? "U"}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body1" fontWeight={700}>
                    {owner?.name ?? "Unknown User"}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    {owner?.role ?? "Team Member"}
                  </Typography>
                </Box>
              </Stack>

              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                {evidence.description}
              </Typography>

              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip
                  icon={
                    evidence.likedByViewer ? (
                      <FavoriteRoundedIcon />
                    ) : (
                      <FavoriteBorderRoundedIcon />
                    )
                  }
                  label={`${evidence.likesCount} likes`}
                  color={evidence.likedByViewer ? "error" : "default"}
                  onClick={() => onToggleLike(evidence.id)}
                  clickable
                  sx={
                    evidence.likedByViewer
                      ? {
                          backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.12),
                          color: "primary.main",
                          borderColor: (theme) => alpha(theme.palette.primary.main, 0.28),
                          fontWeight: 700,
                        }
                      : {
                          backgroundColor: "background.default",
                          color: "text.secondary",
                          borderColor: "divider",
                          fontWeight: 700,
                        }
                  }
                />
                <Chip
                  icon={<ChatBubbleOutlineRoundedIcon />}
                  label={`${evidence.comments.length} comments`}
                  variant="outlined"
                  sx={{
                    backgroundColor: "background.default",
                    color: "text.secondary",
                    borderColor: "divider",
                    fontWeight: 700,
                  }}
                />
                <Chip
                  icon={<AccessTimeRoundedIcon />}
                  label={format(new Date(evidence.createdAt), "dd MMM yyyy, hh:mm a")}
                  variant="outlined"
                  sx={{
                    backgroundColor: "background.default",
                    color: "text.secondary",
                    borderColor: "divider",
                    fontWeight: 700,
                  }}
                />
              </Stack>
            </Stack>

            <Divider sx={{ borderColor: "divider" }} />

            <Stack spacing={1.5}>
              <Typography variant="subtitle2" sx={{ color: "text.secondary" }}>
                Category Path
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                {categoryPath}
              </Typography>
            </Stack>

            <CommentSection
              comments={evidence.comments}
              onAddComment={onAddComment}
            />
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
};
