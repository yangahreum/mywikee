-- =============================================================================
-- wiki: documents 테이블 수동 적용 DDL (SQL Editor 붙여넣기용)
-- =============================================================================
-- 용도: 기존 Supabase 프로젝트(예: youllog)에 wiki 의 documents 테이블만 추가.
-- 적용: Supabase 대시보드 → SQL Editor → 아래 전체 붙여넣기 → Run.
-- 안전: IF NOT EXISTS / CREATE OR REPLACE / DROP ... IF EXISTS 라 여러 번 실행해도 무해.
--       기존 posts/profiles 등 다른 테이블은 건드리지 않음.
-- 비고: 정식 마이그레이션은 supabase/migrations/0001_profiles.sql, 0002_documents.sql.
--       이 파일은 그 중 documents 부분을 단독 실행 가능하도록 set_updated_at 함수까지 포함한 사본.
-- =============================================================================

-- updated_at 자동 갱신 함수 (이미 있으면 그대로, 없으면 생성)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- documents 테이블 — 편집 진실 = content(BlockNote Block[] JSON)
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

-- updated_at 트리거
DROP TRIGGER IF EXISTS trg_documents_set_updated_at ON public.documents;
CREATE TRIGGER trg_documents_set_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 조회 인덱스 (소유자별 최신순)
CREATE INDEX IF NOT EXISTS idx_documents_owner_created
  ON public.documents (owner_id, created_at DESC);

-- RLS: 각 사용자는 자기 문서만 전체 접근 (멀티테넌트 공유 배포)
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owners full access on own documents" ON public.documents;
CREATE POLICY "owners full access on own documents"
  ON public.documents FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);
