import type {
  EvidenceCategory,
  EvidenceFilters,
  EvidenceItem,
  EvidenceUser,
} from "./types";

export const flattenCategories = (
  categories: EvidenceCategory[],
): EvidenceCategory[] =>
  categories.flatMap((category) => [
    category,
    ...(category.children ? flattenCategories(category.children) : []),
  ]);

export const getInitialExpandedCategoryIds = (
  categories: EvidenceCategory[],
): string[] => categories.map((category) => category.id);

export const buildCategoryPathMap = (
  categories: EvidenceCategory[],
  parentPath: string[] = [],
  map: Record<string, string[]> = {},
): Record<string, string[]> => {
  categories.forEach((category) => {
    const path = [...parentPath, category.name];
    map[category.id] = path;

    if (category.children?.length) {
      buildCategoryPathMap(category.children, path, map);
    }
  });

  return map;
};

export const buildDescendantMap = (
  categories: EvidenceCategory[],
  map: Record<string, string[]> = {},
): Record<string, string[]> => {
  const visit = (category: EvidenceCategory): string[] => {
    const childIds = category.children?.flatMap((child) => visit(child)) ?? [];
    const ids = [category.id, ...childIds];
    map[category.id] = ids;
    return ids;
  };

  categories.forEach(visit);

  return map;
};

export const buildCategoryCountMap = (
  categories: EvidenceCategory[],
  evidence: EvidenceItem[],
): Record<string, number> => {
  const descendantMap = buildDescendantMap(categories);
  const counts: Record<string, number> = {};

  Object.entries(descendantMap).forEach(([categoryId, scopedIds]) => {
    counts[categoryId] = evidence.filter((item) =>
      scopedIds.includes(item.categoryId),
    ).length;
  });

  return counts;
};

export const buildUserLookup = (
  users: EvidenceUser[],
): Record<string, EvidenceUser> =>
  users.reduce<Record<string, EvidenceUser>>((acc, user) => {
    acc[user.id] = user;
    return acc;
  }, {});

export const filterEvidenceItems = ({
  evidence,
  filters,
  selectedCategoryId,
  descendantMap,
  categoryPathMap,
  userLookup,
}: {
  evidence: EvidenceItem[];
  filters: EvidenceFilters;
  selectedCategoryId: string | null;
  descendantMap: Record<string, string[]>;
  categoryPathMap: Record<string, string[]>;
  userLookup: Record<string, EvidenceUser>;
}) => {
  const searchQuery = filters.search.trim().toLowerCase();
  const scopedCategoryIds = selectedCategoryId
    ? descendantMap[selectedCategoryId] ?? [selectedCategoryId]
    : null;

  return evidence
    .filter((item) => {
      if (scopedCategoryIds && !scopedCategoryIds.includes(item.categoryId)) {
        return false;
      }

      if (filters.userId && item.userId !== filters.userId) {
        return false;
      }

      const itemDate = item.createdAt.slice(0, 10);
      if (filters.dateFrom && itemDate < filters.dateFrom) {
        return false;
      }

      if (filters.dateTo && itemDate > filters.dateTo) {
        return false;
      }

      if (!searchQuery) {
        return true;
      }

      const user = userLookup[item.userId];
      const haystack = [
        item.title,
        item.description,
        user?.name ?? "",
        categoryPathMap[item.categoryId]?.join(" / ") ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(searchQuery);
    })
    .sort((left, right) => +new Date(right.createdAt) - +new Date(left.createdAt));
};
