import { createFileRoute } from '@tanstack/react-router';
import { TenantProductDetailPage } from '@/components/tenants/tenant-product-detail-page';

export const Route = createFileRoute('/_protected/tenants/$slug/products/$productId')({
  component: TenantProductDetailPage,
});
