"use client";

import { useEffect, useRef } from "react";
import { trpc } from "~/trpc/client";
import { useAuthStore } from "~/stores/auth";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { _setUser, _setLoading, _setLogout, _setLogoutAll } = useAuthStore();

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const refreshMutation = trpc.auth.refreshToken.useMutation();
  const logoutMutation = trpc.auth.logout.useMutation();
  const logoutAllMutation = trpc.auth.logoutAll.useMutation();
  const refreshAttempted = useRef(false);

  useEffect(() => {
    if (!meQuery.data) return;
    refreshAttempted.current = false;
    _setUser(meQuery.data);
    _setLoading(false);
  }, [meQuery.data]);

  // On 401, attempt a silent token refresh once then re-fetch
  useEffect(() => {
    if (!meQuery.error) return;
    if (refreshAttempted.current || refreshMutation.isPending) {
      _setUser(null);
      _setLoading(false);
      return;
    }
    refreshAttempted.current = true;
    refreshMutation.mutate(undefined, {
      onSuccess: () => meQuery.refetch(),
      onError: () => {
        _setUser(null);
        _setLoading(false);
      },
    });
  }, [meQuery.error]);

  useEffect(() => {
    _setLoading(meQuery.isLoading || refreshMutation.isPending);
  }, [meQuery.isLoading, refreshMutation.isPending]);

  useEffect(() => {
    _setLogout(async () => {
      await logoutMutation.mutateAsync(undefined);
      _setUser(null);
      window.location.href = "/login";
    });
    _setLogoutAll(async () => {
      await logoutAllMutation.mutateAsync(undefined);
      _setUser(null);
      window.location.href = "/login";
    });
  }, []);

  return <>{children}</>;
}
