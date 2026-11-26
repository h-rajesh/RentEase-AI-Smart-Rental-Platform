import type { Metadata } from "next";
import AdminPropertiesClient from "./AdminPropertiesClient";

export const metadata: Metadata = {
  title: "Property Management | RentEase Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminPropertiesPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8">
      <div>
        <p className="label-eyebrow">Admin workspace</p>
        <h1 className="mt-2 font-display text-2xl font-semibold">
          Property Management
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Review property listings, monitor verification status, and manage
          properties submitted by landlords.
        </p>
      </div>

      <AdminPropertiesClient />
    </main>
  );
}