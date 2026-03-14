import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { CategoryInfoCard } from '@/components/categories/category-info-card';
import { CategoryProductsList } from '@/components/categories/category-products-list';
import { useCategoryDetailPage } from '@/components/categories/hooks/use-category-detail-page';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { usePermissions } from '@/hooks/use-auth';
import { useSession } from '@/lib/auth-client';

export function CategoryDetailPage() {
  const { categoryId } = useParams({
    from: '/_protected/(tenant)/categories/$categoryId',
  });

  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const { data: session } = useSession();
  const tenantId = session?.user?.tenantId;

  const canReadProducts = hasPermission('products', 'read');

  const { category, isLoading } = useCategoryDetailPage(categoryId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        {canReadProducts && <Skeleton className="h-64 w-full" />}
      </div>
    );
  }

  if (!category || (tenantId && category.tenantId !== tenantId)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-gray-500">Kategori tidak ditemukan</p>
        <Button variant="link" onClick={() => window.history.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/categories' })}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h4 className="text-lg font-semibold m-0">Detail Kategori</h4>
          <p className="text-sm text-gray-500 m-0">Lihat informasi dan produk dalam kategori ini</p>
        </div>
      </div>

      <CategoryInfoCard category={category} />

      {canReadProducts && tenantId && (
        <CategoryProductsList categoryId={categoryId} tenantId={tenantId} />
      )}
    </div>
  );
}

export const Route = createFileRoute('/_protected/(tenant)/categories/$categoryId')({
  component: CategoryDetailPage,
});
