"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Sparkles, Plus, FileText, Notebook, Trash2, Link2 } from "lucide-react";
import { toast } from "sonner";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<any>(null);
  const [prompts, setPrompts] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [addingNote, setAddingNote] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: p } = await supabase.from("projects").select("*").eq("id", params.id).single();
      setProject(p);
      if (p) {
        const { data: mappings } = await supabase.from("project_prompts").select("*, prompts!inner(*)").eq("project_id", p.id);
        setPrompts(mappings?.map((m: any) => m.prompts).filter(Boolean) || []);
        const { data: n } = await supabase.from("project_notes").select("*").eq("project_id", p.id).order("updated_at", { ascending: false });
        setNotes(n || []);
      }
      setLoading(false);
    }
    load();
  }, [params.id]);

  async function addNote() {
    if (!newNoteTitle.trim()) return;
    setAddingNote(true);
    const supabase = createClient();
    const { error } = await supabase.from("project_notes").insert({
      project_id: params.id, title: newNoteTitle.trim(), content: newNoteContent,
    });
    setAddingNote(false);
    if (error) { toast.error(error.message); }
    else {
      toast.success("Note added!");
      setNewNoteTitle(""); setNewNoteContent("");
      const { data: n } = await supabase.from("project_notes").select("*").eq("project_id", params.id).order("updated_at", { ascending: false });
      setNotes(n || []);
    }
  }

  async function deleteNote(noteId: string) {
    const supabase = createClient();
    await supabase.from("project_notes").delete().eq("id", noteId);
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
    toast.success("Note deleted");
  }

  if (loading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /></div>;
  if (!project) return <div className="py-16 text-center"><p className="text-muted-foreground">Project not found</p></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/projects"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg text-xl" style={{ backgroundColor: project.color + "20" }}>
            {project.emoji}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
            {project.description && <p className="text-sm text-muted-foreground">{project.description}</p>}
          </div>
        </div>
      </div>

      <Tabs defaultValue="prompts">
        <TabsList>
          <TabsTrigger value="prompts" className="gap-2"><Sparkles className="h-4 w-4" />Prompts ({prompts.length})</TabsTrigger>
          <TabsTrigger value="notes" className="gap-2"><Notebook className="h-4 w-4" />Notes ({notes.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="prompts" className="space-y-4 mt-4">
          <div className="flex gap-2">
            <Link href="/prompts/new"><Button size="sm" className="gap-2"><Plus className="h-4 w-4" />New Prompt</Button></Link>
          </div>
          {prompts.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <Sparkles className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No prompts in this project yet</p>
              <Link href="/prompts/new"><Button variant="link">Create one</Button></Link>
            </div>
          ) : (
            <div className="space-y-2">
              {prompts.map((prompt: any) => (
                <Link key={prompt.id} href={`/prompts/${prompt.id}`}
                  className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{prompt.title}</p>
                    <p className="text-xs text-muted-foreground">{prompt.category}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="notes" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Add Note</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Input placeholder="Note title" value={newNoteTitle} onChange={(e) => setNewNoteTitle(e.target.value)} />
              <Textarea placeholder="Write your note..." className="min-h-[100px]" value={newNoteContent} onChange={(e) => setNewNoteContent(e.target.value)} />
              <Button size="sm" onClick={addNote} disabled={addingNote || !newNoteTitle.trim()}>
                {addingNote ? <Skeleton className="h-4 w-16" /> : "Add Note"}
              </Button>
            </CardContent>
          </Card>

          {notes.map((note) => (
            <Card key={note.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">{note.title}</CardTitle>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteNote(note.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">{note.content}</p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
