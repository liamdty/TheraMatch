"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function LocationCell() {
  return (
    <Button 
      type="button"
      className={cn(
        "h-8 px-4 text-xs font-medium text-blue-600 border-blue-300/30 bg-transparent rounded-full",
        "hover:border-blue-400/60 hover:text-blue-700 hover:bg-blue-50/50 hover:shadow-blue-200/50 hover:shadow-md",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-400",
        "transition-all duration-200"
      )}
      size="sm"
      variant="outline"
      style={{
        textShadow: '0 0 8px rgba(59, 130, 246, 0.3)',
      }}
    >
      Toronto, Ontario
    </Button>
  );
}