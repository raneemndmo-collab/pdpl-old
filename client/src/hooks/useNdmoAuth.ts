import { useAuth } from "@/_core/hooks/useAuth";

export type NdmoRole = "executive" | "manager" | "analyst" | "viewer";

export function useNdmoAuth() {
  const auth = useAuth();

  const ndmoRole: NdmoRole = (auth.user as any)?.ndmoRole ?? "viewer";
  const isAdmin = auth.user?.role === "admin";

  // Permission checks based on NDMO role hierarchy
  const canManageLeaks = isAdmin || ndmoRole === "executive" || ndmoRole === "manager" || ndmoRole === "analyst";
  const canExport = isAdmin || ndmoRole === "executive" || ndmoRole === "manager";
  const canManageUsers = isAdmin || ndmoRole === "executive";
  const canCreateReports = isAdmin || ndmoRole === "executive" || ndmoRole === "manager";
  const canViewDashboard = true; // Everyone can view
  const canClassifyPii = isAdmin || ndmoRole === "executive" || ndmoRole === "manager" || ndmoRole === "analyst";

  return {
    ...auth,
    ndmoRole,
    isAdmin,
    canManageLeaks,
    canExport,
    canManageUsers,
    canCreateReports,
    canViewDashboard,
    canClassifyPii,
  };
}
