// Image Optimization Utilities for SEO and Performance

export const imageConfig = {
  formats: ['image/webp', 'image/avif'],
  deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  domains: ['omniwtms.com', 'cdn.omniwtms.com'],
  minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year
};

export interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  quality?: number;
}

export const getOptimizedImageProps = ({
  src,
  alt,
  width,
  height,
  priority = false,
  quality = 85,
}: OptimizedImageProps) => {
  return {
    src,
    alt,
    width,
    height,
    priority,
    quality,
    loading: priority ? ('eager' as const) : ('lazy' as const),
    placeholder: 'blur' as const,
    blurDataURL: generateBlurDataURL(width || 800, height || 600),
  };
};

// Generate a simple blur placeholder
function generateBlurDataURL(width: number, height: number): string {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#e0e7ff;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#c7d2fe;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#grad)"/>
    </svg>
  `;
  
  const base64 = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}

// SEO-friendly image alt text generator
export const generateImageAlt = (
  context: string,
  subject: string,
  location?: string
): string => {
  const parts = [subject, context];
  if (location) parts.push(location);
  return parts.join(' - ');
};

// Example usage:
// generateImageAlt('warehouse management', 'OmniWTMS dashboard', 'UK')
// Returns: "OmniWTMS dashboard - warehouse management - UK"

export const imageAltTemplates = {
  hero: (feature: string) => `${feature} - OmniWTMS Warehouse & Transport Management System`,
  feature: (name: string) => `${name} feature in OmniWTMS logistics platform`,
  screenshot: (section: string) => `OmniWTMS ${section} interface screenshot`,
  icon: (name: string) => `${name} icon`,
  logo: (company: string) => `${company} logo`,
  testimonial: (name: string) => `${name} testimonial photo`,
  caseStudy: (company: string) => `${company} case study - OmniWTMS success story`,
};

// Image compression recommendations
export const compressionGuidelines = {
  hero: { quality: 90, format: 'webp' },
  thumbnail: { quality: 80, format: 'webp' },
  icon: { quality: 85, format: 'webp' },
  screenshot: { quality: 85, format: 'webp' },
  background: { quality: 75, format: 'webp' },
};

// Lazy loading configuration
export const lazyLoadConfig = {
  rootMargin: '50px', // Start loading 50px before entering viewport
  threshold: 0.01,
  enableAutoReload: false,
};
