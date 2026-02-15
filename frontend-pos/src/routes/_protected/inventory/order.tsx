import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Table,
  Modal,
  Typography,
  Space,
  Pagination,
  Tag,
  Select,
  Row,
  Col,
  Descriptions,
  Divider,
  Card,
  DatePicker,
} from "antd";
import {
  SearchOutlined,
  EyeOutlined,
  CloseCircleOutlined,
  RollbackOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import {
  ordersApi,
  type Order,
  type OrderListResponse,
} from "@/lib/api/orders";
import { message } from "antd";

const { Title, Text } = Typography;

export const Route = createFileRoute("/_protected/inventory/order")({
  component: OrderPage,
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

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function OrderPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string | undefined>(
    undefined,
  );
  const [dateRange, setDateRange] = useState<[string | null, string | null]>([
    null,
    null,
  ]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const { data: orders, isLoading } = useQuery({
    queryKey: ["orders", { status: statusFilter, startDate: dateRange[0], endDate: dateRange[1] }],
    queryFn: () =>
      ordersApi.getAll({
        status: statusFilter as "complete" | "cancel" | "refunded" | undefined,
        startDate: dateRange[0] || undefined,
        endDate: dateRange[1] || undefined,
      }),
  });

  const cancelMutation = useMutation({
    mutationFn: ordersApi.cancel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      message.success("Order cancelled successfully");
      setIsDetailModalOpen(false);
    },
    onError: (error: Error) => {
      message.error(error.message);
    },
  });

  const refundMutation = useMutation({
    mutationFn: ordersApi.refund,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      message.success("Order refunded successfully");
      setIsDetailModalOpen(false);
    },
    onError: (error: Error) => {
      message.error(error.message);
    },
  });

  const handleViewDetails = async (order: OrderListResponse) => {
    const orderDetails = await ordersApi.getById(order.id);
    setSelectedOrder(orderDetails);
    setIsDetailModalOpen(true);
  };

  const handleCancel = (id: number) => {
    Modal.confirm({
      title: "Cancel Order",
      content:
        "Are you sure you want to cancel this order? Stock will be restored.",
      okText: "Cancel Order",
      okType: "danger",
      onOk: () => {
        cancelMutation.mutate(id);
      },
    });
  };

  const handleRefund = (id: number) => {
    Modal.confirm({
      title: "Refund Order",
      content:
        "Are you sure you want to refund this order? Stock will be restored and payments will be marked as refunded.",
      okText: "Refund Order",
      okType: "danger",
      onOk: () => {
        refundMutation.mutate(id);
      },
    });
  };

  const getStatusTag = (status: string) => {
    const colors: Record<string, string> = {
      complete: "green",
      cancel: "red",
      refunded: "orange",
    };
    const labels: Record<string, string> = {
      complete: "Completed",
      cancel: "Cancelled",
      refunded: "Refunded",
    };
    return <Tag color={colors[status]}>{labels[status]}</Tag>;
  };

  const columns = [
    {
      title: "Order Number",
      dataIndex: "orderNumber",
      key: "orderNumber",
      width: 160,
      render: (value: string) => <Text code>{value}</Text>,
    },
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 180,
      render: (value: Date) => <Text>{formatDate(value)}</Text>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (value: string) => getStatusTag(value),
    },
    {
      title: "Total",
      dataIndex: "totalAmount",
      key: "totalAmount",
      width: 150,
      render: (value: string) => <Text strong>{formatRupiah(value)}</Text>,
    },
    {
      title: "Actions",
      key: "actions",
      width: 180,
      render: (_: unknown, record: OrderListResponse) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
          >
            View
          </Button>
          {record.status === "complete" && (
            <>
              <Button
                type="text"
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => handleCancel(record.id)}
              >
                Cancel
              </Button>
              <Button
                type="text"
                icon={<RollbackOutlined />}
                onClick={() => handleRefund(record.id)}
              >
                Refund
              </Button>
            </>
          )}
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
            Orders
          </Title>
          <Text type="secondary">Manage customer orders</Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate({ to: "/inventory/new-order" })}
        >
          New Order
        </Button>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col>
          <Select
            placeholder="Filter by status"
            allowClear
            style={{ width: 150 }}
            value={statusFilter}
            onChange={(value) => setStatusFilter(value)}
            options={[
              { label: "Completed", value: "complete" },
              { label: "Cancelled", value: "cancel" },
              { label: "Refunded", value: "refunded" },
            ]}
          />
        </Col>
        <Col>
          <DatePicker.RangePicker
            placeholder={["Start Date", "End Date"]}
            onChange={(dates, dateStrings) => {
              if (dates) {
                setDateRange([dateStrings[0] || null, dateStrings[1] || null]);
              } else {
                setDateRange([null, null]);
              }
            }}
            style={{ width: 250 }}
          />
        </Col>
      </Row>

      <Table
        dataSource={orders}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={false}
        size="small"
        locale={{
          emptyText: "No orders found.",
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
        <Text type="secondary">Showing {orders?.length || 0} orders</Text>
        <Pagination
          total={orders?.length || 0}
          pageSize={10}
          showSizeChanger={false}
          size="small"
        />
      </div>

      <Modal
        title={`Order Details - ${selectedOrder?.orderNumber || ""}`}
        open={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        footer={null}
        width={900}
        centered
      >
        {selectedOrder && (
          <Row gutter={16}>
            <Col span={14}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  overflowY: "auto",
                  maxHeight: 350,
                  paddingRight: 4,
                }}
              >
                {selectedOrder.items.map((item) => (
                  <Card key={item.id} size="small" bodyStyle={{ padding: 12 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <Text strong>{item.product.name}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {item.quantity} x {formatRupiah(item.unitPrice)}
                          {parseFloat(item.discountAmount) > 0 && (
                            <Text type="success" style={{ marginLeft: 8 }}>
                              (-{formatRupiah(item.discountAmount)})
                            </Text>
                          )}
                        </Text>
                      </div>
                      <Text strong style={{ color: "#1890ff" }}>
                        {formatRupiah(item.totalPrice)}
                      </Text>
                    </div>
                  </Card>
                ))}
              </div>
            </Col>

            <Col span={10}>
              <div
                style={{ borderLeft: "1px solid #f0f0f0", paddingLeft: 16 }}
              >
                <Descriptions column={1} size="small" style={{ marginBottom: 16 }}>
                  <Descriptions.Item label="Status">
                    {getStatusTag(selectedOrder.status)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Date">
                    {formatDate(selectedOrder.createdAt)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Cashier">
                    {selectedOrder.cashier?.nama ||
                      `ID: ${selectedOrder.cashierId}`}
                  </Descriptions.Item>
                </Descriptions>

                <div
                  style={{
                    padding: "8px 12px",
                    background: "#fafafa",
                    borderRadius: 4,
                    marginBottom: 16,
                  }}
                >
                  <Row style={{ marginBottom: 4 }}>
                    <Col span={16}>
                      <Text>Subtotal</Text>
                    </Col>
                    <Col span={8} style={{ textAlign: "right" }}>
                      <Text>{formatRupiah(selectedOrder.subtotal)}</Text>
                    </Col>
                  </Row>
                  {parseFloat(selectedOrder.discountAmount) > 0 && (
                    <Row style={{ marginBottom: 4 }}>
                      <Col span={16}>
                        <Text type="success">Discount</Text>
                      </Col>
                      <Col span={8} style={{ textAlign: "right" }}>
                        <Text type="success">
                          -{formatRupiah(selectedOrder.discountAmount)}
                        </Text>
                      </Col>
                    </Row>
                  )}
                  <Divider style={{ margin: "8px 0" }} />
                  <Row>
                    <Col span={16}>
                      <Text strong>Total</Text>
                    </Col>
                    <Col span={8} style={{ textAlign: "right" }}>
                      <Text strong style={{ fontSize: 18, color: "#1890ff" }}>
                        {formatRupiah(selectedOrder.totalAmount)}
                      </Text>
                    </Col>
                  </Row>
                </div>

                {selectedOrder.payments.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <Text strong style={{ display: "block", marginBottom: 8 }}>
                      Payment
                    </Text>
                    <Card size="small" bodyStyle={{ padding: 12 }}>
                      <Row style={{ marginBottom: 4 }}>
                        <Col span={16}>
                          <Text type="secondary">Method</Text>
                        </Col>
                        <Col span={8} style={{ textAlign: "right" }}>
                          <Text>
                            {(() => {
                              const labels: Record<string, string> = {
                                cash: "Cash",
                                card: "Card",
                                bank_transfer: "Bank Transfer",
                                qris: "QRIS",
                                e_wallet: "E-Wallet",
                                other: "Other",
                              };
                              return labels[selectedOrder.payments[0].method] ||
                                selectedOrder.payments[0].method;
                            })()}
                          </Text>
                        </Col>
                      </Row>
                      <Row style={{ marginBottom: 4 }}>
                        <Col span={16}>
                          <Text type="secondary">Amount</Text>
                        </Col>
                        <Col span={8} style={{ textAlign: "right" }}>
                          <Text strong>
                            {formatRupiah(selectedOrder.payments[0].amount)}
                          </Text>
                        </Col>
                      </Row>
                      {selectedOrder.payments[0].referenceCode && (
                        <Row>
                          <Col span={16}>
                            <Text type="secondary">Reference</Text>
                          </Col>
                          <Col span={8} style={{ textAlign: "right" }}>
                            <Text>{selectedOrder.payments[0].referenceCode}</Text>
                          </Col>
                        </Row>
                      )}
                    </Card>
                  </div>
                )}

                {selectedOrder.notes && (
                  <div style={{ marginBottom: 16 }}>
                    <Text
                      strong
                      style={{ display: "block", marginBottom: 4 }}
                    >
                      Notes
                    </Text>
                    <Text type="secondary">{selectedOrder.notes}</Text>
                  </div>
                )}

                <Space style={{ width: "100%", justifyContent: "flex-end" }}>
                  <Button onClick={() => setIsDetailModalOpen(false)}>
                    Close
                  </Button>
                  {selectedOrder.status === "complete" && (
                    <>
                      <Button
                        danger
                        icon={<CloseCircleOutlined />}
                        onClick={() => handleCancel(selectedOrder.id)}
                        loading={cancelMutation.isPending}
                      >
                        Cancel Order
                      </Button>
                      <Button
                        icon={<RollbackOutlined />}
                        onClick={() => handleRefund(selectedOrder.id)}
                        loading={refundMutation.isPending}
                      >
                        Refund Order
                      </Button>
                    </>
                  )}
                </Space>
              </div>
            </Col>
          </Row>
        )}
      </Modal>
    </div>
  );
}
