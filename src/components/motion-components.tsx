"use client";

import { motion } from "framer-motion";

export const MotionDiv = motion.div;
export const MotionSection = motion.section;
export const MotionUl = motion.ul;
export const MotionLi = motion.li;

// Simple scroll-reveal wrapper
interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  duration?: number;
}

export function FadeIn({ children, delay = 0, y = 30, duration = 0.5 }: FadeInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      {children}
    </motion.div>
  );
}

// Fade in container for children staggered animations
export function StaggerContainer({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      variants={{
        hidden: {},
        show: {
          transition: {
            staggerChildren: 0.08,
            delayChildren: delay,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  y = 20,
  className,
}: {
  children: React.ReactNode;
  y?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y },
        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } },
      }}
    >
      {children}
    </motion.div>
  );
}
