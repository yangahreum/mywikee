-- wiki — profiles 테이블 + updated_at 트리거 + 신규가입 자동생성 + RLS

CREATE TABLE IF NOT EXISTS public.profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname    text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_set_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles readable by anyone" ON public.profiles;
CREATE POLICY "profiles readable by anyone"
  ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "users can update own profile" ON public.profiles;
CREATE POLICY "users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "users can insert own profile" ON public.profiles;
CREATE POLICY "users can insert own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  INSERT INTO public.profiles (id, nickname)
  VALUES (NEW.id, split_part(NEW.email, '@', 1))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.profiles (id, nickname)
SELECT id, split_part(COALESCE(email, 'user'), '@', 1)
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles);
