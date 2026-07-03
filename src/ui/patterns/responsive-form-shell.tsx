"use client";

import { Plus } from "lucide-react";

import { Drawer } from "@/ui/patterns/drawer";
import { Button } from "@/ui/primitives/button";
import { Card } from "@/ui/primitives/card";
import { cn } from "@/ui/tokens/cn";

interface ResponsiveFormShellProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  triggerLabel: string;
  closeLabel: string;
  children: React.ReactNode;
  hideTrigger?: boolean;
}

export function ResponsiveFormShell({
  open,
  onOpenChange,
  title,
  triggerLabel,
  closeLabel,
  children,
  hideTrigger = false,
}: ResponsiveFormShellProps) {
  return (
    <>
      <div className="md:hidden">
        {!hideTrigger && !open && (
          <Button
            type="button"
            onClick={() => onOpenChange(true)}
            className={cn(
              "fixed bottom-6 right-4 z-30 h-14 gap-2 rounded-full px-5 shadow-lg",
              "pb-[max(0.75rem,env(safe-area-inset-bottom))]",
            )}
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            {triggerLabel}
          </Button>
        )}
        <Drawer
          open={open}
          onClose={() => onOpenChange(false)}
          title={title}
          side="bottom"
          closeLabel={closeLabel}
        >
          {children}
        </Drawer>
      </div>

      <div className="hidden md:block">
        <Card className="space-y-4 p-5">{children}</Card>
      </div>
    </>
  );
}
