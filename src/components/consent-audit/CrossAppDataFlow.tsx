'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { LedgerEntry } from './data';
import { ALL_CATEGORIES, SENSITIVITY_COLORS } from './data';

interface CrossAppDataFlowProps {
  ledger: LedgerEntry[];
  currentSelection: Set<string>;
}

interface TooltipData {
  label: string;
  categories: string[];
  description: string;
  x: number;
  y: number;
}

const APPS = [
  { name: 'ChatGPT', color: '#3F6B57', angle: 210 },
  { name: 'Perplexity', color: '#B4802A', angle: 330 },
  { name: 'Claude', color: '#4B5468', angle: 90 },
] as const;

const CENTER = { name: 'AI Training / Model Refinement', color: '#A13D34' };

export function CrossAppDataFlow({ ledger, currentSelection }: CrossAppDataFlowProps) {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [hoveredConnection, setHoveredConnection] = useState<string | null>(null);

  const activeLedger = ledger.filter((e) => !e.revoked);

  // Build connection data
  const connections: {
    id: string;
    from: string;
    to: string;
    categories: string[];
  }[] = [];

  for (const app of APPS) {
    let categories: string[] = [];
    if (app.name === 'Claude') {
      categories = Array.from(currentSelection);
    } else {
      const entry = activeLedger.find((e) => e.requester === app.name);
      if (entry) categories = entry.categories;
    }
    if (categories.length > 0) {
      connections.push({
        id: `conn-${app.name}-center`,
        from: app.name,
        to: CENTER.name,
        categories,
      });
    }
  }

  // Build cross-app connections
  const appsWithData = APPS.filter((app) => {
    if (app.name === 'Claude') return currentSelection.size > 0;
    return activeLedger.some((e) => e.requester === app.name);
  });

  const crossConnections: {
    id: string;
    from: string;
    to: string;
    sharedCategories: string[];
  }[] = [];

  for (let i = 0; i < appsWithData.length; i++) {
    for (let j = i + 1; j < appsWithData.length; j++) {
      const a = appsWithData[i].name;
      const b = appsWithData[j].name;
      let aCats: string[] = [];
      let bCats: string[] = [];

      if (a === 'Claude') aCats = Array.from(currentSelection);
      else {
        const entry = activeLedger.find((e) => e.requester === a);
        if (entry) aCats = entry.categories;
      }

      if (b === 'Claude') bCats = Array.from(currentSelection);
      else {
        const entry = activeLedger.find((e) => e.requester === b);
        if (entry) bCats = entry.categories;
      }

      const shared = aCats.filter((c) => bCats.includes(c));
      if (shared.length > 0) {
        crossConnections.push({ id: `cross-${a}-${b}`, from: a, to: b, sharedCategories: shared });
      }
    }
  }

  // Get categories for an app
  function getAppCategories(appName: string): string[] {
    if (appName === 'Claude') return Array.from(currentSelection);
    const entry = activeLedger.find((e) => e.requester === appName);
    return entry ? entry.categories : [];
  }

  const size = 280;
  const center = size / 2;
  const nodeRadius = 36;
  const outerRadius = 100;

  function getNodePosition(angle: number) {
    const rad = (angle * Math.PI) / 180;
    return {
      x: center + outerRadius * Math.cos(rad),
      y: center + outerRadius * Math.sin(rad),
    };
  }

  function getDescription(categories: string[]): string {
    if (categories.length === 0) return 'No data shared';
    const catLabels = categories.map((c) => {
      const ev = ALL_CATEGORIES.includes(c) ? c : c;
      return ev;
    });
    if (categories.length <= 3) return `Shares: ${catLabels.join(', ')}`;
    return `Shares ${categories.length} categories: ${catLabels.slice(0, 3).join(', ')}…`;
  }

  return (
    <div className="relative">
      <svg
        width="100%"
        viewBox={`0 0 ${size} ${size}`}
        className="mx-auto"
        role="img"
        aria-label="Cross-app data flow visualization"
      >
        {/* Connections to center */}
        {connections.map((conn) => {
          const app = APPS.find((a) => a.name === conn.from)!;
          const pos = getNodePosition(app.angle);
          const isHovered = hoveredConnection === conn.id;
          const opacity = conn.categories.length > 0 ? (isHovered ? 0.9 : 0.4) : 0.08;

          return (
            <g key={conn.id}>
              <line
                x1={pos.x}
                y1={pos.y}
                x2={center}
                y2={center}
                stroke={app.color}
                strokeWidth={isHovered ? 2.5 : 1.5}
                strokeDasharray={isHovered ? 'none' : '4 4'}
                opacity={opacity}
                onMouseEnter={() => {
                  setHoveredConnection(conn.id);
                  setTooltip({
                    label: `${conn.from} → ${conn.to}`,
                    categories: conn.categories,
                    description: getDescription(conn.categories),
                    x: (pos.x + center) / 2,
                    y: (pos.y + center) / 2 - 12,
                  });
                }}
                onMouseLeave={() => {
                  setHoveredConnection(null);
                  setTooltip(null);
                }}
                className="cursor-pointer"
              />
            </g>
          );
        })}

        {/* Cross-app connections */}
        {crossConnections.map((conn) => {
          const appA = APPS.find((a) => a.name === conn.from)!;
          const appB = APPS.find((a) => a.name === conn.to)!;
          const posA = getNodePosition(appA.angle);
          const posB = getNodePosition(appB.angle);
          const isHovered = hoveredConnection === conn.id;
          const opacity = isHovered ? 0.7 : 0.2;

          return (
            <line
              key={conn.id}
              x1={posA.x}
              y1={posA.y}
              x2={posB.x}
              y2={posB.y}
              stroke="#ECE7DC"
              strokeWidth={isHovered ? 1.5 : 0.8}
              strokeDasharray="3 5"
              opacity={opacity}
              onMouseEnter={() => {
                setHoveredConnection(conn.id);
                setTooltip({
                  label: `${conn.from} ↔ ${conn.to}`,
                  categories: conn.sharedCategories,
                  description: `Shared overlap: ${conn.sharedCategories.join(', ')}`,
                  x: (posA.x + posB.x) / 2,
                  y: (posA.y + posB.y) / 2 - 12,
                });
              }}
              onMouseLeave={() => {
                setHoveredConnection(null);
                setTooltip(null);
              }}
              className="cursor-pointer"
            />
          );
        })}

        {/* App nodes */}
        {APPS.map((app) => {
          const pos = getNodePosition(app.angle);
          const cats = getAppCategories(app.name);
          const hasData = cats.length > 0;
          return (
            <g key={app.name}>
              <circle
                cx={pos.x}
                cy={pos.y}
                r={nodeRadius}
                fill={hasData ? app.color : 'rgba(236, 231, 220, 0.06)'}
                opacity={hasData ? 1 : 0.6}
                stroke={hasData ? app.color : 'rgba(236, 231, 220, 0.15)'}
                strokeWidth={1}
              />
              <text
                x={pos.x}
                y={pos.y + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={hasData ? '#fff' : 'rgba(236, 231, 220, 0.7)'}
                fontSize="10"
                fontWeight="600"
                fontFamily="var(--font-geist-sans), sans-serif"
              >
                {app.name}
              </text>
              {hasData && (
                <text
                  x={pos.x}
                  y={pos.y + 14}
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.85)"
                  fontSize="8"
                  fontFamily="var(--font-geist-mono), monospace"
                >
                  {cats.length} categories
                </text>
              )}
            </g>
          );
        })}

        {/* Center node */}
        <circle
          cx={center}
          cy={center}
          r={28}
          fill={CENTER.color}
          opacity={connections.length > 0 ? 0.8 : 0.3}
        />
        <text
          x={center}
          y={center - 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#fff"
          fontSize="7.5"
          fontWeight="600"
          fontFamily="var(--font-geist-sans), sans-serif"
        >
          AI Training
        </text>
        <text
          x={center}
          y={center + 10}
          textAnchor="middle"
          fill="rgba(255,255,255,0.85)"
          fontSize="7"
          fontFamily="var(--font-geist-sans), sans-serif"
        >
          / Model
        </text>

        {/* Tooltip */}
        {tooltip && (
          <g>
            <rect
              x={tooltip.x - 60}
              y={tooltip.y - 24}
              width={120}
              height={48}
              rx={4}
              fill="#1C2333"
              stroke="rgba(236, 231, 220, 0.55)"
              strokeWidth={0.5}
              opacity={0.95}
            />
            <text
              x={tooltip.x}
              y={tooltip.y - 8}
              textAnchor="middle"
              fill="#ECE7DC"
              fontSize="7.5"
              fontWeight="600"
              fontFamily="var(--font-geist-mono), monospace"
            >
              {tooltip.label}
            </text>
            <text
              x={tooltip.x}
              y={tooltip.y + 6}
              textAnchor="middle"
              fill="rgba(236, 231, 220, 0.8)"
              fontSize="6.5"
              fontFamily="var(--font-geist-sans), sans-serif"
            >
              {tooltip.description.length > 30
                ? tooltip.description.slice(0, 30) + '…'
                : tooltip.description}
            </text>
          </g>
        )}
      </svg>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-2 flex-wrap">
        {APPS.map((app) => (
          <div key={app.name} className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: app.color }}
            />
            <span className="text-[10px]" style={{ color: 'rgba(236, 231, 220, 0.75)', fontFamily: 'var(--font-geist-mono), monospace' }}>
              {app.name}
            </span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CENTER.color }} />
          <span className="text-[10px]" style={{ color: 'rgba(236, 231, 220, 0.75)', fontFamily: 'var(--font-geist-mono), monospace' }}>
            Training Feed
          </span>
        </div>
      </div>

      {/* Category breakdown */}
      <div className="mt-4 space-y-2">
        {APPS.map((app) => {
          const cats = getAppCategories(app.name);
          if (cats.length === 0) return null;
          return (
            <motion.div
              key={app.name}
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-start gap-2"
            >
              <span className="text-[10px] font-semibold mt-0.5 shrink-0" style={{ color: app.color, fontFamily: 'var(--font-geist-mono), monospace' }}>
                {app.name}:
              </span>
              <div className="flex flex-wrap gap-1">
                {cats.map((cat) => (
                  <span
                    key={cat}
                    className="px-1.5 py-0.5 rounded text-[10px] capitalize"
                    style={{
                      backgroundColor: 'rgba(236, 231, 220, 0.08)',
                      color: 'rgba(236, 231, 220, 0.85)',
                    }}
                  >
                    {cat}
                  </span>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
