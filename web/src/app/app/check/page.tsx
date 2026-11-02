import type { Metadata } from "next";
import { CheckView } from "./check-view";

export const metadata: Metadata = { title: "表現チェック" };

export default function CheckPage() {
  return <CheckView />;
}
