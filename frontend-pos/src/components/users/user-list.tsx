import {
  ChevronLeft,
  ChevronRight,
  Edit2,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  Trash2,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { OWNER_ROLE_ID } from '@/constants/role-ids';
import type { Role } from '@/lib/api/roles';
import type { User } from '@/lib/api/users';

interface RoleWithCount extends Role {
  userCount?: number;
}

interface UserListProps {
  displayedUsers: User[];
  filteredUsers: User[];
  selectedRole?: RoleWithCount;
  searchQuery: string;
  isLoading: boolean;
  currentPage: number;
  pageSize: number;
  totalUsers: number;
  totalPages: number;
  onSearchChange: (query: string) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onCreateUser: () => void;
  onEditUser: (user: User) => void;
  onEditRole: () => void;
  onDeleteRole: () => void;
  onManagePermissions: () => void;
}

export function UserList({
  displayedUsers,
  filteredUsers,
  selectedRole,
  searchQuery,
  isLoading,
  currentPage,
  pageSize,
  totalUsers,
  totalPages,
  onSearchChange,
  onPageChange,
  onPageSizeChange,
  onCreateUser,
  onEditUser,
  onEditRole,
  onDeleteRole,
  onManagePermissions,
}: UserListProps) {
  return (
    <Card className="flex-1">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-semibold">
              {selectedRole ? `Pengguna - ${selectedRole.name}` : 'Semua Pengguna'}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {selectedRole
                ? `${filteredUsers.length} pengguna dengan role ini`
                : `${filteredUsers.length} total pengguna`}
            </p>
          </div>
          {selectedRole && (
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" title="Aksi Role">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onManagePermissions}>
                    <Settings className="mr-2 h-4 w-4" />
                    Kelola Hak Akses
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onEditRole}>
                    <Edit2 className="mr-2 h-4 w-4" />
                    Edit Role
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={onDeleteRole}
                    className="text-destructive"
                    disabled={selectedRole.userCount! > 0}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Hapus Role
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button onClick={onCreateUser} size="sm">
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Tambah Pengguna</span>
              </Button>
            </div>
          )}
        </div>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari pengguna..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>Belum ada pengguna</p>
            {selectedRole && (
              <p className="text-sm">Klik "Tambah Pengguna" untuk menambahkan pengguna baru</p>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <Table>
                <TableHeader className="[&_tr]:border-b-0">
                  <TableRow className="bg-gray-100 hover:bg-gray-100 border-b-0">
                    <TableHead className="text-gray-800 font-medium">Nama</TableHead>
                    <TableHead className="text-gray-800 font-medium">Email</TableHead>
                    <TableHead className="text-gray-800 font-medium hidden md:table-cell">
                      Cabang
                    </TableHead>
                    <TableHead className="text-gray-800 font-medium hidden md:table-cell">
                      Role
                    </TableHead>
                    <TableHead className="text-gray-800 font-medium w-[80px] md:w-[100px] rounded-tr-lg rounded-br-lg text-right">
                      Aksi
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedUsers.map((user) => (
                    <TableRow key={user.id} className="hover:bg-white">
                      <TableCell>
                        <div>{user.name}</div>
                        <div className="text-xs text-muted-foreground md:hidden">
                          {user.role?.name || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="break-all">{user.email}</span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {user.outlet?.nama || '-'}
                      </TableCell>
                      <TableCell className="capitalize hidden md:table-cell">
                        {user.role?.name || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEditUser(user)}
                          disabled={user.role?.id === OWNER_ROLE_ID}
                          title={
                            user.role?.id === OWNER_ROLE_ID
                              ? 'Owner role cannot be edited'
                              : 'Edit user'
                          }
                        >
                          <Edit2 className="h-4 w-4 mr-1" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-2 py-4 mt-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs sm:text-sm text-gray-600">
                    Menampilkan {(currentPage - 1) * pageSize + 1} -{' '}
                    {Math.min(currentPage * pageSize, totalUsers)} dari {totalUsers}
                  </span>
                  <Select
                    value={pageSize.toString()}
                    onValueChange={(value) => {
                      onPageSizeChange(parseInt(value));
                      onPageChange(1);
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
          </>
        )}
      </CardContent>
    </Card>
  );
}
