// @ts-nocheck
import { Suspense } from "react";
import { Metadata } from 'next'
import { PricingContent } from "@/components/pricing/pricing-content";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { generateMetadata, pageConfigs } from "@/lib/seo";

export const metadata: Metadata = generateMetadata(pageConfigs.pricing);

export default function PricingPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <PricingContent />
    </Suspense>
  );
}
