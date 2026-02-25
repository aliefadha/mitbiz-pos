import { createFileRoute } from "@tanstack/react-router";
import { OrderDetailPage } from "@/components/orders/order-detail-page";

export const Route = createFileRoute("/_protected/orders/$orderId")({
  component: OrderDetailPage,
});
