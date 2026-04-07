export type EvidenceViewMode = "grid" | "list";

export interface EvidenceUser {
  id: string;
  name: string;
  role: string;
  avatarUrl?: string;
}

export interface EvidenceComment {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  message: string;
  createdAt: string;
}

export interface EvidenceCategory {
  id: string;
  name: string;
  children?: EvidenceCategory[];
}

export interface EvidenceItem {
  id: string;
  title: string;
  imageUrl: string;
  description: string;
  categoryId: string;
  createdAt: string;
  userId: string;
  likesCount: number;
  likedByViewer: boolean;
  comments: EvidenceComment[];
}

export interface EvidenceFilters {
  search: string;
  userId: string;
  dateFrom: string;
  dateTo: string;
}

export interface EvidenceState {
  loading: boolean;
  selectedCategoryId: string | null;
  expandedCategoryIds: string[];
  activeEvidenceId: string | null;
  viewMode: EvidenceViewMode;
  filters: EvidenceFilters;
  evidence: EvidenceItem[];
}

export type EvidenceAction =
  | { type: "finishLoading" }
  | { type: "selectCategory"; payload: string | null }
  | { type: "toggleCategory"; payload: string }
  | { type: "setViewMode"; payload: EvidenceViewMode }
  | {
      type: "setFilter";
      payload: {
        key: keyof EvidenceFilters;
        value: string;
      };
    }
  | { type: "clearFilters" }
  | { type: "toggleLike"; payload: string }
  | {
      type: "addComment";
      payload: {
        evidenceId: string;
        comment: EvidenceComment;
      };
    }
  | { type: "openModal"; payload: string }
  | { type: "closeModal" };
