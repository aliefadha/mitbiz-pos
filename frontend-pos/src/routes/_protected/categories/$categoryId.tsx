import { createFileRoute } from "@tanstack/react-router";
import { CategoryDetailPage } from "@/components/categories/category-detail-page";

export const Route = createFileRoute("/_protected/categories/$categoryId")({
  component: CategoryDetailPage,
});
