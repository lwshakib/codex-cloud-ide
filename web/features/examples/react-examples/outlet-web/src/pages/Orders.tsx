import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/apiClient';

const trackingStages = [
  { id: 'PENDING', label: 'Order placed' },
  { id: 'PAID', label: 'Processing' },
  { id: 'SHIPPED', label: 'Shipped' },
  { id: 'DELIVERED', label: 'Delivered' },
];

const getStageIndex = (status: string) => {
  switch (status) {
    case 'PENDING':
      return 0;
    case 'PAID':
      return 1;
    case 'SHIPPED':
      return 2;
    case 'DELIVERED':
      return 3;
    default:
      return 0;
  }
};

const TrackingProgress = ({ currentStatus }: { currentStatus: string }) => {
  const currentIndex = getStageIndex(currentStatus);

  return (
    <div className="mt-6">
      <div className="relative">
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200" />
        <div
          className="absolute top-5 left-0 h-0.5 bg-indigo-600 transition-all duration-500"
          style={{
            width: `${(currentIndex / (trackingStages.length - 1)) * 100}%`,
          }}
        />
        <div className="relative flex justify-between">
          {trackingStages.map((stage, index) => {
            const isCompleted = index < currentIndex;
            const isCurrent = index === currentIndex;

            return (
              <div key={stage.id} className="flex flex-col items-center">
                <div
                  className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                    isCompleted
                      ? 'border-indigo-600 bg-indigo-600'
                      : isCurrent
                      ? 'border-indigo-600 bg-white'
                      : 'border-gray-300 bg-white'
                  }`}
                >
                  {isCompleted ? (
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : isCurrent ? (
                    <div className="h-3 w-3 rounded-full bg-indigo-600" />
                  ) : (
                    <div className="h-3 w-3 rounded-full bg-gray-300" />
                  )}
                </div>
                <div className="mt-3 text-center">
                  <p className={`text-xs font-medium ${isCompleted || isCurrent ? 'text-indigo-600' : 'text-gray-500'}`}>
                    {stage.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const userStr = localStorage.getItem('user');
        if (!userStr) {
          setLoading(false);
          return;
        }
        const user = JSON.parse(userStr);
        const response = await api.get(`/orders?userId=${user.id}`);
        if (Array.isArray(response.data)) {
          setOrders(response.data);
        } else {
          console.error("Orders response is not an array:", response.data);
          setOrders([]);
        }
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  const ongoingOrders = orders.filter(
    (order) => order.status !== 'DELIVERED' && order.status !== 'CANCELLED'
  );

  const previousOrders = orders.filter((order) => order.status === 'DELIVERED');


  return (
    <div className="bg-white">
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          My Orders
        </h1>

        {/* Ongoing Orders */}
        {ongoingOrders.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Ongoing Orders
            </h2>
            <div className="space-y-8">
              {ongoingOrders.map((order: any) => (
                <div
                  key={order.id}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                    <div className="flex items-center gap-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Order #{order.id.slice(0, 8)}
                      </h3>
                      <Link
                        to="#"
                        className="text-sm text-indigo-600 hover:text-indigo-500"
                      >
                        View details →
                      </Link>
                    </div>
                    <p className="text-sm text-gray-500">
                      Placed on{' '}
                      {new Date(order.createdAt).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>

                  <div className="space-y-10">
                    {order.items.map((item: any) => (
                      <div
                        key={item.id}
                        className="border-b border-gray-200 pb-10 last:border-b-0 last:pb-0"
                      >
                        <div className="flex gap-6 mb-6">
                          <div className="flex-shrink-0">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="h-24 w-24 rounded-lg object-cover sm:h-32 sm:w-32"
                            />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-base font-semibold text-gray-900">
                              {item.name}
                            </h4>
                            <p className="mt-1 text-sm text-gray-600">
                              ${item.price.toFixed(2)} x {item.quantity}
                            </p>
                          </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-6 mb-6">
                          <h5 className="text-base font-semibold text-gray-900 mb-4">
                            Status: {order.status}
                          </h5>
                          <TrackingProgress
                            currentStatus={order.status}
                          />
                        </div>

                        {order.shippingAddress && (
                          <div className="mb-4">
                            <h5 className="text-sm font-medium text-gray-900 mb-2">
                              Shipping Address
                            </h5>
                            <p className="text-sm text-gray-600">{order.shippingAddress}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 pt-6 border-t border-gray-200 text-right">
                    <div className="inline-block text-left min-w-[200px]">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Items Count</span>
                        <span>{order.items.reduce((s: number, i: any) => s + i.quantity, 0)}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200">
                        <span>Total Paid</span>
                        <span className="text-indigo-600">${order.totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Previous Orders */}
        {previousOrders.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Order History
            </h2>
            <div className="space-y-6">
              {previousOrders.map((order: any) => (
                <div
                  key={order.id}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        Order #{order.id.slice(0, 8)}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Delivered on {new Date(order.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        Delivered
                      </span>
                      <p className="text-lg font-semibold text-gray-900 mt-2">
                        ${order.totalAmount.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex items-center space-x-4">
                      {order.items.slice(0, 3).map((item: any) => (
                        <div key={item.id} className="flex-shrink-0">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-16 w-16 rounded-md object-cover"
                          />
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <div className="flex-shrink-0 flex items-center justify-center h-16 w-16 rounded-md bg-gray-100 text-sm font-medium text-gray-600">
                          +{order.items.length - 3}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && orders.length === 0 && (
          <div className="mt-12 text-center">
            <p className="text-lg text-gray-500">You have no orders yet</p>
            <Link
              to="/"
              className="mt-6 inline-block text-indigo-600 hover:text-indigo-500 font-medium"
            >
              Start shopping
            </Link>
          </div>
        )}

        {/* Continue Shopping */}
        {orders.length > 0 && (
          <div className="mt-12 text-center">
            <Link
              to="/"
              className="inline-block text-indigo-600 hover:text-indigo-500 font-medium"
            >
              Continue shopping
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
