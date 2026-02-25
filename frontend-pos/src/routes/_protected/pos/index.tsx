import { createFileRoute } from "@tanstack/react-router";
import { PosPage } from "@/components/orders/pos-page";

export const Route = createFileRoute("/_protected/pos/")({
  component: PosPage,
});
