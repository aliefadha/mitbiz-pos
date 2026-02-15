import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Input,
  Table,
  Modal,
  Form,
  Typography,
  Space,
  Pagination,
  Switch,
  Select,
  InputNumber,
  Row,
  Col,
  Tag,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  SwapOutlined,
} from "@ant-design/icons";
import {
  productsApi,
  type Product,
  type CreateProductDto,
  type UpdateProductDto,
  type AdjustStockDto,
} from "@/lib/api/products";
import { categoriesApi, type Category } from "@/lib/api/categories";
import { message } from "antd";

const { Title, Text } = Typography;

export const Route = createFileRoute("/_protected/inventory/product")({
  component: ProductPage,
});

function formatRupiah(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

function ProductPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(
    null,
  );
  const [searchText, setSearchText] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<number | undefined>(
    undefined,
  );
  const [form] = Form.useForm();
  const [stockForm] = Form.useForm();

  const { data: products, isLoading } = useQuery({
    queryKey: ["products", { categoryId: categoryFilter }],
    queryFn: () => productsApi.getAll({ categoryId: categoryFilter }),
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: categoriesApi.getAll,
  });

  const createMutation = useMutation({
    mutationFn: productsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
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
      queryClient.invalidateQueries({ queryKey: ["products"] });
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
      const product = products?.find((p) => p.id === id);
      return productsApi.update(id, { isActive: !product?.isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
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
      queryClient.invalidateQueries({ queryKey: ["products"] });
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
      queryClient.invalidateQueries({ queryKey: ["products"] });
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
    });
    setIsModalOpen(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    form.setFieldsValue({
      sku: product.sku,
      barcode: product.barcode,
      name: product.name,
      description: product.description,
      categoryId: product.categoryId,
      purchasePrice: parseFloat(product.purchasePrice),
      sellingPrice: parseFloat(product.sellingPrice),
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
      content:
        "Are you sure you want to delete this product? This action cannot be undone.",
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
        updateMutation.mutate({
          id: editingProduct.id,
          data: values,
        });
      } else {
        createMutation.mutate(values as CreateProductDto);
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

  const filteredProducts = products?.filter(
    (prod) =>
      prod.name.toLowerCase().includes(searchText.toLowerCase()) ||
      prod.sku.toLowerCase().includes(searchText.toLowerCase()) ||
      prod.barcode?.toLowerCase().includes(searchText.toLowerCase()),
  );

  const categoryOptions = categories?.map((cat) => ({
    label: cat.name,
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
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (value: string) => <Text strong>{value}</Text>,
    },
    {
      title: "Category",
      dataIndex: ["category", "name"],
      key: "category",
      width: 120,
      render: (value: string | null) =>
        value || <Text type="secondary">-</Text>,
    },
    {
      title: "Purchase Price",
      dataIndex: "purchasePrice",
      key: "purchasePrice",
      width: 130,
      render: (value: string) => formatRupiah(value),
    },
    {
      title: "Selling Price",
      dataIndex: "sellingPrice",
      key: "sellingPrice",
      width: 130,
      render: (value: string) => formatRupiah(value),
    },
    {
      title: "Stock",
      dataIndex: "stockQuantity",
      key: "stockQuantity",
      width: 90,
      render: (value: number, record: Product) => {
        const isLow = value <= record.minStockLevel;
        return (
          <Tag color={isLow ? "red" : "green"}>
            {value} {record.unit}
          </Tag>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      width: 100,
      render: (value: boolean, record: Product) => (
        <Switch
          checked={value}
          onChange={() => handleToggleStatus(record.id)}
          checkedChildren="On"
          unCheckedChildren="Off"
        />
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
          />
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
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
            Master Produk
          </Title>
          <Text type="secondary">Manage product inventory</Text>
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
        pagination={false}
        size="small"
        locale={{
          emptyText: "No products found.",
        }}
      />

      <div
        style={{
          marginTop: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text type="secondary">
          Showing {filteredProducts?.length || 0} products
        </Text>
        <Pagination
          total={filteredProducts?.length || 0}
          pageSize={10}
          showSizeChanger={false}
          size="small"
        />
      </div>

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
            name="name"
            label="Product Name"
            rules={[{ required: true, message: "Please enter product name" }]}
          >
            <Input placeholder="Product name" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea
              placeholder="Product description (optional)"
              rows={2}
            />
          </Form.Item>
          <Form.Item name="categoryId" label="Category">
            <Select
              placeholder="Select category"
              options={categoryOptions}
              allowClear
            />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="purchasePrice"
                label="Purchase Price"
                rules={[
                  { required: true, message: "Please enter purchase price" },
                ]}
              >
                <InputNumber
                  placeholder="0"
                  min={0}
                  style={{ width: "100%" }}
                  formatter={(value) => (value ? formatRupiah(value) : "")}
                  parser={(value) =>
                    value?.replace(/[^\d]/g, "") as unknown as number
                  }
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="sellingPrice"
                label="Selling Price"
                rules={[
                  { required: true, message: "Please enter selling price" },
                ]}
              >
                <InputNumber
                  placeholder="0"
                  min={0}
                  style={{ width: "100%" }}
                  formatter={(value) => (value ? formatRupiah(value) : "")}
                  parser={(value) =>
                    value?.replace(/[^\d]/g, "") as unknown as number
                  }
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
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`Adjust Stock - ${adjustingProduct?.name || ""}`}
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
            <InputNumber
              placeholder="0"
              style={{ width: "100%" }}
              allowNegative
            />
          </Form.Item>
          <Form.Item
            name="reason"
            label="Reason"
            rules={[
              { required: true, message: "Please enter reason for adjustment" },
            ]}
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
