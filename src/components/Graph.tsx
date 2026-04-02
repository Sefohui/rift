import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { useAppStore } from '../store/settingsStore';

function msToSeconds(ms: number): number {
  return Math.round(ms / 100) / 10;
}

export function Graph() {
  const settings = useAppStore((s) => s.settings);
  const splitTimes = useAppStore((s) => s.splitTimes);
  const currentTime = useAppStore((s) => s.currentTime);
  const currentSplitIndex = useAppStore((s) => s.currentSplitIndex);
  const timerState = useAppStore((s) => s.timerState);

  const splits = settings.splits;
  const pb = settings.pb;

  if (!settings.showGraph) return null;

  // Build chart data
  const data = splits.map((split, index) => {
    const pbElapsed =
      pb?.segments[index]?.elapsedTime ?? split.pbTime ?? null;
    const currentElapsed = splitTimes[index] ?? null;

    // For the currently active split, show live position
    const isActive =
      index === currentSplitIndex &&
      (timerState === 'running' || timerState === 'paused');
    const liveElapsed = isActive ? currentTime : currentElapsed;

    return {
      name: split.name.length > 8 ? split.name.slice(0, 7) + '…' : split.name,
      pb: pbElapsed !== null ? msToSeconds(pbElapsed) : undefined,
      current: liveElapsed !== null ? msToSeconds(liveElapsed) : undefined,
    };
  });

  const hasAnyData = data.some((d) => d.current !== undefined || d.pb !== undefined);
  if (!hasAnyData) return null;

  return (
    <div
      className="px-2 py-2"
      style={{
        borderTop: '1px solid var(--border-color)',
        background: 'var(--bg-secondary)',
      }}
    >
      <div
        className="text-xs mb-1 flex gap-4 justify-end"
        style={{ color: 'var(--text-secondary)' }}
      >
        <span className="flex items-center gap-1">
          <span
            className="inline-block w-4 h-0.5"
            style={{ background: 'var(--graph-current)' }}
          />
          Current
        </span>
        {pb && (
          <span className="flex items-center gap-1">
            <span
              className="inline-block w-4 h-0.5"
              style={{ background: 'var(--graph-pb)', opacity: 0.6 }}
            />
            PB
          </span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={120}>
        <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--graph-grid)"
          />
          <XAxis
            dataKey="name"
            tick={{ fill: 'var(--text-secondary)', fontSize: 9 }}
            tickLine={false}
            axisLine={{ stroke: 'var(--border-color)' }}
          />
          <YAxis
            tick={{ fill: 'var(--text-secondary)', fontSize: 9 }}
            tickLine={false}
            axisLine={{ stroke: 'var(--border-color)' }}
            tickFormatter={(v) => `${v}s`}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 4,
              fontSize: 11,
              color: 'var(--text-primary)',
            }}
            formatter={(value: number, name: string) => [
              `${value}s`,
              name === 'pb' ? 'PB' : 'Current',
            ]}
          />
          {pb && (
            <Line
              type="monotone"
              dataKey="pb"
              stroke="var(--graph-pb)"
              strokeWidth={1.5}
              strokeOpacity={0.6}
              dot={false}
              connectNulls
              isAnimationActive={false}
            />
          )}
          <Line
            type="monotone"
            dataKey="current"
            stroke="var(--graph-current)"
            strokeWidth={2}
            dot={{ r: 2, fill: 'var(--graph-current)' }}
            connectNulls
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
