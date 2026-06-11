"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Prompt, Folder, PromptFolderMapping } from "@/lib/types";

export function usePrompts() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const fetchPrompts = useCallback(async () => {
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
  const supabase = createClient();

  const fetchFolders = useCallback(async () => {
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
  const supabase = createClient();

  const fetchMappings = useCallback(async () => {
    const { data } = await supabase.from("prompt_folder_mapping").select("*");
    setMappings(data || []);
  }, []);

  useEffect(() => { fetchMappings(); }, [fetchMappings]);

  return { mappings, refetch: fetchMappings };
}
