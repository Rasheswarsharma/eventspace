"use client";

import React from "react";
import { DashboardContainer } from "../page";
import RoleGuard from "@/components/RoleGuard";

export default function ParticipantDashboardPage() {
  return (
    <RoleGuard allowedRoles={["student", "participant"]}>
      <DashboardContainer defaultRole="student" />
    </RoleGuard>
  );
}
