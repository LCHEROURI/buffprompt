"use client";
import { Badge } from "@/components/ui/badge";
import { useState, useMemo, useRef } from "react";
import Link from "next/link";
import { PromptCard } from "@/components/prompt-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { usePrompts } from "@/lib/store";
import { PROMPT_CATEGORIES, AI_PLATFORMS } from "@/lib/types";
import { exportPrompts, type ExportFormat } from "@/lib/export";
import { parseFile, type ParsedImport } from "@/lib/import";
import { createClient } from "@/lib/supabase/client";
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  FileText,
  Download,
  Upload,
  Loader2,
  FileDown,
  Check,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

export default function PromptsPage() {
  const { prompts, loading, refetch } = usePrompts();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [sortBy, setSortBy] = useState("updated_at");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [exporting, setExporting] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importPreview, setImportPreview] = useState<ParsedImport[] | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredPrompts = useMemo(() => {
    let result = [...prompts];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.prompt_text.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q)) ||
          p.description?.toLowerCase().includes(q)
      );
    }
    if (categoryFilter !== "all") result = result.filter((p) => p.category === categoryFilter);
    if (platformFilter !== "all") result = result.filter((p) => p.ai_platform === platformFilter);
    result.sort((a, b) => {
      if (sortBy === "title") return a.title.localeCompare(b.title);
      if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
    return result;
  }, [prompts, searchQuery, categoryFilter, platformFilter, sortBy]);

  async function handleExportAll(format: ExportFormat) {
    if (filteredPrompts.length === 0) {
      toast.error("No prompts to export");
      return;
    }
    setExporting(true);
    try {
      await exportPrompts(filteredPrompts, format, `prompts-export-${new Date().toISOString().slice(0, 10)}`);
      toast.success(`Exported ${filteredPrompts.length} prompts as ${format.toUpperCase()}`);
    } catch (err: any) {
      toast.error(err.message || "Export failed");
    }
    setExporting(false);
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);
    setImportPreview(null);

    try {
      const parsed = await parseFile(file);
      setImportPreview(parsed);
    } catch (err: any) {
      toast.error(err.message || "Failed to parse file");
      setImportPreview([]);
    }
  }

  async function handleImport() {
    if (!importPreview || importPreview.length === 0) {
      toast.error("No prompts to import");
      return;
    }
    setImporting(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please sign in to import");
      setImporting(false);
      return;
    }

    let successCount = 0;
    for (const item of importPreview) {
      const { error } = await supabase.from("prompts").insert({
        user_id: user.id,
        title: item.title,
        description: item.description,
        prompt_text: item.prompt_text,
        category: item.category,
        ai_platform: item.ai_platform,
        tags: item.tags,
      });
      if (!error) successCount++;
    }

    setImporting(false);
    setImportOpen(false);
    setImportPreview(null);
    setImportFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    if (successCount > 0) {
      toast.success(`Imported ${successCount} prompt${successCount !== 1 ? "s" : ""}!`);
      refetch();
    } else {
      toast.error("Failed to import prompts");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Prompt Library</h1>
          <p className="text-sm text-muted-foreground">
            {filteredPrompts.length} prompt{filteredPrompts.length !== 1 && "s"}
          </p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="outline" className="gap-2" disabled={exporting}>
                {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                {exporting ? "Exporting..." : "Export"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => handleExportAll("txt")}><FileDown className="mr-2 h-4 w-4" /> TXT</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportAll("md")}><FileDown className="mr-2 h-4 w-4" /> Markdown</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportAll("csv")}><FileDown className="mr-2 h-4 w-4" /> CSV</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportAll("pdf")}><FileDown className="mr-2 h-4 w-4" /> PDF</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportAll("docx")}><FileDown className="mr-2 h-4 w-4" /> DOCX</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Dialog open={importOpen} onOpenChange={setImportOpen}>
            <DialogTrigger>
              <Button variant="outline" className="gap-2">
                <Upload className="h-4 w-4" />
                Import
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Import Prompts</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="rounded-lg border-2 border-dashed p-6 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,.md,.csv,.docx"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="import-file"
                  />
                  <Label htmlFor="import-file" className="cursor-pointer">
                    <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                    <p className="text-sm font-medium">
                      {importFile ? importFile.name : "Click to select a file"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Supports TXT, Markdown, CSV, and DOCX files
                    </p>
                  </Label>
                </div>

                {importPreview !== null && (
                  <div className="rounded-lg border p-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <FileText className="h-4 w-4" />
                      Preview: {importPreview.length} prompt{importPreview.length !== 1 && "s"} found
                    </div>
                    <div className="mt-2 max-h-40 space-y-1 overflow-y-auto">
                      {importPreview.map((item, i) => (
                        <div key={i} className="flex items-center gap-2 rounded bg-muted p-2 text-xs">
                          <Check className="h-3 w-3 shrink-0 text-green-500" />
                          <span className="truncate font-medium">{item.title}</span>
                          <Badge variant="outline" className="ml-auto shrink-0 text-xs">{item.category}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  className="w-full gap-2"
                  onClick={handleImport}
                  disabled={!importPreview || importPreview.length === 0 || importing}
                >
                  {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {importing ? "Importing..." : "Import Prompts"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Link href="/prompts/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Prompt
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search prompts by title, content, or tags..." className="pl-9"
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <Select value={categoryFilter} onValueChange={(v) => v && setCategoryFilter(v)}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {PROMPT_CATEGORIES.map((cat) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v) => v && setSortBy(v)}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Sort by" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="updated_at">Last Updated</SelectItem>
              <SelectItem value="title">Title</SelectItem>
              <SelectItem value="rating">Rating</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex rounded-lg border">
            <Button variant={viewMode === "grid" ? "secondary" : "ghost"} size="icon"
              className="h-9 w-9 rounded-none rounded-l-lg" onClick={() => setViewMode("grid")}>
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button variant={viewMode === "list" ? "secondary" : "ghost"} size="icon"
              className="h-9 w-9 rounded-none rounded-r-lg" onClick={() => setViewMode("list")}>
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className={viewMode === "grid" ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" : "space-y-3"}>
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
        </div>
      ) : filteredPrompts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-medium">No prompts found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {searchQuery ? "Try a different search term" : "Get started by creating your first prompt"}
          </p>
          {!searchQuery && <Link href="/prompts/new"><Button className="mt-4 gap-2"><Plus className="h-4 w-4" /> Create Prompt</Button></Link>}
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPrompts.map((prompt) => <PromptCard key={prompt.id} prompt={prompt} />)}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredPrompts.map((prompt) => (
            <Link key={prompt.id} href={`/prompts/${prompt.id}`}
              className="flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-accent">
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{prompt.title}</p>
                {prompt.description && <p className="text-sm text-muted-foreground line-clamp-1">{prompt.description}</p>}
              </div>
              <span className="text-xs text-muted-foreground">{prompt.category}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
