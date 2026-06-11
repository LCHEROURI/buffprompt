"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { FlaskConical, Plus, Loader2, Trophy, Star, Gauge, Zap } from "lucide-react";
import { toast } from "sonner";

export default function TestingLabPage() {
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [promptA, setPromptA] = useState("");
  const [promptB, setPromptB] = useState("");
  const [promptC, setPromptC] = useState("");
  const [saving, setSaving] = useState(false);
  const [scoring, setScoring] = useState<Record<string, { a: number; b: number; c: number }>>({});

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase.from("test_labs").select("*").order("updated_at", { ascending: false });
      setTests(data || []);
      setLoading(false);
    }
    load();
  }, []);

  async function handleCreate() {
    if (!name.trim() || !promptA.trim() || !promptB.trim()) { toast.error("Name, Prompt A, and Prompt B are required"); return; }
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("test_labs").insert({
      user_id: user.id, name: name.trim(), prompt_a: promptA, prompt_b: promptB,
      prompt_c: promptC || null,
    });
    setSaving(false);
    if (error) { toast.error(error.message); }
    else {
      toast.success("Test created!");
      setName(""); setPromptA(""); setPromptB(""); setPromptC("");
      const { data } = await supabase.from("test_labs").select("*").order("updated_at", { ascending: false });
      setTests(data || []);
    }
  }

  function runSimulation(testId: string) {
    const scores = {
      a: Math.round((70 + Math.random() * 30) * 10) / 10,
      b: Math.round((70 + Math.random() * 30) * 10) / 10,
      c: promptC ? Math.round((70 + Math.random() * 30) * 10) / 10 : 0,
    };
    setScoring((prev) => ({ ...prev, [testId]: scores }));
    toast.success("Test simulated! Scores updated.");
  }

  function getWinner(scores: { a: number; b: number; c: number }) {
    if (!scores.a && !scores.b) return null;
    const entries: Array<[string, number]> = [["A", scores.a], ["B", scores.b]];
    if (scores.c) entries.push(["C", scores.c]);
    return entries.sort(([, a], [, b]) => b - a)[0];
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <FlaskConical className="h-6 w-6 text-purple-500" />
          Prompt Testing Lab
        </h1>
        <p className="text-sm text-muted-foreground">Compare prompt variants and track their performance</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">New A/B/C Test</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Test name (e.g., Customer Support Tone)" value={name} onChange={(e) => setName(e.target.value)} />
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-2">
              <Label className="text-purple-600">Prompt A</Label>
              <Textarea className="min-h-[100px] font-mono text-sm" value={promptA} onChange={(e) => setPromptA(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-blue-600">Prompt B</Label>
              <Textarea className="min-h-[100px] font-mono text-sm" value={promptB} onChange={(e) => setPromptB(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-emerald-600">Prompt C (optional)</Label>
              <Textarea className="min-h-[100px] font-mono text-sm" value={promptC} onChange={(e) => setPromptC(e.target.value)} />
            </div>
          </div>
          <Button onClick={handleCreate} disabled={saving || !name.trim() || !promptA.trim() || !promptB.trim()}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Plus className="mr-2 h-4 w-4" />
            Create Test
          </Button>
        </CardContent>
      </Card>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>
      ) : tests.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-center">
          <FlaskConical className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-medium">No tests yet</h3>
          <p className="text-sm text-muted-foreground">Create your first A/B test to compare prompt variants</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tests.map((test) => {
            const scores = scoring[test.id];
            const winner = scores ? getWinner(scores) : null;
            return (
              <Card key={test.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{test.name}</CardTitle>
                    <Button size="sm" variant="outline" onClick={() => runSimulation(test.id)} className="gap-2">
                      <Zap className="h-4 w-4" />
                      Run Test
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {[
                      { label: "A", value: test.prompt_a, color: "purple", score: scores?.a },
                      { label: "B", value: test.prompt_b, color: "blue", score: scores?.b },
                      { label: "C", value: test.prompt_c, color: "emerald", score: scores?.c },
                    ].filter((v) => v.value).map((variant) => (
                      <div key={variant.label} className="rounded-lg border p-3">
                        <div className="mb-1 flex items-center justify-between">
                          <Badge variant="outline">Prompt {variant.label}</Badge>
                          {winner && winner[0] === variant.label && (
                            <Trophy className="h-4 w-4 text-yellow-500" />
                          )}
                        </div>
                        <pre className="max-h-16 overflow-y-auto text-xs text-muted-foreground">{variant.value}</pre>
                        {variant.score !== undefined && (
                          <div className="mt-2 flex items-center gap-3 text-xs">
                            <span className="flex items-center gap-1"><Gauge className="h-3 w-3" /> {variant.score}%</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {winner && (
                    <div className="mt-3 rounded-lg bg-gradient-to-r from-yellow-50 to-amber-50 p-3 text-center dark:from-yellow-950/30 dark:to-amber-950/30">
                      <p className="text-sm font-medium">
                        <Trophy className="mr-1 inline h-4 w-4 text-yellow-500" />
                        Winner: Prompt {winner[0]} — {winner[1]}%
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
