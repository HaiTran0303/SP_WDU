"use client";

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiSearch,
  FiHeart,
  FiChevronDown,
  FiChevronRight,
  FiChevronLeft,
  FiClock,
  FiStar,
  FiArrowRight,
  FiArrowLeft,
  FiGrid,
  FiList,
  FiFilter,
  FiRefreshCw,
  FiTrendingUp,
  FiShoppingCart,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "../context/cartContext";
import { useWishlist } from "../context/WishlistContext"; // Import useWishlist

import TopMenu from "../components/TopMenu";
import MainHeader from "../components/MainHeader";
import SubMenu from "../components/SubMenu";
import Footer from "../components/Footer";
const { cartId, setCartId, updateCartCount } = useCart;
const BANNER_SLIDES = [
  {
    id: 1,
    title: "Summer Sale",
    subtitle: "Discover amazing deals on thousands of items",
    cta: "Shop Now",
    image: "https://cdn-media.sforum.vn/storage/app/media/wp-content/uploads/2024/02/bang-gia-iphone-hien-nay-Thumbnail.jpg",
    color: "from-blue-600 to-purple-600",
  },
  {
    id: 2,
    title: "New Tech Arrivals",
    subtitle: "The latest gadgets at unbeatable prices",
    cta: "Explore Tech",
    image: "https://tintuc.dienthoaigiakho.vn/wp-content/uploads/2022/04/1200x628_Banner-KM-2.png",
    color: "from-green-600 to-teal-600",
  },
  {
    id: 3,
    title: "Fashion Forward",
    subtitle: "Trending styles for every occasion",
    cta: "Shop Now",
    image: "https://stcv4.hnammobile.com/uploads/news/large/iphone-14-series-luon-co-san-hang-giao-ngay-khong-can-doi-social.jpg?v=1741847827",
    color: "from-red-600 to-orange-600",
  },
];

const FEATURED_BRANDS = [
  {
    id: 1,
    name: "Apple",
    logo: "https://picsum.photos/id/180/100/100",
    discount: "Up to 30% off",
  },
  {
    id: 2,
    name: "Samsung",
    logo: "https://picsum.photos/id/181/100/100",
    discount: "Up to 40% off",
  },
  {
    id: 3,
    name: "Sony",
    logo: "https://picsum.photos/id/182/100/100",
    discount: "Up to 25% off",
  },
  {
    id: 4,
    name: "Nike",
    logo: "https://picsum.photos/id/183/100/100",
    discount: "Up to 35% off",
  },
  {
    id: 5,
    name: "Adidas",
    logo: "https://picsum.photos/id/184/100/100",
    discount: "Up to 30% off",
  },
  {
    id: 6,
    name: "Dyson",
    logo: "https://picsum.photos/id/185/100/100",
    discount: "Up to 20% off",
  },
];

const TRENDING_SEARCHES = [
  "iPhone 15",
  "PlayStation 5",
  "Air Fryer",
  "Nike Air Jordan",
  "OLED TV",
  "Mechanical Keyboard",
  "Wireless Earbuds",
  "Smart Watch",
  "Lego Sets",
  "Outdoor Furniture",
];

const COLLECTIONS = [
  {
    id: 1,
    title: "Summer Essentials",
    image: "https://picsum.photos/id/28/600/300",
    itemCount: 156,
    color: "from-yellow-400 to-orange-500",
  },
  {
    id: 2,
    title: "Tech Gadgets Under $100",
    image: "https://picsum.photos/id/48/600/300",
    itemCount: 89,
    color: "from-blue-400 to-indigo-500",
  },
  {
    id: 3,
    title: "Home Office Setup",
    image: "https://picsum.photos/id/36/600/300",
    itemCount: 124,
    color: "from-green-400 to-teal-500",
  },
];

