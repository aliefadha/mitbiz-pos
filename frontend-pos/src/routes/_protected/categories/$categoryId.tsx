import { createFileRoute } from '@tanstack/react-router';
import { CategoryDetailPage } from '@/components/categories/category-detail-page';
import { ErrorPage } from '@/components/error-page';
import { ForbiddenPage } from '@/components/forbidden-page';
import { checkPermission, ForbiddenError } from '@/lib/permissions';

export const Route = createFileRoute('/_protected/categories/$categoryId')({
  component: CategoryDetailPage,
  beforeLoad: async () => {
    const { allowed } = await checkPermission('categories', 'read');
    if (!allowed) {
      throw new ForbiddenError('categories');
    }
  },
  errorComponent: ({ error }) => {
    if (error instanceof ForbiddenError) {
      return <ForbiddenPage resource={error.resource} />;
    }
    return <ErrorPage reset={() => window.location.reload()} />;
  },
});
