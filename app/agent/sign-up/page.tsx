import { AgentAuthPage } from "@/components/agent/agent-auth-page";

export const metadata = {
  title: "Agent Sign Up | HealthiConnect",
  description:
    "Register as a HealthiConnect insurance agent and receive your unique referral Agent ID.",
};

export default function AgentSignUpPage() {
  return <AgentAuthPage mode="sign-up" />;
}
