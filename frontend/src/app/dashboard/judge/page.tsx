"use client";

import React from "react";
import { DashboardContainer } from "../page";
import RoleGuard from "@/components/RoleGuard";

export default function JudgeDashboardPage() {
  return (
    <RoleGuard allowedRoles={["judge"]}>
      <DashboardContainer defaultRole="judge" />
    </RoleGuard>
  );
}
