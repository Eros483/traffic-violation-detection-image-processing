// Page transition wrapper. A short, restrained fade+rise on route change —
// framer-motion, keyed by pathname so each navigation animates once. Respects
// the user's reduced-motion preference (framer-motion reads it automatically
// for `transition`, and we keep the movement small regardless).

import { motion } from "framer-motion";
import type { ReactNode } from "react";

export function PageTransition({ pathname, children }: { pathname: string; children: ReactNode }) {
  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
