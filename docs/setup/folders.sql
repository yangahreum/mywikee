-- wiki — folders 테이블(폴더 계층, 최대 4단) + documents.folder_id + RLS.
--
-- [수동 적용 안내]
--   youllog Supabase SQL 에디터에서 1회 실행한다.
--   public.set_updated_at() 함수가 이미 존재한다고 가정한다(0001_profiles.sql 또는
--   docs/setup/documents-table.sql 에서 정의됨). 없다면 그 SQL 들을 먼저 실행한다.
--   본 스크립트는 재실행 안전하다(IF NOT EXISTS / DROP ... IF EXISTS).

CREATE TABLE IF NOT EXISTS public.folders (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id  uuid REFERENCES public.folders(id) ON DELETE CASCADE,
  name       text NOT NULL DEFAULT '새 폴더',
  depth      int  NOT NULL DEFAULT 1 CHECK (depth BETWEEN 1 AND 4),
  position   int  NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_folders_set_updated_at ON public.folders;
CREATE TRIGGER trg_folders_set_updated_at
  BEFORE UPDATE ON public.folders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_folders_owner_parent
  ON public.folders (owner_id, parent_id, position);

ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owners full access on own folders" ON public.folders;
CREATE POLICY "owners full access on own folders"
  ON public.folders FOR ALL
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS folder_id uuid REFERENCES public.folders(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_documents_owner_folder
  ON public.documents (owner_id, folder_id);
