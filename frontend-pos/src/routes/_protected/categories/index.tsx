import { createFileRoute } from '@tanstack/react-router';
import { CategoryPage } from '@/components/categories/category-page';

export const Route = createFileRoute('/_protected/categories/')({
  component: CategoryPage,
});
