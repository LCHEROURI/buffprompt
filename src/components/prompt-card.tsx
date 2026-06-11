"use client";

import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, Star, StarOff, Clock, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { Prompt } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface PromptCardProps {
  prompt: Prompt;
  onToggleFavorite?: () => void;
}

export function PromptCard({ prompt, onToggleFavorite }: PromptCardProps) {
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(prompt.favorite);
  const supabase = createClient();

  async function handleCopy() {
    await navigator.clipboard.writeText(prompt.prompt_text);
    toast.success("Copied to clipboard");
    await supabase.from("usage_history").upsert(
      { prompt_id: prompt.id, last_used: new Date().toISOString() },
      { onConflict: "prompt_id" }
    );
  }

  async function handleToggleFavorite() {
    const newVal = !isFavorite;
    setIsFavorite(newVal);
    const { error } = await supabase
      .from("prompts")
      .update({ favorite: newVal })
      .eq("id", prompt.id);
    if (error) {
      setIsFavorite(!newVal);
      toast.error("Failed to update");
    } else {
      onToggleFavorite?.();
    }
  }

  return (
    <Card className="group relative flex flex-col transition-all hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/prompts/${prompt.id}`} className="flex-1 min-w-0">
            <h3 className="font-semibold leading-tight truncate">{prompt.title}</h3>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={handleToggleFavorite}
          >
            {isFavorite ? (
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            ) : (
              <StarOff className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </div>
        {prompt.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {prompt.description}
          </p>
        )}
      </CardHeader>
      <CardContent className="flex-1 pb-2">
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary" className="text-xs">
            {prompt.category}
          </Badge>
          {prompt.ai_platform && (
            <Badge variant="outline" className="text-xs">
              {prompt.ai_platform}
            </Badge>
          )}
          {prompt.tags?.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs font-normal">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between border-t pt-3">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {new Date(prompt.updated_at).toLocaleDateString()}
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleCopy}
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
