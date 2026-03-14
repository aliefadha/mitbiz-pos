import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_protected/(global)/all-users/')({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/_protected/(global)/all-users/"!</div>;
}
