'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Zap, 
  Link, 
  Palette, 
  Blocks,
  RefreshCw,
  Shield,
  Globe,
  Cpu,
  Command
} from 'lucide-react';

export default function CommandAdvantage() {
  const [liveStats, setLiveStats] = useState({
    deliveries: 2847,
    efficiency: 97,
    saved: 47
  });
  
  // Simulate live data updates
  useEffect(() => {
    const dataInterval = setInterval(() => {
      setLiveStats(prev => ({
        deliveries: prev.deliveries + Math.floor(Math.random() * 3),
        efficiency: Math.min(99, prev.efficiency + (Math.random() * 0.2 - 0.1)),
        saved: prev.saved + Math.random() * 0.2
      }));
    }, 4000);
    
    return () => clearInterval(dataInterval);
  }, []);
  const advantages = [
    {
      title: 'Warehouse Control',
      description: 'Inventory tracking, order picking, barcode scanning — tight stock control',
      icon: Blocks,
      color: 'text-blue-600'
    },
    {
      title: 'Fleet Management',
      description: 'Real-time tracking, route optimization, digital proof of delivery',
      icon: Globe,
      color: 'text-green-600'
    },
    {
      title: 'AI Automation',
      description: 'Auto-scheduling, demand forecasting, anomaly detection',
      icon: Cpu,
      color: 'text-purple-600'
    },
    {
      title: 'Command Center',
      description: 'Single dashboard with KPIs and vital metrics, always accessible',
      icon: Command,
      color: 'text-red-600'
    }
  ];

  const differentiators = [
    {
      title: 'Live delivery tracking',
      description: 'Real-time GPS tracking with proof of delivery',
      icon: Shield
    },
    {
      title: 'Quick job assignment',
      description: 'Assign jobs and routes in seconds',
      icon: Zap
    },
    {
      title: 'Real-time visibility',
      description: 'Stock visibility with location mapping',
      icon: Cpu
    }
  ];

  return (
    <div className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* WHY OMNIWTMS */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 mb-4 bg-blue-50 border border-blue-100 rounded-full px-3 py-1 animate-pulse-subtle">
            <Command className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium text-blue-700">⚙️ WHY OMNIWTMS</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 animate-fade-in">
            Clarity. Control. No Compromises.
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-8 animate-fade-in">
            Perfect for courier firms, 3PLs, eCommerce teams, and warehouse managers who need one dashboard to manage it all.
          </p>
          <h3 className="text-2xl font-bold text-blue-600 mb-4">
            Ditch the Spreadsheets. Take Command.
          </h3>
          <p className="text-lg text-gray-700 max-w-3xl mx-auto mb-8 animate-fade-in">
            Stop bouncing between apps. OmniWTMS brings everything into one cloud-based control center.
          </p>
        </div>

        {/* Live Dashboard Visual */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-8 mb-16 border border-blue-200 relative overflow-hidden animate-fade-in">
          {/* Background visual effects */}
          <div className="absolute inset-0 bg-command-pattern opacity-20"></div>
          <div className="absolute inset-0 bg-data-flow opacity-30"></div>
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Operations at a Glance</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-white/40 shadow-lg hover-lift animate-fade-in">
                <div className="text-3xl font-bold text-green-600 mb-2">{liveStats.deliveries.toLocaleString()}</div>
                <div className="text-gray-600 text-sm mb-1">JOBS PROCESSED</div>
                <div className="text-green-600 text-sm font-medium">↑ 8% growth</div>
                <div className="w-2 h-2 rounded-full bg-green-400 animate-ping absolute top-4 right-4"></div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-white/40 shadow-lg hover-lift animate-fade-in" style={{ animationDelay: '150ms' }}>
                <div className="text-3xl font-bold text-blue-600 mb-2">{liveStats.efficiency.toFixed(1)}%</div>
                <div className="text-gray-600 text-sm mb-1">EFFICIENCY</div>
                <div className="text-blue-600 text-sm font-medium">Optimized</div>
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-ping absolute top-4 right-4" style={{ animationDelay: '1s' }}></div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-white/40 shadow-lg hover-lift animate-fade-in" style={{ animationDelay: '300ms' }}>
                <div className="text-3xl font-bold text-orange-600 mb-2">£{Math.floor(liveStats.saved)}K</div>
                <div className="text-gray-600 text-sm mb-1">SAVED</div>
                <div className="text-orange-600 text-sm font-medium">This month</div>
                <div className="w-2 h-2 rounded-full bg-orange-400 animate-ping absolute top-4 right-4" style={{ animationDelay: '2s' }}></div>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-6 text-sm">
              {['Real-time', 'AI-Powered', 'Automated', 'Connected'].map((badge, index) => (
                <span 
                  key={index} 
                  className="bg-white/60 backdrop-blur-sm px-3 py-1 rounded-full text-gray-700 border border-white/40 animate-fade-in hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-colors duration-300" 
                  style={{ animationDelay: `${500 + index * 100}ms` }}
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Key Advantages */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center animate-fade-in">
            What You Get:
          </h3>
          <p className="text-center text-gray-600 mb-12 animate-slide-up">
            Web-based. Mobile-enabled. No installs. No hidden features behind paywalls.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {advantages.map((advantage, index) => {
              const Icon = advantage.icon;
              return (
                <Card 
                  key={index} 
                  className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover-lift animate-fade-in" 
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-gray-100 rounded-lg relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-blue-50/30"></div>
                        <Icon className={`w-6 h-6 ${advantage.color} animate-pulse-subtle`} />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">
                          {advantage.title}
                        </h4>
                        <p className="text-gray-600">
                          {advantage.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Built Different Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white text-center relative overflow-hidden animate-glow">
          <div className="absolute inset-0 bg-command-pattern opacity-10"></div>
          <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-white/10 to-transparent"></div>
          <h3 className="text-2xl md:text-3xl font-bold mb-4">
            One Platform That Adapts to You
          </h3>
          <p className="text-lg mb-8 opacity-90 max-w-3xl mx-auto">
            Whether you process 200 or 2,000 jobs a day, the system scales with your volume.
            Unlimited users. Flexible pricing based on real usage — jobs, data, storage.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {differentiators.map((diff, index) => {
              const Icon = diff.icon;
              return (
                <div 
                  key={index} 
                  className="bg-white/10 backdrop-blur-sm rounded-lg p-6 hover-lift animate-fade-in hover:bg-white/20 transition-all duration-300" 
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <div className="relative">
                    <Icon className="w-8 h-8 text-yellow-300 mx-auto mb-4 animate-pulse-subtle" />
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-yellow-300 rounded-full filter blur-xl opacity-30 animate-pulse"></div>
                  </div>
                  <h4 className="font-semibold mb-2">{diff.title}</h4>
                  <p className="text-sm opacity-80">{diff.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}