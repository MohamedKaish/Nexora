"use client";

import { memo } from "react";
import { motion } from "framer-motion";

type TrustMeterProps = {
  manipulationProbability: number;
};

function TrustMeterComponent({ manipulationProbability }: TrustMeterProps) {
  const size = 260;
  const strokeWidth = 18;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (manipulationProbability / 100) * circumference;

  let color = "#10b981"; // Emerald/Green
  let glow = "rgba(16, 185, 129, 0.35)";
  let label = "No anomalies";
  
  if (manipulationProbability > 70) {
    color = "#f43f5e"; // Rose/Red
    glow = "rgba(244, 63, 94, 0.35)";
    label = "Synthetic manipulation";
  } else if (manipulationProbability > 40) {
    color = "#f59e0b"; // Amber/Yellow
    glow = "rgba(245, 158, 11, 0.35)";
    label = "Inconclusive";
  } else if (manipulationProbability > 20) {
    color = "#3b82f6"; // Blue
    glow = "rgba(59, 130, 246, 0.35)";
    label = "Standard editing";
  }

  return (
    <div className="relative flex flex-col items-center justify-center p-8">
      <div className="relative">
        <svg
          width={size}
          height={size}
          className="rotate-[-90deg] drop-shadow-lg"
          style={{ filter: `drop-shadow(0 0 20px ${glow})` }}
          aria-hidden="true"
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255, 255, 255, 0.05)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 2, ease: [0.22, 1, 0.36, 1] }}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <motion.span
            className="text-5xl font-extrabold tracking-tighter text-foreground"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {manipulationProbability.toFixed(1)}<span className="text-2xl text-muted-foreground">%</span>
          </motion.span>
          <span className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Manipulation
          </span>
          <span className="mt-1 text-sm font-medium" style={{ color }}>
            {label}
          </span>
        </div>
      </div>
    </div>
  );
}

export const TrustMeter = memo(TrustMeterComponent);
