import { useState, useMemo } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Input,
  Typography,
  Space,
  Card,
  Row,
  Col,
  InputNumber,
  Select,
  Divider,
  Badge,
  Empty,
  Spin,
  Modal,
  Radio,
} from "antd";
import {
  ArrowLeftOutlined,
  SearchOutlined,
  ShoppingCartOutlined,
  DeleteOutlined,
  PlusOutlined,
  MinusOutlined,
  CheckOutlined,
  PrinterOutlined,
} from "@ant-design/icons";
import { productsApi, type Product } from "@/lib/api/products";
import { categoriesApi } from "@/lib/api/categories";
import { ordersApi, type CreateOrderDto } from "@/lib/api/orders";
import { message } from "antd";
import { formatRupiah } from "@/lib/utils";

const { Title, Text } = Typography;

export const Route = createFileRoute("/_protected/inventory/new-order")({
  component: NewOrderPage,
});

interface CartItem {
  productId: number;
  productName: string;
  productSku: string;
  unitPrice: number;
  quantity: number;
  stockQuantity: number;
}

const CASH_DENOMINATIONS = [50000, 100000, 150000, 200000, 500000];

function NewOrderPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(
    undefined,
  );
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [amountTendered, setAmountTendered] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [discountType, setDiscountType] = useState<"percent" | "fixed">(
    "percent",
  );
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["products", "active"],
    queryFn: productsApi.getActive,
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: categoriesApi.getAll,
  });

  const createMutation = useMutation({
    mutationFn: ordersApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setCompletedOrder(data);
      setIsSuccessModalOpen(true);
    },
    onError: (error: Error) => {
      message.error(error.message);
    },
  });

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchText.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchText.toLowerCase());
      const matchesCategory =
        selectedCategory === undefined ||
        product.categoryId === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchText, selectedCategory]);

  const categoryOptions = useMemo(
    () =>
      categories?.map((cat) => ({
        label: cat.name,
        value: cat.id,
      })) || [],
    [categories],
  );

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stockQuantity) {
          message.warning("Insufficient stock");
          return prev;
        }
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          productSku: product.sku,
          unitPrice: parseFloat(product.sellingPrice),
          quantity: 1,
          stockQuantity: product.stockQuantity,
        },
      ];
    });
  };

  const updateQuantity = (productId: number, quantity: number) => {
    const item = cart.find((i) => i.productId === productId);
    if (quantity > item!.stockQuantity) {
      message.warning("Insufficient stock");
      return;
    }
    if (quantity <= 0) {
      setCart((prev) => prev.filter((i) => i.productId !== productId));
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, quantity } : item,
      ),
    );
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );
  const discountAmount =
    discountType === "percent"
      ? subtotal * (discountPercent / 100)
      : discountPercent;
  const total = subtotal - discountAmount;
  const change = amountTendered ? amountTendered - total : 0;

  const handlePlaceOrder = () => {
    if (cart.length === 0) {
      message.warning("Please add items to cart");
      return;
    }

    if (
      paymentMethod === "cash" &&
      (!amountTendered || amountTendered < total)
    ) {
      message.warning("Please enter sufficient amount tendered");
      return;
    }

    const orderData: CreateOrderDto = {
      items: cart.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        discountAmount: 0,
      })),
      discountAmount: discountAmount,
      notes: notes || undefined,
      payments: [
        {
          method: paymentMethod as CreateOrderDto["payments"][0]["method"],
          amount: total,
          referenceCode: undefined,
        },
      ],
    };

    createMutation.mutate(orderData);
  };

  const handleQuickCash = (denomination: number) => {
    setAmountTendered((prev) => (prev || 0) + denomination);
  };

  const handleClearCart = () => {
    setCart([]);
    setDiscountPercent(0);
    setAmountTendered(null);
    setNotes("");
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          marginBottom: 16,
        }}
      >
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate({ to: "/inventory/order" })}
        >
          Back
        </Button>
        <Title level={4} style={{ margin: 0 }}>
          New Order
        </Title>
      </div>

      <div style={{ flex: 1, display: "flex", gap: 16, overflow: "hidden" }}>
        <Card
          style={{ flex: 7, display: "flex", flexDirection: "column" }}
          bodyStyle={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            padding: 16,
          }}
        >
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col flex="auto">
              <Input
                placeholder="Search products by name or SKU..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
              />
            </Col>
          </Row>

          <div style={{ marginBottom: 12 }}>
            <Space.Compact>
              <Button
                type={selectedCategory === undefined ? "primary" : "default"}
                onClick={() => setSelectedCategory(undefined)}
              >
                All
              </Button>
              {categoryOptions.map((cat) => (
                <Button
                  key={cat.value}
                  type={selectedCategory === cat.value ? "primary" : "default"}
                  onClick={() => setSelectedCategory(cat.value)}
                >
                  {cat.label}
                </Button>
              ))}
            </Space.Compact>
          </div>

          <div
            style={{
              flex: 1,
              overflow: "auto",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
              gap: 12,
              alignContent: "start",
            }}
          >
            {productsLoading ? (
              <div style={{ textAlign: "center", padding: 40 }}>
                <Spin />
              </div>
            ) : filteredProducts.length === 0 ? (
              <Empty description="No products found" />
            ) : (
              filteredProducts.map((product) => (
                <Card
                  key={product.id}
                  size="small"
                  onClick={() => addToCart(product)}
                  style={{
                    cursor: "pointer",
                    opacity: product.stockQuantity > 0 ? 1 : 0.5,
                  }}
                  bodyStyle={{ padding: 12 }}
                >
                  <div style={{ textAlign: "center" }}>
                    <Text strong style={{ display: "block", fontSize: 13 }}>
                      {product.name}
                    </Text>
                    <Text
                      type="secondary"
                      style={{ display: "block", fontSize: 11, marginTop: 2 }}
                    >
                      {product.sku}
                    </Text>
                    <Text
                      strong
                      style={{
                        display: "block",
                        fontSize: 15,
                        color: "#1890ff",
                        marginTop: 8,
                      }}
                    >
                      {formatRupiah(parseFloat(product.sellingPrice))}
                    </Text>
                    <Text
                      type="secondary"
                      style={{
                        display: "block",
                        fontSize: 11,
                        marginTop: 4,
                        color:
                          product.stockQuantity <= product.minStockLevel
                            ? "#ff4d4f"
                            : undefined,
                      }}
                    >
                      Stock: {product.stockQuantity} {product.unit}
                    </Text>
                  </div>
                </Card>
              ))
            )}
          </div>
        </Card>

        <Card
          style={{
            flex: 3,
            display: "flex",
            flexDirection: "column",
            height: "100%",
            maxHeight: "calc(100vh - 120px)",
          }}
          bodyStyle={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            padding: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <Space>
              <ShoppingCartOutlined />
              <Text strong>Cart</Text>
              <Badge count={cart.length} />
            </Space>
            {cart.length > 0 && (
              <Button type="link" size="small" onClick={handleClearCart}>
                Clear
              </Button>
            )}
          </div>

          <div style={{ flex: 1, overflow: "auto", marginBottom: 12 }}>
            {cart.length === 0 ? (
              <Empty description="Cart is empty" />
            ) : (
              cart.map((item) => (
                <div
                  key={item.productId}
                  style={{
                    padding: "12px 0",
                    borderBottom: "1px solid #f0f0f0",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: 8,
                    }}
                  >
                    <div>
                      <Text strong style={{ fontSize: 14 }}>
                        {item.productName}
                      </Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 13 }}>
                        {formatRupiah(item.unitPrice)}
                      </Text>
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Space size={4}>
                      <Button
                        size="middle"
                        icon={<MinusOutlined />}
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity - 1)
                        }
                      />
                      <InputNumber
                        size="middle"
                        min={1}
                        max={item.stockQuantity}
                        value={item.quantity}
                        onChange={(value) =>
                          value && updateQuantity(item.productId, value)
                        }
                        style={{ width: 60, textAlign: "center" }}
                      />
                      <Button
                        size="middle"
                        icon={<PlusOutlined />}
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity + 1)
                        }
                        disabled={item.quantity >= item.stockQuantity}
                      />
                      <Button
                        size="middle"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => removeFromCart(item.productId)}
                      />
                    </Space>
                    <Text strong>
                      {formatRupiah(item.unitPrice * item.quantity)}
                    </Text>
                  </div>
                </div>
              ))
            )}
          </div>

          <div
            style={{
              flexShrink: 0,
              borderTop: "1px solid #f0f0f0",
              paddingTop: 12,
            }}
          >
            <Row style={{ marginBottom: 12 }}>
              <Col span={12}>
                <Text strong style={{ fontSize: 16 }}>
                  Total
                </Text>
              </Col>
              <Col span={12} style={{ textAlign: "right" }}>
                <Text strong style={{ fontSize: 18, color: "#1890ff" }}>
                  {formatRupiah(total)}
                </Text>
              </Col>
            </Row>
            <Button
              type="primary"
              size="large"
              block
              onClick={() => setIsOrderModalOpen(true)}
              disabled={cart.length === 0}
            >
              Review Order
            </Button>
          </div>

          <Modal
            title="Order Summary"
            open={isOrderModalOpen}
            onCancel={() => setIsOrderModalOpen(false)}
            footer={null}
            width={900}
            centered
          >
            <Row gutter={16}>
              <Col span={14}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    overflowY: "auto",
                    maxHeight: 300,
                    paddingRight: 4,
                  }}
                >
                  {cart.map((item) => (
                    <Card
                      key={item.productId}
                      size="small"
                      bodyStyle={{ padding: 12 }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <Text strong>{item.productName}</Text>
                          <br />
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {item.quantity} x {formatRupiah(item.unitPrice)}
                          </Text>
                        </div>
                        <Text strong style={{ color: "#1890ff" }}>
                          {formatRupiah(item.unitPrice * item.quantity)}
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
                  <Row style={{ marginBottom: 8 }}>
                    <Col span={12}>
                      <Text type="secondary">Subtotal</Text>
                    </Col>
                    <Col span={12} style={{ textAlign: "right" }}>
                      <Text>{formatRupiah(subtotal)}</Text>
                    </Col>
                  </Row>

                  <Row style={{ marginBottom: 8, alignItems: "center" }}>
                    <Col span={12}>
                      <Space>
                        <Text type="secondary">Discount</Text>
                        <Radio.Group
                          value={discountType}
                          onChange={(e) => {
                            setDiscountType(e.target.value);
                            setDiscountPercent(0);
                          }}
                          size="small"
                        >
                          <Radio.Button value="percent">%</Radio.Button>
                          <Radio.Button value="fixed">Rp</Radio.Button>
                        </Radio.Group>
                      </Space>
                    </Col>
                    <Col span={12}>
                      <InputNumber
                        size="small"
                        min={0}
                        max={discountType === "percent" ? 100 : undefined}
                        value={discountPercent}
                        onChange={(value) => setDiscountPercent(value || 0)}
                        style={{ width: 90, textAlign: "right" }}
                        addonAfter={
                          discountType === "percent" ? "%" : undefined
                        }
                        formatter={(value) =>
                          discountType === "fixed"
                            ? formatRupiah(value as number)
                            : value
                        }
                        parser={(value) =>
                          discountType === "fixed"
                            ? (value?.replace(
                                /[^\d]/g,
                                "",
                              ) as unknown as number)
                            : value
                        }
                      />
                    </Col>
                  </Row>

                  <Divider style={{ margin: "8px 0" }} />

                  <Row style={{ marginBottom: 12 }}>
                    <Col span={12}>
                      <Text strong style={{ fontSize: 16 }}>
                        Total
                      </Text>
                    </Col>
                    <Col span={12} style={{ textAlign: "right" }}>
                      <Text strong style={{ fontSize: 18, color: "#1890ff" }}>
                        {formatRupiah(total)}
                      </Text>
                    </Col>
                  </Row>

                  <Select
                    placeholder="Payment Method"
                    style={{ width: "100%", marginBottom: 12 }}
                    value={paymentMethod}
                    onChange={setPaymentMethod}
                    options={[
                      { label: "Cash", value: "cash" },
                      { label: "Card", value: "card" },
                      { label: "Bank Transfer", value: "bank_transfer" },
                      { label: "QRIS", value: "qris" },
                      { label: "E-Wallet", value: "e_wallet" },
                      { label: "Other", value: "other" },
                    ]}
                  />

                  {paymentMethod === "cash" && (
                    <>
                      <div style={{ marginBottom: 12 }}>
                        {CASH_DENOMINATIONS.map((denom) => (
                          <Button
                            key={denom}
                            size="small"
                            style={{ marginRight: 4, marginBottom: 4 }}
                            onClick={() => handleQuickCash(denom)}
                          >
                            {formatRupiah(denom)}
                          </Button>
                        ))}
                      </div>
                      <InputNumber
                        placeholder="Amount Tendered"
                        value={amountTendered}
                        onChange={(value) => setAmountTendered(value)}
                        style={{ width: "100%", marginBottom: 8 }}
                        formatter={(value) => formatRupiah(value as number)}
                        parser={(value) =>
                          value?.replace(/[^\d]/g, "") as unknown as number
                        }
                        min={0}
                      />
                      {amountTendered !== null && (
                        <Row style={{ marginBottom: 12 }}>
                          <Col span={12}>
                            <Text type="secondary">Change</Text>
                          </Col>
                          <Col span={12} style={{ textAlign: "right" }}>
                            <Text
                              strong
                              style={{
                                color: change >= 0 ? "#52c41a" : "#ff4d4f",
                              }}
                            >
                              {formatRupiah(change)}
                            </Text>
                          </Col>
                        </Row>
                      )}
                    </>
                  )}

                  <Input.TextArea
                    placeholder="Notes (optional)"
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    style={{ marginBottom: 12 }}
                  />

                  <Space style={{ width: "100%", justifyContent: "flex-end" }}>
                    <Button onClick={() => setIsOrderModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      type="primary"
                      size="large"
                      icon={<CheckOutlined />}
                      onClick={handlePlaceOrder}
                      loading={createMutation.isPending}
                      disabled={
                        cart.length === 0 ||
                        (paymentMethod === "cash" &&
                          (!amountTendered || amountTendered < total))
                      }
                    >
                      Confirm Order
                    </Button>
                  </Space>
                </div>
              </Col>
            </Row>
          </Modal>

          <Modal
            title="Order Created"
            open={isSuccessModalOpen}
            onCancel={() => {
              setIsSuccessModalOpen(false);
              setCompletedOrder(null);
              handleClearCart();
            }}
            footer={[
              <Button
                key="print"
                icon={<PrinterOutlined />}
                onClick={() => message.info("Print feature coming soon")}
              >
                Print
              </Button>,
              <Button
                key="close"
                type="primary"
                onClick={() => {
                  setIsSuccessModalOpen(false);
                  setIsOrderModalOpen(false);
                  setCompletedOrder(null);
                  handleClearCart();
                }}
              >
                Close
              </Button>,
            ]}
            centered
          >
            {completedOrder && (
              <div style={{ textAlign: "center", padding: "16px 0" }}>
                <PrinterOutlined style={{ fontSize: 48, color: "#52c41a", marginBottom: 16 }} />
                <Title level={4}>Order {completedOrder.orderNumber} Created Successfully!</Title>
                <Text type="secondary">What would you like to do next?</Text>
              </div>
            )}
          </Modal>
        </Card>
      </div>
    </div>
  );
}
