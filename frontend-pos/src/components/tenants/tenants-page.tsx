import { Table, Typography, Space, Button, Spin, Modal, Form, Input, message } from "antd";
import { ReloadOutlined, EyeOutlined, PlusOutlined } from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { tenantsApi, } from "@/lib/api/tenants";
import { useSession } from "@/lib/auth-client";
import { generateSlug } from "@/lib/utils";

const { Title, Text } = Typography;

export function TenantsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [form] = Form.useForm();

  const { data: tenants, isLoading, refetch } = useQuery({
    queryKey: ["tenants"],
    queryFn: () => tenantsApi.getAll(undefined, userId),
  });

  const createMutation = useMutation({
    mutationFn: (data: { nama: string; slug: string; noHp?: string; alamat?: string }) =>
      tenantsApi.create(data, userId),
    onSuccess: () => {
      message.success("Tenant created successfully");
      setCreateModalOpen(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
    },
    onError: (error: Error) => {
      message.error(error.message || "Failed to create tenant");
    },
  });

  const columns = [
    {
      title: "No",
      key: "id",
      width: 80,
      render: (_: unknown, _record: unknown, index: number) => index + 1,
    },
    {
      title: "Name",
      dataIndex: "nama",
      key: "nama",
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 180,
      render: (date: Date) => new Date(date).toLocaleDateString("id-ID"),
    },
    {
      title: "Actions",
      key: "actions",
      width: 250,
      render: (_: unknown, record: { slug: string }) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate({ to: `/tenants/${record.slug}` })}
          >
            View
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            Tenant Management
          </Title>
          <Text type="secondary">Manage all tenants in the system</Text>
        </div>
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateModalOpen(true)}
          >
            Create Tenant
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

      <Spin spinning={isLoading}>
        <Table
          dataSource={tenants}
          columns={columns}
          rowKey="id"
          pagination={false}
          loading={isLoading}
        />
      </Spin>

      <Modal
        title="Create Tenant"
        open={createModalOpen}
        onCancel={() => {
          setCreateModalOpen(false);
          form.resetFields();
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
            name="nama"
            label="Nama"
            rules={[{ required: true, message: "Nama tenant wajib diisi" }]}
          >
            <Input 
              placeholder="Masukkan nama tenant" 
              onChange={(e) => {
                const slug = generateSlug(e.target.value);
                form.setFieldValue('slug', slug);
              }}
            />
          </Form.Item>
          <Form.Item name="slug" hidden />
          <Form.Item name="noHp" label="No. HP" rules={[
            {
              pattern: /^(\+62|62|0)?[0-9]{9,14}$/,
              message: "Masukkan nomor HP yang valid",
            },
          ]}>
            <Input placeholder="contoh: 081234567890" />
          </Form.Item>
          <Form.Item name="alamat" label="Alamat">
            <Input.TextArea rows={2} placeholder="Masukkan alamat tenant" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
