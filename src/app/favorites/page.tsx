"use client";

import { useMemo } from "react";
import Link from "next/link";
import { PromptCard } from "@/components/prompt-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePrompts } from "@/lib/store";
import { Heart, Plus, Search, Star } from "lucide-react";
import { useState } from "react";

export default function FavoritesPage() {
  const { prompts, loading, refetch } = usePrompts();
  const [search, setSearch] = useState("");

  const favorites = useMemo(() => {
    let result = prompts.filter((p) => p.favorite);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [prompts, search]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Star className="h-6 w-6 text-yellow-400 fill-yellow-400" />
            Favorites
          </h1>
          <p className="text-sm text-muted-foreground">
            {favorites.length} favorite{favorites.length !== 1 && "s"}
          </p>
        </div>
        <Link href="/prompts/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Prompt
          </Button>
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search favorites..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {favorites.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <Heart className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-medium">No favorites yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Star prompts to add them to your favorites
          </p>
          <Link href="/prompts">
            <Button variant="outline" className="mt-4">
              Browse Prompts
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map((prompt) => (
            <PromptCard
              key={prompt.id}
              prompt={prompt}
              onToggleFavorite={refetch}
            />
          ))}
        </div>
      )}
    </div>
  );
}
