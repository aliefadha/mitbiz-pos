import { createFileRoute } from "@tanstack/react-router";
import { PaymentMethodPage } from "@/components/payment-methods/payment-method-page";

export const Route = createFileRoute("/_protected/payment-methods/")({
  component: PaymentMethodPage,
});
