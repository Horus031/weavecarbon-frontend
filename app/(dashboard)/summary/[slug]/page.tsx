import SummaryClient from "@/components/dashboard/SummaryClient";

interface SummaryPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function SummaryPage({ params }: SummaryPageProps) {
  const { slug } = await params;

  return <SummaryClient productId={slug} />;
}