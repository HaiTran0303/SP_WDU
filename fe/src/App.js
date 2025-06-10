import MainLayout from "./pages/MainLayout";
import { CartProvider } from "./context/cartContext";

export default function App() {
  return (
    <CartProvider>
      <MainLayout />
    </CartProvider>
  );
}
