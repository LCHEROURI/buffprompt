export type AIPlatform =
  | "ChatGPT"
  | "Claude"
  | "Gemini"
  | "Grok"
  | "Codex"
  | "Lovable"
  | "Cursor"
  | "Bolt"
  | "Replit"
  | "Freebuff AI"
  | "Custom";

export type PromptCategory =
  | "Business"
  | "Marketing"
  | "Sales"
  | "Hospitality"
  | "Restaurants"
  | "Coding"
  | "Lovable"
  | "Codex"
  | "OpenAI Agents"
  | "Vibe Coding"
  | "Content Creation"
  | "Social Media"
  | "Research"
  | "Customer Service"
  | "Automation"
  | "Productivity"
  | "Custom";

export type PromptStatus = "active" | "archived";

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Prompt {
  id: string;
  user_id: string;
  title: string;
  prompt_text: string;
  category: PromptCategory;
  description: string | null;
  tags: string[];
  ai_platform: AIPlatform | null;
  rating: number;
  favorite: boolean;
  is_template: boolean;
  status: PromptStatus;
  created_at: string;
  updated_at: string;
}

export interface PromptVersion {
  id: string;
  prompt_id: string;
  version_number: number;
  prompt_text: string;
  change_notes: string | null;
  created_at: string;
}

export interface Folder {
  id: string;
  user_id: string;
  folder_name: string;
  color: string;
  created_at: string;
}

export interface PromptFolderMapping {
  id: string;
  prompt_id: string;
  folder_id: string;
}

export interface UsageHistory {
  id: string;
  prompt_id: string;
  last_used: string;
  use_count: number;
}

export const PROMPT_CATEGORIES: PromptCategory[] = [
  "Business", "Marketing", "Sales", "Hospitality",
  "Restaurants", "Coding", "Lovable", "Codex",
  "OpenAI Agents", "Vibe Coding", "Content Creation",
  "Social Media", "Research", "Customer Service",
  "Automation", "Productivity", "Custom",
];

export const AI_PLATFORMS: AIPlatform[] = [
  "ChatGPT", "Claude", "Gemini", "Grok", "Codex",
  "Lovable", "Cursor", "Bolt", "Replit", "Freebuff AI", "Custom",
];

export const FOLDER_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e",
  "#f97316", "#eab308", "#22c55e", "#14b8a6",
  "#06b6d4", "#3b82f6",
];

