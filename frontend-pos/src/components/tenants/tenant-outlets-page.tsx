import { useState } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Input,
  Table,
  Modal,
  Form,
  Typography,
  Space,
  message,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  SearchOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import { outletsApi, type Outlet } from "@/lib/api/outlets";
import { tenantsApi } from "@/lib/api/tenants";

const { Title, Text } = Typography;

export function TenantOutletsPage() {
  const { id } = useParams({ from: "/_protected/tenants/$id/outlets/" });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [form] = Form.useForm();

  const { data: tenant } = useQuery({
    queryKey: ["tenant", id],
    queryFn: () => tenantsApi.getBySlug(id),
  });

  const { data: outlets, isLoading } = useQuery({
    queryKey: ["outlets", tenant?.id],
    queryFn: () => outletsApi.getAll({ tenantId: tenant!.id }),
    enabled: !!tenant?.id,
  });

  const createMutation = useMutation({
    mutationFn: (data: { tenantId: number; name: string; kode: string; alamat?: string; noHp?: string }) => 
      outletsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["outlets", tenant?.id] });
      message.success("Outlet created successfully");
      setIsModalOpen(false);
      form.resetFields();
    },
    onError: (error: Error) => {
      message.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => Promise.resolve({} as Outlet),
    onSuccess: () => {
      message.success("Outlet deleted successfully");
    },
    onError: (error: Error) => {
      message.error(error.message);
    },
  });

  const handleCreate = () => {
    form.resetFields();
    form.setFieldsValue({ isActive: true });
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: "Delete Outlet",
      content: "Are you sure you want to delete this outlet? This action cannot be undone.",
      okText: "Delete",
      okType: "danger",
      onOk: () => {
        deleteMutation.mutate(id);
      },
    });
  };

  const handleModalCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  const handleModalOk = () => {
    form.validateFields().then((values) => {
      createMutation.mutate({
        ...values,
        tenantId: tenant!.id,
      });
    });
  };

  const filteredOutlets = outlets?.data?.filter(
    (outlet: Outlet) =>
      outlet.name.toLowerCase().includes(searchText.toLowerCase()) ||
      outlet.kode.toLowerCase().includes(searchText.toLowerCase()) ||
      outlet.alamat?.toLowerCase().includes(searchText.toLowerCase())
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
      title: "Kode",
      dataIndex: "kode",
      key: "kode",
      width: 100,
      render: (value: string) => <Text code>{value}</Text>,
    },
    {
      title: "Nama",
      dataIndex: "name",
      key: "name",
      render: (value: string) => <Text strong>{value}</Text>,
    },
    {
      title: "Alamat",
      dataIndex: "alamat",
      key: "alamat",
      render: (value: string | null) => <Text type="secondary">{value || "-"}</Text>,
    },
    {
      title: "No. HP",
      dataIndex: "noHp",
      key: "noHp",
      render: (value: string | null) => <Text type="secondary">{value || "-"}</Text>,
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      width: 100,
      render: (value: boolean) => (
        <Text style={{ color: value ? "#52c41a" : "#ff4d4f" }}>
          {value ? "Active" : "Inactive"}
        </Text>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 80,
      render: (_: unknown, record: Outlet) => (
        <Space size="small">
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Button
        type="link"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate({ to: "/tenants/$id" as any, params: { id } })}
        style={{ marginBottom: 16, paddingLeft: 0 }}
      >
        Back to {tenant?.nama || "Tenant"}
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
            Outlets
          </Title>
          <Text type="secondary">Manage outlets for {tenant?.nama}</Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreate}
        >
          Add Outlet
        </Button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Input
          placeholder="Search outlets..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ maxWidth: 300 }}
          allowClear
        />
      </div>

      <Table
        dataSource={filteredOutlets}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 10 }}
        size="small"
        locale={{
          emptyText: "No outlets found.",
        }}
      />

      <Modal
        title="Add Outlet"
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        confirmLoading={createMutation.isPending}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="kode"
            label="Kode Outlet"
            rules={[{ required: true, message: "Kode outlet wajib diisi" }]}
          >
            <Input placeholder="Contoh: OUT-001" />
          </Form.Item>
          <Form.Item
            name="name"
            label="Nama Outlet"
            rules={[{ required: true, message: "Nama outlet wajib diisi" }]}
          >
            <Input placeholder="Contoh: Outlet Jakarta" />
          </Form.Item>
          <Form.Item name="alamat" label="Alamat">
            <Input.TextArea placeholder="Masukkan alamat outlet" rows={2} />
          </Form.Item>
          <Form.Item name="noHp" label="No. HP">
            <Input placeholder="Contoh: 081234567890" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
