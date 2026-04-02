"use client";

import { useNotificationStore } from "@/stores/notifications";
import { X, CheckCircle2, AlertTriangle, XCircle, Info } from "lucide-react";

const iconMap = {
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
  info: Info,
} as const;

const colorMap = {
  success: "text-success",
  warning: "text-warning",
  error: "text-danger",
  info: "text-primary",
} as const;

const borderMap = {
  success: "border-success/40",
  warning: "border-warning/40",
  error: "border-danger/40",
  info: "border-primary/40",
} as const;

export function ToastContainer() {
  const { notifications, removeNotification } = useNotificationStore();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {notifications.map((notif) => {
        const Icon = iconMap[notif.type];
        return (
          <div
            key={notif.id}
            className={`border ${borderMap[notif.type]} bg-surface flex items-start gap-3 px-4 py-3 animate-in slide-in-from-right-5 rounded-lg shadow-neu ${colorMap[notif.type]}`}
          >
            <Icon className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{notif.title}</p>
              {notif.message && (
                <p className="mt-0.5 text-xs text-muted-foreground">{notif.message}</p>
              )}
            </div>
            <button
              onClick={() => removeNotification(notif.id)}
              className="shrink-0 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
