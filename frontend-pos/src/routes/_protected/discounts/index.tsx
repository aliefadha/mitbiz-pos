import { createFileRoute } from "@tanstack/react-router";
import { DiscountPage } from "@/components/discounts/discount-page";

export const Route = createFileRoute("/_protected/discounts/")({
  component: DiscountPage,
});
