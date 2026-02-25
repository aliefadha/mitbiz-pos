import { createFileRoute } from "@tanstack/react-router";
import { OrderPage } from "@/components/orders/order-page";

export const Route = createFileRoute("/_protected/orders/")({
  component: OrderPage,
});
