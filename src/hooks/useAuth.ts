"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useRouter } from "next/navigation";
import { Id } from "../../convex/_generated/dataModel";

export interface UserSession {
  _id: Id<"users">;
  email: string;
  fullName: string;
  employeeId: string;
  roleId: Id<"roles">;
  roleName: string;
  companyId?: Id<"companies">;
  permissions: string[];
}

export function useAuth() {
  const router = useRouter();
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("erp_session_token");
    setSessionToken(token);
    setIsInitialized(true);
  }, []);

  const currentSessionUser = useQuery(
    api.auth.getCurrentSessionUser,
    sessionToken ? { sessionToken } : "skip"
  );

  const logoutMutation = useMutation(api.auth.logoutSession);

  const login = (token: string, user: UserSession) => {
    localStorage.setItem("erp_session_token", token);
    localStorage.setItem("erp_user_data", JSON.stringify(user));
    setSessionToken(token);
    router.push("/dashboard");
  };

  const logout = async () => {
    if (sessionToken) {
      try {
        await logoutMutation({ sessionToken });
      } catch (err) {
        console.error("Logout session error:", err);
      }
    }
    localStorage.removeItem("erp_session_token");
    localStorage.removeItem("erp_user_data");
    setSessionToken(null);
    router.push("/login");
  };

  const hasPermission = (permissionCode: string): boolean => {
    if (!currentSessionUser) return false;
    if (currentSessionUser.roleName === "Super Admin") return true;
    return (
      currentSessionUser.permissions.includes("*") ||
      currentSessionUser.permissions.includes(permissionCode)
    );
  };

  return {
    user: currentSessionUser as UserSession | null,
    isLoading: !isInitialized || (Boolean(sessionToken) && currentSessionUser === undefined),
    isAuthenticated: Boolean(sessionToken && currentSessionUser),
    login,
    logout,
    hasPermission,
  };
}
