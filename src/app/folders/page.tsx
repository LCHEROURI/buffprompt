"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFolders } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import { FOLDER_COLORS } from "@/lib/types";
import { FolderIcon, Plus, Folder, Loader2, Edit3, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function FoldersPage() {
  const { folders, loading, refetch } = useFolders();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(FOLDER_COLORS[0]);
  const [creating, setCreating] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editFolder, setEditFolder] = useState<any>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [savingDelete, setSavingDelete] = useState<string | null>(null);

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }
    const { error } = await supabase.from("folders").insert({
      user_id: user.id,
      folder_name: newName.trim(),
      color: newColor,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Folder created!");
      setNewName("");
      setOpen(false);
      refetch();
    }
    setCreating(false);
  }

  async function handleEdit() {
    if (!editFolder || !editName.trim()) return;
    setSavingEdit(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("folders")
      .update({ folder_name: editName.trim(), color: editColor })
      .eq("id", editFolder.id);
    setSavingEdit(false);
    if (error) { toast.error(error.message); }
    else {
      toast.success("Folder updated!");
      setEditOpen(false);
      setEditFolder(null);
      refetch();
    }
  }

  async function handleDelete(folderId: string, folderName: string) {
    if (!confirm(`Delete folder "${folderName}"? This will unlink all prompts in this folder.`)) return;
    setSavingDelete(folderId);
    const supabase = createClient();
    const { error } = await supabase.from("folders").delete().eq("id", folderId);
    setSavingDelete(null);
    if (error) { toast.error(error.message); }
    else {
      toast.success("Folder deleted!");
      refetch();
    }
  }

  function openEdit(folder: any) {
    setEditFolder(folder);
    setEditName(folder.folder_name);
    setEditColor(folder.color);
    setEditOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <FolderIcon className="h-6 w-6 text-indigo-500" />
            Folders
          </h1>
          <p className="text-sm text-muted-foreground">
            {folders.length} folder{folders.length !== 1 && "s"}
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Folder
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Folder</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="folderName">Folder Name</Label>
                <Input
                  id="folderName"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g., Marketing Prompts"
                />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-2">
                  {FOLDER_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`h-8 w-8 rounded-full border-2 transition-all ${
                        newColor === color
                          ? "border-foreground scale-110"
                          : "border-transparent"
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewColor(color)}
                    />
                  ))}
                </div>
              </div>
              <Button
                className="w-full"
                onClick={handleCreate}
                disabled={creating || !newName.trim()}
              >
                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Folder
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : folders.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <Folder className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-medium">No folders yet</h3>
          <p className="text-sm text-muted-foreground">
            Create folders to organize your prompts
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {folders.map((folder) => (
            <Card key={folder.id} className="group transition-all hover:shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg shrink-0"
                    style={{ backgroundColor: folder.color + "20" }}
                  >
                    <FolderIcon
                      className="h-5 w-5"
                      style={{ color: folder.color }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">
                      {folder.folder_name}
                    </CardTitle>
                  </div>
                  <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEdit(folder)}
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(folder.id, folder.folder_name)}
                      disabled={savingDelete === folder.id}
                    >
                      {savingDelete === folder.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Folder Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Folder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="editFolderName">Folder Name</Label>
              <Input
                id="editFolderName"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Folder name"
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2">
                {FOLDER_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`h-8 w-8 rounded-full border-2 transition-all ${
                      editColor === color
                        ? "border-foreground scale-110"
                        : "border-transparent"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setEditColor(color)}
                  />
                ))}
              </div>
            </div>
            <Button
              className="w-full"
              onClick={handleEdit}
              disabled={savingEdit || !editName.trim()}
            >
              {savingEdit && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
