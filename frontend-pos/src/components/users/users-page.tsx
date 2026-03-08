import { Skeleton } from '@/components/ui/skeleton';
import {
  CreateRoleDialog,
  CreateUserDialog,
  DeleteRoleDialog,
  EditRoleDialog,
  EditUserDialog,
  RoleManagementDialog,
} from './dialogs';
import { useUsersPage } from './hooks/use-users-page';
import { RoleList } from './role-list';
import { UserList } from './user-list';

export function UsersPage() {
  const {
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
    filteredRoles,
    filteredUsers,
    displayedUsers,
    usersWithRole,
    rolesWithCount,
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
  } = useUsersPage();

  if (isLoadingRoles || isLoadingUsers) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <div className="flex gap-4">
          <Skeleton className="h-[600px] w-1/3" />
          <Skeleton className="h-[600px] flex-1" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h4 className="text-lg font-semibold m-0">Manajemen Pengguna</h4>
          <p className="text-sm text-gray-500 m-0">Kelola pengguna dan role</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex gap-6">
        {/* Left Panel - Role List */}
        <RoleList
          roles={filteredRoles}
          selectedRoleId={selectedRoleId}
          searchQuery={roleSearchQuery}
          onSearchChange={setRoleSearchQuery}
          onSelectRole={handleSelectRole}
          onCreateRole={() => setCreateRoleModalOpen(true)}
        />

        {/* Right Panel - Users List */}
        <UserList
          displayedUsers={displayedUsers}
          filteredUsers={filteredUsers}
          selectedRole={selectedRole}
          searchQuery={userSearchQuery}
          isLoading={isLoadingUsers}
          currentPage={currentPage}
          pageSize={pageSize}
          totalUsers={totalUsers}
          totalPages={totalPages}
          onSearchChange={(query) => {
            setUserSearchQuery(query);
            setCurrentPage(1);
          }}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          onCreateUser={() => setCreateUserModalOpen(true)}
          onEditUser={handleEditUser}
          onEditRole={() => selectedRole && handleEditRole(selectedRole)}
          onDeleteRole={() => setDeleteModalOpen(true)}
          onManagePermissions={() => selectedRoleId && handleOpenRoleManagement(selectedRoleId)}
        />
      </div>

      {/* Dialogs */}
      <CreateRoleDialog
        open={createRoleModalOpen}
        onOpenChange={setCreateRoleModalOpen}
        form={createRoleForm}
        onSubmit={(data) => createRoleMutation.mutate(data)}
        isPending={createRoleMutation.isPending}
        tenantId={tenantId}
      />

      <CreateUserDialog
        open={createUserModalOpen}
        onOpenChange={setCreateUserModalOpen}
        form={createUserForm}
        onSubmit={(data) => createUserMutation.mutate(data)}
        isPending={createUserMutation.isPending}
        selectedRoleName={selectedRole?.name}
        outlets={outletsData?.data}
        isLoadingOutlets={isLoadingOutlets}
      />

      <EditRoleDialog
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        form={editForm}
        onSubmit={(data) =>
          selectedRole && updateRoleMutation.mutate({ id: selectedRole.id, data })
        }
        isPending={updateRoleMutation.isPending}
      />

      <DeleteRoleDialog
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        onConfirm={() => selectedRole && deleteRoleMutation.mutate(selectedRole.id)}
        isPending={deleteRoleMutation.isPending}
        roleName={selectedRole?.name}
      />

      <RoleManagementDialog
        open={roleManagementOpen}
        onOpenChange={setRoleManagementOpen}
        selectedRole={selectedRole}
        usersWithRole={usersWithRole}
        activeResources={activeResources}
        permissionMap={permissionMap}
        isLoadingPermissions={isLoadingPermissions}
        isLoadingResources={isLoadingResources}
        hasUnsavedChanges={hasUnsavedChanges}
        isPending={setPermissionsMutation.isPending}
        onPermissionChange={handlePermissionChange}
        onSavePermissions={handleSavePermissions}
        onCancelChanges={() => {
          setPermissionChanges(new Map());
          setHasUnsavedChanges(false);
        }}
        actions={ACTIONS}
      />

      <EditUserDialog
        open={editUserModalOpen}
        onOpenChange={setEditUserModalOpen}
        form={editUserForm}
        onSubmit={(data) =>
          selectedUser && updateUserMutation.mutate({ id: selectedUser.id, data })
        }
        isPending={updateUserMutation.isPending}
        user={selectedUser || undefined}
        roles={rolesWithCount}
        outlets={outletsData?.data}
        isLoadingRoles={isLoadingRoles}
        isLoadingOutlets={isLoadingOutlets}
      />
    </div>
  );
}
