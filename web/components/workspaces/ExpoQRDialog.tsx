"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useWorkspaceStore } from "@/hooks/use-workspace-store";
import { Smartphone, Download, QrCode, Copy, Check, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const ExpoQRDialog: React.FC = () => {
  const { showExpoQR, setShowExpoQR, expoQRData, currentWorkspace } = useWorkspaceStore();
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [qrOrigin, setQrOrigin] = useState(0); // For forcing refresh

  useEffect(() => {
    if (showExpoQR) {
      setIsLoading(true);
    }
  }, [showExpoQR, expoQRData]);

  if (!expoQRData) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(expoQRData);
    setCopied(true);
    toast.success("URL copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  // Use our local proxy to bypass COEP restrictions
  const qrCodeImageUrl = `/api/qr-proxy?url=${encodeURIComponent(expoQRData)}&t=${qrOrigin}`;

  return (
    <Dialog open={showExpoQR} onOpenChange={setShowExpoQR}>
      <DialogContent className="sm:max-w-md bg-background border-border shadow-2xl overflow-hidden p-0 dark">
        <div className="relative overflow-hidden pt-8 pb-6 px-8">
          {/* Subtle Background Glow */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/5 rounded-full blur-3xl opacity-50" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-primary/5 rounded-full blur-3xl opacity-50" />

          <DialogHeader className="relative items-center text-center space-y-4 mb-10">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center animate-in zoom-in-95 duration-500">
              <Smartphone className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-1.5">
              <DialogTitle className="text-2xl font-bold tracking-tight text-foreground">
                {currentWorkspace?.name || "Mobile Preview"}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground flex items-center justify-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Expo Go Preview Ready
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="flex flex-col items-center space-y-10 relative">
            {/* QR Code Section - Removed card container */}
            <div className="relative group">
              {/* Simple background glow */}
              <div className="absolute -inset-4 bg-primary/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition duration-700" />
              
              <div className="relative flex items-center justify-center min-h-[200px] min-w-[200px] transition-transform duration-500">
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  </div>
                )}
                {/* QR code itself has a small rounded background for contrast but no border/card container */}
                <div className="bg-white p-3 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                  <img
                    src={qrCodeImageUrl}
                    alt="Expo QR Code"
                    className={`w-[180px] h-[180px] rounded-lg transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                    onLoad={() => setIsLoading(false)}
                    onError={() => {
                      setIsLoading(false);
                      toast.error("Failed to load QR code. Please try manual copy.");
                    }}
                  />
                </div>
                
                {!isLoading && (
                    <button 
                        onClick={() => setQrOrigin(prev => prev + 1)}
                        className="absolute -bottom-4 -right-4 p-2 bg-muted hover:bg-muted/80 text-muted-foreground rounded-full transition-all border border-border shadow-sm active:scale-95"
                        title="Refresh QR Code"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                )}
              </div>
            </div>

            {/* Content-focused Sections (Removed card-like borders/backgrounds) */}
            <div className="w-full space-y-6">
                {/* URL Section */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Project URL</span>
                        <span className="text-[9px] text-primary/70 font-bold uppercase tracking-widest bg-primary/5 px-2 py-0.5 rounded-full">
                           {expoQRData.length > 30 ? "Direct URI" : "Safe Link"}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex-1 bg-muted/30 border border-border/50 rounded-xl px-4 py-2.5 flex items-center gap-3 overflow-hidden transition-colors focus-within:border-primary/30">
                            <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
                            <code className="text-xs text-foreground font-mono truncate select-all">
                                {expoQRData}
                            </code>
                        </div>
                        <Button 
                            size="icon" 
                            variant="secondary" 
                            className="h-11 w-11 shrink-0 rounded-xl shadow-sm hover:bg-muted transition-all"
                            onClick={handleCopy}
                            title="Copy to clipboard"
                        >
                            {copied ? (
                                <Check className="h-5 w-5 text-emerald-500 animate-in zoom-in" />
                            ) : (
                                <Copy className="h-5 w-5 text-muted-foreground" />
                            )}
                        </Button>
                    </div>
                </div>

                {/* Instruction Steps - Flat layout */}
                <div className="grid grid-cols-2 gap-6 pt-2">
                  <div className="space-y-2 group">
                      <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-2">
                          <Download className="h-4 w-4" />
                      </div>
                      <p className="text-xs font-bold text-foreground">1. Open Expo Go</p>
                      <p className="text-[10px] text-muted-foreground leading-snug">Available on App Store or Play Store for testing.</p>
                  </div>

                  <div className="space-y-2 group">
                      <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-2">
                          <QrCode className="h-4 w-4" />
                      </div>
                      <p className="text-xs font-bold text-foreground">2. Scan QR Code</p>
                      <p className="text-[10px] text-muted-foreground leading-snug">Use your camera or the Expo app scanner to link.</p>
                  </div>
                </div>
            </div>

            <Button 
              onClick={() => setShowExpoQR(false)}
              className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.99] mt-4"
            >
              Done
            </Button>
          </div>
        </div>

        {/* Flat Footer */}
        <div className="px-8 py-4 border-t border-border/50 flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">
           <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Status: Online</span>
           </div>
           <span>Protocol: {expoQRData.includes("://") ? expoQRData.split("://")[0] : "HTTPS"}</span>
        </div>
      </DialogContent>
    </Dialog>
  );
};
