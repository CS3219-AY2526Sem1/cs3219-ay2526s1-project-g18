"use client";
import React from "react";

export function Dialog({ open, children }: { open: boolean; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">{children}</div>
    </div>
  );
}

export function DialogText({ children }: { children: React.ReactNode }) {
  return <div className="text-gray-900 dark:text-gray-100 mb-4">{children}</div>;
}

export function DialogActions({ children }: { children: React.ReactNode }) {
  return <div className="flex justify-end gap-3 mt-4">{children}</div>;
}

export function DialogButton({ children, onClick, variant = "default" }: { children: React.ReactNode; onClick?: () => void; variant?: "default" | "destructive" }) {
  const base = "px-4 py-2 rounded-md text-sm font-medium";
  const cls = variant === "destructive" ? base + " bg-red-600 text-white hover:bg-red-700" : base + " bg-gray-200 text-gray-900 hover:bg-gray-300";
  return (
    <button onClick={onClick} className={cls}>
      {children}
    </button>
  );
}