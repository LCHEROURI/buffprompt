"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { PROMPT_CATEGORIES, AI_PLATFORMS, type PromptCategory, type AIPlatform } from "@/lib/types";
import { ArrowLeft, Loader2, Save, FileCode, BookmarkPlus } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function NewPromptPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [promptText, setPromptText] = useState("");
  const [category, setCategory] = useState<string>("");
  const [aiPlatform, setAiPlatform] = useState<string>("");
  const [tags, setTags] = useState("");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    await savePrompt(false);
  }

  async function handleSaveAsTemplate() {
    await savePrompt(true);
  }

  async function savePrompt(isTemplate: boolean) {
    if (!title || !promptText) {
      toast.error("Title and prompt text are required");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const { error } = await supabase.from("prompts").insert({
      user_id: user.id,
      title,
      description: description || null,
      prompt_text: promptText,
      category: category || "Custom",
      ai_platform: aiPlatform || null,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      is_template: isTemplate,
    });

    if (error) {
      toast.error(error.message);
      setSaving(false);
    } else {
      toast.success(isTemplate ? "Template saved!" : "Prompt created!");
      router.push("/prompts");
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/prompts">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New Prompt</h1>
          <p className="text-sm text-muted-foreground">
            Create a new prompt for your vault
          </p>
        </div>
      </div>

      <form onSubmit={handleSave}>
        <Card>
          <CardHeader>
            <CardTitle>Prompt Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Customer Support Agent"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this prompt"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={(v) => v && setCategory(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROMPT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>AI Platform</Label>
                <Select value={aiPlatform} onValueChange={(v) => v && setAiPlatform(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    {AI_PLATFORMS.map((plat) => (
                      <SelectItem key={plat} value={plat}>
                        {plat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="comma, separated, tags"
              />
              <p className="text-xs text-muted-foreground">
                Separate tags with commas
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prompt_text">Prompt Content *</Label>
              <Textarea
                id="prompt_text"
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder="Enter your prompt here..."
                className="min-h-[200px] font-mono text-sm"
                required
              />
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-end gap-3">
          <Link href="/prompts">
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
          <Button
            variant="secondary"
            type="button"
            className="gap-2 border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300"
            onClick={handleSaveAsTemplate}
            disabled={saving}
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            <BookmarkPlus className="h-4 w-4" />
            Save as Template
          </Button>
          <Button type="submit" className="gap-2" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            <Save className="h-4 w-4" />
            Save Prompt
          </Button>
        </div>
      </form>
    </div>
  );
}
