import { useState } from "react";
import {
  alpha,
  Avatar,
  Box,
  Button,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import { formatDistanceToNow } from "date-fns";

import type { EvidenceComment } from "../types";

interface CommentSectionProps {
  comments: EvidenceComment[];
  onAddComment: (message: string) => void;
}

export const CommentSection = ({
  comments,
  onAddComment,
}: CommentSectionProps) => {
  const [draft, setDraft] = useState("");

  const handleSubmit = () => {
    const trimmedDraft = draft.trim();
    if (!trimmedDraft) {
      return;
    }

    onAddComment(trimmedDraft);
    setDraft("");
  };

  return (
    <Stack spacing={2.5}>
      <Box>
        <Typography variant="h6" fontWeight={800}>
          Comments
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Add a quick note or review remark for this evidence item.
        </Typography>
      </Box>

      <Paper
        variant="outlined"
        sx={{
          p: 1.5,
          borderRadius: 3,
          backgroundColor: "background.default",
          borderColor: "divider",
        }}
      >
        <Stack spacing={1.5}>
          <TextField
            multiline
            minRows={3}
            placeholder="Write a comment"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            fullWidth
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2.5,
                bgcolor: "background.paper",
                "& fieldset": { borderColor: "divider" },
                "&.Mui-focused fieldset": {
                  borderColor: "primary.main",
                  borderWidth: "1.5px",
                },
              },
            }}
          />
          <Stack direction="row" justifyContent="flex-end">
            <Button
              variant="contained"
              endIcon={<SendRoundedIcon />}
              onClick={handleSubmit}
              disabled={!draft.trim()}
              sx={{
                borderRadius: 999,
                backgroundColor: "primary.main",
                boxShadow: (theme) => `0 4px 12px ${alpha(theme.palette.primary.main, 0.28)}`,
                "&:hover": {
                  backgroundColor: "primary.dark",
                  boxShadow: (theme) => `0 6px 16px ${alpha(theme.palette.primary.main, 0.36)}`,
                },
              }}
            >
              Add Comment
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Stack
        divider={<Divider flexItem />}
        sx={{
          maxHeight: 360,
          overflowY: "auto",
          pr: 0.5,
        }}
      >
        {comments.length ? (
          comments.map((comment) => (
            <Stack key={comment.id} direction="row" spacing={1.5} sx={{ py: 1.5 }}>
              <Avatar sx={{ width: 36, height: 36 }}>
                {comment.userName.slice(0, 1)}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={0.75}
                  alignItems={{ xs: "flex-start", sm: "center" }}
                >
                  <Typography variant="body2" fontWeight={700}>
                    {comment.userName}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    {comment.userRole}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    {formatDistanceToNow(new Date(comment.createdAt), {
                      addSuffix: true,
                    })}
                  </Typography>
                </Stack>
                <Typography variant="body2" color="text.primary" sx={{ mt: 0.75 }}>
                  {comment.message}
                </Typography>
              </Box>
            </Stack>
          ))
        ) : (
          <Paper
            variant="outlined"
            sx={{
              p: 2.5,
              borderRadius: 3,
              textAlign: "center",
              color: "text.secondary",
              backgroundColor: "background.default",
              borderColor: "divider",
            }}
          >
            <Typography variant="body2">
              No comments yet. Add the first note for this evidence item.
            </Typography>
          </Paper>
        )}
      </Stack>
    </Stack>
  );
};
