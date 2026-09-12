"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/lib/fetch-json";

export interface GithubPrefs {
  pinned: string[];
  hidden: string[];
  updatedAt: string | null;
}

const KEY = ["github", "prefs"] as const;

const EMPTY: GithubPrefs = { pinned: [], hidden: [], updatedAt: null };

async function fetchPrefs(): Promise<GithubPrefs> {
  return fetchJson<GithubPrefs>("/api/github/prefs", { cache: "no-store" });
}

async function putPrefs(patch: Partial<GithubPrefs>): Promise<GithubPrefs> {
  return fetchJson<GithubPrefs>("/api/github/prefs", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
}

/** Server-persisted pin/hide preferences for repositories. */
export function useGithubPrefs() {
  const queryClient = useQueryClient();
  const query = useQuery<GithubPrefs>({
    queryKey: KEY,
    queryFn: fetchPrefs,
    staleTime: 60_000,
  });

  const prefs = query.data ?? EMPTY;

  const mutation = useMutation({
    mutationFn: putPrefs,
    onMutate: async (patch) => {
      await queryClient.cancelQueries({ queryKey: KEY });
      const previous = queryClient.getQueryData<GithubPrefs>(KEY) ?? EMPTY;
      queryClient.setQueryData<GithubPrefs>(KEY, { ...previous, ...patch });
      return { previous };
    },
    onError: (_error, _patch, context) => {
      if (context?.previous) {
        queryClient.setQueryData(KEY, context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: KEY });
    },
  });

  const togglePin = (fullName: string) => {
    const pinned = prefs.pinned.includes(fullName)
      ? prefs.pinned.filter((name) => name !== fullName)
      : [fullName, ...prefs.pinned];
    mutation.mutate({ pinned });
  };

  const toggleHidden = (fullName: string) => {
    const hidden = prefs.hidden.includes(fullName)
      ? prefs.hidden.filter((name) => name !== fullName)
      : [fullName, ...prefs.hidden];
    mutation.mutate({ hidden });
  };

  return {
    prefs,
    isPinned: (fullName: string) => prefs.pinned.includes(fullName),
    isHidden: (fullName: string) => prefs.hidden.includes(fullName),
    togglePin,
    toggleHidden,
    isSaving: mutation.isPending,
  };
}
