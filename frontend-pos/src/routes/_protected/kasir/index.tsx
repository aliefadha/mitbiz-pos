import { createFileRoute } from '@tanstack/react-router';
import { KasirPage } from '@/components/kasir/kasir-page';

export const Route = createFileRoute('/_protected/kasir/')({
  component: KasirPage,
});
