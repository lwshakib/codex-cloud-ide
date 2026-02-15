import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  MinusIcon,
  PlusIcon,
  ShoppingBagIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import api from '../api/apiClient';

import { getCartSessionId, triggerCartUpdate } from '../utils/cart';

export default function ProductDetail() {
  const { productId } = useParams<{ productId: string }>();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [cartLoading, setCartLoading] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await api.get(`/catalog/products/${productId}`);
        const productData = response.data;
        
        // Fetch stock info
        try {
          const stockResponse = await api.get(`/inventory/stock/${productId}`);
          productData.inStock = stockResponse.data.stock > 0;
          productData.stockCount = stockResponse.data.stock;
        } catch (err) {
          // Fallback if no inventory record yet
          productData.inStock = true;
          productData.stockCount = 10;
        }
        
        setProduct(productData);
        
        // Fetch related products
        const relatedResponse = await api.get('/catalog/products');
        setRelatedProducts(Array.isArray(relatedResponse.data) ? relatedResponse.data.filter((p: any) => p.id !== productId).slice(0, 4) : []);
      } catch (error) {
        console.error("Failed to fetch product data:", error);
      } finally {
        setLoading(false);
      }
    };
    if (productId) fetchProduct();
  }, [productId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="bg-white">
        <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Product not found
            </h1>
            <p className="mt-4 text-gray-600">
              The product you're looking for doesn't exist.
            </p>
            <Link
              to="/"
              className="mt-6 inline-block text-indigo-600 hover:text-indigo-500 font-medium"
            >
              Continue shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const images = product.images || [product.imageSrc];
  const handleAddToCart = async () => {
    setCartLoading(true);
    try {
      const sessionId = getCartSessionId();
      await api.post('/cart/add', {
        sessionId,
        productId: product.id,
        quantity,
      });
      setIsAdded(true);
      triggerCartUpdate();
      setTimeout(() => setIsAdded(false), 3000);
    } catch (error: any) {
      console.error('Failed to add to cart:', error);
      alert(error.response?.data?.error || 'Failed to add to cart');
    } finally {
      setCartLoading(false);
    }
  };

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="flex items-center space-x-2 text-sm text-gray-500">
            <li>
              <Link to="/" className="hover:text-gray-700">
                Home
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link to="/" className="hover:text-gray-700">
                Products
              </Link>
            </li>
            <li>/</li>
            <li className="text-gray-900">{product.name}</li>
          </ol>
        </nav>

        <div className="lg:grid lg:grid-cols-2 lg:gap-x-8 lg:items-start">
          {/* Image gallery */}
          <div className="flex flex-col-reverse">
            {/* Image selector */}
            {images.length > 1 && (
              <div className="mx-auto mt-6 hidden w-full max-w-2xl sm:block lg:max-w-none">
                <div className="grid grid-cols-4 gap-6">
                  {images.map((image: string, index: number) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setSelectedImage(index)}
                      className={`relative flex h-24 cursor-pointer items-center justify-center rounded-md bg-white text-sm font-medium uppercase text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                        selectedImage === index ? 'ring-2 ring-indigo-500' : ''
                      }`}
                    >
                      <span className="sr-only">
                        {product.name} view {index + 1}
                      </span>
                      <img
                        src={image}
                        alt={`${product.name} view ${index + 1}`}
                        className="h-full w-full object-cover object-center rounded-md"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Main image */}
            <div className="aspect-square w-full overflow-hidden rounded-lg bg-gray-100">
              <img
                src={images[selectedImage]}
                alt={product.imageAlt || product.name}
                className="h-full w-full object-cover object-center"
              />
            </div>
          </div>

          {/* Product info */}
          <div className="mt-10 px-4 sm:mt-16 sm:px-0 lg:mt-0">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              {product.name}
            </h1>

            <div className="mt-3">
              <h2 className="sr-only">Product information</h2>
              <p className="text-3xl tracking-tight text-gray-900">
                ${product.price}
              </p>
            </div>

            {/* Reviews */}
            <div className="mt-3">
              <h3 className="sr-only">Reviews</h3>
              <div className="flex items-center">
                <div className="flex items-center">
                  {[0, 1, 2, 3, 4].map((rating) => (
                    <svg
                      key={rating}
                      className="h-5 w-5 flex-shrink-0 text-yellow-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ))}
                </div>
                <p className="sr-only">5 out of 5 stars</p>
                <p className="ml-2 text-sm text-gray-500">(24 reviews)</p>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="sr-only">Description</h3>
              <div className="space-y-6 text-base text-gray-700">
                <p>{product.description}</p>
              </div>
            </div>

            {/* Color picker */}
            {product.colors && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-900">Color</h3>
                <div className="mt-2 flex items-center space-x-3">
                  {product.colors.map((color: any) => (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => setSelectedColor(color.name)}
                      className={`relative -m-0.5 flex cursor-pointer items-center justify-center rounded-full p-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                        selectedColor === color.name
                          ? color.selectedClass
                          : 'ring-2 ring-transparent'
                      }`}
                    >
                      <span
                        className={`h-8 w-8 rounded-full border border-black border-opacity-10 ${color.class}`}
                        aria-label={color.name}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size picker */}
            {product.sizes && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-900">Size</h3>
                <div className="mt-2 grid grid-cols-3 gap-3">
                  {product.sizes.map((size: any) => (
                    <button
                      key={size.name}
                      type="button"
                      onClick={() => setSelectedSize(size.name)}
                      disabled={!size.inStock}
                      className={`flex items-center justify-center rounded-md border px-3 py-2 text-sm font-medium uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                        selectedSize === size.name
                          ? 'border-indigo-600 bg-indigo-600 text-white'
                          : size.inStock
                          ? 'border-gray-300 bg-white text-gray-900 hover:bg-gray-50'
                          : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {size.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity selector */}
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-900">Quantity</h3>
              <div className="mt-2 flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="rounded-md border border-gray-300 p-1 hover:bg-gray-50"
                >
                  <MinusIcon className="h-4 w-4" />
                </button>
                <span className="text-base font-medium text-gray-900 w-8 text-center">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="rounded-md border border-gray-300 p-1 hover:bg-gray-50"
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Add to cart */}
            <div className="mt-10">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!product.inStock || cartLoading}
                className={`flex w-full items-center justify-center rounded-md border border-transparent px-8 py-3 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-50 ${
                  product.inStock && !cartLoading
                    ? 'bg-indigo-600 hover:bg-indigo-700'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                {cartLoading ? (
                  'Adding...'
                ) : isAdded ? (
                  <>
                    <CheckIcon className="mr-2 h-5 w-5" />
                    Added to cart
                  </>
                ) : product.inStock ? (
                  <>
                    <ShoppingBagIcon className="mr-2 h-5 w-5" />
                    Add to cart
                  </>
                ) : (
                  'Out of stock'
                )}
              </button>
            </div>

            {/* Product details */}
            <section aria-labelledby="details-heading" className="mt-12">
              <h2 id="details-heading" className="sr-only">
                Additional details
              </h2>
              <div className="divide-y divide-gray-200 border-t">
                <div className="py-6">
                  <h3 className="text-sm font-medium text-gray-900">
                    Shipping & Returns
                  </h3>
                  <div className="mt-2 prose prose-sm text-gray-500">
                    <p>
                      Free shipping on orders over $100. Returns accepted within
                      30 days of purchase.
                    </p>
                  </div>
                </div>
                <div className="py-6">
                  <h3 className="text-sm font-medium text-gray-900">Care</h3>
                  <div className="mt-2 prose prose-sm text-gray-500">
                    <p>
                      Hand wash only. Do not bleach. Air dry flat. Do not iron.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Customers also bought */}
        <section className="mt-24 border-t border-gray-200 pt-16">
          <h2 className="text-2xl font-semibold text-gray-900 mb-8">
            Customers also bought
          </h2>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {relatedProducts.map((relatedProduct: any) => (
              <div key={relatedProduct.id} className="group relative">
                <Link to={`/product/${relatedProduct.id}`}>
                  <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-gray-100">
                    <img
                      src={relatedProduct.images?.[0]}
                      alt={relatedProduct.name}
                      className="h-full w-full object-cover object-center group-hover:opacity-75"
                    />
                    {/* Price tag overlay */}
                    <div className="absolute bottom-2 right-2 rounded-md bg-gray-900 px-2.5 py-1">
                      <span className="text-sm font-medium text-white">
                        ${relatedProduct.price}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-base font-semibold text-gray-900">
                      {relatedProduct.name}
                    </h3>
                  </div>
                </Link>
                  <button
                    type="button"
                    onClick={() => {
                      console.log('Add to cart:', relatedProduct.id);
                      alert('Product added to cart!');
                    }}
                    className="mt-4 w-full rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    Add to cart
                  </button>
                </div>
              ))}
          </div>
        </section>
      </div>
    </div>
  );
}
