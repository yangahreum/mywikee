type Props = {
  /** 카피라이트 연도. 서버에서 주입(테스트 고정 가능). */
  year: number;
};

/**
 * 홈 대시보드 푸터 (청사진 Frame 1).
 * max-940 콘텐츠 폭 내부, 상단 1px 보더. 좌: 카피라이트, 우: 링크 placeholder.
 */
export function Footer({ year }: Props) {
  return (
    <footer className="mt-9 flex items-center justify-between border-t border-border pb-7 pt-[22px] text-[10.5px] tracking-[0.05em] text-ink-faint">
      <div>
        © {year} DIGITAL SANCTUARY.{" "}
        <span className="text-chip-ink">SCHOLARLY FOCUS MODE ACTIVE.</span>
      </div>
      <div className="flex gap-[18px]">
        <span>PRIVACY</span>
        <span>TERMS</span>
        <span>API</span>
      </div>
    </footer>
  );
}
