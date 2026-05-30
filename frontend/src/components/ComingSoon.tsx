import { motion, AnimatePresence } from 'framer-motion';
import { X, Rocket } from 'lucide-react';

interface ComingSoonProps {
  isOpen: boolean;
  pageName: string;
  onClose: () => void;
}

export function ComingSoon({ isOpen, pageName, onClose }: ComingSoonProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md z-[70] flex items-center justify-center p-6"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 30 }}
            transition={{ type: 'spring', stiffness: 280, damping: 24 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-panel relative rounded-2xl border border-[var(--panel-border)] shadow-2xl dark:shadow-[0_0_60px_rgba(0,229,255,0.1)] flex flex-col items-center text-center p-10 md:p-16 max-w-md w-full overflow-hidden"
          >
            {/* Background glow blob */}
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Icon */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(var(--accent-primary),0.2)]"
            >
              <Rocket className="w-10 h-10 text-primary" />
            </motion.div>

            {/* Text */}
            <h2 className="text-2xl md:text-3xl font-bold mb-2">
              {pageName}
            </h2>
            <p className="text-[var(--text-secondary)] text-sm md:text-base mb-6 leading-relaxed">
              This feature is currently under development.<br />
              We're working hard to bring it to you soon.
            </p>

            {/* Badge */}
            <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/30 tracking-widest uppercase">
              Coming Soon
            </span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
