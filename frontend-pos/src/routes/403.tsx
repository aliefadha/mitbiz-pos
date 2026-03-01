import { createFileRoute } from '@tanstack/react-router';
import { ForbiddenPage } from '@/components/forbidden-page';

export const Route = createFileRoute('/403')({
  component: ForbiddenPageComponent,
});

function ForbiddenPageComponent() {
  return <ForbiddenPage />;
}
