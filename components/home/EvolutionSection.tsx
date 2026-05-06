'use client';

import { AlertTriangle, Zap, Crown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function EvolutionSection() {
  const stages = [
    {
      title: 'Paper & Spreadsheets',
      description: 'Manual Chaos',
      icon: AlertTriangle,
      color: 'text-red-500',
      bgColor: 'bg-red-50',
      status: 'Past'
    },
    {
      title: 'Siloed Apps',
      description: 'Switching Tabs',
      icon: Zap,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
      status: 'Present'
    },
    {
      title: 'OmniWTMS Command Center',
      description: 'Real-Time Sync + Automation',
      icon: Crown,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
      status: 'Future'
    }
  ];

  return (
    <div className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            From Chaos to Command
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            The evolution of logistics management
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {stages.map((stage, index) => {
            const Icon = stage.icon;
            return (
              <Card key={index} className={`${stage.bgColor} border-0 shadow-lg hover:shadow-xl transition-shadow duration-300`}>
                <CardContent className="p-8 text-center">
                  <div className={`w-16 h-16 ${stage.bgColor} rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <Icon className={`w-8 h-8 ${stage.color}`} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {stage.title}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {stage.description}
                  </p>
                  <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    stage.status === 'Past' ? 'bg-red-100 text-red-700' :
                    stage.status === 'Present' ? 'bg-orange-100 text-orange-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {stage.status}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Call to Action */}
        <div className="text-center bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl p-8 text-white">
          <h3 className="text-2xl md:text-3xl font-bold mb-4">
            Still using spreadsheets in 2025?
          </h3>
          <p className="text-lg mb-6 opacity-90">
            Your competitors are automating while you're still copy-pasting. Time to level up.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
            {[
              { title: 'Legacy Chaos', desc: 'Systems that can\'t communicate' },
              { title: 'Time Waste', desc: 'Tab-switching productivity killer' },
              { title: 'Profit Leaks', desc: 'Hidden costs destroying margins' },
              { title: 'Manual Hell', desc: 'Human error costing thousands' }
            ].map((problem, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-yellow-300 text-sm font-medium mb-1">
                  ⚠️ {problem.title}
                </div>
                <div className="text-white/80 text-sm">
                  {problem.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}