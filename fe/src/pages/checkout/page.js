import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import Footer from "../../components/Footer";
import SubMenu from "../../components/SubMenu";
import MainHeader from "../../components/MainHeader";
import TopMenu from "../../components/TopMenu";
import { useCart } from "../../context/cartContext";

function CheckoutItem({ product }) {
  return (
    <div className="flex items-center gap-4 p-4 border-b">
      <img
        src={product.url || "https://picsum.photos/100"}
        alt={product.title}
        className="w-[100px] h-[100px] object-cover rounded-lg"
      />
      <div>
        <div className="font-semibold">{product.title}</div>
        <div className="text-sm text-gray-500">{product.description}</div>
        <div className="font-bold mt-2">
          {product.quantity} x {product.price.toFixed(2)} VND ={" "}
          {(product.price * product.quantity).toFixed(2)} VND
        </div>
      </div>
    </div>
  );
}

export default function Checkout() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { updateCartCount } = useCart();
  const { cartItems: initialCartItems = [], total: initialTotal = 0 } =
    state || {};
  const [cartItems, setCartItems] = useState(initialCartItems);
  const [addressDetails, setAddressDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState(null);
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
  const token = localStorage.getItem("token");

  const fetchAddressDetails = async () => {
    if (!currentUser._id || !token) return;

    try {
      const response = await fetch(
        `http://localhost:9999/user/${currentUser._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("currentUser");
          localStorage.removeItem("token");
          navigate("/auth");
          throw new Error("Phiên đăng nhập hết hạn");
        }
        throw new Error(
          `Không thể lấy thông tin người dùng: ${response.status}`
        );
      }
      const user = await response.json();
      setAddressDetails({
        name: user.fullname,
        address: user.address || "Chưa cung cấp địa chỉ",
      });
    } catch (error) {
      console.error("Lỗi khi lấy địa chỉ:", error);
      setAddressDetails({
        name: currentUser.fullname || "N/A",
        address: "Chưa cung cấp địa chỉ",
      });
    }
  };

  const validateStock = async () => {
    try {
      for (const item of cartItems) {
        const response = await fetch(
          `http://localhost:9999/products/${item.idProduct}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (!response.ok)
          throw new Error(`Không thể kiểm tra sản phẩm ${item.title}`);
        const product = await response.json();
        if (product.quantity < item.quantity) {
          return {
            valid: false,
            message: `Sản phẩm "${item.title}" chỉ còn ${product.quantity} đơn vị trong kho`,
          };
        }
      }
      return { valid: true };
    } catch (error) {
      return { valid: false, message: error.message };
    }
  };

  const handlePayment = async () => {
    if (!currentUser._id || !token) {
      alert("Vui lòng đăng nhập để thanh toán");
      navigate("/auth");
      return;
    }

    if (cartItems.length === 0) {
      alert("Giỏ hàng của bạn trống!");
      return;
    }

    setIsPaying(true);
    setError(null);
    try {
      const stockCheck = await validateStock();
      if (!stockCheck.valid) {
        throw new Error(stockCheck.message);
      }

      const orderData = {
        userId: currentUser._id,
        orderDate: new Date().toISOString(),
        totalAmount: parseFloat(getCartTotal().toFixed(2)),
        status: "pending",
        items: cartItems.map((item) => ({
          productId: item.idProduct,
          productName: item.title,
          quantity: item.quantity,
          price: parseFloat(item.price.toFixed(2)),
        })),
      };

      const orderResponse = await fetch("http://localhost:9999/orders", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });
      if (!orderResponse.ok) {
        throw new Error("Không thể tạo đơn hàng");
      }
      const order = await orderResponse.json();

      for (const item of cartItems) {
        const response = await fetch(
          `http://localhost:9999/products/${item.idProduct}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              quantity: item.availableStock - item.quantity,
            }),
          }
        );
        if (!response.ok) {
          throw new Error(`Không thể cập nhật kho cho sản phẩm ${item.title}`);
        }
      }

      const deleteResponse = await fetch("http://localhost:9999/shoppingCart", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!deleteResponse.ok) {
        throw new Error("Không thể xóa giỏ hàng");
      }

      updateCartCount();

      navigate("/order-success", {
        state: {
          orderId: order._id,
          cartItems,
          addressDetails,
          orderTotal: getCartTotal(),
        },
      });
    } catch (error) {
      console.error("Lỗi thanh toán:", error);
      setError(error.message || "Đã xảy ra lỗi khi thanh toán");
    } finally {
      setIsPaying(false);
    }
  };

  const getCartTotal = () => {
    return cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  };

  useEffect(() => {
    if (!currentUser._id || !token) {
      setCartItems([]);
      setIsLoading(false);
      return;
    }

    fetchAddressDetails().finally(() => setIsLoading(false));
  }, [currentUser, token]);

  if (!currentUser._id || !token) {
    return (
      <div id="MainLayout" className="min-w-[1050px] max-w-[1300px] mx-auto">
        <div>
          <TopMenu />
          <MainHeader />
          <SubMenu />
        </div>
        <div className="text-center py-20">
          Vui lòng{" "}
          <button
            onClick={() => navigate("/auth")}
            className="text-blue-500 hover:underline"
          >
            đăng nhập
          </button>{" "}
          để tiếp tục thanh toán
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div id="MainLayout" className="min-w-[1050px] max-w-[1300px] mx-auto">
      <div>
        <TopMenu />
        <MainHeader />
        <SubMenu />
      </div>
      <div id="CheckoutPage" className="mt-4 max-w-[1100px] mx-auto">
        <div className="text-2xl font-bold mt-4 mb-4">Thanh toán</div>

        {error && <div className="text-red-500 text-center mb-4">{error}</div>}
        {isLoading ? (
          <div className="text-center py-12">Đang tải...</div>
        ) : (
          <div className="relative flex items-baseline gap-4 justify-between mx-auto w-full">
            <div className="w-[65%]">
              <div className="bg-white rounded-lg p-4 border">
                <div className="text-xl font-semibold mb-2">
                  Địa chỉ giao hàng
                </div>
                <div>
                  <button
                    onClick={() => navigate("/address")}
                    className="text-blue-500 text-sm underline"
                  >
                    Cập nhật địa chỉ
                  </button>
                  {addressDetails ? (
                    <ul className="text-sm mt-2">
                      <li>Tên: {addressDetails.name}</li>
                      <li>Địa chỉ: {addressDetails.address}</li>
                    </ul>
                  ) : (
                    <div className="text-sm mt-2">Chưa có địa chỉ</div>
                  )}
                </div>
              </div>

              <div id="Items" className="bg-white rounded-lg mt-4">
                {cartItems.length === 0 ? (
                  <div className="text-center py-4">
                    Không có sản phẩm trong giỏ hàng
                  </div>
                ) : (
                  cartItems.map((product) => (
                    <CheckoutItem key={product.idProduct} product={product} />
                  ))
                )}
              </div>
            </div>

            <div
              id="PlaceOrder"
              className="relative -top-[6px] w-[35%] border rounded-lg"
            >
              <div className="p-4">
                <div className="flex items-baseline justify-between text-sm mb-1">
                  <div>
                    Sản phẩm (
                    {cartItems.reduce((sum, item) => sum + item.quantity, 0)})
                  </div>
                  <div>{getCartTotal().toFixed(2)} VND</div>
                </div>
                <div className="flex items-center justify-between mb-4 text-sm">
                  <div>Vận chuyển:</div>
                  <div>Miễn phí</div>
                </div>

                <div className="border-t" />

                <div className="flex items-center justify-between my-4">
                  <div className="font-semibold">Tổng đơn hàng</div>
                  <div className="text-2xl font-semibold">
                    {getCartTotal().toFixed(2)} VND
                  </div>
                </div>

                <button
                  className="mt-4 bg-blue-600 text-lg w-full text-white font-semibold p-3 rounded-full hover:bg-blue-700 disabled:bg-gray-400"
                  onClick={handlePayment}
                  disabled={isPaying || cartItems.length === 0}
                >
                  {isPaying ? "Đang xử lý..." : "Xác nhận và thanh toán"}
                </button>
              </div>

              <div className="flex items-center p-4 justify-center gap-2 border-t">
                <img width={50} src="/images/logo.svg" alt="Logo" />
                <div className="font-light mb-2 mt-2">ĐẢM BẢO HOÀN TIỀN</div>
              </div>
            </div>
          </div>
        )}
      </div>
      <div>
        <Footer />
      </div>
    </div>
  );
}
