"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Prompt, Folder, PromptFolderMapping } from "@/lib/types";

export function usePrompts() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrompts = useCallback(async () => {
    const supabase = createClient();
    setLoading(true);
    const { data, error } = await supabase
      .from("prompts")
      .select("*")
      .eq("status", "active")
      .order("updated_at", { ascending: false });
    if (error) setError(error.message);
    else setPrompts(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchPrompts(); }, [fetchPrompts]);

  return { prompts, loading, error, refetch: fetchPrompts };
}

export function useFolders() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFolders = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("folders")
      .select("*")
      .order("folder_name");
    setFolders(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchFolders(); }, [fetchFolders]);

  return { folders, loading, refetch: fetchFolders };
}

export function useFolderMappings() {
  const [mappings, setMappings] = useState<PromptFolderMapping[]>([]);

  const fetchMappings = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from("prompt_folder_mapping").select("*");
    setMappings(data || []);
  }, []);

  useEffect(() => { fetchMappings(); }, [fetchMappings]);

  return { mappings, refetch: fetchMappings };
}
