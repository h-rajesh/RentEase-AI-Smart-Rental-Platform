
import type { Metadata } from "next";
import AdminPropertyReviewClient from "./AdminPropertyReviewClient";

interface PageProps {
  params: Promise<{ propertyId: string }>;
}

export const metadata: Metadata = {
  title: "Review Property | RentEase Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminPropertyReviewPage({
  params,
}: PageProps) {
  const { propertyId } = await params;

  return <AdminPropertyReviewClient propertyId={propertyId} />;
}
