import type { Metadata } from "next";
import { SetupForm } from "./setup-form";

export const metadata: Metadata = { title: "ブランド設定" };

export default function SetupPage() {
  return <SetupForm />;
}
