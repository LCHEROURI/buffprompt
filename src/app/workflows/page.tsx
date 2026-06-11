"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { WorkflowIcon, Plus, Loader2, Play, ArrowRight, Layers } from "lucide-react";
import { toast } from "sonner";

export default function WorkflowsPage() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase.from("workflows").select("*").order("updated_at", { ascending: false });
      setWorkflows(data || []);
      setLoading(false);
    }
    load();
  }, []);

  async function handleCreate() {
    if (!name.trim()) return;
    setCreating(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    const { data, error } = await supabase.from("workflows").insert({
      user_id: user.id, name: name.trim(), description: description || null,
    }).select().single();
    setCreating(false);
    if (error) { toast.error(error.message); }
    else { toast.success("Workflow created!"); setOpen(false); router.push(`/workflows/${data.id}`); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <WorkflowIcon className="h-6 w-6 text-emerald-500" />
            Prompt Workflows
          </h1>
          <p className="text-sm text-muted-foreground">Chain prompts together in sequential steps</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
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

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      ) : workflows.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <Layers className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-medium">No workflows yet</h3>
          <p className="text-sm text-muted-foreground">Create your first prompt chain workflow</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workflows.map((wf) => (
            <Link key={wf.id} href={`/workflows/${wf.id}`}>
              <Card className="cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/50">
                      <WorkflowIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate">{wf.name}</CardTitle>
                      {wf.description && <CardDescription className="text-xs truncate">{wf.description}</CardDescription>}
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
