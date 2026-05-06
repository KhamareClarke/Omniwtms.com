import React from 'react';

interface AnimatedGradientBackgroundProps {
  children: React.ReactNode;
  className?: string;
  intensity?: 'light' | 'medium' | 'strong';
  animated?: boolean;
}

export function AnimatedGradientBackground({
  children,
  className = "",
  intensity = "medium",
  animated = true,
}: AnimatedGradientBackgroundProps) {
  const intensityMap = {
    light: 'opacity-[0.03]',
    medium: 'opacity-[0.07]',
    strong: 'opacity-[0.12]'
  };
  
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Main content */}
      <div className="relative z-10">{children}</div>
      
      {/* Background decorative elements */}
      <div 
        className={`absolute top-0 right-0 w-1/2 h-96 bg-gradient-to-bl from-[#3456FF]/20 to-[#8763FF]/20 rounded-bl-full -z-10 ${intensityMap[intensity]} ${animated ? 'animate-blob-slow' : ''}`}
      />
      <div 
        className={`absolute bottom-0 left-0 w-2/3 h-64 bg-gradient-to-tr from-[#3456FF]/10 to-[#8763FF]/10 rounded-tr-full -z-10 ${intensityMap[intensity]} ${animated ? 'animate-blob' : ''}`}
      />
      <div 
        className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#3456FF05_1px,transparent_1px)] [background-size:20px_20px] -z-10"
      />
      
      {/* Floating particles */}
      {animated && (
        <>
          <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-[#3456FF]/5 rounded-full blur-3xl animate-blob-slow" />
          <div className="absolute bottom-1/4 left-1/3 w-32 h-32 bg-[#8763FF]/5 rounded-full blur-3xl animate-blob" />
        </>
      )}
    </div>
  );
} 