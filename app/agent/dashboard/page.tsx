import { AgentDashboard } from "@/components/agent/agent-dashboard";
import { SiteFooter } from "@/components/home/site-footer";

export const metadata = {
  title: "Agent Dashboard | HealthiConnect",
  description:
    "Track referred patients, active memberships, and commission earnings for insurance agents.",
};

export default function AgentDashboardPage() {
  return (
    <>
      <AgentDashboard />
      <SiteFooter />
    </>
  );
}
