import { useEffect, useRef, useState } from "react";

import { SearchTextField } from "../components/SearchTextField";
import { useKeyboardFocus } from "../hooks/useKeyboardFocus";

/** How long a search field waits before the route it owns is rewritten. */
const searchSettleMs = 300;

/**
 * The field a project section searches its list with. Every section writes its search to its own
 * route rather than to component state, so all this owns is when a keystroke reaches that route —
 * which is behaviour rather than layout, and is therefore shared by sections that lay their chrome
 * out entirely differently.
 *
 * Typing rewrites the route, so the field is held locally and the route follows it once typing
 * settles: a section is never asked to re-render, or a history-free replace issued, per keystroke.
 */
export const SectionSearchField = ({
  onSearch,
  search,
}: {
  /** Called with the settled value, or nothing at all where the field was emptied. */
  onSearch: (search?: string) => void;
  search?: string;
}) => {
  // A value that has been typed but has not reached the route yet. The route remains the state:
  // this only exists between a keystroke and the route carrying it.
  const [draft, setDraft] = useState<string | null>(null);
  const searchRef = useKeyboardFocus();

  // The route is the state, so a settled value is written against whatever the route says then,
  // not against the render the keystroke happened in.
  const latest = useRef(onSearch);
  useEffect(() => {
    latest.current = onSearch;
  });

  // The draft is given up only once the route carries it, so a route that has not caught up yet —
  // the one this field was replacing when the next keystroke arrived — can never overwrite what is
  // being typed. Given up during render rather than in an effect: the field would otherwise be drawn
  // once more from a draft the route has already caught up with.
  if (draft !== null && draft === (search ?? "")) {
    setDraft(null);
  }

  useEffect(() => {
    if (draft === null) {
      return;
    }
    const settle = setTimeout(() => latest.current(draft || undefined), searchSettleMs);
    return () => clearTimeout(settle);
  }, [draft]);

  return (
    <SearchTextField
      fullWidth
      ref={searchRef}
      value={draft ?? search ?? ""}
      onChange={(event) => setDraft(event.target.value)}
    />
  );
};
