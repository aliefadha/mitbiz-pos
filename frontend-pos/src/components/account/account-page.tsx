import { Typography, Card, Table, Button, Space, Tag, Spin, Avatar, Modal, Form, Input, Select, message } from "antd";
import { UserOutlined, ReloadOutlined, PlusOutlined } from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { usersApi, type User, type CreateUserDto } from "@/lib/api/users";
import { outletsApi, type Outlet } from "@/lib/api/outlets";
import { tenantsApi, type Tenant } from "@/lib/api/tenants";
import { useSession } from "@/lib/auth-client";

const { Title, Text } = Typography;

export function AccountPage() {
  const queryClient = useQueryClient();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>("cashier");
  const [selectedTenant, setSelectedTenant] = useState<number | null>(null);
  const [form] = Form.useForm();
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["users"],
    queryFn: () => usersApi.getUsers(),
  });

  const { data: tenantsData } = useQuery({
    queryKey: ["tenants"],
    queryFn: () => tenantsApi.getAll({ isActive: true }, userId),
    enabled: !!userId,
  });

  const { data: outletsData } = useQuery({
    queryKey: ["outlets", selectedTenant],
    queryFn: () => outletsApi.getAll({ isActive: true, tenantId: selectedTenant! }),
    enabled: !!selectedTenant,
  });

  const tenants = tenantsData ?? [];
  const outlets = outletsData?.data ?? [];

  const createMutation = useMutation({
    mutationFn: (data: CreateUserDto) => usersApi.createUser(data),
    onSuccess: () => {
      message.success("User created successfully");
      setCreateModalOpen(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error: Error) => {
      message.error(error.message || "Failed to create user");
    },
  });

  const users = data?.users ?? [];
  const total = data?.total ?? 0;

  const columns = [
    {
      title: "No",
      key: "index",
      width: 80,
      render: (_: unknown, __: unknown, index: number) => index + 1,
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (name: string, record: User) => (
        <Space>
          <Avatar src={record.image} icon={<UserOutlined />} />
          {name}
        </Space>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Verified",
      dataIndex: "emailVerified",
      key: "emailVerified",
      render: (verified: boolean) => (
        <Tag color={verified ? "green" : "red"}>
          {verified ? "Verified" : "Unverified"}
        </Tag>
      ),
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 180,
      render: (date: Date) => new Date(date).toLocaleDateString("id-ID"),
    },
  ];

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <div>
          <Title level={4} style={{ margin: 0 }}>
            Account Management
          </Title>
          <Text type="secondary">Manage all users in the system</Text>
        </div>
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateModalOpen(true)}
          >
            Create User
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => refetch()}
            loading={isLoading}
          >
            Refresh
          </Button>
        </Space>
      </div>

      <Card>
        <Spin spinning={isLoading}>
          <Table
            dataSource={users}
            columns={columns}
            rowKey="id"
            pagination={{
              total,
              pageSize: 10,
              showTotal: (total) => `Total ${total} users`,
            }}
            loading={isLoading}
          />
        </Spin>
      </Card>

      <Modal
        title="Create User"
        open={createModalOpen}
        onCancel={() => {
          setCreateModalOpen(false);
          form.resetFields();
          setSelectedTenant(null);
        }}
        onOk={() => form.submit()}
        confirmLoading={createMutation.isPending}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => createMutation.mutate(values)}
        >
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: "Name is required" }]}
          >
            <Input placeholder="Enter user name" />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Email is required" },
              { type: "email", message: "Invalid email address" },
            ]}
          >
            <Input placeholder="Enter user email" />
          </Form.Item>
          <Form.Item
            name="password"
            label="Password"
            rules={[
              { required: true, message: "Password is required" },
              { min: 8, message: "Password must be at least 8 characters" },
            ]}
          >
            <Input.Password placeholder="Enter password" />
          </Form.Item>
          <Form.Item
            name="role"
            label="Role"
            initialValue="cashier"
            rules={[{ required: true, message: "Role is required" }]}
          >
            <Select
              placeholder="Select role"
              onChange={(value) => setSelectedRole(value)}
              options={[
                { label: "Admin", value: "admin" },
                { label: "Owner", value: "owner" },
                { label: "Cashier", value: "cashier" },
              ]}
            />
          </Form.Item>
          {selectedRole === "cashier" && (
            <>
              <Form.Item
                name="tenantId"
                label="Tenant"
                rules={[{ required: true, message: "Tenant is required for cashier" }]}
              >
                <Select
                  placeholder="Select tenant"
                  onChange={(value) => {
                    setSelectedTenant(value);
                    form.setFieldValue("outletId", undefined);
                  }}
                  options={tenants.map((tenant: Tenant) => ({
                    label: tenant.nama,
                    value: tenant.id,
                  }))}
                />
              </Form.Item>
              <Form.Item
                name="outletId"
                label="Outlet"
                rules={[{ required: true, message: "Outlet is required for cashier" }]}
              >
                <Select
                  placeholder="Select outlet"
                  disabled={!selectedTenant}
                  options={outlets.map((outlet: Outlet) => ({
                    label: outlet.name,
                    value: outlet.id,
                  }))}
                />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </div>
  );
}
