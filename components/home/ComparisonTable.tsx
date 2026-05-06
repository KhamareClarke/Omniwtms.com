import React from 'react';

const data = [
  // Warehouse Management Features
  { feature: '3D warehouse visualization', omni: '✓', clarus: '✗', mandata: '✗' },
  { feature: 'Bin & location-based inventory tracking', omni: '✓', clarus: 'Partial', mandata: '✗' },
  { feature: 'Barcode + RFID support', omni: '✓', clarus: 'Partial', mandata: '✗' },
  { feature: 'Pallet mixer for efficient space use', omni: '✓', clarus: '✗', mandata: '✗' },
  { feature: 'Real-time stock levels and alerts', omni: '✓', clarus: 'Partial', mandata: '✗' },

  // Order & Fulfillment Features
  { feature: 'Bulk order upload + tracking', omni: '✓', clarus: '✓', mandata: 'Partial' },
  { feature: 'Automated dispatch', omni: '✓', clarus: 'Partial', mandata: '✗' },
  { feature: 'Label generation', omni: '✓', clarus: '✓', mandata: '✗' },
  { feature: 'POD and return workflows', omni: '✓', clarus: '✗', mandata: 'Partial' },

  // Transportation & Logistics Features
  { feature: 'Live GPS tracking for all vehicles', omni: '✓', clarus: 'Partial', mandata: '✓' },
  { feature: 'Smart route optimization', omni: '✓', clarus: 'Partial', mandata: 'Partial' },
  { feature: 'Job and driver assignment in seconds', omni: '✓', clarus: '✗', mandata: 'Partial' },
  { feature: 'Digital proof of delivery', omni: '✓', clarus: '✗', mandata: '✓' },
  { feature: 'Real-time status updates', omni: '✓', clarus: 'Partial', mandata: 'Partial' },

  // Customer Management Features
  { feature: 'Branded self-service portal', omni: '✓', clarus: '✗', mandata: '✗' },
  { feature: 'Real-time tracking for end customers', omni: '✓', clarus: 'Partial', mandata: '✗' },
  { feature: 'Customer activity logs and satisfaction insights', omni: '✓', clarus: '✗', mandata: '✗' },

  // Reporting & Analytics Features
  { feature: 'Live KPIs dashboard', omni: '✓', clarus: 'Partial', mandata: 'Partial' },
  { feature: 'Operational analytics', omni: '✓', clarus: 'Partial', mandata: 'Partial' },
  { feature: 'E-commerce performance reports', omni: '✓', clarus: '✗', mandata: '✗' },
  { feature: 'Driver and depot performance benchmarking', omni: '✓', clarus: '✗', mandata: '✗' },

  // AI Automation
  { feature: 'Auto-scheduling based on delivery windows', omni: '✓', clarus: '✗', mandata: '✗' },
  { feature: 'Demand forecasting', omni: '✓', clarus: '✗', mandata: '✗' },
  { feature: 'Delay detection & rerouting', omni: '✓', clarus: '✗', mandata: '✗' },
  { feature: 'Admin task automation', omni: '✓', clarus: '✗', mandata: '✗' },

  // Value/Trust Features
  { feature: 'UK-Based Support', omni: '✓', clarus: '✓', mandata: 'Partial' },
  { feature: 'Transparent Pricing', omni: '✓', clarus: '✗', mandata: '✗' },
  { feature: 'Integrated Transport & Warehouse', omni: '✓', clarus: 'Partial', mandata: '✗' },
  { feature: 'Mobile Driver App', omni: '✓', clarus: '✗', mandata: 'Partial' },
  { feature: 'AI-Powered Forecasting', omni: '✓', clarus: '✗', mandata: '✗' },
  { feature: 'Real-Time Inventory & Orders', omni: '✓', clarus: '✗', mandata: '✗' },
];

export default function ComparisonTable() {
  return (
    <div className="mt-16 mb-12 max-w-4xl mx-auto">
      <h3 className="text-3xl font-bold text-center mb-6 bg-gradient-to-r from-blue-700 via-purple-600 to-indigo-700 text-transparent bg-clip-text animate-gradient-slow">
        OmniWTMS vs Clarus vs Mandata
      </h3>
      <div className="overflow-x-auto rounded-lg shadow-lg bg-white border border-blue-100">
        <table className="min-w-full text-left text-base">
          <thead>
            <tr className="bg-blue-50">
              <th className="py-4 px-4 font-bold text-blue-800">Feature</th>
              <th className="py-4 px-4 font-bold text-blue-800">OmniWTMS</th>
              <th className="py-4 px-4 font-bold text-blue-800">Clarus</th>
              <th className="py-4 px-4 font-bold text-blue-800">Mandata</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={row.feature} className={i % 2 === 0 ? 'bg-white' : 'bg-blue-50'}>
                <td className="py-3 px-4 font-semibold text-gray-900">{row.feature}</td>
                <td className="py-3 px-4 text-center text-green-600 font-bold">{row.omni}</td>
                <td className="py-3 px-4 text-center text-blue-700 font-bold">{row.clarus}</td>
                <td className="py-3 px-4 text-center text-purple-700 font-bold">{row.mandata}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
