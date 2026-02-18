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
  Switch,
  message,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import { categoriesApi, type Category, type CreateCategoryDto, type UpdateCategoryDto } from "@/lib/api/categories";
import { tenantsApi } from "@/lib/api/tenants";

const { Title, Text } = Typography;

export function TenantCategoriesPage() {
  const { id } = useParams({ from: "/_protected/tenants/$id/categories/" });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [searchText, setSearchText] = useState("");
  const [form] = Form.useForm();

  const { data: tenant } = useQuery({
    queryKey: ["tenant", id],
    queryFn: () => tenantsApi.getBySlug(id),
  });

  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories", tenant?.id],
    queryFn: () => categoriesApi.getAll({ tenantId: tenant!.id }),
    enabled: !!tenant?.id,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateCategoryDto) => categoriesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories", tenant?.id] });
      message.success("Category created successfully");
      setIsModalOpen(false);
      form.resetFields();
    },
    onError: (error: Error) => {
      message.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCategoryDto }) =>
      categoriesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories", tenant?.id] });
      message.success("Category updated successfully");
      setIsModalOpen(false);
      setEditingCategory(null);
      form.resetFields();
    },
    onError: (error: Error) => {
      message.error(error.message);
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: categoriesApi.toggleStatus,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["categories", tenant?.id] });
      message.success(
        data.isActive
          ? "Category activated successfully"
          : "Category deactivated successfully"
      );
    },
    onError: (error: Error) => {
      message.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: categoriesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories", tenant?.id] });
      message.success("Category deleted successfully");
    },
    onError: (error: Error) => {
      message.error(error.message);
    },
  });

  const handleCreate = () => {
    setEditingCategory(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    form.setFieldsValue({
      nama: category.nama,
      deskripsi: category.deskripsi,
    });
    setIsModalOpen(true);
  };

  const handleToggleStatus = (category: Category) => {
    toggleStatusMutation.mutate(category.id);
  };

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: "Delete Category",
      content: "Are you sure you want to delete this category? This action cannot be undone.",
      okText: "Delete",
      okType: "danger",
      onOk: () => {
        deleteMutation.mutate(id);
      },
    });
  };

  const handleModalCancel = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    form.resetFields();
  };

  const handleModalOk = () => {
    form.validateFields().then((values) => {
      if (editingCategory) {
        updateMutation.mutate({
          id: editingCategory.id,
          data: values,
        });
      } else {
        createMutation.mutate({
          ...values,
          tenantId: tenant!.id,
        } as CreateCategoryDto);
      }
    });
  };

  const filteredCategories = categories?.data?.filter(
    (cat: Category) =>
      cat.nama.toLowerCase().includes(searchText.toLowerCase()) ||
      cat.deskripsi?.toLowerCase().includes(searchText.toLowerCase())
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
      dataIndex: "nama",
      key: "nama",
      render: (value: string) => <Text strong>{value}</Text>,
    },
    {
      title: "Deskripsi",
      dataIndex: "deskripsi",
      key: "deskripsi",
      render: (value: string | null) => (
        <Text type="secondary">{value || "-"}</Text>
      ),
    },
    {
      title: "Jumlah Produk",
      dataIndex: "productsCount",
      key: "productsCount",
      render: (count: number) => count || 0,
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      width: 100,
      render: (value: boolean, record: Category) => (
        <Switch
          checked={value}
          onChange={() => handleToggleStatus(record)}
          checkedChildren="On"
          unCheckedChildren="Off"
        />
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_: unknown, record: Category) => (
        <Space size="small">
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
      <Button
        type="link"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate({ to: "/tenants/$id", params: { id } })}
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
            Categories
          </Title>
          <Text type="secondary">Manage categories for {tenant?.nama}</Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreate}
        >
          Add Category
        </Button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Input
          placeholder="Search categories..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ maxWidth: 300 }}
          allowClear
        />
      </div>

      <Table
        dataSource={filteredCategories}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 10 }}
        size="small"
        locale={{
          emptyText: "No categories found.",
        }}
      />

      <Modal
        title={editingCategory ? "Edit Category" : "Add Category"}
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="nama"
            label="Nama"
            rules={[
              { required: true, message: "Please enter the category name" },
            ]}
          >
            <Input placeholder="Category name" />
          </Form.Item>
          <Form.Item name="deskripsi" label="Deskripsi">
            <Input.TextArea
              placeholder="Category description (optional)"
              rows={3}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
