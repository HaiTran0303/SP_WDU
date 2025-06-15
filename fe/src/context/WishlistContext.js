// context/WishlistContext.js
import { createContext, useContext, useState, useEffect } from "react";

const WishlistContext = createContext();

export function WishlistProvider({ children }) {
  const [wishlist, setWishlist] = useState(() => {
    const savedWishlist = localStorage.getItem("wishlist");
    console.log("WishlistContext: Raw data from localStorage:", savedWishlist); // Log dữ liệu thô
    try {
      const initialWishlist = savedWishlist ? JSON.parse(savedWishlist) : [];
      console.log("WishlistContext: Parsed initial wishlist:", initialWishlist); // Log sau khi parse
      if (!Array.isArray(initialWishlist)) {
        console.warn("WishlistContext: Parsed data is not an array, defaulting to empty array");
        return [];
      }
      return initialWishlist;
    } catch (error) {
      console.error("WishlistContext: Error parsing wishlist from localStorage:", error);
      return []; // Trả về mảng rỗng nếu parse thất bại
    }
  });

  useEffect(() => {
    console.log("WishlistContext: Wishlist updated, saving to localStorage:", wishlist);
    localStorage.setItem("wishlist", JSON.stringify(wishlist));
  }, [wishlist]);

  return (
    <WishlistContext.Provider value={{ wishlist, setWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    console.error("WishlistContext: useWishlist phải được sử dụng trong WishlistProvider");
  } else {
    console.log("WishlistContext: Context value provided to consumer:", context.wishlist);
  }
  return context || { wishlist: [], setWishlist: () => {} };
};