import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/apiClient';

export default function OrderSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      const fetchOrder = async () => {
        try {
          const response = await api.get(`/orders/${orderId}`);
          setOrder(response.data);
  
          // Clear cart on success if redirected from Stripe (COD handles it before nav)
          // We can just blindly call checkout to clear cart
           // But better to just assume it's done or do it safely
        } catch (error) {
          console.error('Failed to fetch order:', error);
        } finally {
          setLoading(false);
        }
      };
      
      fetchOrder();
    } else {
        setLoading(false);
    }
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!order) {
     return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
            <h1 className="text-2xl font-bold mb-4">Order not found</h1>
            <Link to="/" className="text-indigo-600 hover:text-indigo-500 font-medium">Return to Home</Link>
        </div>
     )
  }


  return (
    <div className="bg-white">
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <p className="text-lg font-medium text-indigo-600">Thank you!</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            It's on the way!
          </h1>
          <p className="mt-4 text-base text-gray-600">
            Your order #{order.id.slice(0, 8)} has been placed and will be with you
            soon.
          </p>
        </div>

        {/* Tracking Number Dummy */}
        <div className="mb-8 border-b border-gray-200 pb-8">
          <h2 className="text-sm font-medium text-gray-900">Order ID</h2>
          <Link
            to="/orders"
            className="mt-2 text-base font-medium text-indigo-600 hover:text-indigo-500"
          >
            {order.id}
          </Link>
        </div>

        {/* Ordered Items */}
        <div className="mb-8 border-b border-gray-200 pb-8">
          {order.items.map((item: any) => (
            <div key={item.id} className="flex gap-6 mb-6 last:mb-0">
              <div className="flex-shrink-0">
                <img
                  src={item.image || "https://placehold.co/150"}
                  alt={item.name}
                  className="h-24 w-24 rounded-lg object-cover sm:h-32 sm:w-32"
                />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  {item.name}
                </h3>
                <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
                  <span>Quantity {item.quantity}</span>
                  <span className="h-4 w-px bg-gray-300"></span>
                  <span>Price ${item.price.toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Addresses */}
        <div className="mb-8 grid grid-cols-1 gap-8 border-b border-gray-200 pb-8 sm:grid-cols-2">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              Shipping address
            </h2>
            <div className="mt-2 text-sm text-gray-600">
              <p>{order.shippingAddress}</p>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Payment Status</span>
              </div>
               <div className="mt-4">
                <span className="text-base font-semibold text-gray-900">
                  Total
                </span>
              </div>
            </div>
            <div className="text-right space-y-2">
              <div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      order.status === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                      {order.status}
                  </span>
              </div>
              <div className="mt-4">
                <span className="text-base font-semibold text-indigo-600">
                  ${order.totalAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-4 sm:flex-row">
          <button
            onClick={() => navigate('/orders')}
            className="flex-1 rounded-md bg-indigo-600 px-4 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Track Order
          </button>
          <Link
            to="/"
            className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-3 text-center text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
