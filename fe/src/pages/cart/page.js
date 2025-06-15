import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import TopMenu from "../../components/TopMenu";
import MainHeader from "../../components/MainHeader";
import SubMenu from "../../components/SubMenu";
import SimilarProducts from "../../components/SimilarProducts";
import Footer from "../../components/Footer";
import { useCart } from "../../context/cartContext";

function EmptyCart() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <ShoppingCart className="h-16 w-16 text-gray-500 mb-4" />
      <h3 className="text-2xl font-semibold mb-2">Your cart is empty</h3>
      <p className="text-gray-500 mb-6">Looks like you haven't added anything to your cart yet</p>
      <button
        onClick={() => navigate("/")}
        className="bg-blue-600 text-white px-8 py-2 rounded-full hover:bg-blue-700"
      >
        Start Shopping
      </button>
    </div>
  );
}

function CartItem({ product, onRemove, onUpdateQuantity, availableStock, onConfirmRemove }) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateQuantity = useCallback((change) => {
    if (isUpdating) return;
    const newQuantity = product.quantity + change;
    if (newQuantity < 1) {
      onConfirmRemove(product.idProduct);
      return;
    }
    if (newQuantity > availableStock) return;
    setIsUpdating(true);
    console.log("Updating quantity - Product ID:", product.idProduct, "New Quantity:", newQuantity);
    onUpdateQuantity(product.idProduct, newQuantity).finally(() => setIsUpdating(false));
  }, [isUpdating, product.idProduct, product.quantity, availableStock, onUpdateQuantity, onConfirmRemove]);

  return (
    <div className="flex items-center justify-between gap-4 border-b p-4">
      <div className="flex items-center gap-4">
        <img
          src={product.url || "https://picsum.photos/100"}
          alt={product.title}
          className="w-[100px] h-[100px] object-cover rounded-lg"
        />
        <div>
          <div className="font-semibold">{product.title}</div>
          <div className="text-sm text-gray-500">{product.description}</div>
          <div className="font-bold mt-2">{product.price.toFixed(2)} VND</div>
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() => handleUpdateQuantity(-1)}
              className="p-1 rounded-full hover:bg-gray-100"
              disabled={isUpdating || product.quantity <= 1}
            >
              <Minus size={16} />
            </button>
            <span>{product.quantity}</span>
            <button
              onClick={() => handleUpdateQuantity(1)}
              className="p-1 rounded-full hover:bg-gray-100"
              disabled={isUpdating || product.quantity >= availableStock}
            >
              <Plus size={16} />
            </button>
          </div>
          {availableStock === 0 && <div className="text-red-500 text-sm mt-1">Hết hàng</div>}
        </div>
      </div>
      <button
        onClick={() => onConfirmRemove(product.idProduct)}
        className="text-blue-500 hover:text-blue-700"
        disabled={isUpdating}
      >
        Xóa
      </button>
    </div>
  );
}

function CartSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 min-h-[400px]">
      <div className="md:col-span-2 space-y-4">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="flex items-center justify-between gap-4 border-b p-4 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-[100px] h-[100px] bg-gray-300 rounded-lg"></div>
              <div>
                <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-300 rounded w-1/3"></div>
              </div>
            </div>
            <div className="h-4 bg-gray-300 rounded w-10"></div>
          </div>
        ))}
      </div>
      <div className="md:col-span-1">
        <div className="bg-white p-4 border h-full flex items-center justify-center">
          <div className="h-10 bg-gray-300 rounded w-full animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}

