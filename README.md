# OmniWTMS - Warehouse & Transport Management System

[![Next.js](https://img.shields.io/badge/Next.js-14.2.23-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.1-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-2.49.1-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)

> **The UK's fastest, most advanced Warehouse & Transport Management System**

OmniWTMS is a comprehensive logistics platform that provides real-time visibility, zero delays, and full automation across warehouses, vehicles, and orders. Built with modern web technologies for maximum performance and scalability.

## 🚀 Features

### 🏭 **Warehouse Management**
- **Real-time Inventory Tracking** - Live stock levels and location mapping
- **AI-Powered Pick Optimization** - Reduce picking time by up to 40%
- **Barcode & QR Code Scanning** - Digital proof of delivery and tracking
- **Multi-warehouse Support** - Manage multiple locations from one dashboard

### 🚛 **Transport Management**
- **AI Route Optimization** - Cut delivery times and reduce empty miles
- **Real-time Vehicle Tracking** - GPS tracking with live updates
- **Driver Mobile App** - Android/iOS app for drivers with digital POD
- **Delivery Scheduling** - Smart scheduling with time window optimization

### 📊 **Analytics & Reporting**
- **Live Dashboard** - Real-time KPIs and performance metrics
- **Custom Reports** - Generate detailed analytics and insights
- **Performance Tracking** - Monitor delivery times, efficiency, and costs
- **Predictive Analytics** - AI-powered forecasting and optimization

### 🔧 **Integration & Automation**
- **API-First Architecture** - Easy integration with existing systems
- **Automated Workflows** - Reduce manual tasks and human error
- **Third-party Integrations** - Connect with accounting, CRM, and ERP systems
- **Webhook Support** - Real-time notifications and data sync

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI Components
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Maps & Routing**: Mapbox GL, Leaflet, What3Words
- **AI/ML**: TensorFlow.js, Google Cloud Vision
- **File Processing**: PDF.js, ExcelJS, Tesseract.js
- **Charts**: Recharts, React visualization libraries
- **Mobile**: Progressive Web App (PWA) support

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account (for backend services)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/KhamareClarke/omniwtms.com.git
   cd omniwtms.com
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env.local
   ```
   
   Configure your environment variables:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_token
   ```

4. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📱 Mobile App

OmniWTMS includes a Progressive Web App (PWA) that works seamlessly on mobile devices:

- **Driver App**: Real-time route updates, digital proof of delivery
- **Warehouse App**: Barcode scanning, inventory management
- **Manager Dashboard**: Live analytics and performance monitoring

## 🏗️ Project Structure

```
omniwtms/
├── app/                    # Next.js 14 App Router
│   ├── (auth)/            # Authentication pages
│   ├── dashboard/         # Main application dashboard
│   ├── api/              # API routes
│   └── globals.css       # Global styles
├── components/           # Reusable React components
│   ├── ui/              # Base UI components (Radix UI)
│   ├── dashboard/       # Dashboard-specific components
│   ├── warehouse/       # Warehouse management components
│   └── transport/       # Transport management components
├── lib/                 # Utility functions and configurations
├── hooks/              # Custom React hooks
├── utils/              # Helper functions
├── public/             # Static assets
└── supabase/           # Database schema and migrations
```

## 🔧 Configuration

### Database Setup (Supabase)
1. Create a new Supabase project
2. Run the SQL migrations in `/supabase/migrations/`
3. Configure Row Level Security (RLS) policies
4. Set up authentication providers

### API Keys Required
- **Supabase**: Database and authentication
- **Mapbox**: Maps and routing
- **Google Cloud**: Vision API (optional, for OCR)
- **What3Words**: Location services (optional)

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm run build
vercel --prod
```

### Docker
```bash
docker build -t omniwtms .
docker run -p 3000:3000 omniwtms
```

### Manual Deployment
```bash
npm run build
npm start
```

## 📊 Performance

- **Lighthouse Score**: 95+ (Performance, Accessibility, SEO)
- **Core Web Vitals**: Excellent ratings across all metrics
- **Mobile Optimized**: Responsive design with mobile-first approach
- **PWA Ready**: Offline support and app-like experience

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs.omniwtms.com](https://docs.omniwtms.com)
- **Email**: support@omniwtms.com
- **Issues**: [GitHub Issues](https://github.com/KhamareClarke/omniwtms.com/issues)

## 🎯 Roadmap

- [ ] **Mobile Apps**: Native iOS and Android applications
- [ ] **Advanced AI**: Machine learning for demand forecasting
- [ ] **IoT Integration**: Sensor data and automated tracking
- [ ] **Multi-tenant**: SaaS platform for multiple organizations
- [ ] **Advanced Analytics**: Business intelligence and reporting

## 🏆 Why Choose OmniWTMS?

- ⚡ **48-Hour Setup** - Go live in just 2 days
- 🎯 **38% Faster Deliveries** - Proven performance improvements
- 🛡️ **Enterprise Security** - GDPR compliant, ISO 27001 certified
- 🇬🇧 **UK-Based Support** - Local support team and data centers
- 💰 **Cost Effective** - Reduce operational costs by up to 25%

---

**Built with ❤️ in the UK for the logistics industry**
"# testomniwtms" 
