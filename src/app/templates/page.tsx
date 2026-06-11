"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { STARTER_TEMPLATES } from "@/lib/types";
import { FileCode, Plus, Search, Sparkles, Loader2, BookmarkPlus } from "lucide-react";
import { toast } from "sonner";

export default function TemplatesPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [addingId, setAddingId] = useState<string | null>(null);
  const [userTemplates, setUserTemplates] = useState<any[]>([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [activeTab, setActiveTab] = useState("starter");

  useEffect(() => {
    async function loadUserTemplates() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoadingUser(false);
        return;
      }
      const { data } = await supabase
        .from("prompts")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_template", true)
        .order("updated_at", { ascending: false });
      setUserTemplates(data || []);
      setLoadingUser(false);
    }
    loadUserTemplates();
  }, []);

  const filteredStarters = STARTER_TEMPLATES.filter(
    (t) =>
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredUserTemplates = userTemplates.filter(
    (t) =>
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.description || "").toLowerCase().includes(search.toLowerCase()) ||
      (t.tags || []).some((tag: string) => tag.toLowerCase().includes(search.toLowerCase()))
  );

  async function useStarterTemplate(template: (typeof STARTER_TEMPLATES)[0]) {
    setAddingId(template.title);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const { error } = await supabase.from("prompts").insert({
      user_id: user.id,
      title: template.title,
      prompt_text: template.prompt_text,
      category: template.category,
      description: template.description,
      tags: template.tags,
      ai_platform: template.ai_platform,
    });

    setAddingId(null);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Template added to your vault!");
      router.push("/prompts");
    }
  }

  async function useUserTemplate(template: any) {
    setAddingId(template.id);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const { error } = await supabase.from("prompts").insert({
      user_id: user.id,
      title: `${template.title} (from template)`,
      prompt_text: template.prompt_text,
      category: template.category,
      description: template.description,
      tags: template.tags,
      ai_platform: template.ai_platform,
    });

    setAddingId(null);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Template added to your vault!");
      router.push("/prompts");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <FileCode className="h-6 w-6 text-indigo-500" />
            Prompt Templates
          </h1>
          <p className="text-sm text-muted-foreground">
            Starter templates and your saved templates
          </p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search templates..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="starter" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Starter Templates ({STARTER_TEMPLATES.length})
          </TabsTrigger>
          <TabsTrigger value="yours" className="gap-2">
            <BookmarkPlus className="h-4 w-4" />
            Your Templates ({userTemplates.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="starter" className="mt-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredStarters.map((template) => (
              <Card key={template.title} className="flex flex-col transition-all hover:shadow-md">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-950/50">
                      <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                  </div>
                  <CardTitle className="mt-2 text-base">{template.title}</CardTitle>
                  <CardDescription className="text-xs">
                    {template.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="secondary" className="text-xs">
                      {template.category}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {template.ai_platform}
                    </Badge>
                    {template.tags.slice(0, 2).map((tag: string) => (
                      <Badge key={tag} variant="secondary" className="text-xs font-normal">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full gap-2"
                    size="sm"
                    onClick={() => useStarterTemplate(template)}
                    disabled={addingId === template.title}
                  >
                    {addingId === template.title ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    Use Template
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
          {filteredStarters.length === 0 && (
            <div className="flex flex-col items-center py-16 text-center">
              <FileCode className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-medium">No templates found</h3>
              <p className="text-sm text-muted-foreground">
                Try a different search term
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="yours" className="mt-4">
          {loadingUser ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="mb-2 h-9 w-9 rounded-lg" />
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="mt-1 h-3 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full" />
                  </CardContent>
                  <CardFooter>
                    <Skeleton className="h-9 w-full" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : filteredUserTemplates.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredUserTemplates.map((template) => (
                <Card key={template.id} className="flex flex-col transition-all hover:shadow-md">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/50">
                        <BookmarkPlus className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                    </div>
                    <CardTitle className="mt-2 text-base">{template.title}</CardTitle>
                    {template.description && (
                      <CardDescription className="text-xs">
                        {template.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="secondary" className="text-xs">
                        {template.category}
                      </Badge>
                      {template.ai_platform && (
                        <Badge variant="outline" className="text-xs">
                          {template.ai_platform}
                        </Badge>
                      )}
                      {(template.tags || []).slice(0, 2).map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="text-xs font-normal">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full gap-2"
                      size="sm"
                      onClick={() => useUserTemplate(template)}
                      disabled={addingId === template.id}
                    >
                      {addingId === template.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                      Use Template
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-16 text-center">
              <BookmarkPlus className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-medium">No saved templates yet</h3>
              <p className="text-sm text-muted-foreground">
                Save prompts as templates from the new prompt page
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
