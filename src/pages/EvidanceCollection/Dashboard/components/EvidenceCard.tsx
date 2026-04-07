import {
  alpha,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import FavoriteBorderRoundedIcon from "@mui/icons-material/FavoriteBorderRounded";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import { format } from "date-fns";

import type { EvidenceItem, EvidenceUser, EvidenceViewMode } from "../types";

interface EvidenceCardProps {
  evidence: EvidenceItem;
  owner?: EvidenceUser;
  categoryPath: string;
  viewMode: EvidenceViewMode;
  onOpen: (evidenceId: string) => void;
  onToggleLike: (evidenceId: string) => void;
}

export const EvidenceCard = ({
  evidence,
  owner,
  categoryPath,
  viewMode,
  onOpen,
  onToggleLike,
}: EvidenceCardProps) => {
  const isList = viewMode === "list";

  return (
    <Card
      sx={{
        height: "100%",
        borderRadius: 3,
        border: "1px solid",
        borderColor: "rgba(15,23,42,0.10)",
        boxShadow: "none",
        overflow: "hidden",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: "0 12px 32px rgba(15,23,42,0.12)",
          borderColor: "rgba(15,23,42,0.2)",
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: isList ? { xs: "column", sm: "row" } : "column",
          height: "100%",
        }}
      >
        <Box
          sx={{
            position: "relative",
            minHeight: isList ? { xs: 240, sm: 220 } : 240,
            width: isList ? { xs: "100%", sm: 300 } : "100%",
            flexShrink: 0,
            cursor: "pointer",
          }}
          onClick={() => onOpen(evidence.id)}
        >
          <CardMedia
            component="img"
            image={evidence.imageUrl}
            alt={evidence.title}
            loading="lazy"
            sx={{
              height: "100%",
              width: "100%",
              objectFit: "cover",
            }}
          />

          <Chip
            label={categoryPath}
            size="small"
            sx={{
              position: "absolute",
              left: 12,
              top: 12,
              maxWidth: "calc(100% - 24px)",
              backgroundColor: (theme) =>
                theme.palette.mode === "dark"
                  ? "rgba(15, 23, 42, 0.86)"
                  : "rgba(15, 23, 42, 0.78)",
              color: "common.white",
              fontWeight: 700,
            }}
          />
        </Box>

        <CardContent
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: 2,
            p: 1,
            flexGrow: 1,
          }}
        >
          <Stack spacing={1.5}>
            <Stack direction="row" justifyContent="space-between" spacing={2}>
              <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
                <Avatar
                  src={owner?.avatarUrl}
                  alt={owner?.name}
                  sx={{ width: 36, height: 36 }}
                >
                  {owner?.name?.slice(0, 1) ?? "U"}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={700} noWrap>
                    {owner?.name ?? "Unknown User"}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary" }} noWrap>
                    {owner?.role ?? "Team Member"}
                  </Typography>

                  <Stack
                direction="row"
                spacing={0.5}
                alignItems="center"
                color="text.secondary"
                sx={{ flexShrink: 0 }}
              >
               
                <Typography variant="caption">
                  {format(new Date(evidence.createdAt), "dd MMM yyyy, hh:mm a")}
                </Typography>
              </Stack>

                </Box>
              </Stack>

              
            </Stack>

            <Box>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                {evidence.title}
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                {evidence.description}
              </Typography>
            </Box>
          </Stack>

          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            flexWrap="wrap"
            spacing={1}
          >
            <Stack direction="row" spacing={1}>
              <IconButton
                aria-label={evidence.likedByViewer ? "Unlike evidence" : "Like evidence"}
                color={evidence.likedByViewer ? "error" : "default"}
                onClick={() => onToggleLike(evidence.id)}
              >
                {evidence.likedByViewer ? (
                  <FavoriteRoundedIcon />
                ) : (
                  <FavoriteBorderRoundedIcon />
                )}
              </IconButton>
              <Chip
                icon={<ChatBubbleOutlineRoundedIcon />}
                label={`${evidence.comments.length} comments`}
                variant="outlined"
                sx={{
                  borderColor: "divider",
                  color: "text.secondary",
                  backgroundColor: "background.default",
                  fontWeight: 700,
                }}
              />
              <Chip
                label={`${evidence.likesCount} likes`}
                variant="outlined"
                color={evidence.likedByViewer ? "error" : "default"}
                sx={
                  evidence.likedByViewer
                    ? {
                        backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.12),
                        color: "primary.main",
                        borderColor: (theme) => alpha(theme.palette.primary.main, 0.28),
                        fontWeight: 700,
                      }
                    : {
                        borderColor: "divider",
                        color: "text.secondary",
                        backgroundColor: "background.default",
                        fontWeight: 700,
                      }
                }
              />
            </Stack>

            <Button
              variant="contained"
              endIcon={<VisibilityRoundedIcon />}
              onClick={() => onOpen(evidence.id)}
              sx={{
                backgroundColor: "primary.main",
                boxShadow: (theme) => `0 4px 12px ${alpha(theme.palette.primary.main, 0.28)}`,
                "&:hover": {
                  backgroundColor: "primary.dark",
                  boxShadow: (theme) => `0 6px 16px ${alpha(theme.palette.primary.main, 0.36)}`,
                },
              }}
            >
              View Details
            </Button>
          </Stack>
        </CardContent>
      </Box>
    </Card>
  );
};
