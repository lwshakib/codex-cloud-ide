"use client";

import React from "react";
import { AlertCircle, X, Terminal, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface TerminalErrorCardProps {
  error: {
    message: string;
    exitCode?: number;
  };
  onFix: () => void;
  onDismiss: () => void;
}

const TerminalErrorCard: React.FC<TerminalErrorCardProps> = ({
  error,
  onFix,
  onDismiss,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="relative mb-6 group break-words"
    >
      <div className="bg-red-500/5 border border-red-500/20 rounded-2xl overflow-hidden shadow-sm backdrop-blur-sm">
        <div className="flex items-center justify-between p-3 bg-red-500/10 border-b border-red-500/10">
          <div className="flex items-center gap-2 text-red-500 italic">
            <AlertCircle className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Terminal Error Detected</span>
          </div>
          <button
            onClick={onDismiss}
            className="p-1 hover:bg-red-500/20 rounded-lg transition-colors text-red-500/60 hover:text-red-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="bg-background/40 rounded-xl p-3 font-mono text-[11px] text-muted-foreground border border-red-500/5 overflow-x-auto max-h-40 scrollbar-thin">
            <div className="flex items-center gap-2 mb-2 text-red-400/80">
              <Terminal className="w-3.5 h-3.5" />
              <span>Output Context:</span>
            </div>
            <pre className="whitespace-pre-wrap leading-relaxed">
              {error.message || "No output captured."}
            </pre>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={onFix}
              variant="destructive"
              size="sm"
              className="h-8.5 rounded-xl px-4 font-bold shadow-lg shadow-red-500/20 transition-all hover:scale-105 active:scale-95 group/btn"
            >
              Explain and Fix
              <ArrowRight className="w-3.5 h-3.5 ml-2 group-hover/btn:translate-x-1 transition-transform" />
            </Button>
            <div className="text-[10px] text-red-500/40 font-medium">
              AI will analyze terminal logs to resolve the issue
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TerminalErrorCard;
