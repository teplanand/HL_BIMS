import type { EvidenceAction, EvidenceItem, EvidenceState } from "./types";

export const createInitialEvidenceState = (
  evidence: EvidenceItem[],
  expandedCategoryIds: string[],
): EvidenceState => ({
  loading: true,
  selectedCategoryId: null,
  expandedCategoryIds,
  activeEvidenceId: null,
  viewMode: "grid",
  filters: {
    search: "",
    userId: "",
    dateFrom: "",
    dateTo: "",
  },
  evidence,
});

export const evidenceReducer = (
  state: EvidenceState,
  action: EvidenceAction,
): EvidenceState => {
  switch (action.type) {
    case "finishLoading":
      return {
        ...state,
        loading: false,
      };

    case "selectCategory":
      return {
        ...state,
        selectedCategoryId: action.payload,
      };

    case "toggleCategory":
      return {
        ...state,
        expandedCategoryIds: state.expandedCategoryIds.includes(action.payload)
          ? state.expandedCategoryIds.filter((id) => id !== action.payload)
          : [...state.expandedCategoryIds, action.payload],
      };

    case "setViewMode":
      return {
        ...state,
        viewMode: action.payload,
      };

    case "setFilter":
      return {
        ...state,
        filters: {
          ...state.filters,
          [action.payload.key]: action.payload.value,
        },
      };

    case "clearFilters":
      return {
        ...state,
        filters: {
          search: "",
          userId: "",
          dateFrom: "",
          dateTo: "",
        },
      };

    case "toggleLike":
      return {
        ...state,
        evidence: state.evidence.map((item) => {
          if (item.id !== action.payload) {
            return item;
          }

          const likedByViewer = !item.likedByViewer;
          return {
            ...item,
            likedByViewer,
            likesCount: item.likesCount + (likedByViewer ? 1 : -1),
          };
        }),
      };

    case "addComment":
      return {
        ...state,
        evidence: state.evidence.map((item) =>
          item.id === action.payload.evidenceId
            ? {
                ...item,
                comments: [action.payload.comment, ...item.comments],
              }
            : item,
        ),
      };

    case "openModal":
      return {
        ...state,
        activeEvidenceId: action.payload,
      };

    case "closeModal":
      return {
        ...state,
        activeEvidenceId: null,
      };

    default:
      return state;
  }
};
