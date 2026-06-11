"use client";

import { useState, useEffect, useMemo, useRef } from "react";
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
import {
  Library, Plus, Upload, FileText, Link2, Trash2, Loader2, FileIcon,
  Search, Edit3, ArrowUpDown, Download, AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

const FILE_TYPES = ["PDF", "Word", "Image", "Research", "Other"] as const;

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(type: string) {
  switch (type) {
    case "PDF": return <FileText className="h-5 w-5 text-red-500" />;
    case "Word": return <FileText className="h-5 w-5 text-blue-500" />;
    case "Image": return <FileIcon className="h-5 w-5 text-green-500" />;
    case "Research": return <FileText className="h-5 w-5 text-purple-500" />;
    default: return <FileIcon className="h-5 w-5 text-muted-foreground" />;
  }
}

function getFileTypeColor(type: string): string {
  switch (type) {
    case "PDF": return "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400";
    case "Word": return "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400";
    case "Image": return "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400";
    case "Research": return "bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400";
    default: return "";
  }
}

export default function KnowledgeBasePage() {
  const { prompts } = usePrompts();
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [typeFilter, setTypeFilter] = useState("all");

  // Add dialog state
  const [addOpen, setAddOpen] = useState(false);
  const [addName, setAddName] = useState("");
  const [addDescription, setAddDescription] = useState("");
  const [addFileType, setAddFileType] = useState("PDF");
  const [addSelectedPrompt, setAddSelectedPrompt] = useState("");
  const [adding, setAdding] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editFile, setEditFile] = useState<any>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editFileType, setEditFileType] = useState("PDF");
  const [editSelectedPrompt, setEditSelectedPrompt] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete state
  const [savingDelete, setSavingDelete] = useState<string | null>(null);

  async function loadFiles() {
    const supabase = createClient();
    const { data } = await supabase.from("knowledge_files").select("*").order("created_at", { ascending: false });
    setFiles(data || []);
    setLoading(false);
  }

  useEffect(() => { loadFiles(); }, []);

  const filteredFiles = useMemo(() => {
    let result = [...files];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          (f.description || "").toLowerCase().includes(q) ||
          f.file_type.toLowerCase().includes(q)
      );
    }

    if (typeFilter !== "all") {
      result = result.filter((f) => f.file_type === typeFilter);
    }

    const promptMap = new Map(prompts.map((p) => [p.id, p.title]));

    result.sort((a, b) => {
      if (sortBy === "oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "type") return a.file_type.localeCompare(b.file_type);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return { files: result, promptMap };
  }, [files, searchQuery, typeFilter, sortBy, prompts]);

  async function handleUploadAndAdd() {
    if (!addName.trim()) { toast.error("File name is required"); return; }
    setAdding(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setAdding(false); return; }

    let fileUrl = "#";
    let fileSize = 0;

    // Upload file to Supabase Storage if provided
    if (uploadFile) {
      const filePath = `${user.id}/${Date.now()}_${uploadFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("knowledge-files")
        .upload(filePath, uploadFile);
      if (uploadError) {
        toast.error("Upload failed: " + uploadError.message);
        setAdding(false);
        return;
      }
      const { data: urlData } = await supabase.storage
        .from("knowledge-files")
        .getPublicUrl(filePath);
      fileUrl = urlData?.publicUrl || "#";
      fileSize = uploadFile.size;
    }

    const { error } = await supabase.from("knowledge_files").insert({
      user_id: user.id,
      name: addName.trim(),
      description: addDescription || null,
      file_url: fileUrl,
      file_type: addFileType,
      file_size: fileSize,
      prompt_id: addSelectedPrompt || null,
    });

    setAdding(false);
    if (error) { toast.error(error.message); }
    else {
      toast.success("File added!");
      setAddOpen(false);
      setAddName("");
      setAddDescription("");
      setAddFileType("PDF");
      setAddSelectedPrompt("");
      setUploadFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      loadFiles();
    }
  }

  function openEdit(file: any) {
    setEditFile(file);
    setEditName(file.name);
    setEditDescription(file.description || "");
    setEditFileType(file.file_type);
    setEditSelectedPrompt(file.prompt_id || "");
    setEditOpen(true);
  }

  async function handleEdit() {
    if (!editFile || !editName.trim()) return;
    setSavingEdit(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("knowledge_files")
      .update({
        name: editName.trim(),
        description: editDescription || null,
        file_type: editFileType,
        prompt_id: editSelectedPrompt || null,
      })
      .eq("id", editFile.id);
    setSavingEdit(false);
    if (error) { toast.error(error.message); }
    else {
      toast.success("File updated!");
      setEditOpen(false);
      setEditFile(null);
      loadFiles();
    }
  }

  async function handleDelete(fileId: string, fileName: string) {
    if (!confirm(`Delete "${fileName}"? This action cannot be undone.`)) return;
    setSavingDelete(fileId);
    const supabase = createClient();
    const { error } = await supabase.from("knowledge_files").delete().eq("id", fileId);
    setSavingDelete(null);
    if (error) { toast.error(error.message); }
    else {
      toast.success("File deleted");
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
    }
  }

  const { files: displayFiles, promptMap } = filteredFiles;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Library className="h-6 w-6 text-amber-500" />
            Knowledge Base
          </h1>
          <p className="text-sm text-muted-foreground">
            {displayFiles.length} file{displayFiles.length !== 1 && "s"} stored
          </p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger>
            <Button className="gap-2"><Plus className="h-4 w-4" />Add File</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle>Add Knowledge File</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-4">
              {/* File upload area */}
              <div className="rounded-lg border-2 border-dashed p-6 text-center transition-colors hover:border-muted-foreground/50">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setUploadFile(file);
                      if (!addName) setAddName(file.name.replace(/\.[^/.]+$/, ""));
                    }
                  }}
                  className="hidden"
                  id="file-upload"
                />
                <Label htmlFor="file-upload" className="cursor-pointer">
                  {uploadFile ? (
                    <>
                      <FileText className="mx-auto mb-2 h-8 w-8 text-primary" />
                      <p className="text-sm font-medium">{uploadFile.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatFileSize(uploadFile.size)} — Click to change
                      </p>
                    </>
                  ) : (
                    <>
                      <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                      <p className="text-sm font-medium">Click to upload a file</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        PDFs, documents, images, and more
                      </p>
                    </>
                  )}
                </Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="addName">File Name</Label>
                <Input id="addName" value={addName} onChange={(e) => setAddName(e.target.value)} placeholder="e.g., Restaurant Menu Analysis" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="addDesc">Description</Label>
                <Input id="addDesc" value={addDescription} onChange={(e) => setAddDescription(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>File Type</Label>
                <Select value={addFileType} onValueChange={(v) => v && setAddFileType(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FILE_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t === "Word" ? "Word Document" : t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Link to Prompt (optional)</Label>
                <Select value={addSelectedPrompt} onValueChange={(v) => v && setAddSelectedPrompt(v)}>
                  <SelectTrigger><SelectValue placeholder="Select a prompt..." /></SelectTrigger>
                  <SelectContent>
                    {prompts.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full gap-2" onClick={handleUploadAndAdd} disabled={adding || !addName.trim()}>
                {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {adding ? "Uploading..." : "Add to Knowledge Base"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search files by name, description, or type..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select value={typeFilter} onValueChange={(v) => v && setTypeFilter(v)}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="File Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {FILE_TYPES.map((t) => (
                <SelectItem key={t} value={t}>{t === "Word" ? "Word" : t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v) => v && setSortBy(v)}>
            <SelectTrigger className="w-[140px]">
              <ArrowUpDown className="mr-2 h-3.5 w-3.5" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="name">Name A-Z</SelectItem>
              <SelectItem value="type">File Type</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* File List */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : displayFiles.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          {searchQuery || typeFilter !== "all" ? (
            <>
              <Search className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-medium">No files match your search</h3>
              <p className="mt-1 text-sm text-muted-foreground">Try a different search or filter</p>
              <Button variant="link" onClick={() => { setSearchQuery(""); setTypeFilter("all"); }}>
                Clear filters
              </Button>
            </>
          ) : (
            <>
              <Library className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-medium">No files yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Upload PDFs, documents, and research files to build your knowledge base
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {displayFiles.map((file) => (
            <Card key={file.id} className="group transition-all hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                      {getFileIcon(file.file_type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="truncate text-sm">{file.name}</CardTitle>
                      {file.description && (
                        <CardDescription className="truncate text-xs">{file.description}</CardDescription>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEdit(file)}
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(file.id, file.name)}
                      disabled={savingDelete === file.id}
                    >
                      {savingDelete === file.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="secondary" className={`text-xs ${getFileTypeColor(file.file_type)}`}>
                    {file.file_type}
                  </Badge>
                  {file.file_size > 0 && (
                    <span className="text-muted-foreground">{formatFileSize(file.file_size)}</span>
                  )}
                  <span className="text-muted-foreground">•</span>
                  <span>{new Date(file.created_at).toLocaleDateString()}</span>
                  {file.file_url && file.file_url !== "#" && (
                    <>
                      <span className="text-muted-foreground">•</span>
                      <a
                        href={file.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        <Download className="h-3 w-3" />
                        Open
                      </a>
                    </>
                  )}
                  {file.prompt_id && promptMap.has(file.prompt_id) && (
                    <>
                      <span className="text-muted-foreground">•</span>
                      <Badge variant="outline" className="gap-1 text-xs">
                        <Link2 className="h-3 w-3" />
                        {promptMap.get(file.prompt_id)}
                      </Badge>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit File</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                {editFile && getFileIcon(editFile.file_type)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{editFile?.name}</p>
                <p className="text-xs text-muted-foreground">{editFile?.file_type}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editName">File Name</Label>
              <Input id="editName" value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editDesc">Description</Label>
              <Input id="editDesc" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>File Type</Label>
              <Select value={editFileType} onValueChange={(v) => v && setEditFileType(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FILE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t === "Word" ? "Word Document" : t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Link to Prompt</Label>
              <Select value={editSelectedPrompt} onValueChange={(v) => v && setEditSelectedPrompt(v)}>
                <SelectTrigger><SelectValue placeholder="Select a prompt..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {prompts.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
