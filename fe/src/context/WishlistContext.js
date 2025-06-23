import { createContext, useContext, useState, useEffect, useMemo } from "react";

const WishlistContext = createContext();

export function WishlistProvider({ children }) {
  const [wishlist, setWishlist] = useState(() => {
    console.log("WishlistContext: Initializing wishlist from localStorage");
    const savedWishlist = localStorage.getItem("wishlist");
    console.log("WishlistContext: Raw data from localStorage:", savedWishlist);
    try {
      const initialWishlist = savedWishlist ? JSON.parse(savedWishlist) : [];
      console.log("WishlistContext: Parsed initial wishlist:", initialWishlist);
      return Array.isArray(initialWishlist) ? initialWishlist : [];
    } catch (error) {
      console.error("WishlistContext: Error parsing wishlist:", error);
      return [];
    }
  });

  useEffect(() => {
    console.log("WishlistContext: Saving wishlist to localStorage:", wishlist);
    try {
      localStorage.setItem("wishlist", JSON.stringify(wishlist));
    } catch (error) {
      console.error("WishlistContext: Error saving wishlist:", error);
    }
  }, [wishlist]);

  const contextValue = useMemo(() => ({ wishlist, setWishlist }), [wishlist]);

  return (
    <WishlistContext.Provider value={contextValue}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
};