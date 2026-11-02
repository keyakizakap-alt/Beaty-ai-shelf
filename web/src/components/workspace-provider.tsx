"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { loadWorkspace, saveWorkspace } from "@/lib/storage";
import type { Workspace } from "@/lib/types";

interface Ctx {
  /** undefined = 読み込み中, null = 未作成 */
  workspace: Workspace | null | undefined;
  update: (next: Workspace | null) => void;
  saveError: boolean;
}

const WorkspaceContext = createContext<Ctx | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspace, setWorkspace] = useState<Workspace | null | undefined>(undefined);
  const [saveError, setSaveError] = useState(false);

  useEffect(() => {
    // ブラウザ保存領域からの読み込みはマウント後にしか行えないため、ここで状態に反映する
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWorkspace(loadWorkspace());
  }, []);

  const update = useCallback((next: Workspace | null) => {
    setWorkspace(next);
    if (next) setSaveError(!saveWorkspace(next));
  }, []);

  return <WorkspaceContext.Provider value={{ workspace, update, saveError }}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace(): Ctx {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("WorkspaceProvider の内側で使ってください");
  return ctx;
}
