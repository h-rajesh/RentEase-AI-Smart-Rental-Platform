import type { Metadata } from "next";
import EditPropertyClient from "./EditPropertyClient";

interface PageProps {
  params: Promise<{ propertyId: string }>;
}

export const metadata: Metadata = {
  title: "Edit Property — RentEase",
  description: "Edit your rental property listing.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function EditPropertyPage({
  params,
}: PageProps) {
  const { propertyId } = await params;

  return <EditPropertyClient propertyId={propertyId} />;
}