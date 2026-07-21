"use client";

import { useAuth } from "./useAuth";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function useCurrentUser() {
  const { user, isAuthenticated, isLoading: isAuthLoading, logout } = useAuth();

  const userProfile = useQuery(
    api.users.getUserProfile,
    user?._id ? { userId: user._id as any } : "skip"
  );

  return {
    user: userProfile || user,
    isAuthenticated,
    isLoading: isAuthLoading || (user?._id && userProfile === undefined),
    logout,
  };
}
