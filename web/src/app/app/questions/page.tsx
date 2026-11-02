import type { Metadata } from "next";
import { RequireBrand } from "@/components/app-shell";
import { QuestionsView } from "./questions-view";

export const metadata: Metadata = { title: "質問" };

export default function QuestionsPage() {
  return (
    <RequireBrand>
      <QuestionsView />
    </RequireBrand>
  );
}
