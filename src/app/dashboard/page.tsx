import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  FileText,
  Star,
  TrendingUp,
  Plus,
  Clock,
  Sparkles,
} from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { count: totalPrompts } = await supabase
    .from("prompts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "active");

  const { count: totalFavorites } = await supabase
    .from("prompts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("favorite", true);

  const { data: recentPrompts } = await supabase
    .from("prompts")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("updated_at", { ascending: false })
    .limit(5);

  const { data: topUsed } = await supabase
    .from("usage_history")
    .select("*, prompts!inner(*)")
    .order("use_count", { ascending: false })
    .limit(5);

  const { count: totalFolders } = await supabase
    .from("folders")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const stats = [
    {
      title: "Total Prompts",
      value: totalPrompts ?? 0,
      icon: FileText,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-100 dark:bg-blue-950/50",
    },
    {
      title: "Favorites",
      value: totalFavorites ?? 0,
      icon: Star,
      color: "text-yellow-600 dark:text-yellow-400",
      bg: "bg-yellow-100 dark:bg-yellow-950/50",
    },
    {
      title: "Folders",
      value: totalFolders ?? 0,
      icon: TrendingUp,
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-100 dark:bg-green-950/50",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Welcome back{user?.user_metadata?.name ? `, ${user.user_metadata.name}` : ""}
          </p>
        </div>
        <Link href="/prompts/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Prompt
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className={`rounded-lg p-2 ${stat.bg}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recently Updated</CardTitle>
          </CardHeader>
          <CardContent>
            {recentPrompts && recentPrompts.length > 0 ? (
              <div className="space-y-3">
                {recentPrompts.map((prompt) => (
                  <Link
                    key={prompt.id}
                    href={`/prompts/${prompt.id}`}
                    className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                      <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{prompt.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {prompt.category} &middot; {new Date(prompt.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center py-8 text-center">
                <FileText className="mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No prompts yet</p>
                <Link href="/prompts/new">
                  <Button variant="link" className="mt-1">
                    Create your first prompt
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Most Used</CardTitle>
          </CardHeader>
          <CardContent>
            {topUsed && topUsed.length > 0 ? (
              <div className="space-y-3">
                {topUsed.map((item: any) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-lg border p-3"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100 dark:bg-green-950/50">
                      <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.prompts?.title || "Untitled"}</p>
                      <p className="text-xs text-muted-foreground">
                        Used {item.use_count} times
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center py-8 text-center">
                <Clock className="mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No usage data yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
