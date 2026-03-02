import { createFileRoute } from '@tanstack/react-router';
import { ProductPage } from '@/components/products/product-page';
import { ErrorPage } from '@/components/error-page';
import { ForbiddenPage } from '@/components/forbidden-page';
import { checkPermission, ForbiddenError } from '@/lib/permissions';

export const Route = createFileRoute('/_protected/products/')({
  component: ProductPage,
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
