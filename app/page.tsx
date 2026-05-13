import { loadState } from "@/lib/storage";
import { DashboardClient } from "./DashboardClient";

export const revalidate = 60;

export default async function Page() {
  const state = await loadState();
  return <DashboardClient state={state} />;
}
