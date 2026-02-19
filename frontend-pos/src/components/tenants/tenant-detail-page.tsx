import { Typography, Spin, Card, Button, Space, Descriptions, Modal, Form, Input, message, Row, Col, Statistic } from "antd";
import { useParams, useNavigate } from "@tanstack/react-router";
import { ArrowLeftOutlined, EditOutlined, DeleteOutlined, UserOutlined, ShopOutlined, AppstoreOutlined, ShoppingOutlined } from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { tenantsApi } from "@/lib/api/tenants";
import { categoriesApi } from "@/lib/api/categories";
import { productsApi } from "@/lib/api/products";
import { outletsApi } from "@/lib/api/outlets";
import { useSession } from "@/lib/auth-client";
import { generateSlug } from "@/lib/utils";

const { Title } = Typography;

export function TenantDetailPage() {
  const { slug } = useParams({ from: "/_protected/tenants/$slug/" });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [form] = Form.useForm();

  const { data: tenant, isLoading: tenantLoading } = useQuery({
    queryKey: ["tenant", slug],
    queryFn: () => tenantsApi.getBySlug(slug),
  });

  const updateMutation = useMutation({
    mutationFn: (data: { nama: string; slug: string; noHp?: string; alamat?: string }) =>
      tenantsApi.update(slug, data, userId),
    onSuccess: () => {
      message.success("Tenant updated successfully");
      setEditModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["tenant", slug] });
    },
    onError: (error: Error) => {
      message.error(error.message || "Failed to update tenant");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => tenantsApi.delete(slug, userId),
    onSuccess: () => {
      message.success("Tenant deleted successfully");
      setDeleteModalOpen(false);
      navigate({ to: "/tenants" });
    },
    onError: (error: Error) => {
      message.error(error.message || "Failed to delete tenant");
    },
  });

  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories", tenant?.id],
    queryFn: () => categoriesApi.getAll({ tenantId: tenant!.id }),
    enabled: !!tenant?.id,
  });

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ["products", tenant?.id],
    queryFn: () => productsApi.getAll({ tenantId: tenant!.id }),
    enabled: !!tenant?.id,
  });

  const { data: outletsData, isLoading: outletsLoading } = useQuery({
    queryKey: ["outlets", tenant?.id],
    queryFn: () => outletsApi.getAll({ tenantId: tenant!.id }),
    enabled: !!tenant?.id,
  });

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["tenant-users", slug],
    queryFn: () => tenantsApi.getUsers(slug),
    enabled: !!slug,
  });

  const isLoading = tenantLoading || categoriesLoading || productsLoading || outletsLoading || usersLoading;

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!tenant) {
    return <div>Tenant not found</div>;
  }

  const categories = categoriesData?.data || [];
  const products = productsData?.data || [];
  const outlets = outletsData?.data || [];
  const users = usersData?.data || [];

  return (
    <div>
      <Button
        type="link"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate({ to: "/tenants" })}
        style={{ marginBottom: 16, paddingLeft: 0 }}
      >
        Back to Tenants
      </Button>

      <Card
        title={
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Title level={4} style={{ margin: 0 }}>
              Tenant Details
            </Title>
          </div>
        }
        extra={
          <Space>
            <Button icon={<EditOutlined />} onClick={() => {
              form.setFieldsValue({
                nama: tenant.nama,
                slug: tenant.slug,
                noHp: tenant.noHp,
                alamat: tenant.alamat,
              });
              setEditModalOpen(true);
            }}>
              Edit
            </Button>
            <Button danger icon={<DeleteOutlined />} onClick={() => setDeleteModalOpen(true)}>
              Delete
            </Button>
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        <Descriptions column={2}>
          <Descriptions.Item label="Nama">{tenant.nama}</Descriptions.Item>
          <Descriptions.Item label="No. HP">{tenant.noHp || "-"}</Descriptions.Item>
          <Descriptions.Item label="Alamat">{tenant.alamat || "-"}</Descriptions.Item>
          <Descriptions.Item label="Dibuat">
            {new Date(tenant.createdAt).toLocaleString("id-ID")}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>  
          <Card  onClick={() => navigate({ to: "/tenants/$slug/outlets" })}>
            <Statistic 
              title="Outlets" 
              value={outlets.length} 
              prefix={<ShopOutlined />} 
              valueStyle={{ color: "#52c41a" }}
            />
            <Button type="link" style={{ padding: 0, marginTop: 8 }}>
              Outlet →
            </Button>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card  onClick={() => navigate({ to: "/tenants/$slug/categories" as any, params: { slug } })}>
            <Statistic 
              title="Categories" 
              value={categories.length} 
              prefix={<AppstoreOutlined />} 
              valueStyle={{ color: "#722ed1" }}
            />
            <Button type="link" style={{ padding: 0, marginTop: 8 }}>
              Kategori →
            </Button>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card  onClick={() => navigate({ to: "/tenants/$slug/products" as any, params: { slug } })}>
            <Statistic 
              title="Products" 
              value={products.length} 
              prefix={<ShoppingOutlined />} 
              valueStyle={{ color: "#faad14" }}
            />
            <Button type="link" style={{ padding: 0, marginTop: 8 }}>
              Produk →
            </Button>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card onClick={() => navigate({ to: "/tenants/$slug/users" as any, params: { slug } })}>
            <Statistic 
              title="Pengguna" 
              value={users.length} 
              prefix={<UserOutlined />} 
              valueStyle={{ color: "#1890ff" }}
            />
            <Button type="link" style={{ padding: 0, marginTop: 8 }}>
              Pengguna →
            </Button>
          </Card>
        </Col>
      </Row>

      <Modal
        title="Edit Tenant"
        open={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={updateMutation.isPending}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => updateMutation.mutate(values)}
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

      <Modal
        title="Hapus Tenant"
        open={deleteModalOpen}
        onCancel={() => setDeleteModalOpen(false)}
        onOk={() => deleteMutation.mutate()}
        okText="Hapus"
        okButtonProps={{ danger: true }}
        confirmLoading={deleteMutation.isPending}
      >
        <p>Apakah Anda yakin ingin menghapus tenant ini? Tindakan ini tidak dapat dibatalkan.</p>
      </Modal>
    </div>
  );
}
