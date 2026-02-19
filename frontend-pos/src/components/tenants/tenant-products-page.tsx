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
  Tag,
  Select,
  InputNumber,
  Row,
  Col,
  message,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  SwapOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import {
  productsApi,
  type Product,
  type CreateProductDto,
  type UpdateProductDto,
  type AdjustStockDto,
} from "@/lib/api/products";
import { categoriesApi } from "@/lib/api/categories";
import type { Category } from "@/lib/api/categories";
import { tenantsApi } from "@/lib/api/tenants";

const { Title, Text } = Typography;

function formatRupiah(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export function TenantProductsPage() {
  const { slug } = useParams({ from: "/_protected/tenants/$slug/products/" });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [searchText, setSearchText] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<number | undefined>(undefined);
  const [form] = Form.useForm();
  const [stockForm] = Form.useForm();

  const { data: tenant } = useQuery({
    queryKey: ["tenant", slug],
    queryFn: () => tenantsApi.getBySlug(slug),
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ["products", tenant?.id],
    queryFn: () => productsApi.getAll({ tenantId: tenant!.id }),
    enabled: !!tenant?.id,
  });

  const { data: categories } = useQuery({
    queryKey: ["categories", tenant?.id],
    queryFn: () => categoriesApi.getAll({ tenantId: tenant!.id }),
    enabled: !!tenant?.id,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateProductDto) => productsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", tenant?.id] });
      message.success("Product created successfully");
      setIsModalOpen(false);
      form.resetFields();
    },
    onError: (error: Error) => {
      message.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateProductDto }) =>
      productsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", tenant?.id] });
      message.success("Product updated successfully");
      setIsModalOpen(false);
      setEditingProduct(null);
      form.resetFields();
    },
    onError: (error: Error) => {
      message.error(error.message);
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id }: { id: number }) => {
      const product = products?.data?.find((p) => p.id === id);
      return productsApi.update(id, { isActive: !product?.isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", tenant?.id] });
      message.success("Product status updated successfully");
    },
    onError: (error: Error) => {
      message.error(error.message);
    },
  });

  const adjustStockMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: AdjustStockDto }) =>
      productsApi.adjustStock(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", tenant?.id] });
      message.success("Stock adjusted successfully");
      setIsStockModalOpen(false);
      setAdjustingProduct(null);
      stockForm.resetFields();
    },
    onError: (error: Error) => {
      message.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: productsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", tenant?.id] });
      message.success("Product deleted successfully");
    },
    onError: (error: Error) => {
      message.error(error.message);
    },
  });

  const handleCreate = () => {
    setEditingProduct(null);
    form.resetFields();
    form.setFieldsValue({
      stockQuantity: 0,
      minStockLevel: 0,
      unit: "pcs",
      isActive: true,
      tipe: "barang",
    });
    setIsModalOpen(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    form.setFieldsValue({
      sku: product.sku,
      barcode: product.barcode,
      nama: product.nama,
      deskripsi: product.deskripsi,
      categoryId: product.categoryId,
      tipe: product.tipe,
      hargaBeli: product.hargaBeli ? parseFloat(product.hargaBeli) : 0,
      hargaJual: product.hargaJual ? parseFloat(product.hargaJual) : 0,
      minStockLevel: product.minStockLevel,
      unit: product.unit,
      isActive: product.isActive,
    });
    setIsModalOpen(true);
  };

  const handleAdjustStock = (product: Product) => {
    setAdjustingProduct(product);
    stockForm.setFieldsValue({ quantity: 0, reason: "" });
    setIsStockModalOpen(true);
  };

  const handleToggleStatus = (id: number) => {
    toggleStatusMutation.mutate({ id });
  };

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: "Delete Product",
      content: "Are you sure you want to delete this product? This action cannot be undone.",
      okText: "Delete",
      okType: "danger",
      onOk: () => {
        deleteMutation.mutate(id);
      },
    });
  };

  const handleModalCancel = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    form.resetFields();
  };

  const handleStockModalCancel = () => {
    setIsStockModalOpen(false);
    setAdjustingProduct(null);
    stockForm.resetFields();
  };

  const handleModalOk = () => {
    form.validateFields().then((values) => {
      if (editingProduct) {
        const data: UpdateProductDto = {
          ...values,
          hargaBeli: values.hargaBeli ? String(values.hargaBeli) : "0",
          hargaJual: values.hargaJual ? String(values.hargaJual) : "0",
        };
        updateMutation.mutate({ id: editingProduct.id, data });
      } else {
        const createData = {
          ...values,
          tenantId: tenant?.id,
          hargaBeli: values.hargaBeli ? String(values.hargaBeli) : "0",
          hargaJual: values.hargaJual ? String(values.hargaJual) : "0",
        };
        createMutation.mutate(createData as CreateProductDto);
      }
    });
  };

  const handleStockModalOk = () => {
    stockForm.validateFields().then((values) => {
      if (adjustingProduct) {
        adjustStockMutation.mutate({
          id: adjustingProduct.id,
          data: values,
        });
      }
    });
  };

  const filteredProducts = products?.data?.filter(
    (prod) =>
      prod.nama.toLowerCase().includes(searchText.toLowerCase()) ||
      prod.sku.toLowerCase().includes(searchText.toLowerCase()) ||
      prod.barcode?.toLowerCase().includes(searchText.toLowerCase()),
  );

  const categoryOptions = categories?.data?.map((cat) => ({
    label: cat.nama,
    value: cat.id,
  }));

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
      title: "SKU",
      dataIndex: "sku",
      key: "sku",
      width: 100,
      render: (value: string) => <Text code>{value}</Text>,
    },
    {
      title: "Nama",
      dataIndex: "nama",
      key: "nama",
      render: (value: string) => <Text strong>{value}</Text>,
    },
    {
      title: "Kategori",
      dataIndex: "category",
      key: "category",
      width: 120,
      render: (category: Category | null) => category?.nama || <Text type="secondary">-</Text>,
    },
    {
      title: "Tipe",
      dataIndex: "tipe",
      key: "tipe",
      width: 80,
      render: (value: string) => {
        const colorMap: Record<string, string> = {
          barang: "blue",
          jasa: "purple",
          digital: "cyan",
        };
        return <Tag color={colorMap[value] || "default"} className="capitalize">{value}</Tag>;
      },
    },
    {
      title: "Harga Beli",
      dataIndex: "hargaBeli",
      key: "hargaBeli",
      width: 130,
      render: (value: string | null) => formatRupiah(value || "0"),
    },
    {
      title: "Harga Jual",
      dataIndex: "hargaJual",
      key: "hargaJual",
      width: 130,
      render: (value: string) => formatRupiah(value),
    },
    {
      title: "Stok",
      dataIndex: "stockQuantity",
      key: "stockQuantity",
      width: 90,
      render: (value: number, record: Product) => {
        const isLow = value <= record.minStockLevel;
        return <Tag color={isLow ? "red" : "green"}>{value} {record.unit}</Tag>;
      },
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      width: 100,
      render: (value: boolean, record: Product) => (
        <Button
          type="text"
          size="small"
          onClick={() => handleToggleStatus(record.id)}
          style={{ color: value ? "#52c41a" : "#ff4d4f" }}
        >
          {value ? "Active" : "Inactive"}
        </Button>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 160,
      render: (_: unknown, record: Product) => (
        <Space size="small">
          <Button
            type="text"
            icon={<SwapOutlined />}
            onClick={() => handleAdjustStock(record)}
            title="Adjust Stock"
            size="small"
          />
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
            size="small"
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
        onClick={() => navigate({ to: "/tenants/$slug", params: { slug } })}
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
            Products
          </Title>
          <Text type="secondary">Manage products for {tenant?.nama}</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          Add Product
        </Button>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col>
          <Input
            placeholder="Search by name, SKU, barcode..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
            allowClear
          />
        </Col>
        <Col>
          <Select
            placeholder="Filter by category"
            allowClear
            style={{ width: 200 }}
            options={categoryOptions}
            value={categoryFilter}
            onChange={(value) => setCategoryFilter(value)}
          />
        </Col>
      </Row>

      <Table
        dataSource={filteredProducts}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 10 }}
        size="small"
        locale={{ emptyText: "No products found." }}
      />

      <Modal
        title={editingProduct ? "Edit Product" : "Add Product"}
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        width={600}
        centered
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="sku"
                label="SKU"
                rules={[{ required: true, message: "Please enter SKU" }]}
              >
                <Input placeholder="e.g., PRD-001" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="barcode" label="Barcode">
                <Input placeholder="e.g., 1234567890123" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="nama"
            label="Product Name"
            rules={[{ required: true, message: "Please enter product name" }]}
          >
            <Input placeholder="Product name" />
          </Form.Item>
          <Form.Item name="deskripsi" label="Description">
            <Input.TextArea placeholder="Product description (optional)" rows={2} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="categoryId" label="Category">
                <Select placeholder="Select category" options={categoryOptions} allowClear />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="tipe" label="Type">
                <Select
                  placeholder="Select type"
                  options={[
                    { label: "Barang (Physical)", value: "barang" },
                    { label: "Jasa (Service)", value: "jasa" },
                    { label: "Digital", value: "digital" },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="hargaBeli" label="Purchase Price (Harga Beli)">
                <InputNumber
                  placeholder="0"
                  min={0}
                  style={{ width: "100%" }}
                  formatter={(value) => (value ? formatRupiah(value) : "")}
                  parser={(value) => (value?.replace(/[^\d]/g, "") || 0) as unknown as number}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="hargaJual" label="Selling Price (Harga Jual)">
                <InputNumber
                  placeholder="0"
                  min={0}
                  style={{ width: "100%" }}
                  formatter={(value) => (value ? formatRupiah(value) : "")}
                  parser={(value) => (value?.replace(/[^\d]/g, "") || 0) as unknown as number}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="stockQuantity" label="Initial Stock">
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="minStockLevel" label="Min Stock Level">
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="unit" label="Unit">
                <Input placeholder="pcs, kg, L" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="isActive" label="Status" valuePropName="checked">
            <Select
              options={[
                { label: "Active", value: true },
                { label: "Inactive", value: false },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`Adjust Stock - ${adjustingProduct?.nama || ""}`}
        open={isStockModalOpen}
        onOk={handleStockModalOk}
        onCancel={handleStockModalCancel}
        confirmLoading={adjustStockMutation.isPending}
        centered
      >
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary">Current Stock: </Text>
          <Text strong>
            {adjustingProduct?.stockQuantity} {adjustingProduct?.unit}
          </Text>
        </div>
        <Form form={stockForm} layout="vertical">
          <Form.Item
            name="quantity"
            label="Quantity Adjustment"
            rules={[{ required: true, message: "Please enter quantity" }]}
            extra="Use positive numbers to add stock, negative to reduce"
          >
            <InputNumber placeholder="0" style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            name="reason"
            label="Reason"
            rules={[{ required: true, message: "Please enter reason for adjustment" }]}
          >
            <Input.TextArea
              placeholder="e.g., Stock count correction, Damaged goods, New shipment received"
              rows={3}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
