import { useEffect, useMemo, useReducer, useState } from "react";
import {
  Box,
  Card,
  Grid,
  InputAdornment,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { useDispatch } from "react-redux";

import { Page } from "../../../components/common/Page";
import { useLoginMutation } from "../../../redux/api/evidancecollection";
import { setToken as setReduxToken } from "../../../redux/authSlice";
import { setToken as persistToken } from "../../../utils/auth";
import { CategoryTree } from "./components/CategoryTree";
import { EvidenceCard } from "./components/EvidenceCard";
import { FilterBar } from "./components/FilterBar";
import { ImageModal } from "./components/ImageModal";
import {
  mockCurrentViewer,
  mockEvidenceCategories,
  mockEvidenceItems,
  mockEvidenceUsers,
} from "./mockData";
import { createInitialEvidenceState, evidenceReducer } from "./reducer";
import {
  buildCategoryCountMap,
  buildCategoryPathMap,
  buildDescendantMap,
  buildUserLookup,
  filterEvidenceItems,
  getInitialExpandedCategoryIds,
} from "./selectors";
import type { EvidenceComment } from "./types";

const EvidenceCardSkeleton = () => (
  <Paper
    variant="outlined"
    sx={{
      borderRadius: 3,
    
      borderColor: "divider",
      backgroundColor: "background.paper",
      boxShadow: "none",
    }}
  >
    <Skeleton variant="rectangular" height={240} />
    <Stack spacing={1.25} sx={{ p: 2.5 }}>
      <Skeleton variant="text" width="45%" height={28} />
      <Skeleton variant="text" width="80%" height={34} />
      <Skeleton variant="text" width="100%" />
      <Skeleton variant="text" width="88%" />
      <Stack direction="row" spacing={1}>
        <Skeleton variant="rounded" width={88} height={32} />
        <Skeleton variant="rounded" width={110} height={32} />
      </Stack>
    </Stack>
  </Paper>
);

const filterCategoriesBySearch = (categories: typeof mockEvidenceCategories, query: string) => {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return categories;
  }

  const filterNodes = (nodes: typeof mockEvidenceCategories): typeof mockEvidenceCategories =>
    nodes.reduce<typeof mockEvidenceCategories>((acc, node) => {
      const filteredChildren = node.children?.length
        ? filterNodes(node.children)
        : [];
      const matchesSelf = node.name.toLowerCase().includes(normalizedQuery);

      if (matchesSelf || filteredChildren.length) {
        acc.push({
          ...node,
          children: filteredChildren,
        });
      }

      return acc;
    }, []);

  return filterNodes(categories);
};

