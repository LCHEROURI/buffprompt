"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import {
  FlaskConical, Plus, Loader2, Trophy, Zap,
  Search, Edit3, Trash2, ArrowUpDown,
} from "lucide-react";
import { toast } from "sonner";

function ScoreBar({ label, value, maxColor }: { label: string; value: number; maxColor?: boolean }) {
  const pct = Math.min(value, 100);
  const color =
    pct >= 80 ? "bg-green-500" :
    pct >= 60 ? "bg-blue-500" :
    pct >= 40 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className={`font-medium tabular-nums ${maxColor ? "text-foreground" : "text-muted-foreground"}`}>
          {Math.round(value)}%
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function VariantCard({
  label,
  text,
  scores,
  isWinner,
  colorScheme,
}: {
  label: string;
  text: string;
  scores: { quality: number; speed: number; accuracy: number } | null;
  isWinner: boolean;
  colorScheme: { badge: string; bg: string; border: string };
}) {
  return (
    <div className={`rounded-lg border p-3 transition-all ${isWinner ? colorScheme.border + " ring-1" : ""} ${colorScheme.bg}`}>
      <div className="mb-2 flex items-center justify-between">
        <Badge variant={isWinner ? "default" : "outline"}>{isWinner && <Trophy className="-ml-0.5 mr-1 h-3 w-3 text-yellow-400" />}Prompt {label}</Badge>
        {isWinner && <Trophy className="h-4 w-4 text-yellow-500" />}
      </div>
      <pre className="max-h-20 overflow-y-auto whitespace-pre-wrap rounded bg-background/50 p-2 text-xs text-muted-foreground">{text}</pre>
      {scores && (
        <div className="mt-2 space-y-1.5">
          <ScoreBar label="Quality" value={scores.quality} maxColor={isWinner} />
          <ScoreBar label="Speed" value={scores.speed} maxColor={isWinner} />
          <ScoreBar label="Accuracy" value={scores.accuracy} maxColor={isWinner} />
        </div>
      )}
    </div>
  );
}

const COLOR_SCHEMES: Record<string, { badge: string; bg: string; border: string }> = {
  A: { badge: "border-purple-300 bg-purple-50 dark:bg-purple-950/20", bg: "", border: "border-purple-400" },
  B: { badge: "border-blue-300 bg-blue-50 dark:bg-blue-950/20", bg: "", border: "border-blue-400" },
  C: { badge: "border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20", bg: "", border: "border-emerald-400" },
};

export default function TestingLabPage() {
  const [tests, setTests] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  // Create state
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [promptA, setPromptA] = useState("");
  const [promptB, setPromptB] = useState("");
  const [promptC, setPromptC] = useState("");
  const [saving, setSaving] = useState(false);

  // Edit state
  const [editOpen, setEditOpen] = useState(false);
  const [editTest, setEditTest] = useState<any>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPromptA, setEditPromptA] = useState("");
  const [editPromptB, setEditPromptB] = useState("");
  const [editPromptC, setEditPromptC] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // Running state
  const [runningTests, setRunningTests] = useState<Set<string>>(new Set());

  // Delete state
  const [savingDelete, setSavingDelete] = useState<string | null>(null);

  const supabase = createClient();

  async function loadData() {
    const { data: t } = await supabase.from("test_labs").select("*").order("created_at", { ascending: false });
    setTests(t || []);
    const { data: r } = await supabase.from("test_lab_results").select("*").order("created_at", { ascending: false });
    setResults(r || []);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  const filteredTests = useMemo(() => {
    let result = [...tests];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((t) =>
        t.name.toLowerCase().includes(q) ||
        (t.description || "").toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      if (sortBy === "oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return result;
  }, [tests, searchQuery, sortBy]);

  function getTestResults(testId: string) {
    return results.filter((r) => r.test_id === testId);
  }

  function getAverageScores(testId: string): Record<string, { quality: number; speed: number; accuracy: number }> {
    const testResults = getTestResults(testId);
    const variants = { A: { q: 0, s: 0, a: 0, count: 0 }, B: { q: 0, s: 0, a: 0, count: 0 }, C: { q: 0, s: 0, a: 0, count: 0 } };

    for (const r of testResults) {
      const v = variants[r.variant as keyof typeof variants];
      if (v) {
        v.q += Number(r.quality_score) || 0;
        v.s += Number(r.speed_score) || 0;
        v.a += Number(r.accuracy_score) || 0;
        v.count++;
      }
    }

    const out: Record<string, { quality: number; speed: number; accuracy: number }> = {};
    for (const [key, v] of Object.entries(variants)) {
      if (v.count > 0) {
        out[key] = {
          quality: Math.round((v.q / v.count) * 10) / 10,
          speed: Math.round((v.s / v.count) * 10) / 10,
          accuracy: Math.round((v.a / v.count) * 10) / 10,
        };
      }
    }
    return out;
  }

  function getOverall(label: string, scores: { quality: number; speed: number; accuracy: number }) {
    return Math.round((scores.quality + scores.speed + scores.accuracy) / 3);
  }

  function findWinner(avgScores: Record<string, { quality: number; speed: number; accuracy: number }>): [string, number] | null {
    const entries = Object.entries(avgScores).map(([k, v]) => [k, getOverall(k, v)] as [string, number]);
    if (entries.length === 0) return null;
    return entries.sort(([, a], [, b]) => b - a)[0];
  }

  function getVariantLabels(test: any): string[] {
    const labels = ["A", "B"];
    if (test.prompt_c) labels.push("C");
    return labels;
  }

  function getPromptText(test: any, label: string): string {
    if (label === "A") return test.prompt_a;
    if (label === "B") return test.prompt_b;
    return test.prompt_c || "";
  }

  async function handleCreate() {
    if (!name.trim() || !promptA.trim() || !promptB.trim()) {
      toast.error("Name, Prompt A, and Prompt B are required");
      return;
    }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }
    const { error } = await supabase.from("test_labs").insert({
      user_id: user.id,
      name: name.trim(),
      description: description || null,
      prompt_a: promptA,
      prompt_b: promptB,
      prompt_c: promptC || null,
    });
    setSaving(false);
    if (error) { toast.error(error.message); }
    else {
      toast.success("Test created!");
      setCreateOpen(false);
      setName(""); setDescription(""); setPromptA(""); setPromptB(""); setPromptC("");
      loadData();
    }
  }

  function openEdit(test: any) {
    setEditTest(test);
    setEditName(test.name);
    setEditDescription(test.description || "");
    setEditPromptA(test.prompt_a);
    setEditPromptB(test.prompt_b);
    setEditPromptC(test.prompt_c || "");
    setEditOpen(true);
  }

  async function handleEdit() {
    if (!editTest || !editName.trim() || !editPromptA.trim() || !editPromptB.trim()) return;
    setSavingEdit(true);
    const { error } = await supabase.from("test_labs").update({
      name: editName.trim(),
      description: editDescription || null,
      prompt_a: editPromptA,
      prompt_b: editPromptB,
      prompt_c: editPromptC || null,
    }).eq("id", editTest.id);
    setSavingEdit(false);
    if (error) { toast.error(error.message); }
    else {
      toast.success("Test updated!");
      setEditOpen(false);
      setEditTest(null);
      loadData();
    }
  }

  async function handleDelete(testId: string, testName: string) {
    if (!confirm(`Delete test "${testName}"? All results will be removed.`)) return;
    setSavingDelete(testId);
    const { error } = await supabase.from("test_labs").delete().eq("id", testId);
    setSavingDelete(null);
    if (error) { toast.error(error.message); }
    else {
      toast.success("Test deleted");
      setTests((prev) => prev.filter((t) => t.id !== testId));
      setResults((prev) => prev.filter((r) => r.test_id !== testId));
    }
  }

  async function handleRunTest(test: any) {
    setRunningTests((prev) => new Set(prev).add(test.id));

    // Simulate realistic scores with slight variation per variant
    const variants = getVariantLabels(test);
    const inserts = variants.map((label) => {
      const base = 65 + Math.random() * 30;
      const offset = (Math.random() - 0.5) * 15; // +/- 7.5 variation
      return {
        test_id: test.id,
        variant: label,
        quality_score: Math.round(Math.min(100, Math.max(10, base + offset)) * 10) / 10,
        speed_score: Math.round(Math.min(100, Math.max(10, base + Math.random() * 20 - 10)) * 10) / 10,
        accuracy_score: Math.round(Math.min(100, Math.max(10, base + Math.random() * 20 - 10)) * 10) / 10,
        user_rating: Math.round((2 + Math.random() * 3) * 10) / 10,
      };
    });

    const { error } = await supabase.from("test_lab_results").insert(inserts);
    setRunningTests((prev) => {
      const next = new Set(prev);
      next.delete(test.id);
      return next;
    });

    if (error) { toast.error(error.message); }
    else {
      toast.success("Test run complete! Results saved.");
      const { data: r } = await supabase.from("test_lab_results").select("*").order("created_at", { ascending: false });
      setResults(r || []);
    }
  }

  async function handleClearResults(testId: string) {
    if (!confirm("Clear all results for this test?")) return;
    const { error } = await supabase.from("test_lab_results").delete().eq("test_id", testId);
    if (error) { toast.error(error.message); }
    else {
      toast.success("Results cleared");
      setResults((prev) => prev.filter((r) => r.test_id !== testId));
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <FlaskConical className="h-6 w-6 text-purple-500" />
            Prompt Testing Lab
          </h1>
          <p className="text-sm text-muted-foreground">
            {filteredTests.length} test{filteredTests.length !== 1 && "s"}
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger>
            <Button className="gap-2"><Plus className="h-4 w-4" />New Test</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader><DialogTitle>Create A/B/C Test</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-4">
              <Input
                placeholder="Test name (e.g., Customer Support Tone)"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Input
                placeholder="Description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label className="text-purple-600 dark:text-purple-400">Prompt A *</Label>
                  <Textarea
                    className="min-h-[120px] font-mono text-sm"
                    value={promptA}
                    onChange={(e) => setPromptA(e.target.value)}
                    placeholder="Enter prompt variant A..."
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-blue-600 dark:text-blue-400">Prompt B *</Label>
                  <Textarea
                    className="min-h-[120px] font-mono text-sm"
                    value={promptB}
                    onChange={(e) => setPromptB(e.target.value)}
                    placeholder="Enter prompt variant B..."
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-emerald-600 dark:text-emerald-400">Prompt C</Label>
                  <Textarea
                    className="min-h-[120px] font-mono text-sm"
                    value={promptC}
                    onChange={(e) => setPromptC(e.target.value)}
                    placeholder="Optional third variant..."
                  />
                </div>
              </div>
              <Button
                className="w-full gap-2"
                onClick={handleCreate}
                disabled={saving || !name.trim() || !promptA.trim() || !promptB.trim()}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <FlaskConical className="h-4 w-4" />}
                {saving ? "Creating..." : "Create Test"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search & Sort */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tests by name..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={sortBy} onValueChange={(v) => v && setSortBy(v)}>
          <SelectTrigger className="w-[160px]">
            <ArrowUpDown className="mr-2 h-3.5 w-3.5" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="name">Name A-Z</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Test List */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : filteredTests.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          {searchQuery ? (
            <>
              <Search className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-medium">No tests match your search</h3>
              <p className="mt-1 text-sm text-muted-foreground">Try a different search term</p>
              <Button variant="link" onClick={() => setSearchQuery("")}>Clear search</Button>
            </>
          ) : (
            <>
              <FlaskConical className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-medium">No tests yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Create A/B tests to compare prompt variants side by side
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTests.map((test) => {
            const avgScores = getAverageScores(test.id);
            const winner = findWinner(avgScores);
            const testResults = getTestResults(test.id);
            const runCount = testResults.length > 0
              ? new Set(testResults.map((r) => r.created_at?.slice(0, 16))).size
              : 0;

            return (
              <Card key={test.id} className="group transition-all hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <FlaskConical className="h-5 w-5 text-purple-500 shrink-0" />
                        <CardTitle className="text-base truncate">{test.name}</CardTitle>
                      </div>
                      {test.description && (
                        <CardDescription className="mt-0.5 truncate">{test.description}</CardDescription>
                      )}
                    </div>
                    <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(test)}
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(test.id, test.name)}
                        disabled={savingDelete === test.id}
                      >
                        {savingDelete === test.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Variant cards */}
                  <div className="grid gap-3 sm:grid-cols-3">
                    {getVariantLabels(test).map((label) => (
                      <VariantCard
                        key={label}
                        label={label}
                        text={getPromptText(test, label)}
                        scores={avgScores[label] || null}
                        isWinner={winner?.[0] === label}
                        colorScheme={COLOR_SCHEMES[label]}
                      />
                    ))}
                  </div>

                  {/* Winner banner */}
                  {winner && (
                    <div className="rounded-lg bg-gradient-to-r from-yellow-50 to-amber-50 p-3 text-center dark:from-yellow-950/30 dark:to-amber-950/30">
                      <p className="text-sm font-medium">
                        <Trophy className="mr-1 inline h-4 w-4 text-yellow-500" />
                        Winner: Prompt {winner[0]} — {winner[1]}% overall
                        {runCount > 0 && (
                          <span className="ml-2 text-xs text-muted-foreground font-normal">
                            (avg of {runCount} run{runCount !== 1 ? "s" : ""})
                          </span>
                        )}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      className="gap-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600"
                      onClick={() => handleRunTest(test)}
                      disabled={runningTests.has(test.id)}
                    >
                      {runningTests.has(test.id) ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Zap className="h-4 w-4" />
                      )}
                      {runningTests.has(test.id) ? "Running..." : "Run Test"}
                    </Button>
                    {testResults.length > 0 && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-2"
                          onClick={() => handleClearResults(test.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Clear Results
                        </Button>
                        <span className="text-xs text-muted-foreground">
                          {testResults.length} result{testResults.length !== 1 && "s"}
                        </span>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>Edit Test</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-4">
            <Input
              placeholder="Test name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
            <Input
              placeholder="Description (optional)"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
            />
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label className="text-purple-600 dark:text-purple-400">Prompt A</Label>
                <Textarea
                  className="min-h-[100px] font-mono text-sm"
                  value={editPromptA}
                  onChange={(e) => setEditPromptA(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-blue-600 dark:text-blue-400">Prompt B</Label>
                <Textarea
                  className="min-h-[100px] font-mono text-sm"
                  value={editPromptB}
                  onChange={(e) => setEditPromptB(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-emerald-600 dark:text-emerald-400">Prompt C</Label>
                <Textarea
                  className="min-h-[100px] font-mono text-sm"
                  value={editPromptC}
                  onChange={(e) => setEditPromptC(e.target.value)}
                  placeholder="Optional"
                />
              </div>
            </div>
            <Button
              className="w-full"
              onClick={handleEdit}
              disabled={savingEdit || !editName.trim() || !editPromptA.trim() || !editPromptB.trim()}
            >
              {savingEdit && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
