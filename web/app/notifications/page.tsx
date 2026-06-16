"use client";

import { useEffect, useState } from "react";
import { BellDotIcon, InfoIcon, TriangleAlertIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api, type Notification } from "@/lib/api";
import { formatShortDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .getNotifications()
      .then((response) => {
        setNotifications(response);
        setError("");
      })
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <Card className="relative overflow-hidden border-blue-500 bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-500 text-primary-foreground shadow-[0_28px_55px_-28px_hsl(226_83%_57%/0.95)]">
        <div className="absolute -right-20 -top-20 size-56 rounded-full bg-white/15" />
        <CardHeader className="relative">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-white/20 text-primary-foreground">
              <BellDotIcon className="size-5" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-normal text-primary-foreground/80">
              Sinkron dari observer backend
            </span>
          </div>
          <CardTitle className="text-primary-foreground">Notifikasi sistem</CardTitle>
          <CardDescription className="text-primary-foreground/80">
            Pantau informasi dan peringatan penting dari aktivitas keuangan terbaru.
          </CardDescription>
        </CardHeader>
      </Card>

      {error ? (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader>
            <CardTitle>Gagal memuat notifikasi</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <div className="grid gap-4">
        {loading
          ? Array.from({ length: 5 }).map((_, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))
          : notifications.length === 0
            ? (
              <Card>
                <CardContent className="flex min-h-52 items-center justify-center text-sm text-muted-foreground">
                  Tidak ada notifikasi untuk tenant ini.
                </CardContent>
              </Card>
            )
            : notifications.map((notification) => {
                const isWarning = notification.type === "warning";
                return (
                  <Card
                    key={notification.id}
                    className={cn(
                      "relative overflow-hidden transition-transform duration-200 hover:-translate-y-0.5",
                      isWarning ? "border-destructive/25 bg-gradient-to-r from-red-50 to-white" : "bg-gradient-to-r from-blue-50/80 to-white"
                    )}
                  >
                    <div
                      className={cn(
                        "absolute inset-y-0 left-0 w-1.5",
                        isWarning ? "bg-destructive" : "bg-primary"
                      )}
                    />
                    <CardContent className="flex flex-col gap-3 py-5 pl-7 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            "rounded-2xl border p-2.5 shadow-sm",
                            isWarning
                              ? "border-destructive/30 bg-destructive/10 text-destructive"
                              : "border-blue-100 bg-white text-primary"
                          )}
                        >
                          {isWarning ? <TriangleAlertIcon className="size-4" /> : <InfoIcon className="size-4" />}
                        </div>
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium text-foreground">{notification.title}</p>
                            <Badge variant={isWarning ? "outline" : "secondary"}>
                              {isWarning ? "Peringatan" : "Info"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{notification.message}</p>
                        </div>
                      </div>
                      <p className="shrink-0 text-xs text-muted-foreground">
                        {formatShortDateTime(notification.created_at)}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
      </div>
    </div>
  );
}
