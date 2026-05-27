"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { type ReactNode } from "react";

type LandingButtonProps = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
  size?: "sm" | "md" | "lg";
  className?: string;
  fullWidth?: boolean;
  icon?: ReactNode;
};

export function LandingButton({
  href,
  children,
  variant = "primary",
  size = "md",
  className = "",
  fullWidth = false,
  icon,
}: LandingButtonProps) {
  const sizeClasses = {
    sm: "px-4 py-2 text-xs gap-1.5",
    md: "px-5 py-2.5 text-sm gap-2",
    lg: "px-8 py-3 text-sm gap-2",
  };

  if (variant === "primary") {
    return (
      <motion.div
        whileHover={{ scale: 1.025, y: -1 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
        className={`relative inline-flex items-center justify-center rounded-full p-px ${fullWidth ? "w-full" : ""} ${className}`}
      >
        {/* Outward glow */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#E8854A] via-[#ffaa75] to-[#E8854A] opacity-60 blur-[3px]" />
        <Link
          href={href}
          className={`relative flex items-center justify-center rounded-full bg-[#E8854A] font-semibold text-[#0a0a0a] transition-colors duration-300 hover:bg-[#E8854A]/95 overflow-hidden group/btn ${sizeClasses[size]} ${fullWidth ? "w-full" : ""}`}
        >
          {/* Shimmer sweep */}
          <div className="absolute -inset-y-0 -left-[100%] w-[50%] bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[30deg] transition-all duration-1000 ease-out group-hover/btn:left-[150%]" />
          <span className="relative z-10">{children}</span>
          <span className="relative z-10 transition-transform duration-300 group-hover/btn:translate-x-0.5">
            {icon ?? <ArrowRight className={size === "sm" ? "size-3" : "size-3.5"} />}
          </span>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.025, y: -1 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 15 }}
      className={`inline-flex ${fullWidth ? "w-full" : ""} ${className}`}
    >
      <Link
        href={href}
        className={`flex items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] font-semibold text-[#F2F2F2] transition-all duration-300 hover:border-white/[0.14] hover:bg-white/[0.06] group/btn ${sizeClasses[size]} ${fullWidth ? "w-full" : ""}`}
      >
        {children}
        <span className="transition-transform duration-300 group-hover/btn:translate-x-0.5">
          {icon ?? <ArrowRight className={size === "sm" ? "size-3" : "size-3.5"} />}
        </span>
      </Link>
    </motion.div>
  );
}
