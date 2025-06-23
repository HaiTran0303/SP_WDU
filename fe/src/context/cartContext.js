import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartCount, setCartCount] = useState(0);
  const [cartId, setCartId] = useState(null);
  const token = localStorage.getItem("token");
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
  const navigate = useNavigate();

  const fetchCartId = useCallback(async () => {
    if (!token || !currentUser._id) {
      setCartId(null);
      return;
    }
    try {
      const response = await fetch("http://localhost:9999/shoppingCart", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("currentUser");
        navigate("/auth");
        return;
      }
      if (response.ok) {
        const data = await response.json();
        setCartId(data.data?._id || null);
      }
    } catch (error) {
      console.error("Error fetching cart ID:", error);
      setCartId(null);
    }
  }, [token, currentUser._id, navigate]);

  const updateCartCount = useCallback(async () => {
    if (!token || !currentUser._id) return;
    try {
      const response = await fetch("http://localhost:9999/shoppingCart/count", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("currentUser");
        navigate("/auth");
        return;
      }
      if (response.ok) {
        const data = await response.json();
        setCartCount(data.itemCount || 0);
      }
    } catch (error) {
      console.error("Error fetching cart count:", error);
    }
  }, [token, currentUser._id, navigate]);

  useEffect(() => {
    fetchCartId();
    updateCartCount();
  }, [fetchCartId, updateCartCount]);

  return (
    <CartContext.Provider value={{ cartCount, setCartCount, cartId, setCartId, updateCartCount, fetchCartId }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);