"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function LocationCell() {
  return (
    <Button 
      type="button"
      className={cn(
        "h-7 px-2.5 text-xs font-medium text-blue-600 border-blue-300/20 bg-transparent",
        " hover:border-blue-400/60 hover:text-blue-700",
        "transition-all duration-200"
      )}
      size="sm"
      variant="outline" 
    >
      Toronto, Ontario
    </Button>
  );
}