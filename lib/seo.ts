import { Metadata } from 'next'

export const siteConfig = {
  name: 'OmniWTMS',
  description: 'UK\'s most advanced AI-powered Warehouse & Transport Management System. Get real-time visibility, zero delays, and full automation across every warehouse, vehicle, and order.',
  url: 'https://omniwtms.com',
  ogImage: 'https://omniwtms.com/og-image.png',
  creator: 'OmniWTMS Ltd',
  keywords: [
    'warehouse management system',
    'transport management',
    'logistics software',
    'UK logistics',
    'warehouse automation',
    'fleet management',
    'inventory management',
    'delivery tracking',
    'supply chain management',
    'WMS software',
    'TMS software',
    '3PL software',
    'courier management',
    'route optimization',
    'AI logistics',
    'warehouse technology',
    'logistics platform',
    'delivery management',
    'freight management',
    'distribution software'
  ]
}

export function generateMetadata({
  title,
  description,
  image,
  noIndex = false,
  keywords,
  canonical
}: {
  title?: string
  description?: string
  image?: string
  noIndex?: boolean
  keywords?: string[]
  canonical?: string
}): Metadata {
  const seoTitle = title ? `${title} | ${siteConfig.name}` : siteConfig.name
  const seoDescription = description || siteConfig.description
  const seoImage = image || siteConfig.ogImage
  const seoKeywords = keywords ? [...siteConfig.keywords, ...keywords] : siteConfig.keywords

  return {
    title: seoTitle,
    description: seoDescription,
    keywords: seoKeywords.join(', '),
    authors: [{ name: siteConfig.creator }],
    creator: siteConfig.creator,
    publisher: siteConfig.creator,
    robots: {
      index: !noIndex,
      follow: !noIndex,
      googleBot: {
        index: !noIndex,
        follow: !noIndex,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      type: 'website',
      locale: 'en_GB',
      url: canonical || siteConfig.url,
      title: seoTitle,
      description: seoDescription,
      siteName: siteConfig.name,
      images: [
        {
          url: seoImage,
          width: 1200,
          height: 630,
          alt: seoTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: seoTitle,
      description: seoDescription,
      images: [seoImage],
      creator: '@omniwtms',
      site: '@omniwtms',
    },
    alternates: {
      canonical: canonical || siteConfig.url,
    },
    other: {
      'msapplication-TileColor': '#2563eb',
      'theme-color': '#ffffff',
    },
  }
}

// Page-specific SEO configurations
export const pageConfigs = {
  home: {
    title: 'AI-Powered UK Warehouse & Transport Management System',
    description: 'OmniWTMS: UK\'s fastest, most advanced Warehouse & Transport Management System. 250+ logistics firms trust us. 38% faster deliveries, zero delays, full automation.',
    keywords: ['warehouse management system UK', 'transport management software', 'logistics automation', 'AI warehouse system']
  },
  pricing: {
    title: 'Transparent UK SaaS Pricing - No Setup Fees',
    description: 'Simple, transparent pricing for OmniWTMS. No setup fees, cancel anytime, all features included. Compare plans and book your free demo today.',
    keywords: ['warehouse management pricing', 'logistics software cost', 'WMS pricing UK', 'transport management price']
  },
  features: {
    title: 'Advanced Warehouse & Transport Management Features',
    description: 'Comprehensive WMS & TMS features: Real-time tracking, AI route optimization, inventory automation, fleet management, and more.',
    keywords: ['warehouse management features', 'transport management features', 'logistics software capabilities', 'WMS TMS features']
  },
  dashboard: {
    title: 'Real-Time Logistics Dashboard & Analytics',
    description: 'Monitor your entire logistics operation in real-time. Advanced analytics, KPI tracking, and actionable insights for better decision making.',
    keywords: ['logistics dashboard', 'warehouse analytics', 'transport KPIs', 'supply chain visibility']
  },
  tracking: {
    title: 'Real-Time Package & Vehicle Tracking',
    description: 'Track packages and vehicles in real-time. Live GPS tracking, delivery notifications, and complete visibility across your supply chain.',
    keywords: ['package tracking', 'vehicle tracking', 'delivery tracking', 'GPS logistics tracking']
  },
  inventory: {
    title: 'Advanced Inventory Management System',
    description: 'Complete inventory control with real-time stock levels, automated reordering, barcode scanning, and multi-warehouse management.',
    keywords: ['inventory management', 'stock control', 'warehouse inventory', 'inventory tracking system']
  },
  orders: {
    title: 'Order Management & Processing System',
    description: 'Streamline order processing from receipt to delivery. Automated workflows, order tracking, and seamless integration.',
    keywords: ['order management', 'order processing', 'order fulfillment', 'order tracking system']
  },
  couriers: {
    title: 'Courier & Driver Management Platform',
    description: 'Manage couriers and drivers efficiently. Route optimization, performance tracking, mobile apps, and real-time communication.',
    keywords: ['courier management', 'driver management', 'delivery management', 'courier tracking system']
  },
  warehouses: {
    title: 'Multi-Warehouse Management System',
    description: 'Manage multiple warehouses from one platform. Cross-docking, inventory transfers, and unified reporting across all locations.',
    keywords: ['multi warehouse management', 'warehouse operations', 'warehouse automation', 'warehouse control system']
  },
  reports: {
    title: 'Advanced Logistics Reporting & Analytics',
    description: 'Comprehensive reporting suite with real-time analytics, KPI dashboards, and custom reports for data-driven decisions.',
    keywords: ['logistics reports', 'warehouse reports', 'transport analytics', 'supply chain reporting']
  }
}
