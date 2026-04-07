export const givePermission = (module: string, right: string): boolean => {
  try {
    const raw = localStorage.getItem("permissions");
    if (!raw) return false;

    const permissions = JSON.parse(raw);

    // Backwards compatibility: some auth responses return a flat array of rights
    // (e.g. ["add", "edit", "view", "delete"]). In that case, treat it as
    // a global permission set (module is ignored).
    if (Array.isArray(permissions)) {
      return permissions.includes(right);
    }

    // Modern structure: permissions are indexed by module name.
    return Array.isArray(permissions[module])
      ? permissions[module].includes(right)
      : false;
  } catch {
    return false;
  }
};
