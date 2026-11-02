import type { Metadata } from "next";
import { Overview } from "./overview";

export const metadata: Metadata = { title: "概要" };

export default function AppHome() {
  return <Overview />;
}
