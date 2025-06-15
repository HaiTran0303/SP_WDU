import MainLayout from "./pages/MainLayout";
import { CartProvider } from "./context/cartContext";
import { WishlistProvider } from "./context/WishlistContext";

export default function App() {
  return (
    <WishlistProvider>
      <CartProvider>
        <MainLayout />
      </CartProvider>
    </WishlistProvider>
  );
}
