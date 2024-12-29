import React from 'react';

interface Props {
  size?: number;
  color?: string;
  className?: string;
}

export const UploadIcon = ({ size = 48, color = '#1976d2', className = '' }: Props) => {
  return React.createElement('svg', {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    strokeWidth: '2',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    className
  }, [
    // Upload arrow
    React.createElement('path', {
      key: 'arrow',
      d: 'M12 15V3m0 0L7 8m5-5l5 5'
    }),
    // Bottom line
    React.createElement('path', {
      key: 'line',
      d: 'M3 17v2a2 2 0 002 2h14a2 2 0 002-2v-2'
    })
  ]);
};
