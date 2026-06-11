"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { usePrompts } from "@/lib/store";
import { Library, Plus, Upload, FileText, Link2, Trash2, Loader2, FileIcon } from "lucide-react";
import { toast } from "sonner";

export default function KnowledgeBasePage() {
  const { prompts } = usePrompts();
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [fileType, setFileType] = useState("PDF");
  const [selectedPrompt, setSelectedPrompt] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase.from("knowledge_files").select("*").order("created_at", { ascending: false });
      setFiles(data || []);
      setLoading(false);
    }
    load();
  }, []);

  async function handleAdd() {
    if (!name.trim()) { toast.error("File name is required"); return; }
    setAdding(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("knowledge_files").insert({
      user_id: user.id, name: name.trim(), description: description || null,
      file_url: "#", file_type: fileType, file_size: 0,
      prompt_id: selectedPrompt || null,
    });
    setAdding(false);
    if (error) { toast.error(error.message); }
    else {
      toast.success("File added!");
      setOpen(false); setName(""); setDescription("");
      const { data } = await supabase.from("knowledge_files").select("*").order("created_at", { ascending: false });
      setFiles(data || []);
    }
  }

  async function deleteFile(fileId: string) {
    const supabase = createClient();
    await supabase.from("knowledge_files").delete().eq("id", fileId);
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    toast.success("File removed");
  }

  function getFileIcon(type: string) {
    switch (type) {
      case "PDF": return <FileText className="h-5 w-5 text-red-500" />;
      case "Word": return <FileText className="h-5 w-5 text-blue-500" />;
      case "Image": return <FileIcon className="h-5 w-5 text-green-500" />;
      default: return <FileText className="h-5 w-5 text-muted-foreground" />;
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Library className="h-6 w-6 text-amber-500" />
            Knowledge Base
          </h1>
          <p className="text-sm text-muted-foreground">Store PDFs, documents, and research linked to prompts</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger>
            <Button className="gap-2"><Plus className="h-4 w-4" />Add File</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Knowledge File</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="fname">File Name</Label>
                <Input id="fname" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Restaurant Menu Analysis.pdf" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fdesc">Description</Label>
                <Input id="fdesc" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>File Type</Label>
                <Select value={fileType} onValueChange={(v: string | null) => v && setFileType(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PDF">PDF</SelectItem>
                    <SelectItem value="Word">Word Document</SelectItem>
                    <SelectItem value="Image">Image</SelectItem>
                    <SelectItem value="Research">Research File</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Link to Prompt (optional)</Label>
                <Select value={selectedPrompt} onValueChange={(v: string | null) => v && setSelectedPrompt(v)}>
                  <SelectTrigger><SelectValue placeholder="Select a prompt..." /></SelectTrigger>
                  <SelectContent>
                    {prompts.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full gap-2" onClick={handleAdd} disabled={adding || !name.trim()}>
                {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Add to Knowledge Base
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : files.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <Library className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-medium">No files yet</h3>
          <p className="text-sm text-muted-foreground">Upload documents and link them to prompts</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {files.map((file) => (
            <Card key={file.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {getFileIcon(file.file_type)}
                    <div className="min-w-0">
                      <CardTitle className="text-sm truncate">{file.name}</CardTitle>
                      {file.description && <CardDescription className="text-xs truncate">{file.description}</CardDescription>}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => deleteFile(file.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="secondary" className="text-xs">{file.file_type}</Badge>
                  {file.prompt_id && <Badge variant="outline" className="gap-1 text-xs"><Link2 className="h-3 w-3" />Linked</Badge>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
