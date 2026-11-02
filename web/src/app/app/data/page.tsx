import type { Metadata } from "next";
import { DataView } from "./data-view";

export const metadata: Metadata = { title: "データ管理" };

export default function DataPage() {
  return <DataView />;
}
