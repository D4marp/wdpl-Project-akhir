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
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 text-muted-foreground">
            <BellDotIcon className="size-4" />
            <span className="text-sm font-medium">Sinkron dari observer backend</span>
          </div>
          <CardTitle>Notifikasi sistem</CardTitle>
          <CardDescription>
            Halaman ini tidak memunculkan Sonner. Popup dibatasi hanya pada submit transaksi.
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
                  <Card key={notification.id} className="border-border/70">
                    <CardContent className="flex flex-col gap-3 pt-6 md:flex-row md:items-start md:justify-between">
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            "rounded-full border p-2",
                            isWarning
                              ? "border-destructive/30 bg-destructive/10 text-destructive"
                              : "border-border bg-muted text-muted-foreground"
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
