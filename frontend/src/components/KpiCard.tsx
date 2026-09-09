import React from 'react';
import { motion, Variants } from 'framer-motion';
import { TreePine, Zap, Cloud, Lightbulb } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  onClick?: () => void;
  sub?: string;
  pulse?: boolean;
  hoverEffect?: 'trees' | 'power' | 'co2' | 'energy';
}

const hoverIcons = {
  trees: TreePine,
  power: Zap,
  co2: Cloud,
  energy: Lightbulb
};

export function KpiCard({ title, value, trend, trendUp, onClick, sub, pulse, hoverEffect }: KpiCardProps) {
  const Card = (pulse || hoverEffect) ? motion.div : 'div';
  
  const animateProps = pulse ? {
    animate: { 
      boxShadow: ["0px 0px 0px rgba(0,229,255,0)", "0px 0px 25px rgba(0,229,255,0.4)", "0px 0px 0px rgba(0,229,255,0)"],
      borderColor: ["rgba(0,229,255,0.1)", "rgba(0,229,255,0.5)", "rgba(0,229,255,0.1)"]
    },
    transition: { duration: 2.5, repeat: Infinity, ease: "easeInOut" }
  } : {};

  const motionProps = hoverEffect ? {
    initial: "initial",
    whileHover: "hover",
    ...animateProps
  } : animateProps;

  const IconComponent = hoverEffect ? hoverIcons[hoverEffect] : null;

  const floatingVariants: Variants = {
    initial: { y: 20, opacity: 0, scale: 0.8 },
    hover: (i: number) => ({
      y: -100,
      opacity: [0, 0.9, 0],
      scale: [0.8, 1.2, 0.8],
      transition: {
        duration: 2 + (i % 3) * 0.5,
        repeat: Infinity,
        delay: i * 0.2,
        ease: "linear"
      }
    })
  };

  return (
    // @ts-expect-error - motion.div accepts all div props but TS throws
    <Card 
      onClick={onClick}
      {...motionProps}
      className={`glass-panel rounded-xl p-6 border flex flex-col relative overflow-hidden ${onClick ? 'cursor-pointer hover:scale-[1.02] transition-transform glowing-border' : 'glowing-border'}`}
    >
      <div className="absolute top-0 right-0 w-24 h-10 bg-primary/10 rounded-bl-[100px] blur-xl pointer-events-none" />
      
      {IconComponent && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden flex justify-around items-end">
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              custom={i}
              variants={floatingVariants}
              className="text-primary drop-shadow-[0_0_8px_rgba(0,229,255,0.8)]"
              style={{ paddingBottom: `${(i % 2) * 20}px` }}
            >
              <IconComponent className="w-10 h-10" />
            </motion.div>
          ))}
        </div>
      )}

      <div className="relative z-10">
        <div className="text-[var(--text-secondary)] text-sm font-medium mb-2">{title}</div>
        <div className="text-3xl font-bold data-font mb-4 text-glow">{value}</div>
        {trend && (
          <div className={`text-sm font-bold ${trendUp ? 'text-[#10b981]' : 'text-error'}`}>
            {trend} vs last week
          </div>
        )}
        {sub && !trend && (
          <div className="text-sm text-[var(--text-secondary)]">{sub}</div>
        )}
      </div>
    </Card>
  );
}
