
import type { Metadata } from "next";
import LandlordPropertyDetailClient from "./LandlordPropertyDetailClient";

interface PageProps {
  params: Promise<{
    propertyId: string;
  }>;
}

export const metadata: Metadata = {
  title: "Manage Property — RentEase",
  description: "View and manage your rental property listing.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function LandlordPropertyPage({
  params,
}: PageProps) {
  const { propertyId } = await params;

  return (
    <LandlordPropertyDetailClient propertyId={propertyId} />
  );
}