export default function Cart() {
  const navigate = useNavigate();
  const { updateCartCount } = useCart();
  const [cartItems, setCartItems] = useState([]);
  const [cartId, setCartId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmRemoveProductId, setConfirmRemoveProductId] = useState(null);
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
  const token = localStorage.getItem("token");

  const fetchCartItems = useCallback(async () => {
    if (!currentUser._id || !token) {
      setCartItems([]);
      setCartId(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:9999/shoppingCart?userId=${currentUser._id}`, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("currentUser");
          localStorage.removeItem("token");
          navigate("/auth");
          throw new Error("Phiên đăng nhập hết hạn");
        }
        throw new Error(`Không thể tải giỏ hàng: ${response.status}`);
      }
      const cart = await response.json();
      setCartId(cart._id);
      const items = cart.products.map((item) => ({
        idProduct: item.idProduct._id,
        title: item.idProduct.title,
        description: item.idProduct.description,
        price: item.idProduct.price,
        url: item.idProduct.url,
        quantity: item.quantity,
        availableStock: item.idProduct.quantity,
      }));
      setCartItems(items);
    } catch (error) {
      setError(error.message);
      setCartItems([]);
      setCartId(null);
    } finally {
      setIsLoading(false);
      updateCartCount();
    }
  }, [currentUser._id, token, navigate, updateCartCount]);

  const removeFromCart = useCallback(async (productId) => {
    try {
      if (!cartId) throw new Error("Giỏ hàng không tồn tại");
      console.log("Removing product - Product ID:", productId);
      const response = await fetch(`http://localhost:9999/shoppingCart/${cartId}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: 0 }), // Gửi quantity: 0 để xóa
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.log("API Error Response:", errorText);
        throw new Error(`Không thể xóa sản phẩm: ${errorText}`);
      }
      const updatedCart = await response.json();
      console.log("API Response after remove:", updatedCart);
      await fetchCartItems();
    } catch (error) {
      console.error("Lỗi khi xóa sản phẩm:", error);
      alert(error.message || "Không thể xóa sản phẩm khỏi giỏ hàng");
    }
  }, [cartId, token, fetchCartItems]);

  const updateQuantity = useCallback(async (productId, newQuantity) => {
    if (newQuantity < 1) return;

    try {
      if (!cartId) throw new Error("Giỏ hàng không tồn tại");
      const existingProduct = cartItems.find((item) => item.idProduct === productId);
      if (!existingProduct) throw new Error("Sản phẩm không tồn tại trong giỏ hàng");

      console.log("Sending to API - Product ID:", productId, "New Quantity:", newQuantity);
      const response = await fetch(`http://localhost:9999/shoppingCart/${cartId}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: newQuantity }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.log("API Error Response:", errorText);
        throw new Error(`Không thể cập nhật số lượng: ${errorText}`);
      }
      const updatedCart = await response.json();
      console.log("API Response:", updatedCart);
      await fetchCartItems();
    } catch (error) {
      console.error("Lỗi khi cập nhật số lượng:", error);
      alert(error.message || "Không thể cập nhật số lượng");
    }
  }, [cartId, cartItems, token, fetchCartItems]);

  const getCartTotal = useCallback(() => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  }, [cartItems]);

  const handleCheckout = useCallback(() => {
    if (!currentUser._id || !token) {
      alert("Vui lòng đăng nhập để thanh toán");
      navigate("/auth");
      return;
    }
    if (cartItems.length === 0) {
      alert("Giỏ hàng của bạn trống!");
      return;
    }
    navigate("/checkout", { state: { cartItems, total: getCartTotal() } });
  }, [currentUser._id, token, cartItems.length, navigate, getCartTotal]);

  const handleConfirmRemove = useCallback((productId) => {
    setConfirmRemoveProductId(productId);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (confirmRemoveProductId) {
      removeFromCart(confirmRemoveProductId);
      setConfirmRemoveProductId(null);
    }
  }, [confirmRemoveProductId, removeFromCart]);

  const handleCancelDelete = useCallback(() => {
    setConfirmRemoveProductId(null);
  }, []);

  useEffect(() => {
    let mounted = true;
    if (mounted) fetchCartItems();
    return () => { mounted = false; };
  }, [fetchCartItems]);

  if (!currentUser._id || !token) {
    return (
      <div id="MainLayout" className="min-w-[1050px] max-w-[1300px] mx-auto">
        <TopMenu />
        <MainHeader />
        <SubMenu />
        <div className="text-center py-20">
          Vui lòng{" "}
          <button onClick={() => navigate("/auth")} className="text-blue-500 hover:underline">
            đăng nhập
          </button>{" "}
          để xem giỏ hàng của bạn
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div id="MainLayout" className="min-w-[1050px] max-w-[1300px] mx-auto">
      <TopMenu />
      <MainHeader />
      <SubMenu />
      <div className="max-w-[1200px] mx-auto mb-8 min-h-[400px]">
        <div className="text-2xl font-bold my-4">Giỏ hàng</div>
        {error && <div className="text-red-500 text-center mb-4">{error}</div>}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 min-h-[400px]">
          <div className="md:col-span-2">
            {isLoading ? (
              <CartSkeleton />
            ) : cartItems.length === 0 ? (
              <EmptyCart />
            ) : (
              <div className="space-y-4">
                {cartItems.map((product) => (
                  <CartItem
                    key={product.idProduct}
                    product={product}
                    onRemove={removeFromCart}
                    onUpdateQuantity={updateQuantity}
                    availableStock={product.availableStock}
                    onConfirmRemove={handleConfirmRemove}
                  />
                ))}
              </div>
            )}
            {confirmRemoveProductId && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg shadow-lg">
                  <h3 className="text-lg font-semibold mb-4">Xác nhận</h3>
                  <p>Bạn có muốn xóa sản phẩm này khỏi giỏ hàng không?</p>
                  <div className="mt-4 flex justify-end gap-4">
                    <button
                      onClick={handleCancelDelete}
                      className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleConfirmDelete}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          {cartItems.length > 0 && !isLoading && (
            <div className="md:col-span-1">
              <div className="bg-white p-4 border sticky top-4">
                <button
                  onClick={handleCheckout}
                  className="flex items-center justify-center bg-blue-600 w-full text-white font-semibold p-3 rounded-full hover:bg-blue-700"
                >
                  Thanh toán
                </button>
                <div className="flex items-center justify-between mt-4 text-sm mb-1">
                  <div>Sản phẩm ({cartItems.length})</div>
                  <div>{getCartTotal().toFixed(2)} VND</div>
                </div>
                <div className="flex items-center justify-between mb-4 text-sm">
                  <div>Vận chuyển:</div>
                  <div>Miễn phí</div>
                </div>
                <div className="border-b border-gray-300" />
                <div className="flex items-center justify-between mt-4 mb-1 text-lg font-semibold">
                  <div>Tổng cộng</div>
                  <div>{getCartTotal().toFixed(2)} VND</div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="mt-12">
          <SimilarProducts />
        </div>
      </div>
      <Footer />
    </div>
  );
}