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
import { FolderKanban, Plus, Loader2, ArrowRight, Edit3, Trash2 } from "lucide-react";
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
  const [editOpen, setEditOpen] = useState(false);
  const [editProject, setEditProject] = useState<any>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editEmoji, setEditEmoji] = useState<string>(PROJECT_EMOJIS[0]);
  const [editColor, setEditColor] = useState(PROJECT_COLORS[0]);
  const [savingEdit, setSavingEdit] = useState(false);
  const [savingDelete, setSavingDelete] = useState<string | null>(null);

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
    else { toast.success("Project created!"); setOpen(false); setName(""); setDescription(""); router.refresh(); }
  }

  async function handleEdit() {
    if (!editProject || !editName.trim()) return;
    setSavingEdit(true);
    const supabase = createClient();
    const { error } = await supabase.from("projects").update({
      name: editName.trim(), description: editDescription || null, emoji: editEmoji, color: editColor,
    }).eq("id", editProject.id);
    setSavingEdit(false);
    if (error) { toast.error(error.message); }
    else {
      toast.success("Project updated!");
      setEditOpen(false);
      setEditProject(null);
      const { data } = await supabase.from("projects").select("*").order("updated_at", { ascending: false });
      setProjects(data || []);
    }
  }

  async function handleDelete(projectId: string, projectName: string) {
    if (!confirm(`Delete project "${projectName}"? This will remove all linked prompts and notes.`)) return;
    setSavingDelete(projectId);
    const supabase = createClient();
    const { error } = await supabase.from("projects").delete().eq("id", projectId);
    setSavingDelete(null);
    if (error) { toast.error(error.message); }
    else {
      toast.success("Project deleted!");
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
    }
  }

  function openEdit(project: any) {
    setEditProject(project);
    setEditName(project.name);
    setEditDescription(project.description || "");
    setEditEmoji(project.emoji);
    setEditColor(project.color);
    setEditOpen(true);
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
            <div key={project.id} className="group relative">
              <Link href={`/projects/${project.id}`}>
                <Card className="cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg text-xl shrink-0"
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
              <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => { e.preventDefault(); openEdit(project); }}
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={(e) => { e.preventDefault(); handleDelete(project.id, project.name); }}
                  disabled={savingDelete === project.id}
                >
                  {savingDelete === project.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Project Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Project</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Icon</Label>
              <div className="flex flex-wrap gap-2">
                {PROJECT_EMOJIS.map((e) => (
                  <button key={e} type="button"
                    className={`h-9 w-9 rounded-lg text-lg transition-all ${editEmoji === e ? "ring-2 ring-foreground scale-110" : "hover:bg-accent"}`}
                    onClick={() => setEditEmoji(e)}
                  >{e}</button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2">
                {PROJECT_COLORS.map((c) => (
                  <button key={c} type="button"
                    className={`h-7 w-7 rounded-full transition-all ${editColor === c ? "ring-2 ring-foreground scale-110" : ""}`}
                    style={{ backgroundColor: c }}
                    onClick={() => setEditColor(c)}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="epname">Project Name</Label>
              <Input id="epname" value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="epdesc">Description</Label>
              <Input id="epdesc" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
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
