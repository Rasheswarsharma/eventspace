"use client";

import React from "react";
import { DashboardContainer } from "../page";
import RoleGuard from "@/components/RoleGuard";

export default function SuperAdminDashboardPage() {
  return (
    <RoleGuard allowedRoles={["super_admin"]}>
      <DashboardContainer defaultRole="super_admin" />
    </RoleGuard>
  );
}
