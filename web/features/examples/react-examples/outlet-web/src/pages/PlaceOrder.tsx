import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/apiClient';
import { getCartSessionId } from '../utils/cart';

export default function PlaceOrder() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
    paymentMethod: 'stripe',
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
  });

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const sessionId = getCartSessionId();
        const response = await api.get(`/cart/${sessionId}`);
        setCartItems(response.data.items || []);
        
        // Populate email if user is logged in
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          setFormData(prev => ({ ...prev, email: user.email }));
        }
      } catch (error) {
        console.error('Failed to fetch cart:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCart();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + (item.price || 0) * (item.quantity || 0),
    0
  );
  const shipping = subtotal > 0 && subtotal < 100 ? 10 : 0;
  const tax = subtotal * 0.1;
  const total = subtotal + shipping + tax;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      // 1. Create the order
      const orderRes = await api.post('/orders', {
        userId: user?.id || 'guest',
        items: cartItems.map(item => ({
          productId: item.productId,
          companyId: item.companyId,
          name: item.name,
          image: item.image,
          quantity: item.quantity,
          price: item.price
        })),
        shippingAddress: `${formData.address}, ${formData.city}, ${formData.state} ${formData.zipCode}, ${formData.country}`,
        totalAmount: total
      });

      const order = orderRes.data;

      if (formData.paymentMethod === 'stripe') {
        // 2. Initiate Stripe payment
        const paymentRes = await api.post('/payments/create-checkout-session', {
          orderId: order.id,
          items: cartItems.map(item => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity
          })),
          successUrl: `${window.location.origin}/order-success?orderId=${order.id}`,
          cancelUrl: `${window.location.origin}/place-order`
        });

        if (paymentRes.data.url) {
          window.location.href = paymentRes.data.url;
        } else {
          throw new Error('Failed to get payment URL');
        }
      } else {
        // Cash on Delivery
        // 2. Notify Cart Service to clear cart? Or just navigate
        const sessionId = getCartSessionId();
        await api.post('/cart/checkout', { sessionId });
        navigate(`/order-success?orderId=${order.id}`);
      }
    } catch (error: any) {
      console.error('Order placement failed:', error);
      alert(error.response?.data?.error || 'Order placement failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Place Your Order
        </h1>

        <form
          onSubmit={handleSubmit}
          className="mt-12 lg:grid lg:grid-cols-12 lg:gap-x-12 xl:gap-x-16"
        >
          <div className="lg:col-span-7">
            {/* Contact Information */}
            <div className="border-b border-gray-200 pb-8">
              <h2 className="text-lg font-medium text-gray-900">
                Contact Information
              </h2>
              <div className="mt-4">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                    placeholder="you@example.com"
                  />
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="border-b border-gray-200 py-8">
              <h2 className="text-lg font-medium text-gray-900">
                Shipping Address
              </h2>
              <div className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
                <div>
                  <label
                    htmlFor="firstName"
                    className="block text-sm font-medium text-gray-700"
                  >
                    First name
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      required
                      value={formData.firstName}
                      onChange={handleChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="lastName"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Last name
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      required
                      value={formData.lastName}
                      onChange={handleChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="address"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Address
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="address"
                      name="address"
                      required
                      value={formData.address}
                      onChange={handleChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                      placeholder="Street address"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="city"
                    className="block text-sm font-medium text-gray-700"
                  >
                    City
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="city"
                      name="city"
                      required
                      value={formData.city}
                      onChange={handleChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="state"
                    className="block text-sm font-medium text-gray-700"
                  >
                    State / Province
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="state"
                      name="state"
                      required
                      value={formData.state}
                      onChange={handleChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="zipCode"
                    className="block text-sm font-medium text-gray-700"
                  >
                    ZIP / Postal code
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="zipCode"
                      name="zipCode"
                      required
                      value={formData.zipCode}
                      onChange={handleChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="country"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Country
                  </label>
                  <div className="mt-1">
                    <select
                      id="country"
                      name="country"
                      required
                      value={formData.country}
                      onChange={handleChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                    >
                      <option>United States</option>
                      <option>Canada</option>
                      <option>Mexico</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="py-8">
              <h2 className="text-lg font-medium text-gray-900">
                Payment Information
              </h2>

              {/* Payment Method Selection */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Payment Method
                </label>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      id="payment-stripe"
                      name="paymentMethod"
                      type="radio"
                      value="stripe"
                      checked={formData.paymentMethod === 'stripe'}
                      onChange={handleChange}
                      className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label
                      htmlFor="payment-stripe"
                      className="ml-3 block text-sm font-medium text-gray-700"
                    >
                      Stripe
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="payment-cod"
                      name="paymentMethod"
                      type="radio"
                      value="cod"
                      checked={formData.paymentMethod === 'cod'}
                      onChange={handleChange}
                      className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label
                      htmlFor="payment-cod"
                      className="ml-3 block text-sm font-medium text-gray-700"
                    >
                      Cash On Delivery
                    </label>
                  </div>
                </div>
              </div>

              {/* Card Details - Only show for Stripe */}
              {formData.paymentMethod === 'stripe' && (
                <div className="mt-6 grid grid-cols-1 gap-y-6">
                  {formData.paymentMethod === 'stripe' && (
                    <div className="rounded-md bg-blue-50 p-4">
                      <div className="flex">
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-blue-800">
                            Secure Payment with Stripe
                          </h3>
                          <div className="mt-2 text-sm text-blue-700">
                            <p>
                              Your payment will be processed securely through
                              Stripe.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div>
                    <label
                      htmlFor="cardNumber"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Card number
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        id="cardNumber"
                        name="cardNumber"
                        required={formData.paymentMethod === 'stripe'}
                        value={formData.cardNumber}
                        onChange={handleChange}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                        placeholder="1234 5678 9012 3456"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="cardName"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Name on card
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        id="cardName"
                        name="cardName"
                        required={formData.paymentMethod === 'stripe'}
                        value={formData.cardName}
                        onChange={handleChange}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-x-4">
                    <div className="col-span-2">
                      <label
                        htmlFor="expiryDate"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Expiry date
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          id="expiryDate"
                          name="expiryDate"
                          required={formData.paymentMethod === 'stripe'}
                          value={formData.expiryDate}
                          onChange={handleChange}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                          placeholder="MM/YY"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="cvv"
                        className="block text-sm font-medium text-gray-700"
                      >
                        CVV
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          id="cvv"
                          name="cvv"
                          required={formData.paymentMethod === 'stripe'}
                          value={formData.cvv}
                          onChange={handleChange}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                          placeholder="123"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Cash On Delivery Message */}
              {formData.paymentMethod === 'cod' && (
                <div className="mt-6 rounded-md bg-green-50 p-4">
                  <div className="flex">
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800">
                        Cash On Delivery
                      </h3>
                      <div className="mt-2 text-sm text-green-700">
                        <p>
                          You will pay in cash when your order is delivered.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="mt-10 lg:col-span-5 lg:mt-0">
            <div className="rounded-lg bg-gray-50 px-4 py-6 sm:p-6 lg:p-8">
              <h2 className="text-lg font-medium text-gray-900">
                Order Summary
              </h2>

              <dl className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-gray-600">Subtotal</dt>
                  <dd className="text-sm font-medium text-gray-900">${subtotal.toFixed(2)}</dd>
                </div>
                <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                  <dt className="text-sm text-gray-600">Shipping</dt>
                  <dd className="text-sm font-medium text-gray-900">${shipping.toFixed(2)}</dd>
                </div>
                <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                  <dt className="text-sm text-gray-600">Tax</dt>
                  <dd className="text-sm font-medium text-gray-900">${tax.toFixed(2)}</dd>
                </div>
                <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                  <dt className="text-base font-medium text-gray-900">
                    Order total
                  </dt>
                  <dd className="text-base font-medium text-gray-900">
                    ${total.toFixed(2)}
                  </dd>
                </div>
              </dl>

              <div className="mt-6">
                <button
                  type="submit"
                  disabled={isSubmitting || cartItems.length === 0}
                  className={`w-full rounded-md border border-transparent px-4 py-3 text-base font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-50 ${
                    isSubmitting || cartItems.length === 0
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  {isSubmitting ? 'Processing...' : 'Place Order'}
                </button>
              </div>

              <div className="mt-6 text-center text-sm">
                <Link
                  to="/cart"
                  className="font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Return to cart
                </Link>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
