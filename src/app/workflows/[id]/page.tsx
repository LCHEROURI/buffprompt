"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft, Play, Plus, Trash2, Loader2, CheckCircle2, WorkflowIcon,
  ArrowUp, ArrowDown, Edit3, History,
} from "lucide-react";
import { toast } from "sonner";

export default function WorkflowDetailPage() {
  const params = useParams();
  const [workflow, setWorkflow] = useState<any>(null);
  const [steps, setSteps] = useState<any[]>([]);
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Add step state
  const [newStepTitle, setNewStepTitle] = useState("");
  const [newStepPrompt, setNewStepPrompt] = useState("");
  const [newStepInstructions, setNewStepInstructions] = useState("");
  const [addingStep, setAddingStep] = useState(false);

  // Edit step state
  const [editStepOpen, setEditStepOpen] = useState(false);
  const [editStep, setEditStep] = useState<any>(null);
  const [editStepTitle, setEditStepTitle] = useState("");
  const [editStepPrompt, setEditStepPrompt] = useState("");
  const [editStepInstructions, setEditStepInstructions] = useState("");
  const [savingEditStep, setSavingEditStep] = useState(false);

  // Run state
  const [running, setRunning] = useState(false);
  const [runResults, setRunResults] = useState<Record<string, string>>({});
  const [currentStepIdx, setCurrentStepIdx] = useState(-1);

  async function loadData() {
    const supabase = createClient();
    const { data: w } = await supabase.from("workflows").select("*").eq("id", params.id).single();
    setWorkflow(w);
    if (w) {
      const { data: s } = await supabase.from("workflow_steps").select("*").eq("workflow_id", w.id).order("step_number", { ascending: true });
      setSteps(s || []);
      const { data: r } = await supabase.from("workflow_runs").select("*").eq("workflow_id", w.id).order("started_at", { ascending: false }).limit(5);
      setRuns(r || []);
    }
    setLoading(false);
  }

  useEffect(() => { loadData(); }, [params.id]);

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

  function openEditStep(step: any) {
    setEditStep(step);
    setEditStepTitle(step.title);
    setEditStepPrompt(step.prompt_text);
    setEditStepInstructions(step.instructions || "");
    setEditStepOpen(true);
  }

  async function handleEditStep() {
    if (!editStep || !editStepTitle.trim() || !editStepPrompt.trim()) return;
    setSavingEditStep(true);
    const supabase = createClient();
    const { error } = await supabase.from("workflow_steps").update({
      title: editStepTitle.trim(), prompt_text: editStepPrompt, instructions: editStepInstructions || null,
    }).eq("id", editStep.id);
    setSavingEditStep(false);
    if (error) { toast.error(error.message); }
    else {
      toast.success("Step updated!");
      setEditStepOpen(false);
      setEditStep(null);
      const { data: s } = await supabase.from("workflow_steps").select("*").eq("workflow_id", params.id).order("step_number", { ascending: true });
      setSteps(s || []);
    }
  }

  async function deleteStep(stepId: string) {
    const supabase = createClient();
    await supabase.from("workflow_steps").delete().eq("id", stepId);
    const { data: s } = await supabase.from("workflow_steps").select("*").eq("workflow_id", params.id).order("step_number", { ascending: true });
    const renumbered = (s || []).map((step: any, i: number) => ({ ...step, step_number: i + 1 }));
    for (const step of renumbered) {
      await supabase.from("workflow_steps").update({ step_number: step.step_number }).eq("id", step.id);
    }
    setSteps(renumbered);
    toast.success("Step removed");
  }

  async function moveStep(stepId: string, direction: "up" | "down") {
    const idx = steps.findIndex((s) => s.id === stepId);
    if (idx === -1) return;
    const newIdx = direction === "up" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= steps.length) return;

    const reordered = [...steps];
    [reordered[idx], reordered[newIdx]] = [reordered[newIdx], reordered[idx]];
    const updated = reordered.map((s, i) => ({ ...s, step_number: i + 1 }));

    const supabase = createClient();
    for (const s of updated) {
      await supabase.from("workflow_steps").update({ step_number: s.step_number }).eq("id", s.id);
    }
    setSteps(updated);
  }

  // Generate a simulated output for a step
  function simulateOutput(step: any, prevOutput?: string): string {
    const lines = [
      `[Step: ${step.title}]`,
      `Processing prompt: "${step.prompt_text.slice(0, 80)}${step.prompt_text.length > 80 ? "..." : ""}"`,
      ``,
    ];
    if (step.instructions) {
      lines.push(`Following instructions: ${step.instructions}`);
      lines.push(``);
    }
    if (prevOutput) {
      lines.push(`Previous step output received (${prevOutput.length} chars).`);
      lines.push(``);
    }
    lines.push("Analysis complete. Key findings:");
    lines.push("• Identified 3 core patterns in the input data");
    lines.push("• Generated actionable recommendations aligned with objectives");
    lines.push("• All constraints and requirements were satisfied");
    lines.push(``);
    lines.push("> Output ready for next step.");
    return lines.join("\n");
  }

  async function runWorkflow() {
    setRunning(true);
    setRunResults({});
    setCurrentStepIdx(-1);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data: runRecord } = await supabase.from("workflow_runs").insert({
      workflow_id: params.id, user_id: user?.id, status: "running",
    }).select().single();

    const results: Record<string, string> = {};
    let prevOutput: string | undefined;

    for (let i = 0; i < steps.length; i++) {
      setCurrentStepIdx(i);
      const step = steps[i];
      await new Promise((r) => setTimeout(r, 800));
      const output = simulateOutput(step, prevOutput);
      results[step.id] = output;
      prevOutput = output;
      setRunResults({ ...results });

      // Save step result to DB
      if (runRecord) {
        await supabase.from("workflow_step_results").insert({
          run_id: runRecord.id, step_id: step.id,
          output: output, status: "completed",
        });
      }
    }

    // Mark run as completed
    if (runRecord) {
      await supabase.from("workflow_runs").update({
        status: "completed", completed_at: new Date().toISOString(),
      }).eq("id", runRecord.id);
      // Refresh runs list
      const { data: r } = await supabase.from("workflow_runs").select("*").eq("workflow_id", params.id).order("started_at", { ascending: false }).limit(5);
      setRuns(r || []);
    }

    setCurrentStepIdx(-1);
    setRunning(false);
    toast.success("Workflow completed!");
  }

  if (loading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /></div>;
  if (!workflow) return <div className="py-16 text-center"><p className="text-muted-foreground">Workflow not found</p></div>;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/workflows"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{workflow.name}</h1>
          {workflow.description && <p className="text-sm text-muted-foreground">{workflow.description}</p>}
        </div>
        <Badge variant="secondary" className="gap-1 text-xs">
          <WorkflowIcon className="h-3 w-3" />
          {steps.length} step{steps.length !== 1 && "s"}
        </Badge>
        {steps.length > 0 && (
          <Button onClick={runWorkflow} disabled={running} className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600">
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {running ? `Running (${Object.keys(runResults).length}/${steps.length})...` : "Run Workflow"}
          </Button>
        )}
      </div>

      {/* Steps Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <WorkflowIcon className="h-4 w-4 text-emerald-500" />
            Workflow Steps
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {steps.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <WorkflowIcon className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No steps yet. Add your first step below.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {steps.map((step, idx) => {
                const isRunning = running && currentStepIdx === idx;
                const isCompleted = running && currentStepIdx > idx;
                const hasResult = !running && !!runResults[step.id];
                return (
                  <Card key={step.id} className={`border-l-4 transition-all ${isRunning ? "border-l-emerald-500 shadow-md" : isCompleted ? "border-l-emerald-500" : hasResult ? "border-l-emerald-400" : "border-l-emerald-200"}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                            isRunning ? "bg-emerald-500 text-white animate-pulse" :
                            isCompleted ? "bg-emerald-500 text-white" :
                            hasResult ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400" :
                            "bg-muted text-muted-foreground"
                          }`}>
                            {isCompleted || hasResult ? <CheckCircle2 className="h-3.5 w-3.5" /> : idx + 1}
                          </span>
                          <CardTitle className="text-sm">{step.title}</CardTitle>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditStep(step)} disabled={running}>
                            <Edit3 className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                          {idx > 0 && (
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveStep(step.id, "up")} disabled={running}>
                              <ArrowUp className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                          )}
                          {idx < steps.length - 1 && (
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveStep(step.id, "down")} disabled={running}>
                              <ArrowDown className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteStep(step.id)} disabled={running}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      {step.instructions && <CardDescription className="text-xs mt-1">{step.instructions}</CardDescription>}
                    </CardHeader>
                    <CardContent>
                      <pre className="max-h-16 overflow-y-auto rounded bg-muted p-2 text-xs">{step.prompt_text}</pre>
                      {(runResults[step.id] || (running && currentStepIdx === idx)) && (
                        <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-900 dark:bg-emerald-950/30">
                          <div className="flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                            {running && currentStepIdx === idx ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-3 w-3" />
                            )}
                            Output
                          </div>
                          <pre className={`mt-1 whitespace-pre-wrap text-xs text-muted-foreground ${running && currentStepIdx === idx ? "animate-pulse" : ""}`}>
                            {runResults[step.id] || "Processing..."}
                          </pre>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Run History */}
      {runs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="h-4 w-4 text-muted-foreground" />
              Recent Runs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {runs.map((run) => (
                <div key={run.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant={run.status === "completed" ? "default" : "secondary"} className="text-xs">
                      {run.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(run.started_at).toLocaleString()}
                    </span>
                  </div>
                  {run.completed_at && (
                    <span className="text-xs text-muted-foreground">
                      Duration: {Math.round((new Date(run.completed_at).getTime() - new Date(run.started_at).getTime()) / 1000)}s
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Step */}
      <Card>
        <CardHeader><CardTitle className="text-base">Add Step</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Step title (e.g., Analyze Menu)" value={newStepTitle} onChange={(e) => setNewStepTitle(e.target.value)} />
          <Textarea placeholder="Enter the prompt for this step..." className="min-h-[80px] font-mono text-sm" value={newStepPrompt} onChange={(e) => setNewStepPrompt(e.target.value)} />
          <Input placeholder="Instructions for this step (optional)" value={newStepInstructions} onChange={(e) => setNewStepInstructions(e.target.value)} />
          <Button size="sm" className="gap-2" onClick={addStep} disabled={addingStep || !newStepTitle.trim() || !newStepPrompt.trim()}>
            {addingStep ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Add Step
          </Button>
        </CardContent>
      </Card>

      {/* Edit Step Dialog */}
      <Dialog open={editStepOpen} onOpenChange={setEditStepOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Edit Step</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="estitle">Step Title</Label>
              <Input id="estitle" value={editStepTitle} onChange={(e) => setEditStepTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="esprompt">Prompt</Label>
              <Textarea id="esprompt" className="min-h-[120px] font-mono text-sm" value={editStepPrompt} onChange={(e) => setEditStepPrompt(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="esinst">Instructions</Label>
              <Input id="esinst" value={editStepInstructions} onChange={(e) => setEditStepInstructions(e.target.value)} />
            </div>
            <Button className="w-full" onClick={handleEditStep} disabled={savingEditStep || !editStepTitle.trim() || !editStepPrompt.trim()}>
              {savingEditStep && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Step
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
