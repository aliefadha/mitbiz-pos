import { Typography, Spin, Card, Tag, Button, Space, Descriptions, Table, Modal, Form, Input, message, Tabs, Row, Col, Statistic } from "antd";
import { useParams, useNavigate } from "@tanstack/react-router";
import { ArrowLeftOutlined, EditOutlined, DeleteOutlined, UserOutlined, ShopOutlined, AppstoreOutlined, ShoppingOutlined, PlusOutlined } from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { tenantsApi } from "@/lib/api/tenants";
import { categoriesApi, type Category } from "@/lib/api/categories";
import { productsApi } from "@/lib/api/products";
import { outletsApi } from "@/lib/api/outlets";
import { useSession } from "@/lib/auth-client";
import { generateSlug } from "@/lib/utils";

const { Title } = Typography;

export function TenantDetailPage() {
  const { id } = useParams({ from: "/_protected/tenants/$id/" });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [addOutletModalOpen, setAddOutletModalOpen] = useState(false);
  const [addCategoryModalOpen, setAddCategoryModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [outletForm] = Form.useForm();
  const [categoryForm] = Form.useForm();

  const { data: tenant, isLoading: tenantLoading } = useQuery({
    queryKey: ["tenant", id],
    queryFn: () => tenantsApi.getBySlug(id),
  });

  const updateMutation = useMutation({
    mutationFn: (data: { nama: string; slug: string; noHp?: string; alamat?: string }) =>
      tenantsApi.update(id, data, userId),
    onSuccess: () => {
      message.success("Tenant updated successfully");
      setEditModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["tenant", id] });
    },
    onError: (error: Error) => {
      message.error(error.message || "Failed to update tenant");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => tenantsApi.delete(id, userId),
    onSuccess: () => {
      message.success("Tenant deleted successfully");
      setDeleteModalOpen(false);
      navigate({ to: "/tenants" });
    },
    onError: (error: Error) => {
      message.error(error.message || "Failed to delete tenant");
    },
  });

  const createOutletMutation = useMutation({
    mutationFn: (data: { tenantId: number; name: string; kode: string; alamat?: string; noHp?: string; isActive?: boolean }) =>
      outletsApi.create(data),
    onSuccess: () => {
      message.success("Outlet created successfully");
      setAddOutletModalOpen(false);
      outletForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ["outlets", tenant?.id] });
    },
    onError: (error: Error) => {
      message.error(error.message || "Failed to create outlet");
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: (data: { tenantId: number; nama: string; deskripsi?: string; isActive?: boolean }) =>
      categoriesApi.create(data),
    onSuccess: () => {
      message.success("Category created successfully");
      setAddCategoryModalOpen(false);
      categoryForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ["categories", tenant?.id] });
    },
    onError: (error: Error) => {
      message.error(error.message || "Failed to create category");
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

  const isLoading = tenantLoading || categoriesLoading || productsLoading || outletsLoading;

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

  const categoryColumns = [
    {
      title: "Nama",
      dataIndex: "nama",
      key: "nama",
    },
    {
      title: "Jumlah Produk",
      dataIndex: "productsCount",
      key: "productsCount",
      render: (count: number) => count || 0,
    },
  ];

  const productColumns = [
    {
      title: "SKU",
      dataIndex: "sku",
      key: "sku",
    },
    {
      title: "Nama",
      dataIndex: "nama",
      key: "nama",
      render: (nama: string, record: { id: number }) => (
        <Button
          type="link"
          onClick={() => navigate({ to: "/tenants/$id/products/$productId", params: { id, productId: String(record.id) } })}
          style={{ padding: 0 }}
        >
          {nama}
        </Button>
      ),
    },
    {
      title: "Kategori",
      dataIndex: "category",
      key: "category",
      render: (category: Category | null) => category?.nama || "-",
    },
    {
      title: "Tipe",
      dataIndex: "tipe",
      key: "tipe",
      render: (tipe: string) => {
        const colorMap: Record<string, string> = {
          barang: "blue",
          jasa: "purple",
          digital: "cyan",
        };
        return <Tag color={colorMap[tipe] || "default"}>{tipe}</Tag>;
      },
    },
    {
      title: "Harga",
      dataIndex: "hargaJual",
      key: "hargaJual",
      render: (price: string) => `Rp ${parseInt(price).toLocaleString("id-ID")}`,
    },
    {
      title: "Stok",
      dataIndex: "stockQuantity",
      key: "stockQuantity",
    },
  ];

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

      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={6}>
            <Statistic 
              title="Pengguna" 
              value={tenant.user ? 1 : 0} 
              prefix={<UserOutlined />} 
              valueStyle={{ color: "#1890ff" }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic 
              title="Outlets" 
              value={outlets.length} 
              prefix={<ShopOutlined />} 
              valueStyle={{ color: "#52c41a" }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic 
              title="Categories" 
              value={categories.length} 
              prefix={<AppstoreOutlined />} 
              valueStyle={{ color: "#722ed1" }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic 
              title="Products" 
              value={products.length} 
              prefix={<ShoppingOutlined />} 
              valueStyle={{ color: "#faad14" }}
            />
          </Col>
        </Row>
      </Card>

      <Card>
        <Tabs
          defaultActiveKey="outlets"
          type="card"
          size="small"
          items={[
            {
              key: "outlets",
              label: (
                <span>
                  <ShopOutlined /> Outlets ({outlets.length})
                </span>
              ),
              children: (
                <>
                  <div style={{ marginBottom: 16, textAlign: "right" }}>
                    <Button 
                      type="primary" 
                      icon={<ShopOutlined />} 
                      onClick={() => setAddOutletModalOpen(true)}
                    >
                      Tambah Outlet
                    </Button>
                  </div>
                  <Table
                    dataSource={outlets}
                  columns={[
                    {
                      title: "Kode",
                      dataIndex: "kode",
                      key: "kode",
                    },
                    {
                      title: "Nama",
                      dataIndex: "name",
                      key: "name",
                      render: (name: string, record: { id: number }) => (
                        <Button
                          type="link"
                          onClick={() => navigate({ to: "/tenants/$id/outlets/$outletId", params: { id, outletId: String(record.id) } })}
                          style={{ padding: 0 }}
                        >
                          {name}
                        </Button>
                      ),
                    },
                    {
                      title: "Alamat",
                      dataIndex: "alamat",
                      key: "alamat",
                      render: (alamat: string | null) => alamat || "-",
                    },
                    {
                      title: "No. HP",
                      dataIndex: "noHp",
                      key: "noHp",
                      render: (noHp: string | null) => noHp || "-",
                    },

                  ]}
                  rowKey="id"
                  pagination={{ pageSize: 5 }}
                  size="small"
                />
                </>
              ),
            },
            {
              key: "categories",
              label: (
                <span>
                  <AppstoreOutlined /> Categories ({categories.length})
                </span>
              ),
              children: (
                <>
                  <div style={{ marginBottom: 16, textAlign: "right" }}>
                    <Button 
                      type="primary" 
                      icon={<PlusOutlined />} 
                      onClick={() => setAddCategoryModalOpen(true)}
                    >
                      Tambah Kategori
                    </Button>
                  </div>
                  <Table
                    dataSource={categories}
                    columns={categoryColumns}
                    rowKey="id"
                    pagination={{ pageSize: 5 }}
                    size="small"
                  />
                </>
              ),
            },
            {
              key: "products",
              label: (
                <span>
                  <ShoppingOutlined /> Products ({products.length})
                </span>
              ),
              children: (
                <>
                  <div style={{ marginBottom: 16, textAlign: "right" }}>
                    <Button 
                      type="primary" 
                      icon={<PlusOutlined />} 
                      onClick={() => navigate({ to: "/tenants/$id/products/new", params: { id } })}
                    >
                      Tambah Produk
                    </Button>
                  </div>
                  <Table
                    dataSource={products}
                    columns={productColumns}
                    rowKey="id"
                    pagination={{ pageSize: 5 }}
                    size="small"
                  />
                </>
              ),
            },
            {
              key: "pengguna",
              label: (
                <span>
                  <UserOutlined /> Pengguna ({tenant.user ? 1 : 0})
                </span>
              ),
              children: (
                <Table
                  dataSource={tenant.user ? [tenant.user] : []}
                  columns={[
                    {
                      title: "Nama",
                      dataIndex: "name",
                      key: "name",
                      render: (name: string | null) => name || "-",
                    },
                    {
                      title: "Email",
                      dataIndex: "email",
                      key: "email",
                    },
                  ]}
                  rowKey="id"
                  pagination={{ pageSize: 5 }}
                  size="small"
                />
              ),
            },
          ]}
        />
      </Card>

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

        <Modal
          title="Tambah Outlet"
          open={addOutletModalOpen}
          onCancel={() => {
            setAddOutletModalOpen(false);
            outletForm.resetFields();
          }}
          onOk={() => outletForm.submit()}
          confirmLoading={createOutletMutation.isPending}
        >
          <Form
            form={outletForm}
            layout="vertical"
            onFinish={(values) => {
              if (tenant?.id) {
                createOutletMutation.mutate({
                  ...values,
                  tenantId: tenant.id,
                });
              }
            }}
          >
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
              <Input.TextArea rows={2} placeholder="Masukkan alamat outlet" />
            </Form.Item>
            <Form.Item name="noHp" label="No. HP" rules={[
              {
                pattern: /^(\+62|62|0)?[0-9]{9,14}$/,
                message: "Masukkan nomor HP yang valid",
              },
            ]}>
              <Input placeholder="contoh: 081234567890" />
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title="Tambah Kategori"
          open={addCategoryModalOpen}
          onCancel={() => {
            setAddCategoryModalOpen(false);
            categoryForm.resetFields();
          }}
          onOk={() => categoryForm.submit()}
          confirmLoading={createCategoryMutation.isPending}
        >
          <Form
            form={categoryForm}
            layout="vertical"
            onFinish={(values) => {
              if (tenant?.id) {
                createCategoryMutation.mutate({
                  ...values,
                  tenantId: tenant.id,
                });
              }
            }}
            initialValues={{ isActive: true }}
          >
            <Form.Item
              name="nama"
              label="Nama Kategori"
              rules={[{ required: true, message: "Nama kategori wajib diisi" }]}
            >
              <Input placeholder="Contoh: Elektronik" />
            </Form.Item>
            <Form.Item name="deskripsi" label="Deskripsi">
              <Input.TextArea rows={2} placeholder="Masukkan deskripsi kategori" />
            </Form.Item>
          </Form>
        </Modal>
    </div>
  );
}
