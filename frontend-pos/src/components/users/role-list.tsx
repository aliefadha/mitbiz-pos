import { Plus, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Role } from '@/lib/api/roles';
import { cn } from '@/lib/utils';

interface RoleWithCount extends Role {
  userCount?: number;
}

interface RoleListProps {
  roles: RoleWithCount[];
  selectedRoleId: string | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectRole: (roleId: string | null) => void;
  onCreateRole: () => void;
}

export function RoleList({
  roles,
  selectedRoleId,
  searchQuery,
  onSearchChange,
  onSelectRole,
  onCreateRole,
}: RoleListProps) {
  return (
    <Card className="w-1/3 min-w-[300px]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">Daftar Role</CardTitle>
        <div className="relative mt-2">
          <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari role..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[500px]">
          <div className="px-4 pb-4 space-y-2">
            {roles.map((role) => (
              <div
                key={role.id}
                onClick={() => onSelectRole(selectedRoleId === role.id ? null : role.id)}
                className={cn(
                  'w-full text-left p-4 rounded-lg border transition-all cursor-pointer',
                  selectedRoleId === role.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50 hover:shadow-sm'
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">{role.name}</span>
                  <Badge variant={role.isActive ? 'default' : 'secondary'} className="text-xs">
                    {role.isActive ? 'Aktif' : 'Nonaktif'}
                  </Badge>
                </div>
                {role.description && (
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                    {role.description}
                  </p>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                  <Users className="h-4 w-4" />
                  <span>{role.userCount || 0} pengguna</span>
                  {role.isDefault && (
                    <Badge variant="outline" className="text-xs ml-auto">
                      Default
                    </Badge>
                  )}
                </div>
              </div>
            ))}
            {roles.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">Tidak ada role ditemukan</div>
            )}
            {/* Tambah Role Card - Hidden when searching */}
            {!searchQuery && (
              <div
                onClick={onCreateRole}
                className="w-full text-left p-4 rounded-lg border border-dashed border-muted-foreground/30 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer flex items-center gap-3"
              >
                <div className="h-10 w-10 rounded-full flex items-center justify-center">
                  <Plus className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-medium mb-1">Tambah Role Baru</div>
                  <p className="text-xs">Buat role baru</p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
