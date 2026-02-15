import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TrashIcon, PlusIcon, MinusIcon } from '@heroicons/react/24/outline';
import api from '../api/apiClient';
import { getCartSessionId, triggerCartUpdate } from '../utils/cart';

export default function Cart() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCart = async () => {
    try {
      const sessionId = getCartSessionId();
      const response = await api.get(`/cart/${sessionId}`);
      setCartItems(response.data.items || []);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const updateQuantity = async (productId: string, change: number) => {
    try {
      const sessionId = getCartSessionId();
      if (change > 0) {
        await api.post('/cart/add', { sessionId, productId, quantity: 1 });
      } else {
        await api.post('/cart/remove', { sessionId, productId, quantity: 1 });
      }
      fetchCart();
      triggerCartUpdate();
    } catch (error) {
      console.error('Failed to update quantity:', error);
    }
  };

  const removeItem = async (productId: string) => {
    try {
      const sessionId = getCartSessionId();
      await api.post('/cart/remove', { sessionId, productId });
      fetchCart();
      triggerCartUpdate();
    } catch (error) {
      console.error('Failed to remove item:', error);
    }
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + (item.price || 0) * (item.quantity || 0),
    0
  );
  const shipping = subtotal > 0 && subtotal < 100 ? 10 : 0;
  const tax = subtotal * 0.1;
  const total = subtotal + shipping + tax;

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
          Shopping Cart
        </h1>

        {cartItems.length === 0 ? (
          <div className="mt-12 text-center">
            <p className="text-lg text-gray-500">Your cart is empty</p>
            <Link
              to="/"
              className="mt-6 inline-block text-indigo-600 hover:text-indigo-500 font-medium"
            >
              Continue shopping
            </Link>
          </div>
        ) : (
          <div className="mt-12 lg:grid lg:grid-cols-12 lg:gap-x-12 lg:items-start xl:gap-x-16">
            <section aria-labelledby="cart-heading" className="lg:col-span-7">
              <h2 id="cart-heading" className="sr-only">
                Items in your shopping cart
              </h2>

              <ul
                role="list"
                className="divide-y divide-gray-200 border-b border-t border-gray-200"
              >
                {cartItems.map((item) => (
                  <li key={item.productId} className="flex py-6 sm:py-10">
                    <div className="flex-shrink-0">
                      <img
                        src={item.image || 'https://loremflickr.com/800/600/luxury'}
                        alt={item.name}
                        className="h-24 w-24 rounded-md object-cover object-center sm:h-48 sm:w-48"
                      />
                    </div>

                    <div className="ml-4 flex flex-1 flex-col justify-between sm:ml-6">
                      <div className="relative pr-9 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:pr-0">
                        <div>
                          <div className="flex justify-between">
                            <h3 className="text-sm">
                              <Link
                                to={`/product/${item.productId}`}
                                className="font-medium text-gray-700 hover:text-gray-800"
                              >
                                {item.name}
                              </Link>
                            </h3>
                          </div>
                          <p className="mt-1 text-sm font-medium text-gray-900">
                            ${item.price.toLocaleString()}
                          </p>
                        </div>

                        <div className="mt-4 sm:mt-0 sm:pr-9">
                          <div className="absolute right-0 top-0">
                            <button
                              type="button"
                              onClick={() => removeItem(item.productId)}
                              className="-m-2 inline-flex p-2 text-gray-400 hover:text-gray-500"
                            >
                              <span className="sr-only">Remove</span>
                              <TrashIcon
                                className="h-5 w-5"
                                aria-hidden="true"
                              />
                            </button>
                          </div>

                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.productId, -1)}
                              className="rounded-md border border-gray-300 p-1 hover:bg-gray-50"
                            >
                              <span className="sr-only">Decrease quantity</span>
                              <MinusIcon
                                className="h-4 w-4"
                                aria-hidden="true"
                              />
                            </button>
                            <span className="text-sm font-medium text-gray-900 w-8 text-center">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.productId, 1)}
                              className="rounded-md border border-gray-300 p-1 hover:bg-gray-50"
                            >
                              <span className="sr-only">Increase quantity</span>
                              <PlusIcon
                                className="h-4 w-4"
                                aria-hidden="true"
                              />
                            </button>
                          </div>
                        </div>
                      </div>

                      <p className="mt-4 flex text-sm sm:mt-0">
                        <span className="font-medium text-gray-900">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            {/* Order summary */}
            <section
              aria-labelledby="summary-heading"
              className="mt-16 rounded-lg bg-gray-50 px-4 py-6 sm:p-6 lg:col-span-5 lg:mt-0 lg:p-8"
            >
              <h2
                id="summary-heading"
                className="text-lg font-medium text-gray-900"
              >
                Order summary
              </h2>

              <dl className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-gray-600">Subtotal</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    ${subtotal.toFixed(2)}
                  </dd>
                </div>
                <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                  <dt className="flex items-center text-sm text-gray-600">
                    <span>Shipping estimate</span>
                  </dt>
                  <dd className="text-sm font-medium text-gray-900">
                    ${shipping.toFixed(2)}
                  </dd>
                </div>
                <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                  <dt className="text-sm text-gray-600">Tax estimate</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    ${tax.toFixed(2)}
                  </dd>
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
                  type="button"
                  onClick={() => {
                    const token = localStorage.getItem('accessToken');
                    if (token) {
                      navigate('/place-order');
                    } else {
                      navigate('/sign-in', { state: { from: '/cart' } });
                    }
                  }}
                  className="w-full rounded-md border border-transparent bg-indigo-600 px-4 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-50"
                >
                  Checkout
                </button>
              </div>

              <div className="mt-6 text-center text-sm">
                <Link
                  to="/"
                  className="font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Continue shopping
                  <span aria-hidden="true"> &rarr;</span>
                </Link>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
