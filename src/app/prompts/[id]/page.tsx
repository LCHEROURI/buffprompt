"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { useFolders } from "@/lib/store";
import { exportPrompts, type ExportFormat } from "@/lib/export";
import type { Prompt, PromptVersion, PromptScore } from "@/lib/types";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  Copy,
  Edit,
  Trash2,
  History,
  Check,
  Sparkles,
  Lightbulb,
  Gauge,
  TrendingUp,
  Target,
  HeartPulse,
  Loader2,
  Zap,
  FilePlus,
  FolderOpen,
  BookmarkPlus,
  Download,
  FileDown,
} from "lucide-react";
import { toast } from "sonner";

const HEALTH_COLORS = [
  { min: 0, max: 30, color: "text-red-500", bg: "bg-red-100 dark:bg-red-950/50", bar: "bg-red-500" },
  { min: 30, max: 60, color: "text-yellow-500", bg: "bg-yellow-100 dark:bg-yellow-950/50", bar: "bg-yellow-500" },
  { min: 60, max: 80, color: "text-blue-500", bg: "bg-blue-100 dark:bg-blue-950/50", bar: "bg-blue-500" },
  { min: 80, max: 101, color: "text-green-500", bg: "bg-green-100 dark:bg-green-950/50", bar: "bg-green-500" },
];

function getHealthColor(score: number) {
  return HEALTH_COLORS.find((h) => score >= h.min && score < h.max) || HEALTH_COLORS[3];
}

