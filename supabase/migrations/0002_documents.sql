-- wiki — documents 테이블 + RLS. 편집 진실 = content(BlockNote Block[] JSON).

CREATE TABLE IF NOT EXISTS public.documents (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project    text NOT NULL DEFAULT 'default',
  title      text NOT NULL DEFAULT '',
  slug       text UNIQUE NOT NULL,
  content    jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_documents_set_updated_at ON public.documents;
CREATE TRIGGER trg_documents_set_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_documents_owner_created
  ON public.documents (owner_id, created_at DESC);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- 각 사용자는 자기 문서만 전체 접근 (멀티테넌트 공유 배포)
DROP POLICY IF EXISTS "owners full access on own documents" ON public.documents;
CREATE POLICY "owners full access on own documents"
  ON public.documents FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);
