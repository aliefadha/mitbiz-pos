import { createFileRoute } from '@tanstack/react-router';
import { UsersPage } from '@/components/users/users-page';

export const Route = createFileRoute('/_protected/users/')({
  component: UsersPage,
});