export const STARTER_TEMPLATES: Array<{
  title: string;
  prompt_text: string;
  category: PromptCategory;
  description: string;
  tags: string[];
  ai_platform: AIPlatform;
}> = [
  {
    title: "Business Analysis",
    prompt_text: "Conduct a comprehensive business analysis for [Company Name] in the [Industry] industry. Analyze the following areas:\n\n1. **Market Position**: Current market share, key competitors, and competitive advantages\n2. **SWOT Analysis**: Strengths, Weaknesses, Opportunities, and Threats\n3. **Financial Health**: Revenue streams, profitability, and growth trajectory\n4. **Operational Efficiency**: Key processes, bottlenecks, and optimization opportunities\n5. **Growth Opportunities**: New markets, product expansions, and strategic partnerships\n\nProvide actionable recommendations with timelines and KPIs.",
    category: "Business",
    description: "Comprehensive business analysis framework",
    tags: ["business", "analysis", "strategy"],
    ai_platform: "ChatGPT",
  },
  {
    title: "SWOT Analysis",
    prompt_text: "Perform a detailed SWOT analysis for [Company/Project Name].\n\n**Strengths** (Internal & Positive):\n- \n- \n- \n\n**Weaknesses** (Internal & Negative):\n- \n- \n- \n\n**Opportunities** (External & Positive):\n- \n- \n- \n\n**Threats** (External & Negative):\n- \n- \n- \n\nFor each quadrant, provide 3-5 specific points with brief explanations. Then provide strategic recommendations.",
    category: "Business",
    description: "Detailed SWOT analysis template",
    tags: ["swot", "strategy", "analysis"],
    ai_platform: "ChatGPT",
  },
  {
    title: "Restaurant Consulting",
    prompt_text: "You are an expert restaurant consultant. Analyze the following restaurant and provide recommendations:\n\n**Restaurant Profile:**\n- Name: [Restaurant Name]\n- Cuisine Type: [Cuisine]\n- Location: [City/Neighborhood]\n- Average Check: [$ Amount]\n- Current Challenges: [Describe]\n\nProvide recommendations in these areas:\n1. **Menu Engineering**: Item profitability and popularity analysis\n2. **Staff Optimization**: Scheduling, training, and retention strategies\n3. **Marketing & Branding**: Local awareness campaigns and social media strategy\n4. **Cost Control**: Food cost reduction without quality sacrifice\n5. **Customer Experience**: Service improvements and loyalty programs\n6. **Revenue Growth**: Catering, delivery, and private events opportunities",
    category: "Restaurants",
    description: "Expert restaurant consulting framework",
    tags: ["restaurant", "consulting", "hospitality"],
    ai_platform: "ChatGPT",
  },
  {
    title: "App Planning",
    prompt_text: "Help me plan a new [Type of App] application.\n\n**App Concept:**\n- Name: [App Name]\n- Purpose: [Brief description]\n- Target Audience: [Who will use it]\n- Platform: [Web/iOS/Android/All]\n\nPlease provide:\n1. **Core Features** - MVP features prioritized by impact\n2. **User Flow** - Step-by-step user journey\n3. **Tech Stack Recommendations** - Frontend, backend, database, hosting\n4. **Database Schema** - Key tables and relationships\n5. **API Design** - Core endpoints\n6. **Monetization Strategy** - How the app will generate revenue\n7. **Launch Roadmap** - Timeline from development to launch",
    category: "Coding",
    description: "Complete app planning and architecture template",
    tags: ["app", "planning", "development", "architecture"],
    ai_platform: "ChatGPT",
  },
  {
    title: "Product Validation",
    prompt_text: "Validate my product idea using the following framework:\n\n**Product Idea:** [Describe your product in 1-2 sentences]\n**Target Market:** [Who is the customer?]\n**Problem Solved:** [What pain point does it address?]\n\nPlease analyze:\n1. **Problem Validation** - Is this a real, painful problem?\n2. **Market Size** - TAM, SAM, SOM analysis\n3. **Competitor Analysis** - Who else solves this and how?\n4. **Differentiation** - What makes this unique?\n5. **Monetization Viability** - Will customers pay?\n6. **Technical Feasibility** - Can this be built?\n7. **Validation Experiments** - 3 low-cost ways to test demand\n8. **Risk Assessment** - Top 3 risks and mitigation strategies",
    category: "Business",
    description: "Product validation and market analysis framework",
    tags: ["validation", "product", "market", "startup"],
    ai_platform: "ChatGPT",
  },
  {
    title: "Landing Page Creator",
    prompt_text: "Design a high-converting landing page for [Product/Service Name].\n\n**Product/Service:** [Description]\n**Target Audience:** [Who is this for?]\n**Unique Value Proposition:** [What makes it special?]\n**Primary Goal:** [Sign ups / Sales / Waitlist / Other]\n\nGenerate:\n1. **Headline Options** - 5 attention-grabbing headlines\n2. **Subheadline** - Supporting text that clarifies the offer\n3. **Hero Section** - Visual concept and CTA button copy\n4. **Key Benefits** - 3-5 bullet points with icons\n5. **Social Proof Section** - Testimonial ideas and trust signals\n6. **Feature Breakdown** - How to present features clearly\n7. **FAQ Section** - 5-7 common objections with answers\n8. **CTA Strategy** - Button colors, placements, and copy\n9. **Mobile Optimization** - Key considerations for mobile users",
    category: "Marketing",
    description: "High-converting landing page design framework",
    tags: ["landing page", "marketing", "conversion", "design"],
    ai_platform: "ChatGPT",
  },
  {
    title: "Marketing Strategy",
    prompt_text: "Develop a comprehensive marketing strategy for [Company/Product Name].\n\n**Company Profile:**\n- Industry: [Industry]\n- Target Customer: [Demographic/Persona]\n- Current Stage: [Startup/Growth/Established]\n- Budget: [Range]\n- Current Channels: [List]\n\nProvide a complete strategy including:\n1. **Channel Mix** - Top 5 channels with rationale\n2. **Content Strategy** - Content types, frequency, and distribution\n3. **Acquisition Funnel** - Top of funnel to conversion\n4. **Retention Strategy** - How to keep customers\n5. **Budget Allocation** - Percentage breakdown across channels\n6. **KPIs & Metrics** - What to measure and targets\n7. **30-60-90 Day Plan** - Immediate actions\n8. **Tools & Resources** - Recommended martech stack",
    category: "Marketing",
    description: "Full marketing strategy and execution plan",
    tags: ["marketing", "strategy", "growth"],
    ai_platform: "ChatGPT",
  },
  {
    title: "Social Media Generator",
    prompt_text: "Create a [Platform] social media content plan for [Brand/Account Name].\n\n**Brand Voice:** [Professional/Funny/Educational/Inspirational]\n**Industry:** [Industry/Niche]\n**Goal:** [Awareness/Engagement/Sales/Community]\n**Posting Frequency:** [Times per week]\n\nGenerate:\n1. **Bio Optimization** - 3 bio options with emojis and keywords\n2. **Content Pillars** - 4-5 content themes with examples\n3. **30-Day Content Calendar** - Post ideas with captions\n4. **Hashtag Strategy** - Mix of broad and niche hashtags\n5. **Engagement Tactics** - How to grow interaction\n6. **Story Ideas** - 10 interactive story concepts\n7. **Reel/Video Concepts** - 5 video ideas with hooks\n8. **Analytics Focus** - Key metrics to track weekly",
    category: "Social Media",
    description: "Social media content planning and generation",
    tags: ["social media", "content", "marketing"],
    ai_platform: "ChatGPT",
  },
  {
    title: "Customer Avatar Creator",
    prompt_text: "Create a detailed customer avatar/persona for [Product/Service].\n\n**Product/Service:** [Description]\n**Industry:** [Industry]\n**Current Customer Base:** [Brief description]\n\nBuild a complete customer persona including demographics, psychographics, behavioral patterns, customer journey, and marketing insights.",
    category: "Marketing",
    description: "Detailed customer persona and avatar creation",
    tags: ["persona", "avatar", "customer", "marketing"],
    ai_platform: "ChatGPT",
  },
];

