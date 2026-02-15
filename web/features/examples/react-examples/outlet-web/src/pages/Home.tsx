import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import HeroSlider from '../components/HeroSlider';
import api from '../api/apiClient';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category: {
    name: string;
  };
  companyId: string;
  company: {
    name: string;
  }
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get('/catalog/products');
        setProducts(response.data);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const latestCollections = Array.isArray(products) ? products.slice(0, 8) : [];
  const luxuryFeatured = Array.isArray(products) ? products.filter(p => p.price > 1000000).slice(0, 4) : [];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      {/* Hero Slider Section */}
      <HeroSlider />

      {/* Latest Collections Section */}
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
              Latest Collections
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Discover our newest arrivals from the world's most prestigious brands
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <form 
              onSubmit={(e: any) => {
                e.preventDefault();
                const query = e.target.search.value;
                if (query.trim()) {
                  window.location.href = `/search?q=${encodeURIComponent(query.trim())}`;
                }
              }}
              className="relative w-full sm:w-80"
            >
              <input
                name="search"
                type="text"
                placeholder="Search masterpieces..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              />
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            </form>

            <Link to="/search" className="hidden text-sm font-semibold text-indigo-600 hover:text-indigo-500 sm:block self-end pb-2">
              Browse all products
              <span aria-hidden="true"> &rarr;</span>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
          {latestCollections.map((product) => (
            <Link
              key={product.id}
              to={`/product/${product.id}`}
              className="group relative flex flex-col"
            >
              <div className="aspect-h-1 aspect-w-1 w-full overflow-hidden rounded-xl bg-gray-200 lg:aspect-none group-hover:opacity-75 transition-opacity duration-300 h-80">
                <img
                  alt={product.name}
                  src={product.images[0] || 'https://loremflickr.com/800/600/luxury'}
                  className="h-full w-full object-cover object-center lg:h-full lg:w-full"
                />
              </div>
              <div className="mt-4 flex justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    <span aria-hidden="true" className="absolute inset-0" />
                    {product.name}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">{product.company.name}</p>
                </div>
                <p className="text-sm font-bold text-gray-900">
                  ${product.price.toLocaleString()}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Luxury Featured Section - Glassmorphism style background */}
      <div className="bg-gray-900 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl uppercase tracking-widest">The Ultra-Luxury Collection</h2>
            <p className="mt-6 text-lg leading-8 text-gray-300">
              Only for those who demand the very best. Exclusive access to limited edition masterpieces.
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-3">
            {luxuryFeatured.slice(0, 3).map((product) => (
              <article key={product.id} className="flex flex-col items-start justify-between bg-white/5 p-6 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                <div className="relative w-full">
                  <img
                    alt={product.name}
                    src={product.images[0]}
                    className="aspect-[16/9] w-full rounded-xl bg-gray-100 object-cover sm:aspect-[2/1] lg:aspect-[3/2]"
                  />
                  <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-gray-900/10" />
                </div>
                <div className="max-w-xl">
                  <div className="mt-8 flex items-center gap-x-4 text-xs">
                    <time dateTime="2026-01-04" className="text-gray-400">
                      Jan 4, 2026
                    </time>
                    <span className="relative z-10 rounded-full bg-indigo-500/10 px-3 py-1.5 font-medium text-indigo-400 ring-1 ring-inset ring-indigo-500/20 uppercase">
                      {product.category?.name || "Unknown Category"}
                    </span>
                  </div>
                  <div className="group relative">
                    <h3 className="mt-3 text-lg font-semibold leading-6 text-white group-hover:text-gray-300">
                      <Link to={`/product/${product.id}`}>
                        <span className="absolute inset-0" />
                        {product.name}
                      </Link>
                    </h3>
                    <p className="mt-5 line-clamp-3 text-sm leading-6 text-gray-400">
                      {product.description}
                    </p>
                  </div>
                  <div className="relative mt-8 flex items-center gap-x-4">
                    <div className="text-sm leading-6">
                      <p className="font-semibold text-white">
                        <span className="absolute inset-0" />
                        {product.company.name}
                      </p>
                      <p className="text-indigo-400 font-bold text-lg">${product.price.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
