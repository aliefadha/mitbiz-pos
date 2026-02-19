import { createFileRoute } from "@tanstack/react-router";
import { ProductDetailPage } from "@/components/products/product-detail-page";

export const Route = createFileRoute("/_protected/tenants/$slug/products/$productId")({
  component: ProductDetailPage,
});
