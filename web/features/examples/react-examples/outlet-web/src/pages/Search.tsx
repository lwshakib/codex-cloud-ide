import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
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

export default function Search() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(query);

  const fetchProducts = async (searchQuery: string) => {
    setLoading(true);
    try {
      const response = await api.get(`/catalog/products?q=${searchQuery}`);
      setProducts(response.data);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(query);
    setSearchInput(query);
  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchInput.trim())}`;
    }
  };

  return (
    <div className="bg-white min-h-screen">
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              {query ? `Search results for "${query}"` : 'All Products'}
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              {products.length} products found
            </p>
          </div>
          
          <form onSubmit={handleSearch} className="relative w-full md:w-96">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search masterpieces..."
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
            />
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          </form>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <>
            {products.length === 0 ? (
              <div className="text-center py-24">
                <div className="bg-gray-50 rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-4">
                  <MagnifyingGlassIcon className="h-10 w-10 text-gray-300" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">No products found</h3>
                <p className="mt-1 text-sm text-gray-500">Try searching for something else or browse our collections.</p>
                <Link to="/" className="mt-6 inline-block text-indigo-600 font-semibold hover:text-indigo-500">
                  Go back home
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
                {products.map((product) => (
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
            )}
          </>
        )}
      </div>
    </div>
  );
}
