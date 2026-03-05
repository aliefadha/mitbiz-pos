import { createFileRoute } from '@tanstack/react-router';
import { CreateProductPage } from '@/components/products/create-product-page';

export const Route = createFileRoute('/_protected/products/new')({
  component: CreateProductPage,
});
