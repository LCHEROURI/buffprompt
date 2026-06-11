"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { PROMPT_CATEGORIES, AI_PLATFORMS } from "@/lib/types";
import { Store, Search, ShoppingCart, Star, Download, Sparkles } from "lucide-react";
import { toast } from "sonner";

const DEMO_LISTINGS = [
  { id: "1", title: "Restaurant Menu Analyzer", description: "Complete menu analysis framework for restaurants", price: 9.99, category: "Restaurants", platform: "ChatGPT", rating: 4.8, sales: 234, tags: ["menu", "restaurant", "analysis"] },
  { id: "2", title: "Social Media Content Engine", description: "Generate 30 days of social media content", price: 14.99, category: "Social Media", platform: "Claude", rating: 4.6, sales: 189, tags: ["social", "content", "marketing"] },
  { id: "3", title: "Customer Avatar Builder", description: "Deep customer persona creation framework", price: 7.99, category: "Marketing", platform: "ChatGPT", rating: 4.9, sales: 421, tags: ["persona", "avatar", "marketing"] },
  { id: "4", title: "Code Review Assistant", description: "Expert code review prompt for developers", price: 5.99, category: "Coding", platform: "Codex", rating: 4.7, sales: 156, tags: ["code", "review", "development"] },
  { id: "5", title: "SEO Content Optimizer", description: "Optimize content for search engines", price: 11.99, category: "Marketing", platform: "ChatGPT", rating: 4.5, sales: 98, tags: ["seo", "content", "optimization"] },
  { id: "6", title: "Business Plan Generator", description: "Comprehensive business plan creation", price: 19.99, category: "Business", platform: "Gemini", rating: 4.4, sales: 67, tags: ["business", "plan", "startup"] },
];

export default function MarketplacePage() {
  const [search, setSearch] = useState("");

  const filtered = DEMO_LISTINGS.filter(
    (item) =>
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase()) ||
      item.tags.some((t) => t.includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Store className="h-6 w-6 text-orange-500" />
          Prompt Marketplace
        </h1>
        <p className="text-sm text-muted-foreground">Discover premium prompts from the community</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search marketplace..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item) => (
          <Card key={item.id} className="flex flex-col transition-all hover:shadow-md">
            <CardHeader>
              <div className="flex items-start justify-between">
                <Badge>{item.category}</Badge>
                <Badge variant="outline" className="text-xs">{item.platform}</Badge>
              </div>
              <CardTitle className="mt-2 text-base">{item.title}</CardTitle>
              <CardDescription className="text-xs">{item.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="flex items-center gap-2 text-sm">
                <div className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{item.rating}</span>
                </div>
                <span className="text-muted-foreground">({item.sales} sold)</span>
              </div>
            </CardContent>
            <CardFooter className="flex items-center justify-between border-t pt-3">
              <span className="text-lg font-bold">${item.price}</span>
              <Button size="sm" className="gap-2">
                <ShoppingCart className="h-4 w-4" />
                Purchase
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center py-16 text-center">
          <Store className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-medium">No listings found</h3>
          <p className="text-sm text-muted-foreground">Try a different search term</p>
        </div>
      )}
    </div>
  );
}
