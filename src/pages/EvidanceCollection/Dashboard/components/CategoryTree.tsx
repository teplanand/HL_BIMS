import type { MouseEvent } from "react";
import {
  Box,
  Collapse,
  List,
  ListItemButton,
  ListItemText,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";

import type { EvidenceCategory } from "../types";

interface CategoryTreeProps {
  categories: EvidenceCategory[];
  counts: Record<string, number>;
  loading?: boolean;
  selectedCategoryId: string | null;
  expandedCategoryIds: string[];
  onSelectCategory: (categoryId: string | null) => void;
  onToggleCategory: (categoryId: string) => void;
  totalCount: number;
}

interface CategoryNodeProps {
  category: EvidenceCategory;
  counts: Record<string, number>;
  depth: number;
  selectedCategoryId: string | null;
  expandedCategoryIds: string[];
  onSelectCategory: (categoryId: string | null) => void;
  onToggleCategory: (categoryId: string) => void;
}

const CategoryNode = ({
  category,
  counts,
  depth,
  selectedCategoryId,
  expandedCategoryIds,
  onSelectCategory,
  onToggleCategory,
}: CategoryNodeProps) => {
  const hasChildren = Boolean(category.children?.length);
  const isExpanded = expandedCategoryIds.includes(category.id);
  const isSelected = selectedCategoryId === category.id;
  const childGroupCount = category.children?.length ?? 0;
  const secondaryLabel = hasChildren
    ? `${counts[category.id] ?? 0} items · ${childGroupCount} groups`
    : `${counts[category.id] ?? 0} items`;

  return (
    <Box>
      <ListItemButton
        onClick={() => onSelectCategory(category.id)}
        disableRipple
        selected={isSelected}
        sx={{
          borderRadius: 2,
          mb: 0.5,
          py: 1,
          px: 1.5,
          ml: depth ? 1.25 : 0,
          borderLeft: "3px solid transparent",
          transition: "background-color 0.15s ease, border-color 0.15s ease",
          "&.Mui-selected": {
            borderLeftColor: "#FF8A3D",
            "&:hover": {
              bgcolor: "#FFF4ED",
            },
          },
          "&:hover:not(.Mui-selected)": {
            bgcolor: "rgba(0,0,0,0.03)",
          },
        }}
      >
        {hasChildren ? (
          <Box
            component="span"
            onClick={(event: MouseEvent<HTMLSpanElement>) => {
              event.stopPropagation();
              onToggleCategory(category.id);
            }}
            sx={{
              width: 24,
              height: 24,
              mr: 1,
              borderRadius: 999,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#94A3B8",
              flexShrink: 0,
              "&:hover": {
                backgroundColor: "rgba(255,138,61,0.08)",
                color: "#FF8A3D",
              },
            }}
          >
            {isExpanded ? (
              <ExpandMoreRoundedIcon fontSize="small" />
            ) : (
              <ChevronRightRoundedIcon fontSize="small" />
            )}
          </Box>
        ) : (
          <Box component="span" sx={{ width: 24, mr: 1, flexShrink: 0 }} />
        )}

        <ListItemText
          primary={category.name}
          secondary={secondaryLabel}
          primaryTypographyProps={{
            fontWeight: isSelected ? 700 : 600,
            fontSize: "0.88rem",
            noWrap: true,
          }}
          secondaryTypographyProps={{
            fontWeight: 500,
            fontSize: "0.72rem",
            color: "#64748B",
            noWrap: true,
          }}
        />

        <Typography
          variant="caption"
        sx={{ ml: 1, color: isSelected ? "#FF8A3D" : "#94A3B8", fontWeight: 700 }}
      >
          {counts[category.id] ?? 0}
        </Typography>
      </ListItemButton>

      {hasChildren ? (
        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
          <Stack sx={{ pt: 0.25 }}>
            {category.children?.map((child) => (
              <CategoryNode
                key={child.id}
                category={child}
                counts={counts}
                depth={depth + 1}
                selectedCategoryId={selectedCategoryId}
                expandedCategoryIds={expandedCategoryIds}
                onSelectCategory={onSelectCategory}
                onToggleCategory={onToggleCategory}
              />
            ))}
          </Stack>
        </Collapse>
      ) : null}
    </Box>
  );
};

export const CategoryTree = ({
  categories,
  counts,
  loading = false,
  selectedCategoryId,
  expandedCategoryIds,
  onSelectCategory,
  onToggleCategory,
  totalCount,
}: CategoryTreeProps) => (
  <List disablePadding sx={{ px: 1, flex: 1 }}>
    <ListItemButton
      onClick={() => onSelectCategory(null)}
      disableRipple
      selected={selectedCategoryId === null}
      sx={{
        borderRadius: 2,
        mb: 0.5,
        px: 1.5,
        py: 1,
        borderLeft: "3px solid transparent",
        "&.Mui-selected": {
          borderLeftColor: "#FF8A3D",
          "&:hover": {
            bgcolor: "#FFF4ED",
          },
        },
        "&:hover:not(.Mui-selected)": {
          bgcolor: "rgba(0,0,0,0.03)",
        },
      }}
    >
      <Box component="span" sx={{ width: 24, mr: 1, flexShrink: 0 }} />
      <ListItemText
        primary="All Evidence"
        secondary={`${totalCount} items available`}
        primaryTypographyProps={{
          fontWeight: 700,
          fontSize: "0.88rem",
        }}
        secondaryTypographyProps={{
          fontWeight: 500,
          fontSize: "0.72rem",
          color: "#64748B",
        }}
      />
      <Typography
        variant="caption"
        sx={{ ml: 1, color: selectedCategoryId === null ? "#FF8A3D" : "#94A3B8", fontWeight: 700 }}
      >
        {totalCount}
      </Typography>
    </ListItemButton>

    {loading
      ? Array.from({ length: 7 }).map((_, index) => (
          <Skeleton
            key={index}
            variant="rounded"
            height={40}
            sx={{ ml: index > 1 ? 2 : 0 }}
          />
        ))
      : categories.map((category) => (
          <CategoryNode
            key={category.id}
            category={category}
            counts={counts}
            depth={0}
            selectedCategoryId={selectedCategoryId}
            expandedCategoryIds={expandedCategoryIds}
            onSelectCategory={onSelectCategory}
            onToggleCategory={onToggleCategory}
          />
        ))}
  </List>
);
