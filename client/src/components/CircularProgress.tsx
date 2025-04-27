import React from 'react';

interface CircularProgressProps {
  value: number; // 0-100
  max: number;
  size?: number;
  thickness?: number;
  color?: string;
  label?: string;
  showValue?: boolean;
  className?: string;
}

export function CircularProgress({
  value,
  max,
  size = 120,
  thickness = 10,
  color = '#FF2D55', // Default Apple Fitness red
  label,
  showValue = true,
  className = ''
}: CircularProgressProps) {
  // Calculate percentage
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  // Calculate the radius (size minus twice the thickness for padding)
  const radius = (size - thickness * 2) / 2;
  
  // Calculate the circumference of the circle
  const circumference = radius * 2 * Math.PI;
  
  // Calculate the dash offset based on percentage
  const dashOffset = circumference - (percentage / 100) * circumference;
  
  return (
    <div className={`circular-progress ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background circle */}
        <circle 
          className="circular-progress-background"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={thickness}
        />
        
        {/* Progress circle */}
        <circle 
          className="circular-progress-value"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={thickness}
          style={{
            stroke: color,
            strokeDasharray: circumference,
            strokeDashoffset: dashOffset
          }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      
      {/* Center text */}
      {showValue && (
        <div className="circular-progress-text">
          {value}
          {label && <div className="text-xs text-gray-500 font-normal">{label}</div>}
        </div>
      )}
    </div>
  );
}