import { useState, useEffect } from "react";
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
      <ShoppingCart className="h-16 w-16 text-gray-400 mb-4" />
      <h3 className="text-2xl font-semibold mb-2">Your cart is empty</h3>
      <p className="text-gray-500 mb-6">
        Looks like you haven't added anything to your cart yet
      </p>
      <button
        onClick={() => navigate("/")}
        className="bg-blue-600 text-white px-8 py-2 rounded-full hover:bg-blue-700"
      >
        Start Shopping
      </button>
    </div>
  );
}

function CartItem({ product, onRemove, onUpdateQuantity, availableStock }) {
  const [isUpdating, setIsUpdating] = useState(false);

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
              onClick={() => {
                setIsUpdating(true);
                onUpdateQuantity(
                  product.idProduct,
                  product.quantity - 1
                ).finally(() => setIsUpdating(false));
              }}
              className="p-1 rounded-full hover:bg-gray-100"
              disabled={product.quantity <= 1 || isUpdating}
            >
              <Minus size={16} />
            </button>
            <span>{product.quantity}</span>
            <button
              onClick={() => {
                setIsUpdating(true);
                onUpdateQuantity(
                  product.idProduct,
                  product.quantity + 1
                ).finally(() => setIsUpdating(false));
              }}
              className="p-1 rounded-full hover:bg-gray-100"
              disabled={product.quantity >= availableStock || isUpdating}
            >
              <Plus size={16} />
            </button>
          </div>
          {availableStock === 0 && (
            <div className="text-red-500 text-sm mt-1">Hết hàng</div>
          )}
        </div>
      </div>
      <button
        onClick={() => {
          setIsUpdating(true);
          onRemove(product.idProduct).finally(() => setIsUpdating(false));
        }}
        className="text-blue-500 hover:text-blue-700"
        disabled={isUpdating}
      >
        Xóa
      </button>
    </div>
  );
}

export default function Cart() {
  const navigate = useNavigate();
  const { updateCartCount } = useCart();
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
  const token = localStorage.getItem("token");

  const fetchCartItems = async () => {
    if (!currentUser._id || !token) {
      setCartItems([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("http://localhost:9999/shoppingCart", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
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
      if (!cart || !cart.products) {
        setCartItems([]);
      } else {
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
      }
      updateCartCount();
    } catch (error) {
      setError(error.message);
      setCartItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  const addToCart = async (productId) => {
    if (!currentUser._id || !token) {
      alert("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng");
      navigate("/auth");
      return;
    }

    try {
      const productResponse = await fetch(
        `http://localhost:9999/products/${productId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!productResponse.ok)
        throw new Error("Không thể lấy thông tin sản phẩm");
      const product = await productResponse.json();
      if (product.quantity <= 0) {
        alert("Sản phẩm này đã hết hàng!");
        return;
      }

      const cartResponse = await fetch("http://localhost:9999/shoppingCart", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const cart = await cartResponse.json();

      let products = cart?.products || [];
      const existingProduct = products.find(
        (p) => p.idProduct._id === productId
      );
      if (existingProduct) {
        const newQuantity = existingProduct.quantity + 1;
        if (newQuantity > product.quantity) {
          alert("Không thể thêm sản phẩm; đã đạt giới hạn tồn kho!");
          return;
        }
        products = products.map((p) =>
          p.idProduct._id === productId ? { ...p, quantity: newQuantity } : p
        );
      } else {
        products.push({ idProduct: productId, quantity: 1 });
      }

      const updateResponse = await fetch("http://localhost:9999/shoppingCart", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ products }),
      });
      if (!updateResponse.ok) throw new Error("Không thể cập nhật giỏ hàng");

      await fetchCartItems();
    } catch (error) {
      console.error("Lỗi khi thêm vào giỏ hàng:", error);
      alert(error.message || "Không thể thêm sản phẩm vào giỏ hàng");
    }
  };

  const removeFromCart = async (productId) => {
    try {
      const cartResponse = await fetch("http://localhost:9999/shoppingCart", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!cartResponse.ok) throw new Error("Không thể lấy giỏ hàng");
      const cart = await cartResponse.json();

      const products = cart.products.filter(
        (p) => p.idProduct._id !== productId
      );
      if (products.length === 0) {
        const deleteResponse = await fetch(
          "http://localhost:9999/shoppingCart",
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!deleteResponse.ok) throw new Error("Không thể xóa giỏ hàng");
      } else {
        const updateResponse = await fetch(
          "http://localhost:9999/shoppingCart",
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ products }),
          }
        );
        if (!updateResponse.ok) throw new Error("Không thể cập nhật giỏ hàng");
      }

      await fetchCartItems();
    } catch (error) {
      console.error("Lỗi khi xóa sản phẩm:", error);
      alert(error.message || "Không thể xóa sản phẩm khỏi giỏ hàng");
    }
  };

  const updateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) return;

    try {
      const productResponse = await fetch(
        `http://localhost:9999/products/${productId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!productResponse.ok)
        throw new Error("Không thể lấy thông tin sản phẩm");
      const product = await productResponse.json();
      if (newQuantity > product.quantity) {
        alert("Không thể cập nhật số lượng; không đủ hàng tồn kho!");
        return;
      }

      const cartResponse = await fetch("http://localhost:9999/shoppingCart", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!cartResponse.ok) throw new Error("Không thể lấy giỏ hàng");
      const cart = await cartResponse.json();

      const products = cart.products.map((p) =>
        p.idProduct._id === productId ? { ...p, quantity: newQuantity } : p
      );

      const updateResponse = await fetch("http://localhost:9999/shoppingCart", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ products }),
      });
      if (!updateResponse.ok) throw new Error("Không thể cập nhật giỏ hàng");

      await fetchCartItems();
    } catch (error) {
      console.error("Lỗi khi cập nhật số lượng:", error);
      alert(error.message || "Không thể cập nhật số lượng");
    }
  };

  const getCartTotal = () => {
    return cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  };

  const handleCheckout = () => {
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
  };

  useEffect(() => {
    fetchCartItems();
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
          để xem giỏ hàng của bạn
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

      <div className="max-w-[1200px] mx-auto mb-8 min-h-[300px]">
        <div className="text-2xl font-bold my-4">Giỏ hàng</div>
        {error && <div className="text-red-500 text-center mb-4">{error}</div>}
        {isLoading ? (
          <div className="text-center py-12">Đang tải...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              {cartItems.length === 0 ? (
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
                    />
                  ))}
                </div>
              )}
            </div>

            {cartItems.length > 0 && (
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
        )}

        <div className="mt-12">
          <SimilarProducts />
        </div>
      </div>
      <Footer />
    </div>
  );
}
