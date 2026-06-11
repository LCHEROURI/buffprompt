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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { PROJECT_EMOJIS, PROJECT_COLORS } from "@/lib/types";
import { FolderKanban, Plus, Loader2, ArrowRight, FileText, Notebook } from "lucide-react";
import { toast } from "sonner";

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [emoji, setEmoji] = useState<string>(PROJECT_EMOJIS[0]);
  const [color, setColor] = useState(PROJECT_COLORS[0]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase.from("projects").select("*").order("updated_at", { ascending: false });
      setProjects(data || []);
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
    const { error } = await supabase.from("projects").insert({
      user_id: user.id, name: name.trim(), description: description || null, emoji, color,
    });
    setCreating(false);
    if (error) { toast.error(error.message); }
    else { toast.success("Project created!"); setOpen(false); setName(""); setDescription(""); window.location.reload(); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <FolderKanban className="h-6 w-6 text-indigo-500" />
            AI Projects
          </h1>
          <p className="text-sm text-muted-foreground">{projects.length} project{projects.length !== 1 && "s"}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger>
            <Button className="gap-2"><Plus className="h-4 w-4" />New Project</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Project</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Icon</Label>
                <div className="flex flex-wrap gap-2">
                  {PROJECT_EMOJIS.map((e) => (
                    <button key={e} type="button"
                      className={`h-9 w-9 rounded-lg text-lg transition-all ${emoji === e ? "ring-2 ring-foreground scale-110" : "hover:bg-accent"}`}
                      onClick={() => setEmoji(e)}
                    >{e}</button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-2">
                  {PROJECT_COLORS.map((c) => (
                    <button key={c} type="button"
                      className={`h-7 w-7 rounded-full transition-all ${color === c ? "ring-2 ring-foreground scale-110" : ""}`}
                      style={{ backgroundColor: c }}
                      onClick={() => setColor(c)}
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pname">Project Name</Label>
                <Input id="pname" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Restaurant Growth Engine" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pdesc">Description</Label>
                <Input id="pdesc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's this project about?" />
              </div>
              <Button className="w-full" onClick={handleCreate} disabled={creating || !name.trim()}>
                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Project
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <FolderKanban className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-medium">No projects yet</h3>
          <p className="text-sm text-muted-foreground">Create your first AI project</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg text-xl"
                      style={{ backgroundColor: project.color + "20" }}>
                      {project.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate">{project.name}</CardTitle>
                      {project.description && (
                        <p className="text-xs text-muted-foreground truncate">{project.description}</p>
                      )}
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
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