// ==========================================
// ADVANCED BUILDER FEATURES
// ==========================================

// --- PROJECTS ---
export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  emoji: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectPrompt {
  id: string;
  project_id: string;
  prompt_id: string;
  created_at: string;
}

export interface ProjectNote {
  id: string;
  project_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectDocument {
  id: string;
  project_id: string;
  name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  created_at: string;
}

// --- WORKFLOWS ---
export interface Workflow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkflowStep {
  id: string;
  workflow_id: string;
  step_number: number;
  title: string;
  prompt_id: string | null;
  prompt_text: string;
  instructions: string | null;
  created_at: string;
}

export interface WorkflowRun {
  id: string;
  workflow_id: string;
  user_id: string;
  status: "running" | "completed" | "failed";
  started_at: string;
  completed_at: string | null;
}

export interface WorkflowStepResult {
  id: string;
  run_id: string;
  step_id: string;
  output: string | null;
  status: "pending" | "completed" | "failed";
  completed_at: string | null;
}

// --- TESTING LAB ---
export interface TestLab {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  prompt_a: string;
  prompt_b: string;
  prompt_c: string | null;
  created_at: string;
  updated_at: string;
}

export interface TestLabResult {
  id: string;
  test_id: string;
  variant: "A" | "B" | "C";
  quality_score: number;
  speed_score: number;
  accuracy_score: number;
  user_rating: number;
  notes: string | null;
  created_at: string;
}

// --- KNOWLEDGE BASE ---
export interface KnowledgeFile {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  file_url: string;
  file_type: string;
  file_size: number;
  prompt_id: string | null;
  created_at: string;
}

// --- PROMPT SCORE ---
export interface PromptScore {
  id: string;
  prompt_id: string;
  effectiveness_score: number;
  usage_score: number;
  user_rating: number;
  success_rate: number;
  overall_health: number;
  updated_at: string;
}

// --- MARKETPLACE ---
export interface MarketplaceListing {
  id: string;
  seller_id: string;
  prompt_id: string;
  title: string;
  description: string;
  price: number;
  category: PromptCategory;
  tags: string[];
  ai_platform: AIPlatform;
  rating: number;
  sold_count: number;
  status: "active" | "sold" | "inactive";
  created_at: string;
  updated_at: string;
}

// --- HOSPITALITY CATEGORIES ---
export const HOSPITALITY_CATEGORIES = [
  "Restaurant Operations",
  "Food Costing",
  "Menu Engineering",
  "Social Media",
  "Customer Retention",
  "Staff Training",
  "Recruitment",
  "Marketing Campaigns",
  "Reviews Management",
  "Competitive Analysis",
] as const;

export type HospitalityCategory = (typeof HOSPITALITY_CATEGORIES)[number];

// --- PROJECT EMOJIS ---
export const PROJECT_EMOJIS = [
  "🚀", "💡", "📊", "🎯", "⚡", "🛠️", "🌟", "💼",
  "📈", "🎨", "🤖", "🧠", "📝", "🏗️", "🔬", "🎮",
] as const;

export const PROJECT_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e",
  "#f97316", "#eab308", "#22c55e", "#14b8a6",
  "#06b6d4", "#3b82f6", "#a855f7", "#d946ef",
];
