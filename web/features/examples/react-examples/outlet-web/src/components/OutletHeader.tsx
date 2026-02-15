'use client';

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react';
import {
  Bars3Icon,
  MagnifyingGlassIcon,
  ShoppingBagIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const navigation = {
  main: [
    { name: 'Home', href: '/' },
    { name: 'Collections', href: '#' },
    { name: 'About', href: '#' },
    { name: 'Contact', href: '#' },
  ],
  pages: [
    { name: 'Company', href: '#' },
    { name: 'Stores', href: '#' },
  ],
};

export default function OutletHeader() {
  const [open, setOpen] = useState(false);
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const [user, setUser] = useState<any>(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (e) {
        console.error("Failed to parse user from local storage", e);
      }
    }
    return null;
  });

  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const fetchCartCount = async () => {
      try {
        const { getCartSessionId } = await import('../utils/cart');
        const api = (await import('../api/apiClient')).default;
        const sessionId = getCartSessionId();
        const response = await api.get(`/cart/${sessionId}`);
        const items = response.data.items || [];
        const count = items.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);
        setCartCount(count);
      } catch (error) {
        console.error("Failed to fetch cart count", error);
      }
    };

    fetchCartCount();
    // Listen for storage changes to update cart count (when items are added in other tabs)
    window.addEventListener('storage', fetchCartCount);
    // Listen for custom cart-updated event (same tab)
    window.addEventListener('cart-updated', fetchCartCount);
    return () => {
      window.removeEventListener('storage', fetchCartCount);
      window.removeEventListener('cart-updated', fetchCartCount);
    };
  }, []);

  const handleLogout = async () => {
     try {
        const sessionToken = localStorage.getItem('sessionToken');
        if (sessionToken) {
           await import('../api/apiClient').then(mod => {
              mod.default.post('/auth/logout', { sessionToken });
           });
        }
     } catch (error) {
        console.error("Logout failed", error);
     } finally {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('sessionToken');
        localStorage.removeItem('user');
        setUser(null);
        window.location.href = '/sign-in';
     }
  };

  return (
    <div className="bg-white">
      {/* Mobile menu */}
      <Dialog open={open} onClose={setOpen} className="relative z-40 lg:hidden">
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-black/25 transition-opacity duration-300 ease-linear data-closed:opacity-0"
        />
        <div className="fixed inset-0 z-40 flex">
          <DialogPanel
            transition
            className="relative flex w-full max-w-xs transform flex-col overflow-y-auto bg-white pb-12 shadow-xl transition duration-300 ease-in-out data-closed:-translate-x-full"
          >
            <div className="flex px-4 pt-5 pb-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="relative -m-2 inline-flex items-center justify-center rounded-md p-2 text-gray-400"
              >
                <span className="absolute -inset-0.5" />
                <span className="sr-only">Close menu</span>
                <XMarkIcon aria-hidden="true" className="size-6" />
              </button>
            </div>

            {/* Links */}
            <div className="space-y-6 border-t border-gray-200 px-4 py-6">
              {navigation.main.map((item) => (
                <div key={item.name} className="flow-root">
                  <Link
                    to={item.href}
                    className="-m-2 block p-2 font-medium text-gray-900"
                  >
                    {item.name}
                  </Link>
                </div>
              ))}
            </div>

            <div className="space-y-6 border-t border-gray-200 px-4 py-6">
              {navigation.pages.map((page) => (
                <div key={page.name} className="flow-root">
                  <a
                    href={page.href}
                    className="-m-2 block p-2 font-medium text-gray-900"
                  >
                    {page.name}
                  </a>
                </div>
              ))}
            </div>

            <div className="space-y-6 border-t border-gray-200 px-4 py-6">
              {user ? (
                 <>
                  <div className="flow-root">
                    <span className="-m-2 block p-2 font-medium text-gray-900">
                      Hi, {user.email?.split('@')[0]}
                    </span>
                  </div>
                  <div className="flow-root">
                    <button
                      onClick={handleLogout}
                      className="-m-2 block p-2 font-medium text-red-600 w-full text-left"
                    >
                      Sign out
                    </button>
                  </div>
                 </>
              ) : (
                <>
                  <div className="flow-root">
                    <Link
                      to="/sign-in"
                      className="-m-2 block p-2 font-medium text-gray-900"
                    >
                      Sign in
                    </Link>
                  </div>
                  <div className="flow-root">
                    <Link
                      to="/create-account"
                      className="-m-2 block p-2 font-medium text-gray-900"
                    >
                      Create account
                    </Link>
                  </div>
                </>
              )}
            </div>

            <div className="border-t border-gray-200 px-4 py-6">
              <a href="#" className="-m-2 flex items-center p-2">
                <img
                  alt=""
                  src="https://tailwindcss.com/plus-assets/img/flags/flag-canada.svg"
                  className="block h-auto w-5 shrink-0"
                />
                <span className="ml-3 block text-base font-medium text-gray-900">
                  CAD
                </span>
                <span className="sr-only">, change currency</span>
              </a>
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      <header className="relative bg-white">
        <p className="flex h-10 items-center justify-center bg-indigo-600 px-4 text-sm font-medium text-white sm:px-6 lg:px-8">
          Get free delivery on orders over $100
        </p>

        <nav
          aria-label="Top"
          className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
        >
          <div className="border-b border-gray-200">
            <div className="flex h-16 items-center">
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="relative rounded-md bg-white p-2 text-gray-400 lg:hidden"
              >
                <span className="absolute -inset-0.5" />
                <span className="sr-only">Open menu</span>
                <Bars3Icon aria-hidden="true" className="size-6" />
              </button>

              {/* Logo */}
              <div className="ml-4 flex lg:ml-0">
                <Link to="/">
                  <span className="sr-only">Outlet</span>
                  <span
                    className="text-2xl uppercase tracking-wide"
                    style={{
                      fontFamily: "'Montserrat', sans-serif",
                      fontWeight: 500,
                      color: '#374151',
                      letterSpacing: '0.05em',
                    }}
                  >
                    OUTLET
                  </span>
                </Link>
              </div>

              {/* Navigation Links */}
              <div className="hidden lg:ml-8 lg:block lg:self-stretch">
                <div className="flex h-full space-x-8">
                  {navigation.main.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-800"
                    >
                      {item.name}
                    </Link>
                  ))}
                  {navigation.pages.map((page) => (
                    <a
                      key={page.name}
                      href={page.href}
                      className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-800"
                    >
                      {page.name}
                    </a>
                  ))}
                </div>
              </div>

              <div className="ml-auto flex items-center">
                <div className="hidden lg:flex lg:flex-1 lg:items-center lg:justify-end lg:space-x-6">
                  {user ? (
                    <>
                      <span className="text-sm font-medium text-gray-700">
                        Hi, {user.email?.split('@')[0]}
                      </span>
                      <span aria-hidden="true" className="h-6 w-px bg-gray-200" />
                      <button
                        onClick={handleLogout}
                        className="text-sm font-medium text-red-600 hover:text-red-500"
                      >
                        Sign out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/sign-in"
                        className="text-sm font-medium text-gray-700 hover:text-gray-800"
                      >
                        Sign in
                      </Link>
                      <span aria-hidden="true" className="h-6 w-px bg-gray-200" />
                      <Link
                        to="/create-account"
                        className="text-sm font-medium text-gray-700 hover:text-gray-800"
                      >
                        Create account
                      </Link>
                    </>
                  )}
                </div>

                <div className="hidden lg:ml-8 lg:flex">
                  <a
                    href="#"
                    className="flex items-center text-gray-700 hover:text-gray-800"
                  >
                    <img
                      alt=""
                      src="https://tailwindcss.com/plus-assets/img/flags/flag-canada.svg"
                      className="block h-auto w-5 shrink-0"
                    />
                    <span className="ml-3 block text-sm font-medium">CAD</span>
                    <span className="sr-only">, change currency</span>
                  </a>
                </div>

                {/* Search */}
                <div className="flex lg:ml-6">
                  <form 
                    onSubmit={(e: any) => {
                      e.preventDefault();
                      const query = e.target.search.value;
                      if (query.trim()) {
                        window.location.href = `/search?q=${encodeURIComponent(query.trim())}`;
                      }
                    }}
                    className="relative"
                  >
                    <input
                      name="search"
                      type="text"
                      placeholder="Search..."
                      className="w-32 lg:w-48 pl-8 pr-3 py-1.5 text-sm bg-gray-50 border border-transparent rounded-full focus:bg-white focus:border-indigo-500 focus:w-64 outline-none transition-all duration-300"
                    />
                    <MagnifyingGlassIcon
                      aria-hidden="true"
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-gray-400"
                    />
                    <button type="submit" className="sr-only">Search</button>
                  </form>
                </div>

                {/* Cart */}
                <div className="ml-4 flow-root lg:ml-6">
                  <Link to="/cart" className="group -m-2 flex items-center p-2">
                    <ShoppingBagIcon
                      aria-hidden="true"
                      className="size-6 shrink-0 text-gray-400 group-hover:text-gray-500"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700 group-hover:text-gray-800">
                      {cartCount}
                    </span>
                    <span className="sr-only">items in cart, view bag</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </nav>
      </header>
    </div>
  );
}
