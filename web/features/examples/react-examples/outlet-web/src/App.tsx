import { Routes, Route, Navigate } from 'react-router-dom';
import OutletHeader from './components/OutletHeader';
import Footer from './components/Footer';
import Home from './pages/Home';
import Auth from './pages/Auth';
import VerifyEmail from './pages/VerifyEmail';
import Cart from './pages/Cart';
import PlaceOrder from './pages/PlaceOrder';
import OrderSuccess from './pages/OrderSuccess';
import Orders from './pages/Orders';
import ProductDetail from './pages/ProductDetail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Search from './pages/Search';

export function App() {
  return (
    <div className="flex flex-col min-h-screen">
      <OutletHeader />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/sign-in" element={<Navigate to="/auth" replace />} />
          <Route path="/create-account" element={<Navigate to="/auth" replace />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/place-order" element={<PlaceOrder />} />
          <Route path="/order-success" element={<OrderSuccess />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/product/:productId" element={<ProductDetail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
