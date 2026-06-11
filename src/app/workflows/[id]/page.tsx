"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Play, Plus, Trash2, GripVertical, Loader2, CheckCircle2, WorkflowIcon } from "lucide-react";
import { toast } from "sonner";

export default function WorkflowDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [workflow, setWorkflow] = useState<any>(null);
  const [steps, setSteps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newStepTitle, setNewStepTitle] = useState("");
  const [newStepPrompt, setNewStepPrompt] = useState("");
  const [newStepInstructions, setNewStepInstructions] = useState("");
  const [addingStep, setAddingStep] = useState(false);
  const [running, setRunning] = useState(false);
  const [runResults, setRunResults] = useState<Record<string, string>>({});

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: w } = await supabase.from("workflows").select("*").eq("id", params.id).single();
      setWorkflow(w);
      if (w) {
        const { data: s } = await supabase.from("workflow_steps").select("*").eq("workflow_id", w.id).order("step_number", { ascending: true });
        setSteps(s || []);
      }
      setLoading(false);
    }
    load();
  }, [params.id]);

  async function addStep() {
    if (!newStepTitle.trim() || !newStepPrompt.trim()) { toast.error("Title and prompt are required"); return; }
    setAddingStep(true);
    const supabase = createClient();
    const nextNum = steps.length + 1;
    const { error } = await supabase.from("workflow_steps").insert({
      workflow_id: params.id, step_number: nextNum, title: newStepTitle.trim(),
      prompt_text: newStepPrompt, instructions: newStepInstructions || null,
    });
    setAddingStep(false);
    if (error) { toast.error(error.message); }
    else {
      toast.success("Step added!");
      setNewStepTitle(""); setNewStepPrompt(""); setNewStepInstructions("");
      const { data: s } = await supabase.from("workflow_steps").select("*").eq("workflow_id", params.id).order("step_number", { ascending: true });
      setSteps(s || []);
    }
  }

  async function deleteStep(stepId: string) {
    const supabase = createClient();
    await supabase.from("workflow_steps").delete().eq("id", stepId);
    const { data: s } = await supabase.from("workflow_steps").select("*").eq("workflow_id", params.id).order("step_number", { ascending: true });
    setSteps(s || []);
    toast.success("Step removed");
  }

  async function runWorkflow() {
    setRunning(true);
    setRunResults({});
    const results: Record<string, string> = {};
    for (const step of steps) {
      await new Promise((r) => setTimeout(r, 1000));
      results[step.id] = "> [Simulated output for: " + step.title + "]\n\nProcessing prompt...\nAnalysis complete.\n\nKey findings would appear here based on the prompt: \"" + step.prompt_text.slice(0, 100) + "...\"";
      setRunResults({ ...results });
    }
    setRunning(false);
    toast.success("Workflow completed!");
  }

  if (loading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /></div>;
  if (!workflow) return <div className="py-16 text-center"><p className="text-muted-foreground">Workflow not found</p></div>;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/workflows"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{workflow.name}</h1>
          {workflow.description && <p className="text-sm text-muted-foreground">{workflow.description}</p>}
        </div>
        {steps.length > 0 && (
          <Button onClick={runWorkflow} disabled={running} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {running ? "Running..." : "Run Workflow"}
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <WorkflowIcon className="h-4 w-4" />
            Workflow Steps ({steps.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {steps.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <p className="text-sm text-muted-foreground">No steps yet. Add your first step below.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {steps.map((step, idx) => (
                <Card key={step.id} className="border-l-4" style={{ borderLeftColor: "#10b981" }}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                          {idx + 1}
                        </span>
                        <CardTitle className="text-sm">{step.title}</CardTitle>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteStep(step.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                    {step.instructions && <CardDescription className="text-xs">{step.instructions}</CardDescription>}
                  </CardHeader>
                  <CardContent>
                    <pre className="max-h-20 overflow-y-auto rounded bg-muted p-2 text-xs">{step.prompt_text}</pre>
                    {runResults[step.id] && (
                      <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-900 dark:bg-emerald-950/30">
                        <div className="flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" />
                          Output
                        </div>
                        <pre className="mt-1 whitespace-pre-wrap text-xs text-muted-foreground">{runResults[step.id]}</pre>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Add Step</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Step title (e.g., Analyze Menu)" value={newStepTitle} onChange={(e) => setNewStepTitle(e.target.value)} />
          <Textarea placeholder="Enter the prompt for this step..." className="min-h-[80px] font-mono text-sm" value={newStepPrompt} onChange={(e) => setNewStepPrompt(e.target.value)} />
          <Input placeholder="Instructions for this step (optional)" value={newStepInstructions} onChange={(e) => setNewStepInstructions(e.target.value)} />
          <Button size="sm" onClick={addStep} disabled={addingStep || !newStepTitle.trim() || !newStepPrompt.trim()}>
            {addingStep ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Add Step
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
