import { ChevronLeft, ChevronRight, Search, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Tenant } from '@/lib/api/tenants';
import type { User } from '@/lib/api/users';

interface UserListProps {
  users: User[];
  tenants: Tenant[];
  searchQuery: string;
  tenantFilter: string;
  currentPage: number;
  pageSize: number;
  totalUsers: number;
  totalPages: number;
  onSearchChange: (query: string) => void;
  onTenantFilterChange: (value: string) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function UserList({
  users,
  tenants,
  searchQuery,
  tenantFilter,
  currentPage,
  pageSize,
  totalUsers,
  totalPages,
  onSearchChange,
  onTenantFilterChange,
  onPageChange,
  onPageSizeChange,
}: UserListProps) {
  return (
    <Card className="py-4">
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Cari nama atau email..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={tenantFilter} onValueChange={onTenantFilterChange}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Semua Bisnis" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Bisnis</SelectItem>
              {tenants.map((tenant) => (
                <SelectItem key={tenant.id} value={tenant.id}>
                  {tenant.nama}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="[&_tr]:border-b-0">
              <TableRow className="bg-gray-50 hover:bg-gray-50 border-b-0">
                <TableHead className="text-gray-600 font-medium rounded-tl-lg rounded-bl-lg">
                  Nama
                </TableHead>
                <TableHead className="text-gray-600 font-medium">Email</TableHead>
                <TableHead className="text-gray-600 font-medium">Bisnis</TableHead>
                <TableHead className="text-gray-600 font-medium">Status</TableHead>
                {/* <TableHead className="text-gray-600 font-medium rounded-tr-lg rounded-br-lg text-center">
                  Aksi
                </TableHead> */}
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-gray-400">
                    <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Belum ada user yang ditemukan</p>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id} className="hover:bg-gray-50/50">
                    <TableCell className="font-medium text-gray-900">{user.name}</TableCell>
                    <TableCell className="text-gray-600">{user.email}</TableCell>
                    <TableCell className="text-gray-600">{user.tenant?.nama || '-'}</TableCell>
                    <TableCell>
                      <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-transparent text-xs font-medium px-2.5 py-0.5">
                        Aktif
                      </Badge>
                    </TableCell>
                    {/* <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="outline"
                          size="icon-sm"
                          className="text-gray-500 hover:text-gray-700"
                          title="Edit user"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon-sm"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 hover:border-red-200"
                          title="Hapus user"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell> */}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 0 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-2 py-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs sm:text-sm text-gray-600">
                Menampilkan {(currentPage - 1) * pageSize + 1} -{' '}
                {Math.min(currentPage * pageSize, totalUsers)} dari {totalUsers}
              </span>
              <Select
                value={pageSize.toString()}
                onValueChange={(value) => {
                  onPageSizeChange(parseInt(value));
                }}
              >
                <SelectTrigger className="w-[70px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onPageChange(page)}
                    className="w-8 sm:w-9"
                  >
                    {page}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
