-- ============================================
-- Prompt Vault Pro — Complete Database Schema
-- ============================================
-- Run this in the Supabase SQL Editor
-- to set up all tables, RLS, triggers, and indexes
-- ============================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- HELPER: updated_at trigger function
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TABLE: prompts
-- ============================================
CREATE TABLE IF NOT EXISTS prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  prompt_text TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Custom',
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  ai_platform TEXT,
  rating NUMERIC DEFAULT 0,
  favorite BOOLEAN DEFAULT FALSE,
  is_template BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prompts_user_id ON prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_prompts_status ON prompts(status);
CREATE INDEX IF NOT EXISTS idx_prompts_category ON prompts(category);
CREATE INDEX IF NOT EXISTS idx_prompts_favorite ON prompts(favorite);

ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own prompts"
  ON prompts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own prompts"
  ON prompts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own prompts"
  ON prompts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own prompts"
  ON prompts FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER trg_prompts_updated_at
  BEFORE UPDATE ON prompts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLE: prompt_versions
-- ============================================
CREATE TABLE IF NOT EXISTS prompt_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE NOT NULL,
  version_number BIGINT NOT NULL,
  prompt_text TEXT NOT NULL,
  change_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prompt_versions_prompt_id ON prompt_versions(prompt_id);

ALTER TABLE prompt_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view versions of own prompts"
  ON prompt_versions FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM prompts WHERE prompts.id = prompt_versions.prompt_id AND prompts.user_id = auth.uid())
  );

CREATE POLICY "Users can insert versions for own prompts"
  ON prompt_versions FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM prompts WHERE prompts.id = prompt_versions.prompt_id AND prompts.user_id = auth.uid())
  );

-- ============================================
-- TABLE: folders
-- ============================================
CREATE TABLE IF NOT EXISTS folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  folder_name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id);

ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own folders"
  ON folders FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- TABLE: prompt_folder_mapping
-- ============================================
CREATE TABLE IF NOT EXISTS prompt_folder_mapping (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE NOT NULL,
  folder_id UUID REFERENCES folders(id) ON DELETE CASCADE NOT NULL,
  UNIQUE(prompt_id, folder_id)
);

CREATE INDEX IF NOT EXISTS idx_pfm_prompt_id ON prompt_folder_mapping(prompt_id);
CREATE INDEX IF NOT EXISTS idx_pfm_folder_id ON prompt_folder_mapping(folder_id);

ALTER TABLE prompt_folder_mapping ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own prompt-folder mappings"
  ON prompt_folder_mapping FOR ALL
  USING (
    EXISTS (SELECT 1 FROM prompts WHERE prompts.id = prompt_folder_mapping.prompt_id AND prompts.user_id = auth.uid())
  );

-- ============================================
-- TABLE: usage_history
-- ============================================
CREATE TABLE IF NOT EXISTS usage_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE NOT NULL,
  last_used TIMESTAMPTZ DEFAULT NOW(),
  use_count INTEGER DEFAULT 0,
  UNIQUE(prompt_id)
);

ALTER TABLE usage_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view usage of own prompts"
  ON usage_history FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM prompts WHERE prompts.id = usage_history.prompt_id AND prompts.user_id = auth.uid())
  );

CREATE POLICY "Users can upsert usage for own prompts"
  ON usage_history FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM prompts WHERE prompts.id = usage_history.prompt_id AND prompts.user_id = auth.uid())
  );

CREATE POLICY "Users can update usage for own prompts"
  ON usage_history FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM prompts WHERE prompts.id = usage_history.prompt_id AND prompts.user_id = auth.uid())
  );

-- ============================================
-- TABLE: projects
-- ============================================
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  emoji TEXT DEFAULT '🚀',
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own projects"
  ON projects FOR ALL
  USING (auth.uid() = user_id);

CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLE: project_prompts
-- ============================================
CREATE TABLE IF NOT EXISTS project_prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, prompt_id)
);

CREATE INDEX IF NOT EXISTS idx_project_prompts_project_id ON project_prompts(project_id);
CREATE INDEX IF NOT EXISTS idx_project_prompts_prompt_id ON project_prompts(prompt_id);

ALTER TABLE project_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own project prompts"
  ON project_prompts FOR ALL
  USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = project_prompts.project_id AND projects.user_id = auth.uid())
  );

-- ============================================
-- TABLE: project_notes
-- ============================================
CREATE TABLE IF NOT EXISTS project_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_notes_project_id ON project_notes(project_id);

ALTER TABLE project_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own project notes"
  ON project_notes FOR ALL
  USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = project_notes.project_id AND projects.user_id = auth.uid())
  );

CREATE TRIGGER trg_project_notes_updated_at
  BEFORE UPDATE ON project_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLE: project_documents
-- ============================================
CREATE TABLE IF NOT EXISTS project_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_docs_project_id ON project_documents(project_id);

ALTER TABLE project_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own project documents"
  ON project_documents FOR ALL
  USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = project_documents.project_id AND projects.user_id = auth.uid())
  );

-- ============================================
-- TABLE: workflows
-- ============================================
CREATE TABLE IF NOT EXISTS workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflows_user_id ON workflows(user_id);

ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own workflows"
  ON workflows FOR ALL
  USING (auth.uid() = user_id);

CREATE TRIGGER trg_workflows_updated_at
  BEFORE UPDATE ON workflows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLE: workflow_steps
