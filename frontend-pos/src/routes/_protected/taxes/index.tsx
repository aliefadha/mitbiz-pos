import { createFileRoute } from '@tanstack/react-router';
import { TaxPage } from '@/components/taxes/tax-page';

export const Route = createFileRoute('/_protected/taxes/')({
  component: TaxPage,
});
