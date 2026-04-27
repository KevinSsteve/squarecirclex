import { useEffect, useRef, useState } from 'react';

/**
 * Custom hook for lazy loading images
 * Uses IntersectionObserver to load images only when they enter viewport
 * 
 * @param {string} src - Image source URL
 * @param {string} placeholder - Placeholder image URL (optional)
 * @returns {object} - { imageSrc, isLoaded, error }
 */
export const useLazyImage = (src, placeholder = null) => {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);
  const imgRef = useRef(null);

  useEffect(() => {
    if (!src) return;

    // Check if IntersectionObserver is supported
    if (!('IntersectionObserver' in window)) {
      // Fallback: load image immediately
      setImageSrc(src);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Load the image
            const img = new Image();
            img.src = src;
            
            img.onload = () => {
              setImageSrc(src);
              setIsLoaded(true);
              observer.disconnect();
            };
            
            img.onerror = () => {
              setError('Failed to load image');
              observer.disconnect();
            };
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before entering viewport
        threshold: 0.01,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  }, [src, placeholder]);

  return { imageSrc, isLoaded, error, imgRef };
};

/**
 * LazyImage component wrapper
 * Usage: <LazyImage src="image.jpg" alt="Description" className="..." />
 */
export const LazyImage = ({ src, alt, className = '', placeholder = null, ...props }) => {
  const { imageSrc, isLoaded, error, imgRef } = useLazyImage(src, placeholder);

  return (
    <img
      ref={imgRef}
      src={imageSrc || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3C/svg%3E'}
      alt={alt}
      className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
      loading="lazy"
      {...props}
      onError={(e) => {
        if (error) {
          e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3Crect fill="%23f3f4f6" width="1" height="1"/%3E%3C/svg%3E';
        }
      }}
    />
  );
};

export default useLazyImage;
