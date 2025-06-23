import { useState, useEffect } from "react";
import { ChevronDown, ShoppingCart } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/cartContext";
import Wishlist from "../pages/wishlist/page";

export default function TopMenu() {
  const [isMenu, setIsMenu] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const { cartCount, updateCartCount } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const user = localStorage.getItem("currentUser");
    const token = localStorage.getItem("token");
    if (user && token) {
      setCurrentUser(JSON.parse(user));
    } else {
      localStorage.removeItem("currentUser");
      localStorage.removeItem("token");
      setCurrentUser(null);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      updateCartCount();
    }
  }, [currentUser, updateCartCount]);

  const handleSignOut = () => {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("token");
    setCurrentUser(null);
    setIsMenu(false);
    navigate("/auth");
  };

  return (
    <div id="TopMenu" className="border-b">
      <div className="flex items-center justify-between w-full mx-auto max-w-[1200px]">
        <ul className="flex items-center text-[11px] text-[#333333] px-2 h-8">
          <li className="relative px-3">
            {currentUser ? (
              <button
                onClick={() => setIsMenu(!isMenu)}
                className="flex items-center gap-2 hover:underline cursor-pointer"
              >
                <div>Hi, {currentUser.username}</div>
                <ChevronDown size={12} />
              </button>
            ) : (
              <Link
                to="/auth"
                className="flex items-center gap-2 hover:underline cursor-pointer"
              >
                <div>Đăng nhập</div>
                <ChevronDown size={12} />
              </Link>
            )}

            {currentUser && isMenu && (
              <div className="absolute bg-white w-[200px] text-[#333333] z-40 top-[20px] left-0 border shadow-lg">
                <div className="flex items-center justify-start gap-1 p-3">
                  <img
                    src="https://picsum.photos/50"
                    alt="User Avatar"
                    className="w-[50px] h-[50px] rounded-full"
                  />
                  <div>
                    <div className="font-bold text-[13px]">
                      {currentUser.username}
                    </div>
                    <Link to={`/profile`}>
                      <div className="text-sm font-semibold border px-1 bg-gray-200 rounded-lg text-blue-500">
                        Account Settings
                      </div>
                    </Link>
                  </div>
                </div>
                <div className="border-b" />
                <ul className="bg-white">
                  <li className="text-[11px] py-2 px-4 hover:underline text-blue-500 hover:text-blue-600 cursor-pointer">
                    <Link to="/order-history">Lịch sử đơn hàng</Link>
                  </li>
                  <li
                    onClick={handleSignOut}
                    className="text-[11px] py-2 px-4 hover:underline text-blue-500 hover:text-blue-600 cursor-pointer"
                  >
                    Đăng xuất
                  </li>
                </ul>
              </div>
            )}
          </li>
          <li className="px-3 hover:underline cursor-pointer">
            <Link to="/daily-deals">Ưu đãi hàng ngày</Link>
          </li>
          <li className="px-3 hover:underline cursor-pointer">
            <Link to="/help">Hỗ trợ & Liên hệ</Link>
          </li>
        </ul>

        <ul className="flex items-center text-[11px] text-[#333333] px-2 h-8">
          {currentUser?.role === "admin" && (
            <li className="flex items-center gap-2 px-3 hover:underline cursor-pointer">
              <Link
                to="/adminDashboard"
                className="flex items-center gap-2 text-blue-400 font-bold"
              >
                Bảng quản trị
              </Link>
            </li>
          )}
          <li className="flex items-center gap-2 px-3 hover:underline cursor-pointer">
            <Link to="/sell">Bán hàng</Link>
          </li>
          <li className="flex items-center gap-2 px-3 hover:underline cursor-pointer">
            <Link to="/shipping">
              <img width={32} src="/images/vn.png" alt="Ship to Vietnam" />
              Giao hàng đến
            </Link>
          </li>
          <li className="flex items-center gap-2 px-3 hover:underline cursor-pointer">
            <Link to="/wishlist" element={<Wishlist key={Math.random().toString(36).substring(2)} />}>Danh sách yêu thích</Link>
          </li>
          <li className="px-3 hover:underline cursor-pointer relative">
            <Link to="/cart">
              <ShoppingCart size={22} />
              {cartCount > 0 && (
                <div className="absolute text-[10px] -top-[2px] -right-[5px] bg-red-500 w-[14px] h-[14px] rounded-full text-white flex items-center justify-center">
                  {cartCount}
                </div>
              )}
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
