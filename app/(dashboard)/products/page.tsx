import { demoProducts } from "@/lib/dashboardData";
import ProductsClient from "@/components/dashboard/ProductsClient";

export default function ProductsPage() {
  return <ProductsClient products={demoProducts} />;
}
