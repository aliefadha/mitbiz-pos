import { useQuery } from '@tanstack/react-query';
import { Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { type Tenant, tenantsApi } from '@/lib/api/tenants';

function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date));
}

interface UsersTabProps {
  tenant: Tenant;
}

export function UsersTab({ tenant }: UsersTabProps) {
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['tenant-users', tenant.slug],
    queryFn: () => tenantsApi.getUsers(tenant.slug),
  });

  const users = usersData?.data || [];

  if (isLoading) {
    return (
      <div className="space-y-3 pt-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <Users className="h-12 w-12 mb-3 opacity-40" />
        <p className="text-sm font-medium">Belum ada pengguna</p>
        <p className="text-xs mt-1">Pengguna yang terdaftar akan muncul di sini</p>
      </div>
    );
  }

  return (
    <div className="pt-2">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Bergabung</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-600 text-xs font-semibold">
                    {(user.name || user.email).charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium text-gray-900">{user.name || '—'}</span>
                </div>
              </TableCell>
              <TableCell className="text-gray-500">{user.email}</TableCell>
              <TableCell>
                <Badge>{user.role?.name || 'member'}</Badge>
              </TableCell>
              <TableCell className="text-gray-500">
                {user.createdAt ? formatDate(user.createdAt) : '—'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
