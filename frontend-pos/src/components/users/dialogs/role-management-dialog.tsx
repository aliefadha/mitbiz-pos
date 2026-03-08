import { Check, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Role } from '@/lib/api/roles';
import type { User } from '@/lib/api/users';

interface RoleManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedRole?: Role;
  usersWithRole: User[];
  activeResources: Array<{ id: string; name: string; isActive: boolean }>;
  permissionMap: Map<string, Set<string>>;
  isLoadingPermissions: boolean;
  isLoadingResources: boolean;
  hasUnsavedChanges: boolean;
  isPending: boolean;
  onPermissionChange: (resource: string, action: string, checked: boolean) => void;
  onSavePermissions: () => void;
  onCancelChanges: () => void;
  actions: readonly string[];
}

export function RoleManagementDialog({
  open,
  onOpenChange,
  selectedRole,
  activeResources,
  permissionMap,
  isLoadingPermissions,
  isLoadingResources,
  hasUnsavedChanges,
  isPending,
  onPermissionChange,
  onSavePermissions,
  onCancelChanges,
  actions,
}: RoleManagementDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Kelola Hak Akses - {selectedRole?.name}
          </DialogTitle>
          <DialogDescription>Atur izin akses untuk role ini</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4 ">
          {/* Role Info */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant={selectedRole?.isActive ? 'default' : 'secondary'}>
              {selectedRole?.isActive ? 'Aktif' : 'Nonaktif'}
            </Badge>
          </div>
          {/* Permissions Table */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                Hak Akses
                {hasUnsavedChanges && (
                  <Badge variant="secondary" className="text-xs">
                    Ada perubahan
                  </Badge>
                )}
              </h4>
            </div>

            <ScrollArea className="h-[400px] border rounded-md">
              {isLoadingPermissions || isLoadingResources ? (
                <div className="p-4 space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <Table>
                  <TableHeader className="[&_tr]:border-b-0 sticky top-0 bg-white">
                    <TableRow className="bg-gray-100 hover:bg-gray-100 border-b-0">
                      <TableHead className="text-gray-800 font-medium">Resource</TableHead>
                      <TableHead className="text-gray-800 font-medium text-center w-[80px]">
                        Create
                      </TableHead>
                      <TableHead className="text-gray-800 font-medium text-center w-[80px]">
                        Read
                      </TableHead>
                      <TableHead className="text-gray-800 font-medium text-center w-[80px]">
                        Update
                      </TableHead>
                      <TableHead className="text-gray-800 font-medium text-center w-[80px]">
                        Delete
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeResources.map((resource) => {
                      const resourcePermissions = permissionMap.get(resource.name) || new Set();

                      return (
                        <TableRow key={resource.id}>
                          <TableCell className="font-medium capitalize">{resource.name}</TableCell>
                          {actions.map((action) => (
                            <TableCell key={action} className="text-center">
                              <Checkbox
                                checked={resourcePermissions.has(action)}
                                onCheckedChange={(checked) =>
                                  onPermissionChange(resource.name, action, checked as boolean)
                                }
                              />
                            </TableCell>
                          ))}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          {hasUnsavedChanges ? (
            <>
              <Button variant="outline" onClick={onCancelChanges}>
                <X className="mr-2 h-4 w-4" />
                Batal
              </Button>
              <Button onClick={onSavePermissions} disabled={isPending}>
                <Check className="mr-2 h-4 w-4" />
                {isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
            </>
          ) : (
            <Button onClick={() => onOpenChange(false)}>Tutup</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
