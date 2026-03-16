import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { outletsApi } from '@/lib/api/outlets';
import { getRolePermissions, groupPermissions, type Role, rolesApi } from '@/lib/api/roles';
import { type CreateUserDto, type User, usersApi } from '@/lib/api/users';
import { useSession } from '@/lib/auth-client';

const ACTIONS = ['create', 'read', 'update', 'delete'] as const;

export interface CreateRoleForm {
  name: string;
  description?: string;
  scope: 'tenant' | 'global';
}

export interface EditRoleForm {
  name: string;
  description?: string;
  isActive: boolean;
}

export interface CreateUserForm {
  name: string;
  email: string;
  password: string;
  outletId?: string;
}

export interface EditUserForm {
  name: string;
  email: string;
  roleId: string;
  outletId?: string;
}

export function useUsersPage() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const tenantId = session?.user?.tenantId;

  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [roleSearchQuery, setRoleSearchQuery] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [createRoleModalOpen, setCreateRoleModalOpen] = useState(false);
  const [createUserModalOpen, setCreateUserModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editUserModalOpen, setEditUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [roleManagementOpen, setRoleManagementOpen] = useState(false);
  const [permissionChanges, setPermissionChanges] = useState<Map<string, Set<string>>>(new Map());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const createRoleForm = useForm<CreateRoleForm>({
    defaultValues: {
      name: '',
      description: '',
      scope: 'tenant',
    },
  });

  const editForm = useForm<EditRoleForm>({
    defaultValues: {
      name: '',
      description: '',
      isActive: true,
    },
  });

  const createUserForm = useForm<CreateUserForm>({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      outletId: '',
    },
  });

  const editUserForm = useForm<EditUserForm>({
    defaultValues: {
      name: '',
      email: '',
      roleId: '',
      outletId: '',
    },
  });

  // Fetch roles
  const { data: rolesData, isLoading: isLoadingRoles } = useQuery({
    queryKey: ['roles', tenantId],
    queryFn: () => rolesApi.getAll({ tenantId, scope: tenantId ? 'tenant' : undefined }),
    enabled: !!tenantId,
  });

  // Fetch users
  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users', tenantId, currentPage, pageSize, userSearchQuery],
    queryFn: () => usersApi.getUsers({ tenantId, page: currentPage, limit: pageSize }),
    enabled: !!tenantId,
  });

  // Fetch resources for permission management
  const { data: resourcesData, isLoading: isLoadingResources } = useQuery({
    queryKey: ['resources'],
    queryFn: () => rolesApi.getResources(),
    enabled: !!tenantId,
  });

  // Fetch outlets for user creation
  const { data: outletsData, isLoading: isLoadingOutlets } = useQuery({
    queryKey: ['outlets', tenantId],
    queryFn: () => outletsApi.getAll({ tenantId }),
    enabled: !!tenantId,
  });

  // Fetch permissions for selected role
  const { data: permissionsData, isLoading: isLoadingPermissions } = useQuery({
    queryKey: ['permissions', selectedRoleId],
    queryFn: () => getRolePermissions(selectedRoleId!),
    enabled: !!selectedRoleId && roleManagementOpen,
  });

  // Combine roles with user counts
  const rolesWithCount = useMemo(() => {
    if (!rolesData || !usersData?.users) return [];

    return rolesData
      .filter((role) => (tenantId ? role.tenantId === tenantId : true))
      .map((role) => ({
        ...role,
        userCount: usersData.users.filter((u) => u.roleId === role.id).length,
      }))
      .sort((a, b) => (b.userCount || 0) - (a.userCount || 0));
  }, [rolesData, usersData, tenantId]);

  const filteredRoles = useMemo(() => {
    if (!roleSearchQuery) return rolesWithCount;
    return rolesWithCount.filter(
      (role) =>
        role.name.toLowerCase().includes(roleSearchQuery.toLowerCase()) ||
        role.description?.toLowerCase().includes(roleSearchQuery.toLowerCase())
    );
  }, [rolesWithCount, roleSearchQuery]);

  const selectedRole = useMemo(
    () => rolesWithCount.find((r) => r.id === selectedRoleId),
    [rolesWithCount, selectedRoleId]
  );

  // Filter users by selected role
  const filteredUsers = useMemo(() => {
    if (!usersData?.users) return [];
    let users = usersData.users;

    // Filter by selected role
    if (selectedRoleId) {
      users = users.filter((u) => u.roleId === selectedRoleId);
    }

    // Filter by search query
    if (userSearchQuery) {
      const query = userSearchQuery.toLowerCase();
      users = users.filter(
        (u) => u.name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query)
      );
    }

    return users;
  }, [usersData, selectedRoleId, userSearchQuery]);

  // Pagination - use filtered users count when role is selected
  const totalUsers =
    selectedRoleId || userSearchQuery ? filteredUsers.length : (usersData?.meta?.total ?? 0);

  const totalPages =
    selectedRoleId || userSearchQuery
      ? Math.ceil(filteredUsers.length / pageSize)
      : (usersData?.meta?.totalPages ?? 0);

  // Displayed users - apply pagination to filtered users
  const displayedUsers = useMemo(() => {
    if (selectedRoleId || userSearchQuery) {
      const start = (currentPage - 1) * pageSize;
      return filteredUsers.slice(start, start + pageSize);
    }
    return usersData?.users ?? [];
  }, [filteredUsers, currentPage, pageSize, selectedRoleId, userSearchQuery, usersData]);

  const usersWithRole = useMemo(() => {
    if (!usersData?.users || !selectedRoleId) return [];
    return usersData.users.filter((u) => u.roleId === selectedRoleId);
  }, [usersData, selectedRoleId]);

  const groupedPermissions = useMemo(() => {
    if (!permissionsData) return [];
    return groupPermissions(permissionsData);
  }, [permissionsData]);

  const permissionMap = useMemo(() => {
    const map = new Map<string, Set<string>>();

    groupedPermissions.forEach((group) => {
      map.set(group.resource, new Set(group.actions));
    });

    permissionChanges.forEach((actions, resource) => {
      map.set(resource, new Set(actions));
    });

    return map;
  }, [groupedPermissions, permissionChanges]);

  // Mutations
  const createRoleMutation = useMutation({
    mutationFn: (data: CreateRoleForm) => rolesApi.create({ ...data, tenantId: tenantId! }),
    onSuccess: () => {
      toast.success('Role berhasil dibuat');
      setCreateRoleModalOpen(false);
      createRoleForm.reset();
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal membuat role');
    },
  });

  const createUserMutation = useMutation({
    mutationFn: (data: CreateUserForm) =>
      usersApi.createUser({
        ...data,
        roleId: selectedRoleId!,
        tenantId: tenantId!,
      } as CreateUserDto),
    onSuccess: () => {
      toast.success('Pengguna berhasil dibuat');
      setCreateUserModalOpen(false);
      createUserForm.reset();
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal membuat pengguna');
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: EditUserForm }) => usersApi.updateUser(id, data),
    onSuccess: () => {
      toast.success('Pengguna berhasil diupdate');
      setEditUserModalOpen(false);
      setSelectedUser(null);
      editUserForm.reset();
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal mengupdate pengguna');
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: EditRoleForm }) => rolesApi.update(id, data),
    onSuccess: () => {
      toast.success('Role berhasil diupdate');
      setEditModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal mengupdate role');
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: (id: string) => rolesApi.delete(id),
    onSuccess: () => {
      toast.success('Role berhasil dihapus');
      setDeleteModalOpen(false);
      setSelectedRoleId(null);
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal menghapus role');
    },
  });

  const setPermissionsMutation = useMutation({
    mutationFn: ({
      roleId,
      permissions,
    }: {
      roleId: string;
      permissions: { resource: string; action: string }[];
    }) => rolesApi.setPermissions(roleId, { permissions }),

    onMutate: async ({ permissions }) => {
      await queryClient.cancelQueries({ queryKey: ['permissions', selectedRoleId] });
      const previousPermissions = queryClient.getQueryData(['permissions', selectedRoleId]);
      queryClient.setQueryData(['permissions', selectedRoleId], permissions);
      setPermissionChanges(new Map());
      setHasUnsavedChanges(false);
      return { previousPermissions };
    },

    onSuccess: () => {
      toast.success('Hak akses berhasil disimpan');
    },

    onError: (_err, _variables, context) => {
      if (context?.previousPermissions) {
        queryClient.setQueryData(['permissions', selectedRoleId], context.previousPermissions);
      }
      setHasUnsavedChanges(true);
      toast.error('Gagal menyimpan hak akses');
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions', selectedRoleId] });
    },
  });

  // Handlers
  const handlePermissionChange = (resource: string, action: string, checked: boolean) => {
    setPermissionChanges((prev) => {
      const next = new Map(prev);
      const currentActions = new Set(next.get(resource) || permissionMap.get(resource) || []);

      if (checked) {
        currentActions.add(action);
      } else {
        currentActions.delete(action);
      }

      next.set(resource, currentActions);
      return next;
    });
    setHasUnsavedChanges(true);
  };

  const handleSavePermissions = () => {
    if (!selectedRoleId) return;

    const permissions: { resource: string; action: string }[] = [];
    permissionMap.forEach((actions, resource) => {
      actions.forEach((action) => {
        permissions.push({ resource, action });
      });
    });

    setPermissionsMutation.mutate({ roleId: selectedRoleId, permissions });
  };

  const handleEditRole = (role: Role) => {
    editForm.reset({
      name: role.name,
      description: role.description || '',
      isActive: role.isActive,
    });
    setEditModalOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    editUserForm.reset({
      name: user.name,
      email: user.email,
      roleId: user.roleId || '',
      outletId: user.outletId || '',
    });
    setEditUserModalOpen(true);
  };

  const handleOpenRoleManagement = (roleId: string) => {
    setSelectedRoleId(roleId);
    setPermissionChanges(new Map());
    setHasUnsavedChanges(false);
    setRoleManagementOpen(true);
  };

  const handleSelectRole = (roleId: string | null) => {
    setSelectedRoleId(roleId);
    setCurrentPage(1);
  };

  const activeResources = resourcesData?.filter((r) => r.isActive) || [];

  return {
    // State
    selectedRoleId,
    selectedRole,
    selectedUser,
    roleSearchQuery,
    userSearchQuery,
    createRoleModalOpen,
    createUserModalOpen,
    editModalOpen,
    editUserModalOpen,
    deleteModalOpen,
    roleManagementOpen,
    permissionChanges,
    hasUnsavedChanges,
    currentPage,
    pageSize,
    tenantId,

    // Forms
    createRoleForm,
    editForm,
    createUserForm,
    editUserForm,

    // Data
    rolesWithCount,
    filteredRoles,
    filteredUsers,
    displayedUsers,
    usersWithRole,
    groupedPermissions,
    permissionMap,
    activeResources,
    outletsData,

    // Loading states
    isLoadingRoles,
    isLoadingUsers,
    isLoadingResources,
    isLoadingPermissions,
    isLoadingOutlets,

    // Pagination
    totalUsers,
    totalPages,

    // Setters
    setRoleSearchQuery,
    setUserSearchQuery,
    setCreateRoleModalOpen,
    setCreateUserModalOpen,
    setEditModalOpen,
    setEditUserModalOpen,
    setSelectedUser,
    setDeleteModalOpen,
    setRoleManagementOpen,
    setPermissionChanges,
    setHasUnsavedChanges,
    setCurrentPage,
    setPageSize,

    // Mutations
    createRoleMutation,
    createUserMutation,
    updateUserMutation,
    updateRoleMutation,
    deleteRoleMutation,
    setPermissionsMutation,

    // Handlers
    handlePermissionChange,
    handleSavePermissions,
    handleEditRole,
    handleEditUser,
    handleOpenRoleManagement,
    handleSelectRole,
    ACTIONS,
  };
}
