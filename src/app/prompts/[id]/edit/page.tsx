"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
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
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { PROMPT_CATEGORIES, AI_PLATFORMS, type Prompt } from "@/lib/types";
import { ArrowLeft, Loader2, Save, RotateCcw } from "lucide-react";
import { toast } from "sonner";

export default function EditPromptPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [promptText, setPromptText] = useState("");
  const [category, setCategory] = useState<string>("");
  const [aiPlatform, setAiPlatform] = useState<string>("");
  const [tags, setTags] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase.from("prompts").select("*").eq("id", params.id).single();
      if (data) {
        setPrompt(data);
        setTitle(data.title);
        setDescription(data.description || "");
        setPromptText(data.prompt_text);
        setCategory(data.category);
        setAiPlatform(data.ai_platform || "");
        setTags(data.tags?.join(", ") || "");
      }
      setLoading(false);
    }
    load();
  }, [params.id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !promptText) { toast.error("Title and prompt text are required"); return; }
    setSaving(true);
    const supabase = createClient();
    if (prompt) {
      await supabase.from("prompt_versions").insert({
        prompt_id: prompt.id,
        version_number: Math.floor(Date.now() / 1000),
        prompt_text: prompt.prompt_text,
        change_notes: "Auto-saved before edit",
      });
    }
    const { error } = await supabase.from("prompts").update({
      title, description: description || null, prompt_text: promptText,
      category: category || "Custom", ai_platform: aiPlatform || null,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
    }).eq("id", params.id);
    if (error) { toast.error(error.message); setSaving(false); }
    else { toast.success("Prompt updated!"); router.push("/prompts/" + params.id); }
  }

  if (loading) return <div className="mx-auto max-w-3xl space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-96 w-full" /></div>;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href={"/prompts/" + params.id}><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div><h1 className="text-2xl font-bold tracking-tight">Edit Prompt</h1><p className="text-sm text-muted-foreground">Editing &quot;{title}&quot;</p></div>
      </div>
      <form onSubmit={handleSave}>
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><RotateCcw className="h-4 w-4" />Prompt Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label htmlFor="title">Title *</Label><Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required /></div>
            <div className="space-y-2"><Label htmlFor="description">Description</Label><Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>Category</Label><Select value={category} onValueChange={(v) => v && setCategory(v)}><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger><SelectContent>{PROMPT_CATEGORIES.map((cat) => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}</SelectContent></Select></div>
              <div className="space-y-2"><Label>AI Platform</Label><Select value={aiPlatform} onValueChange={(v) => v && setAiPlatform(v)}><SelectTrigger><SelectValue placeholder="Select platform" /></SelectTrigger><SelectContent>{AI_PLATFORMS.map((plat) => (<SelectItem key={plat} value={plat}>{plat}</SelectItem>))}</SelectContent></Select></div>
            </div>
            <div className="space-y-2"><Label htmlFor="tags">Tags</Label><Input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="comma, separated" /></div>
            <div className="space-y-2"><Label htmlFor="prompt_text">Prompt Content *</Label><Textarea id="prompt_text" value={promptText} onChange={(e) => setPromptText(e.target.value)} className="min-h-[200px] font-mono text-sm" required /></div>
          </CardContent>
        </Card>
        <div className="mt-6 flex justify-end gap-3">
          <Link href={"/prompts/" + params.id}><Button variant="outline" type="button">Cancel</Button></Link>
          <Button type="submit" className="gap-2" disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin" />}<Save className="h-4 w-4" />Save Changes</Button>
        </div>
      </form>
    </div>
  );
}
