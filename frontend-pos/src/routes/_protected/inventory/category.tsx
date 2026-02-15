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
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { categoriesApi, type Category, type CreateCategoryDto, type UpdateCategoryDto } from "@/lib/api/categories";
import { message } from "antd";

const { Title, Text } = Typography;

export const Route = createFileRoute("/_protected/inventory/category")({
  component: CategoryPage,
});

function CategoryPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [searchText, setSearchText] = useState("");
  const [form] = Form.useForm();

  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: categoriesApi.getAll,
  });

  const createMutation = useMutation({
    mutationFn: categoriesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
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
      queryClient.invalidateQueries({ queryKey: ["categories"] });
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
      queryClient.invalidateQueries({ queryKey: ["categories"] });
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
      queryClient.invalidateQueries({ queryKey: ["categories"] });
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
      name: category.name,
      description: category.description,
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
        createMutation.mutate(values as CreateCategoryDto);
      }
    });
  };

  const filteredCategories = categories?.filter(
    (cat) =>
      cat.name.toLowerCase().includes(searchText.toLowerCase()) ||
      cat.description?.toLowerCase().includes(searchText.toLowerCase())
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
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (value: string) => <Text strong>{value}</Text>,
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (value: string | null) => (
        <Text type="secondary">{value || "-"}</Text>
      ),
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
            Master Kategori
          </Title>
          <Text type="secondary">Manage product categories</Text>
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
        pagination={false}
        size="small"
        locale={{
          emptyText: "No categories found.",
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
          Showing {filteredCategories?.length || 0} categories
        </Text>
        <Pagination
          total={filteredCategories?.length || 0}
          pageSize={10}
          showSizeChanger={false}
          size="small"
        />
      </div>

      <Modal
        title={editingCategory ? "Edit Category" : "Add Category"}
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Name"
            rules={[
              { required: true, message: "Please enter the category name" },
            ]}
          >
            <Input placeholder="Category name" />
          </Form.Item>
          <Form.Item name="description" label="Description">
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
