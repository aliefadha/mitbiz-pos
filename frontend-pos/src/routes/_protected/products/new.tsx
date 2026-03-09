import { createFileRoute, redirect } from '@tanstack/react-router';
import { CreateProductPage } from '@/components/products/create-product-page';
import { checkPermission } from '@/lib/permissions';

export const Route = createFileRoute('/_protected/products/new')({
  component: CreateProductPage,
  beforeLoad: async () => {
    const { allowed } = await checkPermission('products', 'create');
    if (!allowed) {
      throw redirect({ to: '/403' });
    }
  },
});
