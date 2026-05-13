import { loadState } from "@/lib/storage";
import { Dashboard } from "./Dashboard";

export const dynamic = "force-dynamic";

export default async function Page() {
  const state = await loadState();
  return <Dashboard state={state} />;
}
