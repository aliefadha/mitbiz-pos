import { createFileRoute } from "@tanstack/react-router";
import { OutletPage } from "@/components/outlets/outlet-page";

export const Route = createFileRoute("/_protected/outlets/")({
  component: OutletPage,
});
