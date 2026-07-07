"use client";

import React from "react";
import { DashboardContainer } from "../page";
import RoleGuard from "@/components/RoleGuard";

export default function AdminDashboardPage() {
  return (
    <RoleGuard allowedRoles={["society_president", "society_admin"]}>
      <DashboardContainer defaultRole="society_president" />
    </RoleGuard>
  );
}
