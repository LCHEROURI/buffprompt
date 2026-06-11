"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePrompts, useFolders } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import {
  BarChart3,
  TrendingUp,
  Star,
  Hash,
  FileText,
} from "lucide-react";

export default function AnalyticsPage() {
  const { prompts, loading } = usePrompts();
  const { folders } = useFolders();
  const [topUsed, setTopUsed] = useState<any[]>([]);

  useEffect(() => {
    async function loadUsage() {
      const supabase = createClient();
      const { data } = await supabase
        .from("usage_history")
        .select("*, prompts!inner(title)")
        .order("use_count", { ascending: false })
        .limit(10);
      setTopUsed(data || []);
    }
    loadUsage();
  }, []);

  // Count by category
  const categoryCount: Record<string, number> = {};
  prompts.forEach((p) => {
    categoryCount[p.category] = (categoryCount[p.category] || 0) + 1;
  });

  // Count by platform
  const platformCount: Record<string, number> = {};
  prompts.forEach((p) => {
    if (p.ai_platform) {
      platformCount[p.ai_platform] = (platformCount[p.ai_platform] || 0) + 1;
    }
  });

  const avgRating =
    prompts.length > 0
      ? (prompts.reduce((sum, p) => sum + (p.rating || 0), 0) / prompts.length).toFixed(1)
      : "0";

  const stats = [
    {
      title: "Total Prompts",
      value: prompts.length,
      icon: FileText,
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      title: "Avg Rating",
      value: avgRating,
      suffix: "/5",
      icon: Star,
      color: "text-yellow-600",
      bg: "bg-yellow-100",
    },
    {
      title: "Categories Used",
      value: Object.keys(categoryCount).length,
      icon: Hash,
      color: "text-purple-600",
      bg: "bg-purple-100",
    },
    {
      title: "Platforms",
      value: Object.keys(platformCount).length,
      icon: TrendingUp,
      color: "text-green-600",
      bg: "bg-green-100",
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <BarChart3 className="h-6 w-6" />
          Analytics
        </h1>
        <p className="text-sm text-muted-foreground">
          Insights into your prompt collection
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className={`rounded-lg p-2 ${stat.bg} dark:opacity-80`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {stat.value}
                  {stat.suffix && (
                    <span className="text-lg font-normal text-muted-foreground">
                      {stat.suffix}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">By Category</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.entries(categoryCount).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(categoryCount)
                  .sort(([, a], [, b]) => b - a)
                  .map(([category, count]) => {
                    const maxCount = Math.max(...Object.values(categoryCount));
                    const pct = Math.round((count / maxCount) * 100);
                    return (
                      <div key={category} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{category}</span>
                          <span className="text-muted-foreground">{count}</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No data yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">By AI Platform</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.entries(platformCount).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(platformCount)
                  .sort(([, a], [, b]) => b - a)
                  .map(([platform, count]) => {
                    const maxCount = Math.max(...Object.values(platformCount));
                    const pct = Math.round((count / maxCount) * 100);
                    return (
                      <div key={platform} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{platform}</span>
                          <span className="text-muted-foreground">{count}</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No data yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {topUsed.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Most Used Prompts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topUsed.map((item: any, i: number) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {item.prompts?.title || "Untitled"}
                    </p>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {item.use_count} uses
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