const POPage = () => {
  const [categorySearchText, setCategorySearchText] = useState("");
  const dispatchRedux = useDispatch();
  const [login] = useLoginMutation();

  const initialState = useMemo(
    () =>
      createInitialEvidenceState(
        mockEvidenceItems,
        getInitialExpandedCategoryIds(mockEvidenceCategories),
      ),
    [],
  );

  const [state, dispatch] = useReducer(evidenceReducer, initialState);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      dispatch({ type: "finishLoading" });
    }, 700);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    let isActive = true;

    const autoLogin = async () => {
      try {
        const response = await login().unwrap();
        const token =
          typeof response?.token === "string" && response.token
            ? response.token
            : typeof response?.access_token === "string"
              ? response.access_token
              : null;

        if (!isActive || !token) {
          return;
        }

        persistToken(token);
        dispatchRedux(setReduxToken(token));
      } catch (error) {
        console.error("Evidence auto login failed", error);
      }
    };

    void autoLogin();

    return () => {
      isActive = false;
    };
  }, [dispatchRedux, login]);

  const categoryPathMap = useMemo(
    () => buildCategoryPathMap(mockEvidenceCategories),
    [],
  );
  const descendantMap = useMemo(
    () => buildDescendantMap(mockEvidenceCategories),
    [],
  );
  const categoryCountMap = useMemo(
    () => buildCategoryCountMap(mockEvidenceCategories, state.evidence),
    [state.evidence],
  );
  const visibleCategories = useMemo(
    () => filterCategoriesBySearch(mockEvidenceCategories, categorySearchText),
    [categorySearchText],
  );
  const userLookup = useMemo(() => buildUserLookup(mockEvidenceUsers), []);

  const filteredEvidence = useMemo(
    () =>
      filterEvidenceItems({
        evidence: state.evidence,
        filters: state.filters,
        selectedCategoryId: state.selectedCategoryId,
        descendantMap,
        categoryPathMap,
        userLookup,
      }),
    [
      state.evidence,
      state.filters,
      state.selectedCategoryId,
      descendantMap,
      categoryPathMap,
      userLookup,
    ],
  );

  const activeEvidence = state.activeEvidenceId
    ? state.evidence.find((item) => item.id === state.activeEvidenceId) ?? null
    : null;

  const selectedCategoryLabel = state.selectedCategoryId
    ? categoryPathMap[state.selectedCategoryId]?.join(" / ") ?? "Selected Category"
    : "All Evidence";

  const handleAddComment = (evidenceId: string, message: string) => {
    const comment: EvidenceComment = {
      id: `comment-${Date.now()}`,
      userId: mockCurrentViewer.id,
      userName: mockCurrentViewer.name,
      userRole: mockCurrentViewer.role,
      message,
      createdAt: new Date().toISOString(),
    };

    dispatch({
      type: "addComment",
      payload: {
        evidenceId,
        comment,
      },
    });
  };

  return (
    <Page module="evidance">
      <Card
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
           
           
        }}
      >
        <Box
          sx={{
            width: { xs: "100%", md: 260 },
            minWidth: { md: 260 },
            borderRight: { md: "1px solid rgba(15,23,42,0.10)" },
            borderBottom: { xs: "1px solid", md: "none" },
            borderColor: "divider",
            display: "flex",
            flexDirection: "column",
            alignSelf: "flex-start",
          }}
        >
          <Box sx={{ px: 2, pt: 2, pb: 1.25 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search Category..."
              value={categorySearchText}
              onChange={(event) => setCategorySearchText(event.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: "text.secondary", fontSize: 18 }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2.5,
                  bgcolor: "#F8FAFC",
                  "& fieldset": { borderColor: "rgba(15,23,42,0.12)" },
                  "&:hover fieldset": { borderColor: "rgba(15,23,42,0.2)" },
                  "&.Mui-focused fieldset": {
                    borderColor: "#FF8A3D",
                    borderWidth: "1.5px",
                  },
                },
                "& .MuiInputBase-input": {
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  py: 0.9,
                },
              }}
            />
          </Box>

          <Box
            sx={{
              px: 1,
              pb: 2,
            }}
          >
            <CategoryTree
              categories={visibleCategories}
              counts={categoryCountMap}
              loading={state.loading}
              selectedCategoryId={state.selectedCategoryId}
              expandedCategoryIds={state.expandedCategoryIds}
              onSelectCategory={(categoryId) =>
                dispatch({ type: "selectCategory", payload: categoryId })
              }
              onToggleCategory={(categoryId) =>
                dispatch({ type: "toggleCategory", payload: categoryId })
              }
              totalCount={state.evidence.length}
            />
          </Box>
        </Box>

        <Box
          sx={{
            flex: 1,
            px: 2,
            py: 2,
          }}
        >

          
                  


          <Stack spacing={2}>
            <Stack
              direction={{ xs: "column", xl: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "flex-end", lg: "flex-start" }}
              spacing={1.25}
              sx={{ mb: 0.5 }}
            >
             
             <div>
                <Box>
                    <Typography variant="h6"   sx={{ fontWeight: 800, }}>
                        {selectedCategoryLabel}
                    </Typography>
                   
                  </Box>

             </div>

              <FilterBar
                search={state.filters.search}
                userId={state.filters.userId}
                dateFrom={state.filters.dateFrom}
                dateTo={state.filters.dateTo}
                viewMode={state.viewMode}
                summaryLabel={`${filteredEvidence.length} items · ${visibleCategories.length} groups`}
                users={mockEvidenceUsers}
                onSearchChange={(value) =>
                  dispatch({
                    type: "setFilter",
                    payload: { key: "search", value },
                  })
                }
                onUserChange={(value) =>
                  dispatch({
                    type: "setFilter",
                    payload: { key: "userId", value },
                  })
                }
                onDateFromChange={(value) =>
                  dispatch({
                    type: "setFilter",
                    payload: { key: "dateFrom", value },
                  })
                }
                onDateToChange={(value) =>
                  dispatch({
                    type: "setFilter",
                    payload: { key: "dateTo", value },
                  })
                }
                onViewModeChange={(value) =>
                  dispatch({ type: "setViewMode", payload: value })
                }
                onClearFilters={() => dispatch({ type: "clearFilters" })}
              />
            </Stack>

            

            {state.loading ? (
              <Grid container spacing={2}>
                {Array.from({ length: 6 }).map((_, index) => (
                  <Grid
                    key={index}
                    size={{
                      xs: 12,
                      sm: state.viewMode === "grid" ? 6 : 12,
                      xl: state.viewMode === "grid" ? 4 : 12,
                    }}
                  >
                    <EvidenceCardSkeleton />
                  </Grid>
                ))}
              </Grid>
            ) : filteredEvidence.length ? (
              <Grid container spacing={2}>
                {filteredEvidence.map((item) => (
                  <Grid
                    key={item.id}
                    size={{
                      xs: 12,
                      sm: state.viewMode === "grid" ? 6 : 12,
                      xl: state.viewMode === "grid" ? 3 : 12,
                    }}
                  >
                    <EvidenceCard
                      evidence={item}
                      owner={userLookup[item.userId]}
                      categoryPath={
                        categoryPathMap[item.categoryId]?.join(" / ") ??
                        "Uncategorized"
                      }
                      viewMode={state.viewMode}
                      onOpen={(evidenceId) =>
                        dispatch({ type: "openModal", payload: evidenceId })
                      }
                      onToggleLike={(evidenceId) =>
                        dispatch({ type: "toggleLike", payload: evidenceId })
                      }
                    />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Paper
                variant="outlined"
                sx={{
                  borderRadius: 3,
                  p: { xs: 3, md: 5 },
                  textAlign: "center",
                  boxShadow: "none",
                  borderColor: "divider",
                  backgroundColor: "background.paper",
                }}
              >
                <Stack spacing={1.5} alignItems="center">
                  <Typography variant="h6" fontWeight={700}>
                    No evidence found
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ maxWidth: 460, color: "text.secondary" }}
                  >
                    Try a different category, clear the date range, or search with a
                    broader keyword to see more mock evidence.
                  </Typography>
                </Stack>
              </Paper>
            )}
          </Stack>
        </Box>

        <ImageModal
          open={Boolean(activeEvidence)}
          evidence={activeEvidence}
          owner={activeEvidence ? userLookup[activeEvidence.userId] : undefined}
          categoryPath={
            activeEvidence
              ? categoryPathMap[activeEvidence.categoryId]?.join(" / ") ??
                "Uncategorized"
              : ""
          }
          onClose={() => dispatch({ type: "closeModal" })}
          onToggleLike={(evidenceId) =>
            dispatch({ type: "toggleLike", payload: evidenceId })
          }
          onAddComment={(message) => {
            if (activeEvidence) {
              handleAddComment(activeEvidence.id, message);
            }
          }}
        />
      </Card>
    </Page>
  );
};

export default POPage;
