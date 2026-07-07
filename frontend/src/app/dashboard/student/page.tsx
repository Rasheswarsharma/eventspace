"use client";

import React from "react";
import { DashboardContainer } from "../page";
import RoleGuard from "@/components/RoleGuard";

export default function StudentDashboardPage() {
  return (
    <RoleGuard allowedRoles={["student"]}>
      <DashboardContainer defaultRole="student" />
    </RoleGuard>
  );
}