-- ============================================
CREATE TABLE IF NOT EXISTS workflow_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE NOT NULL,
  step_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  prompt_id UUID REFERENCES prompts(id) ON DELETE SET NULL,
  prompt_text TEXT NOT NULL,
  instructions TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflow_steps_workflow_id ON workflow_steps(workflow_id);

ALTER TABLE workflow_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own workflow steps"
  ON workflow_steps FOR ALL
  USING (
    EXISTS (SELECT 1 FROM workflows WHERE workflows.id = workflow_steps.workflow_id AND workflows.user_id = auth.uid())
  );

-- ============================================
-- TABLE: workflow_runs
-- ============================================
CREATE TABLE IF NOT EXISTS workflow_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_workflow_runs_workflow_id ON workflow_runs(workflow_id);

ALTER TABLE workflow_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own workflow runs"
  ON workflow_runs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workflow runs"
  ON workflow_runs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workflow runs"
  ON workflow_runs FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- TABLE: workflow_step_results
-- ============================================
CREATE TABLE IF NOT EXISTS workflow_step_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_id UUID REFERENCES workflow_runs(id) ON DELETE CASCADE NOT NULL,
  step_id UUID REFERENCES workflow_steps(id) ON DELETE CASCADE NOT NULL,
  output TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_wsr_run_id ON workflow_step_results(run_id);

ALTER TABLE workflow_step_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own step results"
  ON workflow_step_results FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM workflow_runs WHERE workflow_runs.id = workflow_step_results.run_id AND workflow_runs.user_id = auth.uid())
  );

CREATE POLICY "Users can insert own step results"
  ON workflow_step_results FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM workflow_runs WHERE workflow_runs.id = workflow_step_results.run_id AND workflow_runs.user_id = auth.uid())
  );

CREATE POLICY "Users can update own step results"
  ON workflow_step_results FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM workflow_runs WHERE workflow_runs.id = workflow_step_results.run_id AND workflow_runs.user_id = auth.uid())
  );

-- ============================================
-- TABLE: test_labs
-- ============================================
CREATE TABLE IF NOT EXISTS test_labs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  prompt_a TEXT NOT NULL,
  prompt_b TEXT NOT NULL,
  prompt_c TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_test_labs_user_id ON test_labs(user_id);

ALTER TABLE test_labs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own test labs"
  ON test_labs FOR ALL
  USING (auth.uid() = user_id);

CREATE TRIGGER trg_test_labs_updated_at
  BEFORE UPDATE ON test_labs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLE: test_lab_results
-- ============================================
CREATE TABLE IF NOT EXISTS test_lab_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_id UUID REFERENCES test_labs(id) ON DELETE CASCADE NOT NULL,
  variant TEXT NOT NULL CHECK (variant IN ('A', 'B', 'C')),
  quality_score NUMERIC DEFAULT 0,
  speed_score NUMERIC DEFAULT 0,
  accuracy_score NUMERIC DEFAULT 0,
  user_rating NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tlr_test_id ON test_lab_results(test_id);

ALTER TABLE test_lab_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own test results"
  ON test_lab_results FOR ALL
  USING (
    EXISTS (SELECT 1 FROM test_labs WHERE test_labs.id = test_lab_results.test_id AND test_labs.user_id = auth.uid())
  );

-- ============================================
-- TABLE: knowledge_files
-- ============================================
CREATE TABLE IF NOT EXISTS knowledge_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER DEFAULT 0,
  prompt_id UUID REFERENCES prompts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_files_user_id ON knowledge_files(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_files_prompt_id ON knowledge_files(prompt_id);

ALTER TABLE knowledge_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own knowledge files"
  ON knowledge_files FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- TABLE: prompt_scores
-- ============================================
CREATE TABLE IF NOT EXISTS prompt_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE NOT NULL,
  effectiveness_score NUMERIC DEFAULT 0,
  usage_score NUMERIC DEFAULT 0,
  user_rating NUMERIC DEFAULT 0,
  success_rate NUMERIC DEFAULT 0,
  overall_health NUMERIC DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(prompt_id)
);

ALTER TABLE prompt_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage scores of own prompts"
  ON prompt_scores FOR ALL
  USING (
    EXISTS (SELECT 1 FROM prompts WHERE prompts.id = prompt_scores.prompt_id AND prompts.user_id = auth.uid())
  );

CREATE TRIGGER trg_prompt_scores_updated_at
  BEFORE UPDATE ON prompt_scores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLE: marketplace_listings
-- ============================================
CREATE TABLE IF NOT EXISTS marketplace_listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  ai_platform TEXT,
  rating NUMERIC DEFAULT 0,
  sold_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'sold', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ml_seller_id ON marketplace_listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_ml_status ON marketplace_listings(status);
CREATE INDEX IF NOT EXISTS idx_ml_category ON marketplace_listings(category);

ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active listings"
  ON marketplace_listings FOR SELECT
  USING (status = 'active' OR seller_id = auth.uid());

CREATE POLICY "Users can create own listings"
  ON marketplace_listings FOR INSERT
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update own listings"
  ON marketplace_listings FOR UPDATE
  USING (auth.uid() = seller_id);

CREATE TRIGGER trg_marketplace_listings_updated_at
  BEFORE UPDATE ON marketplace_listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