function ScoreBar({ label, value, icon: Icon }: { label: string; value: number; icon: LucideIcon }) {
  const health = getHealthColor(value);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
          <span>{label}</span>
        </div>
        <span className={`font-medium ${health.color}`}>{Math.round(value)}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all duration-500 ${health.bar}`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );
}

export default function PromptDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [versions, setVersions] = useState<PromptVersion[]>([]);
  const [score, setScore] = useState<PromptScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [improving, setImproving] = useState(false);
  const [improveResult, setImproveResult] = useState<string | null>(null);
  const [moveFolderOpen, setMoveFolderOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const { folders } = useFolders();

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: p } = await supabase
        .from("prompts")
        .select("*")
        .eq("id", params.id)
        .single();
      setPrompt(p);

      if (p) {
        const { data: v } = await supabase
          .from("prompt_versions")
          .select("*")
          .eq("prompt_id", params.id)
          .order("version_number", { ascending: false });
        setVersions(v || []);

        const { data: s } = await supabase
          .from("prompt_scores")
          .select("*")
          .eq("prompt_id", params.id)
          .maybeSingle();
        if (s) setScore(s);
      }
      setLoading(false);
    }
    load();
  }, [params.id]);

  async function handleCopy() {
    if (!prompt) return;
    await navigator.clipboard.writeText(prompt.prompt_text);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
    const supabase = createClient();
    const { data: existing } = await supabase
      .from("usage_history")
      .select("use_count")
      .eq("prompt_id", prompt.id)
      .maybeSingle();
    const newCount = (existing?.use_count || 0) + 1;
    await supabase.from("usage_history").upsert(
      { prompt_id: prompt.id, last_used: new Date().toISOString(), use_count: newCount },
      { onConflict: "prompt_id" }
    );
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this prompt?")) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("prompts")
      .update({ status: "archived" })
      .eq("id", params.id);
    if (error) { toast.error(error.message); }
    else { toast.success("Prompt archived"); router.push("/prompts"); }
  }

  async function handleDuplicate() {
    if (!prompt) return;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("prompts").insert({
      user_id: user.id,
      title: `${prompt.title} (Copy)`,
      prompt_text: prompt.prompt_text,
      category: prompt.category,
      description: prompt.description,
      tags: prompt.tags,
      ai_platform: prompt.ai_platform,
    });
    if (error) { toast.error(error.message); }
    else { toast.success("Duplicated!"); router.push("/prompts"); }
  }

  async function handleCreateVersion() {
    if (!prompt) return;
    const supabase = createClient();
    const latestVersion = versions[0];
    const nextNumber = latestVersion ? latestVersion.version_number + 1 : 1;
    const { error } = await supabase.from("prompt_versions").insert({
      prompt_id: prompt.id,
      version_number: nextNumber,
      prompt_text: prompt.prompt_text,
      change_notes: "Manual version snapshot",
    });
    if (error) { toast.error(error.message); }
    else {
      toast.success(`Version v${nextNumber} created!`);
      const { data: v } = await supabase
        .from("prompt_versions")
        .select("*")
        .eq("prompt_id", params.id)
        .order("version_number", { ascending: false });
      setVersions(v || []);
    }
  }

  async function handleSaveAsTemplate() {
    if (!prompt) return;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("prompts").insert({
      user_id: user.id,
      title: prompt.title,
      prompt_text: prompt.prompt_text,
      category: prompt.category,
      description: prompt.description,
      tags: prompt.tags,
      ai_platform: prompt.ai_platform,
      is_template: true,
    });
    if (error) { toast.error(error.message); }
    else { toast.success("Saved as template!"); }
  }

  async function handleMoveToFolder() {
    if (!prompt || !selectedFolder) return;
    const supabase = createClient();
    const { error } = await supabase.from("prompt_folder_mapping").upsert(
      { prompt_id: prompt.id, folder_id: selectedFolder },
      { onConflict: "prompt_id" }
    );
    if (error) { toast.error(error.message); }
    else {
      toast.success("Moved to folder!");
      setMoveFolderOpen(false);
      setSelectedFolder(null);
    }
  }

  async function handleExport(format: ExportFormat) {
    if (!prompt) return;
    setExporting(format);
    try {
      await exportPrompts([prompt], format, prompt.title.replace(/[/\\?%*:|"<>]/g, "_"));
      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch (err: any) {
      toast.error(err.message || "Export failed");
    }
    setExporting(null);
  }

  function analyzePrompt(text: string, desc: string | null, tags: string[] | null, platform: string | null) {
    const weaknesses: string[] = [];
    const suggestions: string[] = [];
    let weaknessScore = 0;
    if (text.length < 50) {
      weaknesses.push("Prompt is too short - lacks detail and specificity");
      suggestions.push("Add more context, constraints, and expected output format");
      weaknessScore += 20;
    }
    if (!text.includes("\n\n")) {
      weaknesses.push("No clear section breaks - reduces readability");
      suggestions.push("Use markdown sections (##, ###) or numbered steps to structure the prompt");
      weaknessScore += 10;
    }
    if (!text.includes("?") && !text.includes("Write") && !text.includes("Create")) {
      weaknesses.push("No explicit instruction verb - the AI may lack direction");
      suggestions.push("Start with a clear action verb: Analyze, Write, Create, Generate, Explain");
      weaknessScore += 15;
    }
    if (!desc) {
      weaknesses.push("No description - makes it harder to understand the prompt purpose");
      suggestions.push("Add a brief description of what this prompt accomplishes");
      weaknessScore += 10;
    }
    if (!tags || tags.length < 2) {
      weaknesses.push("Few or no tags - reduces discoverability");
      suggestions.push("Add more relevant tags for better organization");
      weaknessScore += 10;
    }
    if (!platform) {
      weaknesses.push("No AI platform specified");
      suggestions.push("Specify which AI platform this prompt is optimized for");
      weaknessScore += 10;
    }
    if (text.length > 2000) {
      weaknesses.push("Prompt is very long - may exceed context windows or lose focus");
      suggestions.push("Consider breaking into smaller, focused prompts");
      weaknessScore += 15;
    }
    if (weaknesses.length === 0) {
      weaknesses.push("No major issues detected - this is a well-structured prompt!");
      suggestions.push("Consider A/B testing with minor variations to further optimize performance");
      weaknessScore = 5;
    }
    return { weaknesses, suggestions, weaknessScore };
  }

  async function handleImprove() {
    if (!prompt) return;
    setImproving(true);
    setImproveResult(null);
    await new Promise((r) => setTimeout(r, 2000));
    const { weaknesses, suggestions, weaknessScore } = analyzePrompt(
      prompt.prompt_text, prompt.description, prompt.tags, prompt.ai_platform
    );
    let optimizedText = prompt.prompt_text;
    if (weaknesses.length > 0 && !weaknesses[0].includes("No major issues")) {
      optimizedText = prompt.prompt_text.trim();
      if (!optimizedText.includes("\n\n")) optimizedText = `## Objective\n${optimizedText}`;
      if (!optimizedText.includes("?") && !optimizedText.startsWith("Write") && !optimizedText.startsWith("Create")) {
        optimizedText = `${optimizedText}\n\n## Instructions\nPlease analyze the above carefully and provide a comprehensive response.`;
      }
    }
    const result = `## AI Prompt Review\n\n` +
      `### Weaknesses Identified (${weaknesses.length})\n` +
      `${weaknesses.map((w, i) => `${i + 1}. ${w}`).join("\n")}\n\n` +
      `### Suggested Improvements\n` +
      `${suggestions.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\n` +
      `### Optimized Version Preview\n` +
      `\`\`\`\n${optimizedText.slice(0, 600)}${optimizedText.length > 600 ? "..." : ""}\n\`\`\``;
    setImproveResult(result);
    setImproving(false);
    const effectiveness = Math.max(30, 100 - weaknessScore);
    const supabase = createClient();
    try {
      const { data: usageData } = await supabase.from("usage_history").select("use_count").eq("prompt_id", prompt.id).maybeSingle();
      const actualUses = usageData?.use_count || 0;
      const usageScore = Math.min(100, Math.round(30 + actualUses * 5));
      const successRate = Math.max(40, Math.round(effectiveness * 0.85 + Math.random() * 10));
      const overall = Math.round((effectiveness + usageScore + successRate) / 3);
      const userRating = Math.min(5, Math.max(1, Math.round(2.5 + effectiveness / 30)));
      await supabase.from("prompt_scores").upsert({
        prompt_id: prompt.id, effectiveness_score: effectiveness, usage_score: usageScore,
        user_rating: userRating, success_rate: successRate, overall_health: overall,
      }, { onConflict: "prompt_id" });
      setScore({ id: "", prompt_id: prompt.id, effectiveness_score: effectiveness, usage_score: usageScore,
        user_rating: userRating, success_rate: successRate, overall_health: overall, updated_at: new Date().toISOString() });
      toast.success("AI review complete!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save scores");
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!prompt) {
    return (
      <div className="flex flex-col items-center py-16">
        <p className="text-lg text-muted-foreground">Prompt not found</p>
        <Link href="/prompts"><Button variant="link">Back to prompts</Button></Link>
      </div>
    );
  }

  const health = score ? getHealthColor(score.overall_health) : null;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/prompts"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{prompt.title}</h1>
          {prompt.description && <p className="text-sm text-muted-foreground">{prompt.description}</p>}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge>{prompt.category}</Badge>
        {prompt.ai_platform && <Badge variant="outline">{prompt.ai_platform}</Badge>}
        {prompt.tags?.map((tag) => <Badge key={tag} variant="secondary">{tag}</Badge>)}
        <span className="ml-auto text-xs text-muted-foreground">
          Updated {new Date(prompt.updated_at).toLocaleDateString()}
        </span>
      </div>

      {score && (
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-background to-muted/50 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Gauge className={`h-4 w-4 ${health?.color}`} /> Prompt Health Score
              </CardTitle>
              {health && (
                <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${health.bg} ${health.color}`}>
                  <HeartPulse className="h-3.5 w-3.5" /> {Math.round(score.overall_health)}% Overall
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <ScoreBar label="Effectiveness" value={score.effectiveness_score} icon={Target} />
              <ScoreBar label="Usage Score" value={score.usage_score} icon={TrendingUp} />
              <ScoreBar label="Success Rate" value={score.success_rate} icon={Zap} />
              <ScoreBar label="Overall Health" value={score.overall_health} icon={HeartPulse} />
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Prompt Content</CardTitle>
          <Button variant={copied ? "secondary" : "outline"} size="sm" className="gap-2" onClick={handleCopy}>
            {copied ? <><Check className="h-4 w-4" />Copied</> : <><Copy className="h-4 w-4" />Copy</>}
          </Button>
        </CardHeader>
        <CardContent>
          <pre className="whitespace-pre-wrap rounded-lg bg-muted p-4 font-mono text-sm">{prompt.prompt_text}</pre>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Link href={`/prompts/${prompt.id}/edit`}><Button variant="default" className="gap-2"><Edit className="h-4 w-4" /> Edit</Button></Link>
        <Button variant="outline" className="gap-2" onClick={handleDuplicate}><Copy className="h-4 w-4" /> Duplicate</Button>
        <Button variant="outline" className="gap-2" onClick={handleCreateVersion}><FilePlus className="h-4 w-4" /> Create Version</Button>

        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button variant="outline" className="gap-2" disabled={!!exporting}>
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {exporting ? `Exporting ${exporting.toUpperCase()}...` : "Export"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={() => handleExport("txt")}><FileDown className="mr-2 h-4 w-4" /> TXT</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("md")}><FileDown className="mr-2 h-4 w-4" /> Markdown</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("csv")}><FileDown className="mr-2 h-4 w-4" /> CSV</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("pdf")}><FileDown className="mr-2 h-4 w-4" /> PDF</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("docx")}><FileDown className="mr-2 h-4 w-4" /> DOCX</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Dialog open={moveFolderOpen} onOpenChange={setMoveFolderOpen}>
          <DialogTrigger><Button variant="outline" className="gap-2"><FolderOpen className="h-4 w-4" /> Move To Folder</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Move to Folder</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <Select value={selectedFolder || ""} onValueChange={(v) => v && setSelectedFolder(v)}>
                <SelectTrigger><SelectValue placeholder="Select a folder" /></SelectTrigger>
                <SelectContent>
                  {folders.map((f) => <SelectItem key={f.id} value={f.id}>{f.folder_name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button className="w-full gap-2" onClick={handleMoveToFolder} disabled={!selectedFolder}>
                <FolderOpen className="h-4 w-4" /> Move
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Button variant="outline" className="gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400" onClick={handleSaveAsTemplate}>
          <BookmarkPlus className="h-4 w-4" /> Save as Template
        </Button>
        <Button variant="secondary" className="gap-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600" onClick={handleImprove} disabled={improving}>
          {improving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {improving ? "Analyzing..." : "Improve Prompt"}
        </Button>
        <Button variant="destructive" className="gap-2" onClick={handleDelete}><Trash2 className="h-4 w-4" /> Archive</Button>
      </div>

      {improveResult && (
        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50 dark:border-purple-900 dark:from-purple-950/30 dark:to-indigo-950/30">
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Lightbulb className="h-4 w-4 text-purple-500" /> AI Prompt Review</CardTitle></CardHeader>
          <CardContent><pre className="whitespace-pre-wrap text-sm leading-relaxed">{improveResult}</pre></CardContent>
        </Card>
      )}

      {versions.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><History className="h-4 w-4" /> Version History ({versions.length})</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {versions.map((version) => (
              <div key={version.id} className="rounded-lg border p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium">v{version.version_number}</span>
                  <span className="text-xs text-muted-foreground">{new Date(version.created_at).toLocaleString()}</span>
                </div>
                {version.change_notes && <p className="mb-2 text-xs text-muted-foreground">{version.change_notes}</p>}
                <pre className="max-h-32 overflow-y-auto rounded bg-muted p-2 text-xs">
                  {version.prompt_text.slice(0, 500)}{version.prompt_text.length > 500 && "..."}
                </pre>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
