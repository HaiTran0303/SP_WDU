import { useState, useEffect } from "react";
import {
  FaUsers,
  FaShoppingBag,
  FaBoxOpen,
  FaList,
  FaShoppingCart,
  FaEdit,
  FaTrashAlt,
  FaBan,
  FaCheckCircle,
  FaEye,
  FaSearch,
  FaPlus,
  FaSignOutAlt,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useDebounce } from "use-debounce";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [sellerProducts, setSellerProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionStates, setActionStates] = useState({});
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [successMessage, setSuccessMessage] = useState(null);
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState({
    show: false,
    action: null,
    id: null,
  });
  const [showDetail, setShowDetail] = useState({
    show: false,
    type: null,
    data: null,
  });
  const [showAddEdit, setShowAddEdit] = useState({
    show: false,
    type: null,
    data: null,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const navigate = useNavigate();

  // Axios instance
  const createApiInstance = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/auth");
      return null;
    }

    const api = axios.create({
      baseURL: "http://localhost:9999",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/auth");
          setError("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
        }
        return Promise.reject(error);
      }
    );

    return api;
  };

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async (retryCount = 0) => {
      const api = createApiInstance();
      if (!api) return;

      try {
        setLoading(true);
        setError(null);
        const [
          usersRes,
          ordersRes,
          categoriesRes,
          productsRes,
          sellerProductsRes,
        ] = await Promise.all([
          api.get("/users"),
          // api.get("/orders"),
          // api.get("/categories"),
          // api.get("/products"),
          // api.get("/sellerProducts"),
        ]);

        setUsers(usersRes.data);
        // setOrders(ordersRes.data);
        // setCategories(categoriesRes.data);
        // setProducts(productsRes.data);
        // setSellerProducts(sellerProductsRes.data);
        setLoading(false);
      } catch (err) {
        if (retryCount < 2) {
          setTimeout(() => fetchData(retryCount + 1), 1000);
        } else {
          setError(err.response?.data?.message || "Không thể tải dữ liệu");
          setLoading(false);
        }
      }
    };
    fetchData();
  }, []);

  // Filter data
  const filterData = (data, tab) => {
    if (!searchTerm) return data;
    return data.filter((item) => {
      if (tab === "users") {
        return (
          item.fullname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.email?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      } else if (tab === "products") {
        return item.title?.toLowerCase().includes(searchTerm.toLowerCase());
      } else if (tab === "orders") {
        return (
          item._id?.toString().includes(searchTerm) ||
          users
            .find((u) => u._id === item.user_id)
            ?.fullname?.toLowerCase()
            .includes(searchTerm.toLowerCase())
        );
      } else if (tab === "categories") {
        return item.name?.toLowerCase().includes(searchTerm.toLowerCase());
      } else if (tab === "sellerProducts") {
        return users
          .find((u) => u.id === item.userId)
          ?.fullname?.toLowerCase()
          .includes(searchTerm.toLowerCase());
      }
      return false;
    });
  };

  // Pagination
  const paginateData = (data) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return data.slice(startIndex, startIndex + itemsPerPage);
  };

  const getTotalPages = (data) => Math.ceil(data.length / itemsPerPage);

  const handlePageChange = (page) => {
    if (
      page >= 1 &&
      page <= getTotalPages(filterData(getDataByTab(), activeTab))
    ) {
      setCurrentPage(page);
    }
  };

  const getDataByTab = () => {
    switch (activeTab) {
      case "users":
        return users;
      case "products":
        return products;
      case "orders":
        return orders;
      case "categories":
        return categories;
      case "sellerProducts":
        return sellerProducts;
      default:
        return [];
    }
  };

  // Actions
  const confirmAction = (action, id) => {
    setShowConfirm({ show: true, action, id });
    setSuccessMessage(null);
  };

  const executeAction = async () => {
    const { action, id } = showConfirm;
    setActionLoading(true);
    try {
      if (action === "toggleUser") {
        const user = users.find((u) => u._id === id);
        await toggleUserStatus(id, user.action);
      } else if (action === "deleteProduct") {
        await deleteProduct(id);
      } else if (action === "cancelOrder") {
        await cancelOrder(id);
      } else if (action === "deleteUser") {
        await deleteUser(id);
      } else if (action === "deleteCategory") {
        await deleteCategory(id);
      }
      setShowConfirm({ show: false, action: null, id: null });
    } catch (err) {
      setError(err.response?.data?.message || "Hành động thất bại");
    }
    setActionLoading(false);
  };

  const toggleUserStatus = async (id, currentAction) => {
    const api = createApiInstance();
    if (!api) return;

    setActionStates((prev) => ({
      ...prev,
      [id]: { ...prev[id], toggle: true },
    }));

    try {
      const newAction = currentAction === "unlock" ? "lock" : "unlock";
      const response = await api.patch(`/users/${id}`, { action: newAction });

      setUsers(
        users.map((u) => (u._id === id ? { ...u, action: newAction } : u))
      );

      setSuccessMessage(
        `Đã ${newAction === "lock" ? "khóa" : "mở khóa"} người dùng thành công!`
      );
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Không thể cập nhật trạng thái");
    }

    setActionStates((prev) => ({
      ...prev,
      [id]: { ...prev[id], toggle: false },
    }));
  };

  const deleteUser = async (id) => {
    const api = createApiInstance();
    if (!api) return;

    setActionStates((prev) => ({
      ...prev,
      [id]: { ...prev[id], delete: true },
    }));
    try {
      await api.delete(`/users/${id}`);
      setUsers(users.filter((u) => u._id !== id));
      setSuccessMessage("Xóa người dùng thành công!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Không thể xóa người dùng");
    }
    setActionStates((prev) => ({
      ...prev,
      [id]: { ...prev[id], delete: false },
    }));
  };

  const addEditUser = async (userData) => {
    const api = createApiInstance();
    if (!api) return;

    setActionLoading(true);
    try {
      let response;
      if (userData.id) {
        // Cập nhật
        response = await api.put(`/users/${userData.id}`, userData);
        // Cập nhật lại danh sách users trong state
        setUsers((prevUsers) =>
          prevUsers.map((u) => (u._id === userData.id ? response.data : u))
        );
        setSuccessMessage("Cập nhật người dùng thành công!");
      } else {
        // Thêm mới
        response = await api.post("/users", userData);
        setUsers((prevUsers) => [...prevUsers, response.data]);
        setSuccessMessage("Thêm người dùng thành công!");
      }

      setShowAddEdit({ show: false, type: null, data: null });
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Không thể lưu người dùng");
    }
    setActionLoading(false);
  };

  const deleteProduct = async (productId) => {
    const api = createApiInstance();
    if (!api) return;

    setActionStates((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], delete: true },
    }));
    try {
      await api.delete(`/products/${productId}`);
      setProducts(products.filter((p) => p._id !== productId));
      setSuccessMessage("Xóa sản phẩm thành công!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Không thể xóa sản phẩm");
    }
    setActionStates((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], delete: false },
    }));
  };

  const addEditProduct = async (productData) => {
    const api = createApiInstance();
    if (!api) return;

    setActionLoading(true);
    try {
      const payload = {
        title: productData.title,
        description: productData.description,
        price: productData.price,
        categoryId: productData.categoryId,
        status: productData.status,
        quantity: productData.quantity,
        url: productData.url,
      };

      let response;

      if (productData.id) {
        // Nếu có ID thì gọi PUT để cập nhật
        response = await api.put(`/products/${productData.id}`, payload);
        setProducts(
          products.map((p) => (p._id === productData.id ? response.data : p))
        );
        setSuccessMessage("Cập nhật sản phẩm thành công!");
      } else {
        // Nếu không có ID thì gọi POST để thêm mới
        response = await api.post("/products", payload);
        setProducts([...products, response.data]);
        setSuccessMessage("Thêm sản phẩm thành công!");
      }

      // Đóng form
      setShowAddEdit({ show: false, type: null, data: null });
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi khi xử lý sản phẩm");
    }
    setActionLoading(false);
  };

  // Order Actions
  const editOrder = async (orderData) => {
    const api = createApiInstance();
    if (!api) return;

    setActionLoading(true);
    try {
      const response = await api.put(`/orders/${orderData._id}`, orderData);
      setOrders(
        orders.map((o) => (o._id === orderData._id ? response.data : o))
      );
      setSuccessMessage("Cập nhật đơn hàng thành công!");
      setShowAddEdit({ show: false, type: null, data: null });
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi khi cập nhật đơn hàng");
    }
    setActionLoading(false);
  };

  const cancelOrder = async (orderId) => {
    const api = createApiInstance();
    if (!api) return;

    setActionStates((prev) => ({
      ...prev,
      [orderId]: { ...prev[orderId], cancel: true },
    }));
    try {
      const response = await api.patch(`/orders/${orderId}`, {
        status: "cancelled",
      });
      setOrders(orders.map((o) => (o._id === orderId ? response.data : o)));
      setSuccessMessage("Hủy đơn hàng thành công!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Không thể hủy đơn hàng");
    }
    setActionStates((prev) => ({
      ...prev,
      [orderId]: { ...prev[orderId], cancel: false },
    }));
  };

  const deleteCategory = async (id) => {
    const api = createApiInstance();
    if (!api) return;

    try {
      await api.delete(`/categories/${id}`);
      setCategories(categories.filter((c) => c._id !== id));
      setSuccessMessage("Xóa danh mục thành công!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi khi xóa danh mục");
    }
  };

  const addEditCategory = async (categoryData) => {
    const api = createApiInstance();
    if (!api) return;
    setActionLoading(true);
    try {
      let response;
      const payload = {
        name: categoryData.name,
        description: categoryData.description || "", // Optional
      };

      if (categoryData._id) {
        response = await api.put(`/categories/${categoryData._id}`, payload);
        setCategories(
          categories.map((c) =>
            c._id === categoryData._id ? response.data : c
          )
        );
        setSuccessMessage("Cập nhật danh mục thành công!");
      } else {
        response = await api.post("/categories", payload);
        setCategories([...categories, response.data]);
        setSuccessMessage("Thêm danh mục thành công!");
      }

      setShowAddEdit({ show: false, type: null, data: null });
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi khi xử lý danh mục");
    }
    setActionLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/auth");
  };

  const showDetailModal = (type, id) => {
    let data;
    if (type === "user") data = users.find((u) => u._id === id);
    else if (type === "product") data = products.find((p) => p._id === id);
    else if (type === "order") data = orders.find((o) => o._id === id);
    else if (type === "sellerProduct")
      data = sellerProducts.find((s) => s._id === id);
    setShowDetail({ show: true, type, data });
  };

  const showAddEditModal = (type, data = null) => {
    setShowAddEdit({ show: true, type, data });
    setSuccessMessage(null);
  };

  const getOrderStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return (
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
            Hoàn thành
          </span>
        );
      case "processing":
        return (
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
            Đang xử lý
          </span>
        );
      case "shipped":
        return (
          <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium">
            Đã giao
          </span>
        );
      case "cancelled":
        return (
          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
            Đã hủy
          </span>
        );
      case "pending":
        return (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
            Chờ xử lý
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
            {status}
          </span>
        );
    }
  };

  const getProductStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "available":
        return (
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
            Có sẵn
          </span>
        );
      case "out_of_stock":
        return (
          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
            Hết hàng
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
            {status}
          </span>
        );
    }
  };

  // Render
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-t-blue-500 border-gray-200 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b p-4 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Admin Panel</h2>
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-2 rounded-md hover:bg-gray-100"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>

      {/* Sidebar */}
      <div
        className={`${
          isMenuOpen ? "block" : "hidden"
        } md:block w-full md:w-64 bg-white shadow-md md:h-screen md:sticky md:top-0`}
      >
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Admin Panel</h2>
          <ul className="space-y-2">
            <li
              className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                activeTab === "users"
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => {
                setActiveTab("users");
                setCurrentPage(1);
                setIsMenuOpen(false);
              }}
            >
              <FaUsers className="w-5 h-5 mr-3" />
              <span>Quản lý người dùng</span>
            </li>
            <li
              className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                activeTab === "products"
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => {
                setActiveTab("products");
                setCurrentPage(1);
                setIsMenuOpen(false);
              }}
            >
              <FaBoxOpen className="w-5 h-5 mr-3" />
              <span>Quản lý sản phẩm</span>
            </li>
            <li
              className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                activeTab === "orders"
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => {
                setActiveTab("orders");
                setCurrentPage(1);
                setIsMenuOpen(false);
              }}
            >
              <FaShoppingBag className="w-5 h-5 mr-3" />
              <span>Quản lý đơn hàng</span>
            </li>
            <li
              className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                activeTab === "categories"
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => {
                setActiveTab("categories");
                setCurrentPage(1);
                setIsMenuOpen(false);
              }}
            >
              <FaList className="w-5 h-5 mr-3" />
              <span>Quản lý danh mục</span>
            </li>
            <li
              className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                activeTab === "sellerProducts"
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => {
                setActiveTab("sellerProducts");
                setCurrentPage(1);
                setIsMenuOpen(false);
              }}
            >
              <FaShoppingCart className="w-5 h-5 mr-3" />
              <span>Sản phẩm người bán</span>
            </li>
            <li
              className="flex items-center p-3 rounded-lg cursor-pointer text-gray-700 hover:bg-gray-100 transition-colors"
              onClick={() => navigate("/")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5 mr-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              <span>Về trang chủ</span>
            </li>
            <li
              className="flex items-center p-3 rounded-lg cursor-pointer text-red-700 hover:bg-red-100 transition-colors"
              onClick={handleLogout}
            >
              <FaSignOutAlt className="w-5 h-5 mr-3" />
              <span>Đăng xuất</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-8">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
            {activeTab === "users" && "Quản lý người dùng"}
            {activeTab === "products" && "Quản lý sản phẩm"}
            {activeTab === "orders" && "Quản lý đơn hàng"}
            {activeTab === "categories" && "Quản lý danh mục"}
            {activeTab === "sellerProducts" && "Quản lý sản phẩm của người bán"}
          </h1>
          <p className="text-gray-600">
            {activeTab === "users" &&
              "Xem và quản lý tất cả người dùng trong hệ thống"}
            {activeTab === "products" &&
              "Xem và quản lý tất cả sản phẩm trong hệ thống"}
            {activeTab === "orders" &&
              "Xem và quản lý tất cả đơn hàng trong hệ thống"}
            {activeTab === "categories" &&
              "Xem và quản lý tất cả danh mục sản phẩm"}
            {activeTab === "sellerProducts" &&
              "Xem và quản lý sản phẩm của người bán"}
          </p>
        </div>

        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full md:w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <FaSearch className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
          </div>

          {activeTab === "users" && (
            <button
              onClick={() => showAddEditModal("user")}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center"
            >
              <FaPlus className="h-5 w-5 mr-2" />
              Thêm tài khoản
            </button>
          )}
          {activeTab === "products" && (
            <button
              onClick={() => showAddEditModal("product")}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center"
            >
              <FaPlus className="h-5 w-5 mr-2" />
              Thêm sản phẩm
            </button>
          )}

          {activeTab === "categories" && (
            <button
              onClick={() => showAddEditModal("category")}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center"
            >
              <FaPlus className="h-5 w-5 mr-2" />
              Thêm danh mục
            </button>
          )}
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 p-4 bg-green-100 text-green-800 rounded-lg">
            {successMessage}
          </div>
        )}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {activeTab === "users" && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tên
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vai trò
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginateData(filterData(users, "users")).map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user._id || user.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-gray-500 font-medium">
                              {user.fullname?.charAt(0) || "?"}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.fullname}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.role === "admin" ? (
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                            Admin
                          </span>
                        ) : user.role === "seller" ? (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                            Người bán
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                            Người dùng
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => confirmAction("toggleUser", user._id)}
                          className={`inline-flex items-center px-3 py-1.5 rounded-md mr-2 ${
                            user.action === "lock"
                              ? "bg-red-50 text-red-700 hover:bg-red-100"
                              : "bg-green-50 text-green-700 hover:bg-green-100"
                          }`}
                          disabled={
                            actionStates[user._id]?.toggle || actionLoading
                          }
                        >
                          {actionStates[user._id]?.toggle ? (
                            <div className="w-4 h-4 border-2 border-t-white border-gray-300 rounded-full animate-spin mr-1"></div>
                          ) : user.action === "lock" ? (
                            <>
                              <FaBan className="w-4 h-4 mr-1" />
                              <span>Khóa</span>
                            </>
                          ) : (
                            <>
                              <FaCheckCircle className="w-4 h-4 mr-1" />
                              <span>Mở khóa</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => showDetailModal("user", user._id)}
                          className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 mr-2"
                        >
                          <FaEye className="w-4 h-4 mr-1" />
                          <span>Chi tiết</span>
                        </button>
                        <button
                          onClick={() => showAddEditModal("user", user)}
                          className="inline-flex items-center px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-md hover:bg-yellow-100 mr-2"
                        >
                          <FaEdit className="w-4 h-4 mr-1" />
                          <span>Sửa</span>
                        </button>
                        <button
                          onClick={() => confirmAction("deleteUser", user._id)}
                          className="inline-flex items-center px-3 py-1.5 bg-red-50 text-red-700 rounded-md hover:bg-red-100"
                          disabled={actionStates[user._id]?.delete}
                        >
                          {actionStates[user._id]?.delete ? (
                            <div className="w-4 h-4 border-2 border-t-white border-gray-300 rounded-full animate-spin mr-1"></div>
                          ) : (
                            <FaTrashAlt className="w-4 h-4 mr-1" />
                          )}
                          <span>Xóa</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filterData(users, "users").length === 0 && (
                <div className="text-center py-10">
                  <p className="text-gray-500">Không tìm thấy người dùng nào</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "products" && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sản phẩm
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Giá
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Danh mục
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Số lượng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginateData(filterData(products, "products")).map(
                    (product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product._id}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
                              {product.url ? (
                                <img
                                  src={product.url}
                                  alt={product.title}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center bg-gray-200">
                                  <FaBoxOpen className="h-6 w-6 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {product.title}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          ${product.price}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.categoryName || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getProductStatusBadge(product.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() =>
                              showDetailModal("product", product._id)
                            }
                            className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 mr-2"
                          >
                            <FaEye className="w-4 h-4 mr-1" />
                            <span>Chi tiết</span>
                          </button>
                          <button
                            onClick={() => showAddEditModal("product", product)}
                            className="inline-flex items-center px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-md hover:bg-yellow-100 mr-2"
                          >
                            <FaEdit className="w-4 h-4 mr-1" />
                            <span>Sửa</span>
                          </button>
                          <button
                            onClick={() =>
                              confirmAction("deleteProduct", product._id)
                            }
                            className="inline-flex items-center px-3 py-1.5 bg-red-50 text-red-700 rounded-md hover:bg-red-100"
                            disabled={actionLoading}
                          >
                            <FaTrashAlt className="w-4 h-4 mr-1" />
                            <span>Xóa</span>
                          </button>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
              {filterData(products, "products").length === 0 && (
                <div className="text-center py-10">
                  <p className="text-gray-500">Không tìm thấy sản phẩm nào</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "orders" && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mã đơn
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Người đặt
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tổng tiền
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ngày đặt
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginateData(filterData(orders, "orders")).map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{order.order_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.user_id?.fullname || "N/A"}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ${order.total_amount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getOrderStatusBadge(order.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order.order_date).toLocaleDateString(
                          "vi-VN",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => showDetailModal("order", order._id)}
                          className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 mr-2"
                        >
                          <FaEye className="w-4 h-4 mr-1" />
                          <span>Chi tiết</span>
                        </button>
                        <button
                          onClick={() => showAddEditModal("order", order)}
                          className="inline-flex items-center px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-md hover:bg-yellow-100 mr-2"
                        >
                          <FaEdit className="w-4 h-4 mr-1" />
                          <span>Sửa</span>
                        </button>
                        {order.status !== "cancelled" &&
                          order.status !== "completed" && (
                            <button
                              onClick={() =>
                                confirmAction("cancelOrder", order._id)
                              }
                              className="inline-flex items-center px-3 py-1.5 bg-red-50 text-red-700 rounded-md hover:bg-red-100"
                              disabled={actionLoading}
                            >
                              <FaBan className="w-4 h-4 mr-1" />
                              <span>Hủy</span>
                            </button>
                          )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filterData(orders, "orders").length === 0 && (
                <div className="text-center py-10">
                  <p className="text-gray-500">Không tìm thấy đơn hàng nào</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "categories" && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tên danh mục
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mô tả
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginateData(filterData(categories, "categories")).map(
                    (category) => (
                      <tr key={category._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {category._id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {category.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {category.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() =>
                              showAddEditModal("category", category)
                            }
                            className="inline-flex items-center px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-md hover:bg-yellow-100 mr-2"
                          >
                            <FaEdit className="w-4 h-4 mr-1" />
                            <span>Sửa</span>
                          </button>
                          <button
                            onClick={() =>
                              confirmAction("deleteCategory", category._id)
                            }
                            className="inline-flex items-center px-3 py-1.5 bg-red-50 text-red-700 rounded-md hover:bg-red-100"
                            disabled={actionLoading}
                          >
                            <FaTrashAlt className="w-4 h-4 mr-1" />
                            <span>Xóa</span>
                          </button>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
              {filterData(categories, "categories").length === 0 && (
                <div className="text-center py-10">
                  <p className="text-gray-500">Không tìm thấy danh mục nào</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "sellerProducts" && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Người bán
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sản phẩm
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginateData(
                    filterData(sellerProducts, "sellerProducts")
                  ).map((seller) => (
                    <tr key={seller._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {seller._id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-gray-500 font-medium">
                              {users
                                .find((user) => user._id === seller.userId)
                                ?.fullname?.charAt(0) || "?"}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {users.find((user) => user.id === seller.userId)
                                ?.fullname || "N/A"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          {seller.products?.length > 0 ? (
                            seller.products.map((prod) => (
                              <div
                                key={prod.idProduct}
                                className="flex items-center"
                              >
                                <span className="text-sm text-gray-900 font-medium">
                                  {products.find(
                                    (p) => p._id === prod.idProduct
                                  )?.title || prod.idProduct}
                                </span>
                                <span className="ml-2">
                                  {prod.status === "active" ? (
                                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                      Đang bán
                                    </span>
                                  ) : (
                                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                                      Ngừng bán
                                    </span>
                                  )}
                                </span>
                              </div>
                            ))
                          ) : (
                            <span className="text-sm text-gray-500">
                              Không có sản phẩm
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() =>
                            showDetailModal("sellerProduct", seller._id)
                          }
                          className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100"
                        >
                          <FaEye className="w-4 h-4 mr-1" />
                          <span>Chi tiết</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filterData(sellerProducts, "sellerProducts").length === 0 && (
                <div className="text-center py-10">
                  <p className="text-gray-500">
                    Không tìm thấy sản phẩm người bán nào
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Hiển thị{" "}
            <span className="font-medium">
              {(currentPage - 1) * itemsPerPage + 1}
            </span>{" "}
            đến{" "}
            <span className="font-medium">
              {Math.min(
                currentPage * itemsPerPage,
                filterData(getDataByTab(), activeTab).length
              )}
            </span>{" "}
            trong số{" "}
            <span className="font-medium">
              {filterData(getDataByTab(), activeTab).length}
            </span>{" "}
            kết quả
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            >
              Trước
            </button>
            {Array.from(
              { length: getTotalPages(filterData(getDataByTab(), activeTab)) },
              (_, i) => i + 1
            ).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-1 border rounded-md text-sm ${
                  currentPage === page
                    ? "bg-blue-50 text-blue-600 border-blue-200"
                    : "border-gray-300 text-gray-500 hover:bg-gray-50"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={
                currentPage ===
                getTotalPages(filterData(getDataByTab(), activeTab))
              }
              className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            >
              Tiếp
            </button>
          </div>
        </div>
      </div>

      {/* Confirm Modal */}
      {showConfirm.show && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {showConfirm.action === "toggleUser" &&
                "Xác nhận thay đổi trạng thái"}
              {showConfirm.action === "deleteProduct" &&
                "Xác nhận xóa sản phẩm"}
              {showConfirm.action === "cancelOrder" && "Xác nhận hủy đơn hàng"}
              {showConfirm.action === "deleteUser" && "Xác nhận xóa tài khoản"}
              {showConfirm.action === "deleteCategory" &&
                "Xác nhận xóa danh mục"}
            </h3>

            <p className="text-gray-600 mb-6">
              {showConfirm.action === "toggleUser" &&
              users.find((u) => u._id === showConfirm.id)?.role === "admin" ? (
                <span className="text-red-500">
                  Không thể thay đổi trạng thái của tài khoản admin.
                </span>
              ) : (
                <>
                  Bạn có chắc chắn muốn{" "}
                  {showConfirm.action === "toggleUser"
                    ? `${
                        users.find((u) => u._id === showConfirm.id)?.action ===
                        "unlock"
                          ? "khóa"
                          : "mở khóa"
                      } người dùng này`
                    : showConfirm.action === "deleteProduct"
                    ? "xóa sản phẩm này"
                    : showConfirm.action === "cancelOrder"
                    ? "hủy đơn hàng này"
                    : showConfirm.action === "deleteUser"
                    ? "xóa tài khoản này"
                    : "xóa danh mục này"}{" "}
                  không?
                </>
              )}
            </p>

            <div className="flex justify-end gap-4">
              <button
                onClick={() =>
                  setShowConfirm({ show: false, action: null, id: null })
                }
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                disabled={actionLoading}
              >
                Hủy
              </button>

              {!(
                showConfirm.action === "toggleUser" &&
                users.find((u) => u._id === showConfirm.id)?.role === "admin"
              ) && (
                <button
                  onClick={executeAction}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center"
                  disabled={actionLoading}
                >
                  {actionLoading && (
                    <div className="w-5 h-5 border-2 border-t-white border-gray-300 rounded-full animate-spin mr-2"></div>
                  )}
                  Xác nhận
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetail.show && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {showDetail.type === "user" && "Chi tiết người dùng"}
              {showDetail.type === "product" && "Chi tiết sản phẩm"}
              {showDetail.type === "order" && "Chi tiết đơn hàng"}
              {showDetail.type === "sellerProduct" &&
                "Chi tiết sản phẩm người bán"}
            </h3>
            {showDetail.type === "user" && showDetail.data && (
              <div className="space-y-3">
                <p>
                  <span className="font-medium">ID:</span>{" "}
                  {showDetail.data._id || showDetail.data.id}
                </p>
                <p>
                  <span className="font-medium">Họ tên:</span>{" "}
                  {showDetail.data.fullname}
                </p>
                <p>
                  <span className="font-medium">Email:</span>{" "}
                  {showDetail.data.email}
                </p>
                <p>
                  <span className="font-medium">Vai trò:</span>{" "}
                  {showDetail.data.role === "admin"
                    ? "Admin"
                    : showDetail.data.role === "seller"
                    ? "Người bán"
                    : "Người dùng"}
                </p>
                <p>
                  <span className="font-medium">Trạng thái:</span>{" "}
                  {showDetail.data?.action === "lock" ? "Khóa" : "Mở khóa"}
                </p>
              </div>
            )}
            {showDetail.type === "product" && showDetail.data && (
              <div className="space-y-3">
                <p>
                  <span className="font-medium">ID:</span> {showDetail.data._id}
                </p>
                <p>
                  <span className="font-medium">Tên:</span>{" "}
                  {showDetail.data.title}
                </p>
                <p>
                  <span className="font-medium">Mô tả:</span>{" "}
                  {showDetail.data.description}
                </p>
                <p>
                  <span className="font-medium">Giá:</span> $
                  {showDetail.data.price}
                </p>
                <p>
                  <span className="font-medium">Danh mục:</span>{" "}
                  {showDetail.data.categoryName || "N/A"}
                </p>
                <p>
                  <span className="font-medium">Trạng thái:</span>{" "}
                  {showDetail.data.status}
                </p>
                <p>
                  <span className="font-medium">Số lượng:</span>{" "}
                  {showDetail.data.quantity}
                </p>
                <p>
                  <span className="font-medium">URL ảnh:</span>{" "}
                  {showDetail.data.url}
                </p>
              </div>
            )}
            {showDetail.type === "order" && showDetail.data && (
              <div className="space-y-3">
                <p>
                  <span className="font-medium">Mã đơn:</span>{" "}
                  {showDetail.data.order_id}
                </p>
                <p>
                  <span className="font-medium">Người đặt:</span>{" "}
                  {showDetail.data.user_id?.fullname || "N/A"}
                </p>
                <p>
                  <span className="font-medium">Tổng tiền:</span> $
                  {showDetail.data.total_amount}
                </p>
                <p>
                  <span className="font-medium">Trạng thái:</span>{" "}
                  {showDetail.data.status}
                </p>
                <p>
                  <span className="font-medium">Ngày đặt:</span>{" "}
                  {new Date(showDetail.data.order_date).toLocaleString("vi-VN")}
                </p>
                <p>
                  <span className="font-medium">Sản phẩm:</span>
                </p>
                <ul className="list-disc pl-5">
                  {showDetail.data.items?.map((item) => (
                    <li key={item.product_name}>
                      {item.product_name} (x{item.quantity}) - ${item.price}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {showDetail.type === "sellerProduct" && showDetail.data && (
              <div className="space-y-3">
                <p>
                  <span className="font-medium">ID:</span> {showDetail.data._id}
                </p>
                <p>
                  <span className="font-medium">Người bán:</span>{" "}
                  {users.find((u) => u.id === showDetail.data.userId)
                    ?.fullname || "N/A"}
                </p>
                <p>
                  <span className="font-medium">Sản phẩm:</span>
                </p>
                <ul className="list-disc pl-5">
                  {showDetail.data.products?.map((prod) => (
                    <li key={prod.idProduct}>
                      {products.find((p) => p._id === prod.idProduct)?.title ||
                        prod.idProduct}{" "}
                      -{" "}
                      {prod.status === "active" ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          Đang bán
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                          Ngừng bán
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex justify-end mt-6">
              <button
                onClick={() =>
                  setShowDetail({ show: false, type: null, data: null })
                }
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <div className="space-y-4">
        {showAddEdit.show && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {showAddEdit.type === "user" &&
                  (showAddEdit.data ? "Sửa tài khoản" : "Thêm tài khoản mới")}
                {showAddEdit.type === "product" &&
                  (showAddEdit.data ? "Sửa sản phẩm" : "Thêm sản phẩm mới")}
                {showAddEdit.type === "order" && "Sửa đơn hàng"}
                {showAddEdit.type === "category" &&
                  (showAddEdit.data ? "Sửa danh mục" : "Thêm danh mục mới")}
              </h3>
              {showAddEdit.type === "user" && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    const userData = {
                      id: showAddEdit.data?._id || "",
                      email: formData.get("email"),
                      password: formData.get("password"),
                      fullname: formData.get("fullname"),
                      order_id: formData.get("order_id")
                        ? formData
                            .get("order_id")
                            .split(",")
                            .map((id) => id.trim())
                        : [],
                      address: {
                        street: formData.get("street"),
                        zipcode: formData.get("zipcode"),
                        city: formData.get("city"),
                        country: formData.get("country"),
                      },
                      role: formData.get("role"),
                      action: formData.get("action"),
                    };
                    addEditUser(userData);
                  }}
                >
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        defaultValue={showAddEdit.data?.email || ""}
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Mật khẩu
                      </label>
                      <input
                        type="password"
                        name="password"
                        defaultValue={showAddEdit.data?.password || ""}
                        required={!showAddEdit.data}
                        className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Họ tên
                      </label>
                      <input
                        type="text"
                        name="fullname"
                        defaultValue={showAddEdit.data?.fullname || ""}
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Đơn hàng (phân cách bằng dấu phẩy)
                      </label>
                      <input
                        type="text"
                        name="order_id"
                        defaultValue={
                          showAddEdit.data?.order_id?.join(",") || ""
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Đường
                      </label>
                      <input
                        type="text"
                        name="street"
                        defaultValue={showAddEdit.data?.address?.street || ""}
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Mã bưu điện
                      </label>
                      <input
                        type="text"
                        name="zipcode"
                        defaultValue={showAddEdit.data?.address?.zipcode || ""}
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Thành phố
                      </label>
                      <input
                        type="text"
                        name="city"
                        defaultValue={showAddEdit.data?.address?.city || ""}
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Quốc gia
                      </label>
                      <input
                        type="text"
                        name="country"
                        defaultValue={showAddEdit.data?.address?.country || ""}
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Vai trò
                      </label>
                      <select
                        name="role"
                        defaultValue={showAddEdit.data?.role || "user"}
                        className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                      >
                        <option value="user">Người dùng</option>
                        <option value="seller">Người bán</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Trạng thái
                      </label>
                      <select
                        name="action"
                        defaultValue={showAddEdit.data?.action || "unlock"}
                        className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                      >
                        <option value="unlock">Mở khóa</option>
                        <option value="lock">Khóa</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-4 mt-6">
                    <button
                      type="button"
                      onClick={() =>
                        setShowAddEdit({ show: false, type: null, data: null })
                      }
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                      disabled={actionLoading}
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center"
                      disabled={actionLoading}
                    >
                      {actionLoading ? (
                        <div className="w-5 h-5 border-2 border-t-white border-gray-300 rounded-full animate-spin mr-2"></div>
                      ) : null}
                      {showAddEdit.data ? "Cập nhật" : "Thêm"}
                    </button>
                  </div>
                </form>
              )}
              {showAddEdit.type === "product" && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    const productData = {
                      id: showAddEdit.data?._id || "",
                      title: formData.get("title"),
                      description: formData.get("description"),
                      price: Number(formData.get("price")),
                      categoryId: formData.get("categoryId"),
                      status: formData.get("status"),
                      quantity: Number(formData.get("quantity")),
                      url: formData.get("url"),
                    };
                    addEditProduct(productData);
                  }}
                >
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Tên sản phẩm
                      </label>
                      <input
                        type="text"
                        name="title"
                        defaultValue={showAddEdit.data?.title || ""}
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Mô tả
                      </label>
                      <textarea
                        name="description"
                        defaultValue={showAddEdit.data?.description || ""}
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Giá
                      </label>
                      <input
                        type="number"
                        name="price"
                        defaultValue={showAddEdit.data?.price || ""}
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Danh mục
                      </label>
                      <select
                        name="categoryId"
                        defaultValue={showAddEdit.data?.categoryId || ""}
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                      >
                        <option value="">Chọn danh mục</option>
                        {categories.map((cat) => (
                          <option key={cat._id} value={cat._id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Trạng thái
                      </label>
                      <select
                        name="status"
                        defaultValue={showAddEdit.data?.status || "available"}
                        className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                      >
                        <option value="available">Có sẵn</option>
                        <option value="out_of_stock">Hết hàng</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Số lượng
                      </label>
                      <input
                        type="number"
                        name="quantity"
                        defaultValue={showAddEdit.data?.quantity || ""}
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        URL ảnh
                      </label>
                      <input
                        type="text"
                        name="url"
                        defaultValue={showAddEdit.data?.url || ""}
                        className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-4 mt-6">
                    <button
                      type="button"
                      onClick={() =>
                        setShowAddEdit({ show: false, type: null, data: null })
                      }
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                      disabled={actionLoading}
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center"
                      disabled={actionLoading}
                    >
                      {actionLoading ? (
                        <div className="w-5 h-5 border-2 border-t-white border-gray-300 rounded-full animate-spin mr-2"></div>
                      ) : null}
                      {showAddEdit.data ? "Cập nhật" : "Thêm"}
                    </button>
                  </div>
                </form>
              )}
              {showAddEdit.type === "order" && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    const orderData = {
                      _id: showAddEdit.data._id, // <- Thêm dòng này
                      order_id: showAddEdit.data.order_id,
                      user_id: showAddEdit.data.user_id,
                      order_date: showAddEdit.data.order_date,
                      total_amount: Number(formData.get("total_amount")),
                      status: formData.get("status"),
                      items: showAddEdit.data.items,
                    };
                    editOrder(orderData);
                  }}
                >
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Tổng tiền
                      </label>
                      <input
                        type="number"
                        name="total_amount"
                        defaultValue={showAddEdit.data?.total_amount || ""}
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Trạng thái
                      </label>
                      <select
                        name="status"
                        defaultValue={showAddEdit.data?.status || ""}
                        className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                      >
                        <option value="pending">Chờ xử lý</option>
                        <option value="processing">Đang xử lý</option>
                        <option value="shipped">Đã giao</option>
                        <option value="completed">Hoàn thành</option>
                        <option value="cancelled">Đã hủy</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-4 mt-6">
                    <button
                      type="button"
                      onClick={() =>
                        setShowAddEdit({ show: false, type: null, data: null })
                      }
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                      disabled={actionLoading}
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center"
                      disabled={actionLoading}
                    >
                      {actionLoading ? (
                        <div className="w-5 h-5 border-2 border-t-white border-gray-300 rounded-full animate-spin mr-2"></div>
                      ) : null}
                      Cập nhật
                    </button>
                  </div>
                </form>
              )}
              {showAddEdit.type === "category" && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    const categoryData = {
                      _id: showAddEdit.data?._id, // cần lấy _id ở đây
                      name: formData.get("name"),
                      description: formData.get("description"),
                    };
                    addEditCategory(categoryData);
                  }}
                >
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Tên danh mục
                      </label>
                      <input
                        type="text"
                        name="name"
                        defaultValue={showAddEdit.data?.name || ""}
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Mô tả
                      </label>
                      <textarea
                        name="description"
                        defaultValue={showAddEdit.data?.description || ""}
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-4 mt-6">
                    <button
                      type="button"
                      onClick={() =>
                        setShowAddEdit({ show: false, type: null, data: null })
                      }
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                      disabled={actionLoading}
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center"
                      disabled={actionLoading}
                    >
                      {actionLoading ? (
                        <div className="w-5 h-5 border-2 border-t-white border-gray-300 rounded-full animate-spin mr-2"></div>
                      ) : null}
                      {showAddEdit.data ? "Cập nhật" : "Thêm"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
