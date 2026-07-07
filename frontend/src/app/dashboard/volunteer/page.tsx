"use client";

import React from "react";
import { DashboardContainer } from "../page";
import RoleGuard from "@/components/RoleGuard";

export default function VolunteerDashboardPage() {
  return (
    <RoleGuard allowedRoles={["volunteer"]}>
      <DashboardContainer defaultRole="volunteer" />
    </RoleGuard>
  );
}
