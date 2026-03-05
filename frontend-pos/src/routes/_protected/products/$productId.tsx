import { createFileRoute } from '@tanstack/react-router';
import { ErrorPage } from '@/components/error-page';
import { ForbiddenPage } from '@/components/forbidden-page';
import { ProductDetailPage } from '@/components/products/product-detail-page';
import { checkPermission, ForbiddenError } from '@/lib/permissions';

export const Route = createFileRoute('/_protected/products/$productId')({
  component: ProductDetailPage,
  beforeLoad: async () => {
    const { allowed } = await checkPermission('products', 'read');
    if (!allowed) {
      throw new ForbiddenError('products');
    }
  },
  errorComponent: ({ error }) => {
    if (error instanceof ForbiddenError) {
      return <ForbiddenPage resource={error.resource} />;
    }
    return <ErrorPage reset={() => window.location.reload()} />;
  },
});
