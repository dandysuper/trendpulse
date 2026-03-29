import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendCluster } from '../types';

interface TrendChartProps {
  data: TrendCluster['historicalGrowth'];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: 'rgba(28, 28, 30, 0.9)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: '10px 14px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
      }}
    >
      <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '11px', marginBottom: '4px' }}>
        {label}
      </p>
      <p style={{ color: '#0A84FF', fontSize: '14px', fontWeight: 600 }}>
        {payload[0].value}
      </p>
    </div>
  );
};

export const TrendChart: React.FC<TrendChartProps> = ({ data }) => {
  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{
            top: 5,
            right: 0,
            left: 0,
            bottom: 0,
          }}
        >
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="rgba(10, 132, 255, 0.25)" stopOpacity={1} />
              <stop offset="95%" stopColor="rgba(10, 132, 255, 0)" stopOpacity={1} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'rgba(255, 255, 255, 0.4)', fontSize: 11 }}
          />
          <YAxis hide />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: 'rgba(255, 255, 255, 0.08)', strokeWidth: 1 }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#0A84FF"
            strokeWidth={2.5}
            fill="url(#colorValue)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
