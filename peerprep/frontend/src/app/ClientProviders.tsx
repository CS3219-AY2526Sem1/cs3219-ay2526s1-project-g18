"use client";
import React from "react";
import { NavigationGuardProvider } from "next-navigation-guard";

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  // NavigationGuardProvider is a client-side provider; wrap any other
  // client-only providers you need here.
  return <NavigationGuardProvider>{children}</NavigationGuardProvider>;
}
