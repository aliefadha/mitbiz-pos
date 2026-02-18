import { useState } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Input,
  Table,
  Typography,
  Space,
  Tag,
  Avatar,
  Modal,
  Form,
  Select,
  message,
} from "antd";
import {
  SearchOutlined,
  ArrowLeftOutlined,
  UserOutlined,
  ShopOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { tenantsApi, type User } from "@/lib/api/tenants";
import { outletsApi, type Outlet } from "@/lib/api/outlets";
import { usersApi, type CreateUserDto } from "@/lib/api/users";

const { Title, Text } = Typography;

export function TenantUsersPage() {
  const { id } = useParams({ from: "/_protected/tenants/$id/users/" });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchText, setSearchText] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  const { data: tenantData } = useQuery({
    queryKey: ["tenant", id],
    queryFn: () => tenantsApi.getBySlug(id),
  });

  const { data: usersData, isLoading } = useQuery({
    queryKey: ["tenant-users", id],
    queryFn: () => tenantsApi.getUsers(id),
    enabled: !!tenantData,
  });

  const { data: outletsData } = useQuery({
    queryKey: ["outlets", tenantData?.id],
    queryFn: () => outletsApi.getAll({ tenantId: tenantData!.id }),
    enabled: !!tenantData?.id,
  });

  const createUserMutation = useMutation({
    mutationFn: (data: CreateUserDto) => usersApi.createUser(data),
    onSuccess: () => {
      message.success("User created successfully");
      setIsModalOpen(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ["tenant-users", id] });
    },
    onError: (error: Error) => {
      message.error(error.message || "Failed to create user");
    },
  });

  const users: User[] = usersData?.data || [];
  const outlets: Outlet[] = outletsData?.data || [];

  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchText.toLowerCase()) ||
      user.email.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: "No.",
      key: "index",
      width: 60,
      render: (_: unknown, __: unknown, index: number) => (
        <Text type="secondary">{index + 1}</Text>
      ),
    },
    {
      title: "Nama",
      dataIndex: "name",
      key: "name",
      render: (value: string | null, record: User) => (
        <Space>
          <Avatar
            src={record.image}
            icon={<UserOutlined />}
            size="small"
          />
          <Text strong>{value || "-"}</Text>
        </Space>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      render: (value: string) => <Text type="secondary">{value}</Text>,
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      render: (value: string) => {
        const color = value === "owner" ? "blue" : value === "admin" ? "purple" : "default";
        return <Tag color={color}>{value || "cashier"}</Tag>;
      },
    },
    {
      title: "Outlet",
      dataIndex: "outletId",
      key: "outletId",
      render: (value: number | null) => {
        const outlet = outlets.find((o) => o.id === value);
        return outlet ? (
          <Space>
            <ShopOutlined />
            <Text type="secondary">{outlet.name}</Text>
          </Space>
        ) : (
          <Text type="secondary">Owner</Text>
        );
      },
    },
    {
      title: "Dibuat",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (value: Date) => (
        <Text type="secondary">
          {new Date(value).toLocaleDateString("id-ID")}
        </Text>
      ),
    },
  ];

  const handleModalOk = () => {
    form.validateFields().then((values) => {
      createUserMutation.mutate({
        ...values,
        role: "cashier",
      });
    });
  };

  const handleModalCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  return (
    <div>
      <Button
        type="link"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate({ to: "/tenants/$id" as any, params: { id } })}
        style={{ marginBottom: 16, paddingLeft: 0 }}
      >
        Back to {tenantData?.nama || "Tenant"}
      </Button>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <div>
          <Title level={4} style={{ margin: 0 }}>
            Pengguna
          </Title>
          <Text type="secondary">Manage users for {tenantData?.nama}</Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsModalOpen(true)}
        >
          Tambah Kasir
        </Button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Input
          placeholder="Search users..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ maxWidth: 300 }}
          allowClear
        />
      </div>

      <Table
        dataSource={filteredUsers}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 10 }}
        size="small"
        locale={{
          emptyText: "No users found.",
        }}
      />

      <Modal
        title="Tambah Kasir"
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        confirmLoading={createUserMutation.isPending}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Nama"
            rules={[{ required: true, message: "Nama wajib diisi" }]}
          >
            <Input placeholder="Masukkan nama kasir" />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Email wajib diisi" },
              { type: "email", message: "Email tidak valid" },
            ]}
          >
            <Input placeholder="contoh: kasir@email.com" />
          </Form.Item>
          <Form.Item
            name="password"
            label="Password"
            rules={[
              { required: true, message: "Password wajib diisi" },
              { min: 8, message: "Password minimal 8 karakter" },
            ]}
          >
            <Input.Password placeholder="Minimal 8 karakter" />
          </Form.Item>
          <Form.Item
            name="outletId"
            label="Outlet"
            rules={[{ required: true, message: "Pilih outlet" }]}
          >
            <Select
              placeholder="Pilih outlet"
              options={outlets.map((outlet) => ({
                value: outlet.id,
                label: outlet.name,
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
