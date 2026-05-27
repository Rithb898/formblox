"use client";

import { motion } from "motion/react";
import { ToggleLeft, Star, type LucideIcon, ListChecks, Type } from "lucide-react";

interface FloatingOrb {
  icon: LucideIcon;
  label: string;
  x: number[];
  y: number[];
  rotate: number[];
  duration: number;
  position: string;
}

const orbs: FloatingOrb[] = [
  {
    icon: Type,
    label: "Short text",
    x: [0, 14, 0],
    y: [0, -10, 0],
    rotate: [0, 3, 0],
    duration: 7,
    position: "-left-6 -top-4",
  },
  {
    icon: ToggleLeft,
    label: "Yes / No",
    x: [0, -12, 0],
    y: [0, -14, 0],
    rotate: [0, -2, 0],
    duration: 8,
    position: "-right-8 top-8",
  },
  {
    icon: Star,
    label: "Rating",
    x: [0, 8, 0],
    y: [0, 12, 0],
    rotate: [0, -3, 0],
    duration: 6.5,
    position: "left-0 -bottom-6",
  },
  {
    icon: ListChecks,
    label: "Multiple choice",
    x: [0, -10, 0],
    y: [0, 10, 0],
    rotate: [0, 2, 0],
    duration: 7.5,
    position: "-right-4 -bottom-8",
  },
];

export function FloatingFields() {
  return (
    <>
      {orbs.map((orb) => {
        const Icon = orb.icon;
        return (
          <motion.div
            key={orb.label}
            animate={{ x: orb.x, y: orb.y, rotate: orb.rotate }}
            transition={{
              duration: orb.duration,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className={`pointer-events-none absolute z-10 hidden select-none md:flex ${orb.position}`}
          >
            <div className="flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-[#111]/80 px-3 py-2 text-xs text-[#6B6B6B] backdrop-blur-sm">
              <Icon className="size-3.5 text-[#E8854A]" />
              <span className="font-mono text-[10px] uppercase tracking-wider">{orb.label}</span>
            </div>
          </motion.div>
        );
      })}
    </>
  );
}
