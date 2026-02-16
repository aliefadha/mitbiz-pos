import { createFileRoute } from "@tanstack/react-router";
import { AccountPage } from "@/components/account/account-page";

export const Route = createFileRoute("/_protected/account/")({
  component: AccountPage,
});
