"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function useProjects(companyId?: string) {
  const projects = useQuery(api.projects.listProjects, {
    companyId: companyId ? (companyId as any) : undefined,
  }) || [];

  return {
    projects,
    isLoading: projects === undefined,
  };
}
