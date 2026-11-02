import type { Metadata } from "next";
import { RequireBrand } from "@/components/app-shell";
import { ReportView } from "./report-view";

export const metadata: Metadata = { title: "レポート" };

export default function ReportPage() {
  return (
    <RequireBrand>
      <ReportView />
    </RequireBrand>
  );
}
