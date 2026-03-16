import { useQuery } from '@tanstack/react-query';
import { Building2 } from 'lucide-react';
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
import { type Outlet, tenantsApi } from '@/lib/api/tenants';

interface OutletsTabProps {
  slug: string;
}

export function OutletsTab({ slug }: OutletsTabProps) {
  const { data: outletsData, isLoading } = useQuery({
    queryKey: ['tenant-outlets', slug],
    queryFn: () => tenantsApi.getOutlets(slug),
  });

  const outlets: Outlet[] = outletsData?.data || [];

  if (isLoading) {
    return (
      <div className="space-y-3 pt-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (outlets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <Building2 className="h-12 w-12 mb-3 opacity-40" />
        <p className="text-sm font-medium">Belum ada outlet</p>
        <p className="text-xs mt-1">Outlet yang terdaftar akan muncul di sini</p>
      </div>
    );
  }

  return (
    <div className="pt-2">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama Outlet</TableHead>
            <TableHead>Kode</TableHead>
            <TableHead>Alamat</TableHead>
            <TableHead>No. Telepon</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {outlets.map((outlet) => (
            <TableRow key={outlet.id}>
              <TableCell className="font-medium text-gray-900">{outlet.nama}</TableCell>
              <TableCell>
                <code className="bg-gray-100 px-2 py-0.5 rounded text-xs text-gray-600">
                  {outlet.kode}
                </code>
              </TableCell>
              <TableCell className="text-gray-500">{outlet.alamat || '—'}</TableCell>
              <TableCell className="text-gray-500">{outlet.noHp || '—'}</TableCell>
              <TableCell>
                <Badge
                  className={
                    outlet.isActive
                      ? 'bg-green-100 text-green-700 hover:bg-green-100'
                      : 'bg-red-100 text-red-700 hover:bg-red-100'
                  }
                >
                  {outlet.isActive ? 'Aktif' : 'Nonaktif'}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
