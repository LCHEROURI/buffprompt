"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import {
  WorkflowIcon, Plus, Loader2, Layers, Search, Edit3, Trash2, ArrowUpDown,
} from "lucide-react";
import { toast } from "sonner";

export default function WorkflowsPage() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [stepCounts, setStepCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  // Create state
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  // Edit state
  const [editOpen, setEditOpen] = useState(false);
  const [editWorkflow, setEditWorkflow] = useState<any>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete state
  const [savingDelete, setSavingDelete] = useState<string | null>(null);

  const supabase = createClient();

  async function loadData() {
    const { data: w } = await supabase.from("workflows").select("*").order("created_at", { ascending: false });
    setWorkflows(w || []);

    // Get step counts for all workflows
    if (w && w.length > 0) {
      const ids = w.map((wf: any) => wf.id);
      const { data: steps } = await supabase
        .from("workflow_steps")
        .select("workflow_id")
        .in("workflow_id", ids);
      const counts: Record<string, number> = {};
      for (const wf of w) {
        counts[wf.id] = (steps || []).filter((s: any) => s.workflow_id === wf.id).length;
      }
      setStepCounts(counts);
    }
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  const filteredWorkflows = useMemo(() => {
    let result = [...workflows];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (wf) =>
          wf.name.toLowerCase().includes(q) ||
          (wf.description || "").toLowerCase().includes(q)
      );
    }
    result.sort((a, b) => {
      if (sortBy === "oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    return result;
  }, [workflows, searchQuery, sortBy]);

  async function handleCreate() {
    if (!name.trim()) return;
    setCreating(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setCreating(false); router.push("/login"); return; }
    const { data, error } = await supabase.from("workflows").insert({
      user_id: user.id, name: name.trim(), description: description || null,
    }).select().single();
    setCreating(false);
    if (error) { toast.error(error.message); }
    else {
      toast.success("Workflow created!");
      setCreateOpen(false);
      setName("");
      setDescription("");
      router.push(`/workflows/${data.id}`);
    }
  }

  function openEdit(wf: any) {
    setEditWorkflow(wf);
    setEditName(wf.name);
    setEditDescription(wf.description || "");
    setEditOpen(true);
  }

  async function handleEdit() {
    if (!editWorkflow || !editName.trim()) return;
    setSavingEdit(true);
    const { error } = await supabase.from("workflows").update({
      name: editName.trim(), description: editDescription || null,
    }).eq("id", editWorkflow.id);
    setSavingEdit(false);
    if (error) { toast.error(error.message); }
    else {
      toast.success("Workflow updated!");
      setEditOpen(false);
      setEditWorkflow(null);
      loadData();
    }
  }

  async function handleDelete(wfId: string, wfName: string) {
    if (!confirm(`Delete workflow "${wfName}"? All steps and run history will be removed.`)) return;
    setSavingDelete(wfId);
    const { error } = await supabase.from("workflows").delete().eq("id", wfId);
    setSavingDelete(null);
    if (error) { toast.error(error.message); }
    else {
      toast.success("Workflow deleted");
      setWorkflows((prev) => prev.filter((wf) => wf.id !== wfId));
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <WorkflowIcon className="h-6 w-6 text-emerald-500" />
            Prompt Workflows
          </h1>
          <p className="text-sm text-muted-foreground">
            {filteredWorkflows.length} workflow{filteredWorkflows.length !== 1 && "s"}
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger>
            <Button className="gap-2"><Plus className="h-4 w-4" />New Workflow</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Workflow</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="wname">Workflow Name</Label>
                <Input id="wname" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Restaurant Marketing Engine" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wdesc">Description</Label>
                <Input id="wdesc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does this workflow do?" />
              </div>
              <Button className="w-full" onClick={handleCreate} disabled={creating || !name.trim()}>
                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Workflow
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
            placeholder="Search workflows by name..."
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

      {/* Workflow List */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : filteredWorkflows.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          {searchQuery ? (
            <>
              <Search className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-medium">No workflows match your search</h3>
              <p className="mt-1 text-sm text-muted-foreground">Try a different search term</p>
              <Button variant="link" onClick={() => setSearchQuery("")}>Clear search</Button>
            </>
          ) : (
            <>
              <Layers className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-medium">No workflows yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Chain multiple prompts together in sequential steps
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredWorkflows.map((wf) => {
            const count = stepCounts[wf.id] || 0;
            return (
              <div key={wf.id} className="group relative">
                <Link href={`/workflows/${wf.id}`}>
                  <Card className="cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/50">
                          <WorkflowIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base truncate">{wf.name}</CardTitle>
                          {wf.description && (
                            <CardDescription className="text-xs truncate">{wf.description}</CardDescription>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <Badge variant="secondary" className="text-xs">
                        <Layers className="mr-1 h-3 w-3" />
                        {count} step{count !== 1 && "s"}
                      </Badge>
                    </CardContent>
                  </Card>
                </Link>
                <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => { e.preventDefault(); openEdit(wf); }}
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={(e) => { e.preventDefault(); handleDelete(wf.id, wf.name); }}
                    disabled={savingDelete === wf.id}
                  >
                    {savingDelete === wf.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Workflow</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="ewname">Workflow Name</Label>
              <Input id="ewname" value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ewdesc">Description</Label>
              <Input id="ewdesc" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
            </div>
            <Button className="w-full" onClick={handleEdit} disabled={savingEdit || !editName.trim()}>
              {savingEdit && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
