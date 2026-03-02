import { KasirPage } from '@/components/kasir/kasir-page';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_protected/kasir/')({
  component: KasirPage,
});
