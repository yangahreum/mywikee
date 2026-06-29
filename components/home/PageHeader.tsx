import { Plus } from "lucide-react";
import { createDraftDocument } from "@/app/me/actions";

type Props = { totalCount: number };

export function PageHeader({ totalCount }: Props) {
  return (
    <div className="mb-[22px] flex items-end justify-between">
      <div>
        <h1 className="m-0 font-serif text-[30px] font-semibold tracking-[-0.02em]">
          Home
        </h1>
        <div className="mt-1.5 text-[12.5px] text-ink-muted">
          Your knowledge workspace · {totalCount} pages
        </div>
      </div>
      <form action={createDraftDocument}>
        <button
          type="submit"
          className="flex h-[38px] items-center gap-[7px] rounded-[9px] bg-primary px-4 text-[12.5px] font-medium text-primary-fg"
        >
          <Plus size={15} strokeWidth={2.2} /> New Page
        </button>
      </form>
    </div>
  );
}
