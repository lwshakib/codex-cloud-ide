import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const slides = [
  {
    id: 1,
    imageSrc:
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=600&fit=crop',
    title: 'New Collection 2024',
    description: 'Shop our newest arrivals',
    buttonText: 'Shop Now',
    buttonLink: '#',
  },
  {
    id: 2,
    imageSrc:
      'https://images.unsplash.com/photo-1445205170230-053b83016050?w=1200&h=600&fit=crop',
    title: 'Summer Sale',
    description: 'Up to 50% off selected items',
    buttonText: 'Explore Deals',
    buttonLink: '#',
  },
  {
    id: 3,
    imageSrc:
      'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1200&h=600&fit=crop',
    title: 'Premium Quality',
    description: 'Crafted with care',
    buttonText: 'Learn More',
    buttonLink: '#',
  },
];

export default function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000); // Auto-slide every 5 seconds

    return () => clearInterval(timer);
  }, []);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
      <div className="relative w-full h-[400px] sm:h-[450px] rounded-lg overflow-hidden">
        {/* Slides */}
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-700 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${slide.imageSrc})` }}
            >
              <div className="absolute inset-0 bg-black/50"></div>
            </div>
            <div className="relative h-full flex items-center justify-center">
              <div className="text-center px-6 max-w-2xl">
                <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-3 drop-shadow-lg">
                  {slide.title}
                </h2>
                <p className="text-base sm:text-lg text-white/95 mb-6 drop-shadow-md">
                  {slide.description}
                </p>
                <Link
                  to={slide.buttonLink}
                  className="inline-block bg-white text-gray-900 px-6 py-2.5 rounded text-sm font-medium hover:bg-gray-100 transition-colors shadow-lg"
                >
                  {slide.buttonText}
                </Link>
              </div>
            </div>
          </div>
        ))}

        {/* Navigation Arrows */}
        <button
          onClick={goToPrevious}
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-700 p-1.5 rounded-full shadow-sm transition-all z-10"
          aria-label="Previous slide"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <button
          onClick={goToNext}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-700 p-1.5 rounded-full shadow-sm transition-all z-10"
          aria-label="Next slide"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>

        {/* Slide Indicators */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-1.5 z-10">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? 'w-6 bg-gray-900'
                  : 'w-1.5 bg-gray-400 hover:bg-gray-600'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
