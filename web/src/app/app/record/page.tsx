import type { Metadata } from "next";
import { Suspense } from "react";
import { RequireBrand } from "@/components/app-shell";
import { RecordView } from "./record-view";

export const metadata: Metadata = { title: "回答の記録" };

export default function RecordPage() {
  return (
    <RequireBrand>
      <Suspense fallback={<div aria-busy="true" className="h-40 animate-pulse rounded-xl bg-surface-muted" />}>
        <RecordView />
      </Suspense>
    </RequireBrand>
  );
}
