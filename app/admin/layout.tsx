import { AdminLayout } from "@/components/admin/admin-layout";
import type { ReactNode } from "react";

export const metadata = {
  title: "Admin | HealthiConnect",
  description: "Administration portal for HealthiConnect.",
};

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
}