const CATEGORY_IMAGES = {
  Fashion:
    "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=500&h=500&fit=crop",
  Electronics:
    "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=500&h=500&fit=crop",
  "Home & Kitchen":
    "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=500&h=500&fit=crop",
  "Health & Fitness":
    "https://images.unsplash.com/photo-1576678927484-cc907957088c?w=500&h=500&fit=crop",
  Entertainment:
    "https://images.unsplash.com/photo-1511882150382-421056c89033?w=500&h=500&fit=crop",
};

const ProductSkeleton = () => (
  <div className="bg-white rounded-lg shadow-sm overflow-hidden flex flex-col h-full animate-pulse">
    <div className="relative w-full h-48 bg-gray-300"></div>
    <div className="p-4 flex-grow flex flex-col">
      <div className="h-6 bg-gray-300 rounded mb-2"></div>
      <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-300 rounded w-1/2"></div>
    </div>
  </div>
);

const MainPage = () => {
  const navigate = useNavigate();
  const { updateCartCount } = useCart();
  const { wishlist, setWishlist } = useWishlist(); // Sử dụng context
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("featured");
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [isSticky, setIsSticky] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [currentBannerSlide, setCurrentBannerSlide] = useState(0);
  const [cartId, setCartId] = useState(null);
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
  const token = localStorage.getItem("token");

  const bannerRef = useRef(null);
  const categoriesRef = useRef(null);
  const filtersRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    try {
      const storedWishlist = JSON.parse(
        localStorage.getItem("wishlist") || "[]"
      );
      setWishlist(storedWishlist);
    } catch (error) {
      console.error("Error loading wishlist:", error);
      setWishlist([]);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("wishlist", JSON.stringify(wishlist));
    } catch (error) {
      console.error("Error saving wishlist:", error);
    }
  }, [wishlist]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const productsResponse = await fetch("http://localhost:9999/products/");
        if (!productsResponse.ok)
          throw new Error(`HTTP error! status: ${productsResponse.status}`);
        const productsData = await productsResponse.json();
        const categoriesResponse = await fetch(
          "http://localhost:9999/categories"
        );
        if (!categoriesResponse.ok)
          throw new Error(`HTTP error! status: ${categoriesResponse.status}`);
        const categoriesData = await categoriesResponse.json();

        const productsArray = Array.isArray(productsData)
          ? productsData
          : productsData.data || [];
        setProducts(productsArray);
        setCategories(
          Array.isArray(categoriesData)
            ? categoriesData
            : categoriesData.data || []
        );

        const randomProducts = productsArray.slice(0, 4);
        setFeaturedProducts(randomProducts);

        // Fetch cart để lấy cartId
        if (currentUser._id && token) {
          const cartResponse = await fetch(
            `http://localhost:9999/shoppingCart?userId=${currentUser._id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );
          if (cartResponse.ok) {
            const cart = await cartResponse.json();
            setCartId(cart._id);
          }
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser._id, token]);

  useEffect(() => {
    const startAutoSlide = () => {
      intervalRef.current = setInterval(() => {
        setCurrentBannerSlide((prev) => (prev + 1) % BANNER_SLIDES.length);
      }, 3000);
    };
    startAutoSlide();
    return () => clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory]);

  useEffect(() => {
    const handleScroll = () => {
      if (filtersRef.current)
        setIsSticky(window.scrollY > filtersRef.current.offsetTop);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const filteredProducts = selectedCategory
    ? products.filter((product) => product.categoryId == selectedCategory)
    : products.filter(
        (product) =>
          product.price / 100 >= priceRange[0] &&
          product.price / 100 <= priceRange[1]
      );

  const getSortedProducts = () => {
    const sorted = [...filteredProducts];
    switch (sortBy) {
      case "price-low":
        sorted.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        sorted.sort((a, b) => b.price - a.price);
        break;
      case "newest":
        sorted.sort(
          (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        );
        break;
      default:
        break;
    }
    return sorted;
  };

  const sortedProducts = getSortedProducts();
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = sortedProducts.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const getCategoryName = (categoryId) => {
    const category = categories.find((cat) => cat.id == categoryId);
    return category ? category.name : "Unknown Category";
  };

  const toggleWishlist = (product) => {
  if (!product._id) {
    console.error("Product ID is undefined:", product);
    showNotificationWithTimeout("Không thể thêm vào danh sách yêu thích: Sản phẩm không hợp lệ");
    return;
  }
  const isInWishlist = wishlist.some((item) => item.id === product._id);
  let updatedWishlist;
  if (isInWishlist) {
    updatedWishlist = wishlist.filter((item) => item.id !== product._id);
    showNotificationWithTimeout("Đã xóa khỏi danh sách yêu thích");
  } else {
    updatedWishlist = [
      ...wishlist,
      {
        id: product._id,
        title: product.title,
        url: product.url || "/placeholder.svg",
        price: product.price / 100,
        status: product.quantity > 0 ? "available" : "out of stock",
        category: getCategoryName(product.categoryId),
        description: product.description,
      },
    ];
    showNotificationWithTimeout("Đã thêm vào danh sách yêu thích");
  }
  console.log("Updated wishlist:", updatedWishlist); // Log để debug
  setWishlist(updatedWishlist);
};

  const showNotificationWithTimeout = (message) => {
    setNotificationMessage(message);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

const addToCart = async (productId) => {
  if (!productId) {
    showNotificationWithTimeout("Không thể thêm vào giỏ hàng: Sản phẩm không hợp lệ");
    return;
  }

  if (!currentUser._id || !token) {
    showNotificationWithTimeout("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng");
    navigate("/auth");
    return;
  }

  try {
    console.log("Adding to cart - Product ID:", productId, "User ID:", currentUser._id);
    const response = await fetch("http://localhost:9999/shoppingCart/add", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ productId, quantity: 1 }),
    });

    if (response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("currentUser");
      showNotificationWithTimeout("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
      navigate("/auth");
      return;
    }

    const data = await response.json();
    console.log("API Response:", data);

    if (!response.ok) {
      throw new Error(data.message || "Không thể thêm sản phẩm vào giỏ hàng");
    }

    if (data.success && data.data && data.data._id) {
      setCartId(data.data._id); // Cập nhật cartId nếu tồn tại
      showNotificationWithTimeout("Đã thêm vào giỏ hàng");
      updateCartCount();
    } else {
      throw new Error("Dữ liệu trả về từ server không hợp lệ");
    }
  } catch (error) {
    console.error("Lỗi khi thêm vào giỏ hàng:", error);
    showNotificationWithTimeout(error.message || "Không thể thêm sản phẩm vào giỏ hàng");
  }
};

  const handleViewProduct = (product) => {
    if (!product._id) {
      console.error("Product ID is undefined:", product);
      return;
    }
    if (!recentlyViewed.some((item) => item._id === product._id)) {
      setRecentlyViewed((prev) => [product, ...prev].slice(0, 4));
    }
  };

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const goToPreviousPage = () =>
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  const goToNextPage = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  const scrollBanner = (direction) => {
    clearInterval(intervalRef.current);
    setCurrentBannerSlide((prev) =>
      direction === "left"
        ? (prev - 1 + BANNER_SLIDES.length) % BANNER_SLIDES.length
        : (prev + 1) % BANNER_SLIDES.length
    );
    const startAutoSlide = () => {
      intervalRef.current = setInterval(() => {
        setCurrentBannerSlide((prev) => (prev + 1) % BANNER_SLIDES.length);
      }, 3000);
    };
    startAutoSlide();
  };

  const scrollCategories = (direction) => {
    if (categoriesRef.current) {
      const scrollAmount = direction === "left" ? -300 : 300;
      categoriesRef.current.scrollBy({
        left: scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white text-gray-900 transition-colors duration-300">
        <div className="bg-white shadow-sm">
          <div className="max-w-[1300px] mx-auto">
            <TopMenu />
            <MainHeader />
            <SubMenu />
          </div>
        </div>

        <AnimatePresence>
          {showNotification && (
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="fixed top-20 right-4 z-50 bg-[#0053A0] text-white px-4 py-2 rounded-md shadow-lg"
            >
              {notificationMessage}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="max-w-[1300px] mx-auto px-4 py-4">
          <div
            className="relative mb-8 rounded-xl overflow-hidden shadow-lg"
            ref={bannerRef}
          >
            <div className="absolute top-1/2 left-4 z-10">
              <button
                onClick={() => scrollBanner("left")}
                className="bg-white/30 backdrop-blur-sm hover:bg-white/50 text-white p-2 rounded-full"
              >
                <FiChevronLeft className="h-6 w-6" />
              </button>
            </div>
            <div className="absolute top-1/2 right-4 z-10">
              <button
                onClick={() => scrollBanner("right")}
                className="bg-white/30 backdrop-blur-sm hover:bg-white/50 text-white p-2 rounded-full"
              >
                <FiChevronRight className="h-6 w-6" />
              </button>
            </div>
            <div className="relative h-[400px] overflow-hidden">
              {BANNER_SLIDES.map((slide, index) => (
                <div
                  key={slide.id}
                  className={`absolute inset-0 transition-opacity duration-1000 ${
                    index === currentBannerSlide
                      ? "opacity-100"
                      : "opacity-0 pointer-events-none"
                  }`}
                >
                  <div
                    className="absolute inset-0 bg-gradient-to-r opacity-80 z-10"
                    style={{
                      backgroundImage: `linear-gradient(to right, ${
                        slide.color.split(" ")[1]
                      }, transparent)`,
                    }}
                  ></div>
                  <img
                    src={slide.image || "/placeholder.svg"}
                    alt={slide.title}
                    className="w-full h-full object-cover"
                    onError={(e) => (e.target.src = "/placeholder.svg")}
                  />
                  <div className="absolute inset-0 flex items-center z-20">
                    <div className="ml-8 md:ml-16 max-w-lg">
                      <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
                        {slide.title}
                      </h2>
                      <p className="text-white/90 text-lg mb-6">
                        {slide.subtitle}
                      </p>
                      <button className="bg-white text-gray-900 hover:bg-gray-50 px-6 py-3 rounded-full font-medium shadow-md">
                        {slide.cta}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
              {BANNER_SLIDES.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    clearInterval(intervalRef.current);
                    setCurrentBannerSlide(index);
                    const startAutoSlide = () => {
                      intervalRef.current = setInterval(() => {
                        setCurrentBannerSlide(
                          (prev) => (prev + 1) % BANNER_SLIDES.length
                        );
                      }, 3000);
                    };
                    startAutoSlide();
                  }}
                  className={`w-2.5 h-2.5 rounded-full transition-colors ${
                    index === currentBannerSlide ? "bg-white" : "bg-white/50"
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="mb-8">
            <div className="flex items-center mb-4">
              <FiTrendingUp className="text-[#0053A0] mr-2" />
              <h2 className="text-lg font-medium">Tìm kiếm thịnh hành</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {TRENDING_SEARCHES.map((search, index) => (
                <button
                  key={index}
                  className="bg-white hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-full text-sm border border-gray-200 transition-colors"
                >
                  {search}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-8 relative">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">
                Danh mục sản phẩm
              </h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => scrollCategories("left")}
                  className="bg-white rounded-full p-2 shadow-sm hover:bg-gray-100"
                >
                  <FiArrowLeft className="h-5 w-5 text-gray-700" />
                </button>
                <button
                  onClick={() => scrollCategories("right")}
                  className="bg-white rounded-full p-2 shadow-sm hover:bg-gray-100"
                >
                  <FiArrowRight className="h-5 w-5 text-gray-700" />
                </button>
              </div>
            </div>
            <div
              ref={categoriesRef}
              className="flex overflow-x-auto scroll-smooth hide-scrollbar pb-2"
            >
              <div
                className={`min-w-[150px] p-2 cursor-pointer ${
                  selectedCategory === null ? "opacity-100" : "opacity-70"
                }`}
                onClick={() => setSelectedCategory(null)}
              >
                <motion.div
                  className={`bg-gradient-to-br from-[#0053A0] to-[#00438A] rounded-lg p-4 text-center h-full ${
                    selectedCategory === null
                      ? "ring-2 ring-[#0053A0] ring-offset-2"
                      : ""
                  }`}
                >
                  <div className="text-3xl mb-2">🔥</div>
                  <h3 className="font-medium text-white">Tất cả danh mục</h3>
                  <p className="text-xs text-white/80 mt-1">
                    {products.length} sản phẩm
                  </p>
                </motion.div>
              </div>
              {categories.map((category) => (
                <div
                  key={category.id}
                  className={`min-w-[150px] p-2 cursor-pointer ${
                    selectedCategory === category.id
                      ? "opacity-100"
                      : "opacity-70"
                  }`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <motion.div
                    className={`bg-white rounded-lg shadow-sm p-4 text-center h-full ${
                      selectedCategory === category.id
                        ? "ring-2 ring-[#0053A0] ring-offset-2"
                        : ""
                    }`}
                  >
                    <div className="relative mb-2 h-12 w-12 mx-auto">
                      <img
                        src={
                          CATEGORY_IMAGES[category.name] || "/placeholder.svg"
                        }
                        alt={category.name}
                        className="w-full h-full object-cover rounded-full"
                        onError={(e) => (e.target.src = "/placeholder.svg")}
                      />
                    </div>
                    <h3 className="font-medium text-gray-900">
                      {category.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {
                        products.filter((p) => p.categoryId == category.id)
                          .length
                      }{" "}
                      sản phẩm
                    </p>
                  </motion.div>
                </div>
              ))}
            </div>
          </div>

          <div
            ref={filtersRef}
            className={`bg-white p-4 rounded-lg shadow-sm mb-6 ${
              isSticky ? "sticky top-0 z-20 shadow-md" : ""
            }`}
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <div className="flex items-center mb-4 md:mb-0">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center text-sm font-medium text-gray-700 mr-4"
                >
                  <FiFilter className="mr-1 h-4 w-4" />
                  Bộ lọc
                  <FiChevronDown
                    className={`ml-1 h-4 w-4 transition-transform ${
                      showFilters ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-1.5 rounded ${
                      viewMode === "grid" ? "bg-gray-200" : "bg-white"
                    }`}
                  >
                    <FiGrid className="h-5 w-5 text-gray-700" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-1.5 rounded ${
                      viewMode === "list" ? "bg-gray-200" : "bg-white"
                    }`}
                  >
                    <FiList className="h-5 w-5 text-gray-700" />
                  </button>
                </div>
              </div>
              <div className="flex items-center w-full md:w-auto">
                <div className="text-sm text-gray-500 mr-2">Sắp xếp theo:</div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="flex-grow md:flex-grow-0 border-gray-300 rounded-md text-sm focus:ring-[#0053A0] focus:border-[#0053A0] bg-white text-gray-900"
                >
                  <option value="featured">Nổi bật</option>
                  <option value="price-low">Giá: Thấp đến cao</option>
                  <option value="price-high">Giá: Cao đến thấp</option>
                  <option value="newest">Mới nhất</option>
                </select>
                <button
                  onClick={() => {
                    setSelectedCategory(null);
                    setPriceRange([0, 1000]);
                    setSortBy("featured");
                  }}
                  className="ml-2 flex items-center text-sm text-[#0053A0] hover:underline"
                >
                  <FiRefreshCw className="mr-1 h-3 w-3" />
                  Đặt lại
                </button>
              </div>
            </div>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-4 pt-4 border-t border-gray-200"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">
                      Khoảng giá
                    </h3>
                    <div className="flex items-center space-x-4">
                      <input
                        type="range"
                        min="0"
                        max="1000"
                        step="10"
                        value={priceRange[1]}
                        onChange={(e) =>
                          setPriceRange([
                            priceRange[0],
                            Number.parseInt(e.target.value),
                          ])
                        }
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#0053A0]"
                      />
                    </div>
                    <div className="flex justify-between mt-2 text-sm text-gray-600">
                      <span>${priceRange[0]}</span>
                      <span>${priceRange[1]}</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">
                      Tình trạng sản phẩm
                    </h3>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-[#0053A0] focus:ring-[#0053A0]"
                          defaultChecked
                        />
                        <span className="ml-2 text-sm text-gray-700">Mới</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-[#0053A0] focus:ring-[#0053A0]"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          Đã qua sử dụng
                        </span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-[#0053A0] focus:ring-[#0053A0]"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          Tân trang
                        </span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">
                      Tùy chọn vận chuyển
                    </h3>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-[#0053A0] focus:ring-[#0053A0]"
                          defaultChecked
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          Miễn phí vận chuyển
                        </span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-[#0053A0] focus:ring-[#0053A0]"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          Giao hàng trong ngày
                        </span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-[#0053A0] focus:ring-[#0053A0]"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          Miễn phí đổi trả
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          <div className="mb-12">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">
                {selectedCategory
                  ? `Sản phẩm ${getCategoryName(selectedCategory)}`
                  : "Tất cả sản phẩm"}
              </h2>
              <div className="text-sm text-gray-500">
                {filteredProducts.length} kết quả
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: itemsPerPage }).map((_, index) => (
                  <ProductSkeleton key={index} />
                ))}
              </div>
            ) : paginatedProducts.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <div className="text-gray-400 mb-4">
                  <FiSearch size={48} className="mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Không tìm thấy sản phẩm
                </h3>
                <p className="text-gray-500">
                  Không có sản phẩm nào phù hợp với tiêu chí của bạn.
                </p>
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="mt-4 px-4 py-2 bg-[#0053A0] text-white rounded-full hover:bg-[#00438A]"
                >
                  Xem tất cả sản phẩm
                </button>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                {paginatedProducts.map((product) => (
                  <motion.div
                    key={product._id}
                    className="bg-white rounded-lg shadow-sm overflow-hidden flex flex-col h-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="relative w-full h-48">
                      <img
                        src={
                          product.url
                            ? `${product.url}/300`
                            : "/placeholder.svg"
                        }
                        alt={product.title}
                        className="w-full h-full object-cover"
                        onError={(e) => (e.target.src = "/placeholder.svg")}
                      />
                      <button
                        onClick={() => toggleWishlist(product)}
                        className="absolute top-2 right-2 bg-white/80 p-1.5 rounded-full hover:bg-white"
                      >
                        <FiHeart
                          className={`h-5 w-5 ${
                            wishlist.some((item) => item.id === product._id)
                              ? "text-[#e43147] fill-[#e43147]"
                              : "text-gray-600"
                          }`}
                        />
                      </button>
                    </div>
                    <div className="p-4 flex-grow flex flex-col">
                      <h3 className="font-medium text-gray-900 mb-1 line-clamp-2 flex-grow">
                        {product.title}
                      </h3>
                      <div className="flex items-baseline mb-1">
                        <span className="text-lg font-bold text-gray-900">
                          ${(product.price / 100).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center text-xs text-gray-500 mb-2">
                        <div className="flex items-center text-yellow-400 mr-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <FiStar
                              key={i}
                              className={`h-3 w-3 ${
                                i < 4 ? "fill-yellow-400" : ""
                              }`}
                            />
                          ))}
                        </div>
                        <span>(1000)</span>
                        <span className="mx-1">•</span>
                        <span className="text-green-600 font-medium">
                          Miễn phí vận chuyển
                        </span>
                      </div>
                      <button
                        onClick={() => addToCart(product._id)}
                        className="w-full bg-[#0053A0] hover:bg-[#00438A] text-white py-2 rounded-full font-medium text-sm mt-auto"
                        disabled={product.quantity === 0}
                      >
                        {product.quantity === 0 ? "Hết hàng" : "Thêm vào giỏ"}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="space-y-4 mb-8">
                {paginatedProducts.map((product) => (
                  <motion.div
                    key={product._id}
                    className="bg-white rounded-lg shadow-sm overflow-hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="flex flex-col sm:flex-row">
                      <div className="relative w-full sm:w-48 h-48">
                        <img
                          src={
                            product.url
                              ? `${product.url}/300`
                              : "/placeholder.svg"
                          }
                          alt={product.title}
                          className="w-full h-full object-cover"
                          onError={(e) => (e.target.src = "/placeholder.svg")}
                        />
                        <button
                          onClick={() => toggleWishlist(product)}
                          className="absolute top-2 right-2 bg-white/80 p-1.5 rounded-full hover:bg-white"
                        >
                          <FiHeart
                            className={`h-5 w-5 ${
                              wishlist.some((item) => item.id === product._id)
                                ? "text-[#e43147] fill-[#e43147]"
                                : "text-gray-600"
                            }`}
                          />
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1.5 flex items-center">
                          <FiClock className="mr-1 h-3 w-3" />
                          Còn hàng
                        </div>
                      </div>
                      <div className="p-4 flex-grow">
                        <div className="flex justify-between">
                          <h3 className="font-medium text-gray-900 mb-1">
                            {product.title}
                          </h3>
                        </div>
                        <div className="flex items-center text-xs text-gray-500 mb-2">
                          <div className="flex items-center text-yellow-400 mr-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <FiStar
                                key={i}
                                className={`h-3 w-3 ${
                                  i < 4 ? "fill-yellow-400" : ""
                                }`}
                              />
                            ))}
                          </div>
                          <span>(1000)</span>
                          <span className="mx-1">•</span>
                          <span>{getCategoryName(product.categoryId)}</span>
                        </div>
                        <div className="flex items-baseline mb-2">
                          <span className="text-xl font-bold text-gray-900">
                            ${(product.price / 100).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600 mb-3">
                          <div className="flex items-center mr-4">
                            <FiShoppingCart className="mr-1 h-4 w-4 text-green-600" />
                            <span className="text-green-600 font-medium">
                              Miễn phí vận chuyển
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => addToCart(product._id)}
                            className="bg-[#0053A0] hover:bg-[#00438A] text-white py-2 px-6 rounded-full font-medium text-sm"
                            disabled={product.quantity === 0}
                          >
                            {product.quantity === 0
                              ? "Hết hàng"
                              : "Thêm vào giỏ"}
                          </button>
                          <button
                            onClick={() => handleViewProduct(product)}
                            className="border border-gray-300 hover:border-gray-400 text-gray-700 py-2 px-6 rounded-full font-medium text-sm"
                          >
                            Xem chi tiết
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 py-8">
                <button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className={`flex items-center px-4 py-2 rounded-full ${
                    currentPage === 1
                      ? "bg-gray-50 text-gray-400 cursor-not-allowed"
                      : "bg-white hover:bg-gray-50 text-gray-700 border shadow-sm"
                  }`}
                >
                  <FiChevronLeft className="mr-1" size={12} /> Trước
                </button>
                <div className="hidden md:flex items-center">
                  {Array.from({ length: totalPages }).map((_, index) => {
                    if (
                      totalPages <= 7 ||
                      index === 0 ||
                      index === totalPages - 1 ||
                      (index >= currentPage - 2 && index <= currentPage + 2)
                    ) {
                      return (
                        <button
                          key={index + 1}
                          onClick={() => paginate(index + 1)}
                          className={`w-10 h-10 mx-1 rounded-full ${
                            currentPage === index + 1
                              ? "bg-[#0053A0] text-white"
                              : "bg-white hover:bg-gray-50 text-gray-700 border shadow-sm"
                          }`}
                        >
                          {index + 1}
                        </button>
                      );
                    } else if (
                      (index === 1 && currentPage > 4) ||
                      (index === totalPages - 2 && currentPage < totalPages - 3)
                    ) {
                      return (
                        <span key={index} className="mx-1 text-gray-500">
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>
                <div className="md:hidden flex items-center">
                  <span className="text-gray-600 text-sm">
                    Trang {currentPage} / {totalPages}
                  </span>
                </div>
                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className={`flex items-center px-4 py-2 rounded-full ${
                    currentPage === totalPages
                      ? "bg-gray-50 text-gray-400 cursor-not-allowed"
                      : "bg-white hover:bg-gray-50 text-gray-700 border shadow-sm"
                  }`}
                >
                  Tiếp <FiChevronRight className="ml-1" size={12} />
                </button>
              </div>
            )}
          </div>

          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Bộ sưu tập nổi bật</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {COLLECTIONS.map((collection) => (
                <motion.div
                  key={collection.id}
                  className="relative rounded-lg overflow-hidden shadow-lg h-48"
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-r ${collection.color} opacity-80`}
                  ></div>
                  <img
                    src={collection.image || "/placeholder.svg"}
                    alt={collection.title}
                    className="w-full h-full object-cover"
                    onError={(e) => (e.target.src = "/placeholder.svg")}
                  />
                  <div className="absolute inset-0 flex flex-col justify-end p-6">
                    <h3 className="text-white text-xl font-bold mb-1">
                      {collection.title}
                    </h3>
                    <p className="text-white/90 text-sm mb-3">
                      {collection.itemCount} sản phẩm
                    </p>
                    <button className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white py-2 px-4 rounded-full text-sm font-medium self-start">
                      Khám phá bộ sưu tập
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Thương hiệu nổi bật</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              {FEATURED_BRANDS.map((brand) => (
                <motion.div
                  key={brand.id}
                  className="bg-white rounded-lg shadow-sm p-4 text-center cursor-pointer"
                >
                  <div className="h-16 w-16 mx-auto mb-3 bg-gray-50 rounded-full p-2 flex items-center justify-center">
                    <img
                      src={brand.logo || "/placeholder.svg"}
                      alt={brand.name}
                      className="max-h-full max-w-full object-contain"
                      onError={(e) => (e.target.src = "/placeholder.svg")}
                    />
                  </div>
                  <h3 className="font-medium text-gray-900">{brand.name}</h3>
                  <p className="text-xs text-[#e43147] font-medium mt-1">
                    {brand.discount}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="mb-12">
            <div className="bg-gradient-to-r from-[#0053A0] to-[#00438A] rounded-lg p-6 text-white">
              <div className="flex flex-col md:flex-row items-center justify-between">
                <div className="mb-6 md:mb-0">
                  <h2 className="text-xl font-bold mb-2">Không bỏ lỡ ưu đãi</h2>
                  <p className="text-white/80">
                    Đăng ký nhận bản tin để nhận các ưu đãi cá nhân hóa qua
                    email.
                  </p>
                </div>
                <div className="w-full md:w-auto flex flex-col sm:flex-row">
                  <input
                    type="email"
                    placeholder="Địa chỉ email của bạn"
                    className="w-full sm:w-64 px-4 py-2 rounded-l-md focus:outline-none focus:ring-2 focus:ring-white/50"
                  />
                  <button className="mt-2 sm:mt-0 bg-white text-[#0053A0] hover:bg-gray-50 px-6 py-2 rounded-r-md font-medium">
                    Đăng ký
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 bg-gray-300 text-white">
          <div className="max-w-[1300px] mx-auto">
            <Footer />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainPage;
