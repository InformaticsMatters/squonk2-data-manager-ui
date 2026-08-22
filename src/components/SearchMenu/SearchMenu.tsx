import {
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

import { CheckRounded, SearchRounded } from "@mui/icons-material";
import {
  Box,
  Divider,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  ListSubheader,
  Popover,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";

/**
 * One row the menu offers. `href` is what separates the two things choosing can mean: a row that
 * names one is a real link, so the pointer affordances a link carries — the status bar, the context
 * menu, opening in another tab — are real ones. A row without an `href` is a plain option and the
 * consumer's `onSelect` is the whole of what choosing it does.
 *
 * `href` is a plain string rather than the generated route union: that union models a route as a
 * pathname and a query object, which no built path string satisfies, so every link in this
 * application casts (see `src/projects/routes.ts`). The cast is made once here rather than by each
 * consumer.
 */
export type SearchMenuRow = {
  href?: string;
  id: string;
  primary: ReactNode;
  secondary?: ReactNode;
};

/**
 * One run of rows, headed or not. The keyboard walks every section as one flat list, so a highlight
 * crosses from one section into the next without the caller having to know the boundary is there.
 */
export type SearchMenuSection = { heading?: string; rows: SearchMenuRow[] };

/** What a trigger has to carry for the menu it opens to be described and operated correctly. */
export type SearchMenuTriggerBinding = {
  "aria-expanded": boolean;
  "aria-haspopup": "dialog";
  "aria-label": string;
  onClick: (event: MouseEvent<HTMLElement>) => void;
};

export type SearchMenuProps = {
  /** Names the trigger and the dialog it opens, so both are described as the same control. */
  ariaLabel: string;
  /** Accessible text on the "you are here" marker. */
  currentHint: string;
  /** Where the caller already is. Never the keyboard highlight — see the note on `activeIndex`. */
  currentId?: string;
  emptyLabel: (search: string) => string;
  /** What choosing a row will do, stated before it is done. Announced as the dialog's description. */
  footerNote?: ReactNode;
  isPending: boolean;
  listLabel: string;
  /** Lets a consumer gate its own reads on the menu being open. The component has no opinion. */
  onOpenChange?: (open: boolean) => void;
  onSearchChange: (search: string) => void;
  onSelect: (row: SearchMenuRow) => void;
  pendingLabel: string;
  renderTrigger: (bind: SearchMenuTriggerBinding) => ReactNode;
  search: string;
  searchLabel: string;
  searchPlaceholder: string;
  sections: SearchMenuSection[];
};

/**
 * A trigger that opens a searchable, keyboard-navigable, optionally sectioned list.
 *
 * The chrome holds two of these — the project selector and the organisation switcher — and they are
 * one component so that they cannot drift apart: the same keys, the same focus rules and the same
 * vocabulary to assistive technology, whether choosing a row navigates or selects.
 *
 * It owns no data. It never reads the organisation in effect, never issues a query and never imports
 * the organisation-selection state module; which organisations or projects exist stays the concern
 * of the screens that display them.
 *
 * The pattern is a combobox in a dialog: the trigger opens a modal dialog, and inside it the search
 * field is the combobox and the list is its listbox. Focus stays in the search field for the life of
 * the menu, which is what lets typing and arrowing interleave, so the highlight is carried to
 * assistive technology through `aria-activedescendant` rather than by moving focus.
 *
 * `activeIndex` and `currentId` are separate concerns and must never share one appearance. The
 * active index is where the keyboard is, drawn with the list's selected-row styling and the ARIA
 * selected state; `currentId` is where the caller already is, drawn as a distinct marker with
 * `aria-current` and `currentHint`.
 */
export const SearchMenu = ({
  ariaLabel,
  currentHint,
  currentId,
  emptyLabel,
  footerNote,
  isPending,
  listLabel,
  onOpenChange,
  onSearchChange,
  onSelect,
  pendingLabel,
  renderTrigger,
  search,
  searchLabel,
  searchPlaceholder,
  sections,
}: SearchMenuProps) => {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const prefix = useId();
  const listboxId = `${prefix}listbox`;
  const footerId = `${prefix}footer`;
  const optionId = (index: number) => `${prefix}option-${index}`;
  const headingId = (index: number) => `${prefix}heading-${index}`;
  const open = !!anchor;

  // The flat list the keyboard walks is computed here from the sections themselves, so no consumer
  // can hand this component an index that disagrees with the list it is showing.
  const rows = useMemo(() => sections.flatMap(({ rows: sectionRows }) => sectionRows), [sections]);
  const sectionStarts = useMemo(() => {
    let start = 0;
    return sections.map(({ rows: sectionRows }) => {
      const sectionStart = start;
      start += sectionRows.length;
      return sectionStart;
    });
  }, [sections]);

  // The highlight starts at the top of whatever the list has just become, so Enter always opens the
  // row the caller can see is highlighted.
  useEffect(() => setActiveIndex(0), [search]);
  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const close = () => {
    setAnchor(null);
    onOpenChange?.(false);
    // The search text describes no page and can be sent to nobody, so it is discarded rather than
    // kept: reopening the menu starts clean.
    onSearchChange("");
  };

  const selectRow = (row: SearchMenuRow | undefined) => {
    if (!row) {
      return;
    }
    close();
    onSelect(row);
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    const last = Math.max(rows.length - 1, 0);
    switch (event.key) {
      case "ArrowDown": {
        event.preventDefault();
        // The highlight stops at the ends rather than wrapping, so a caller who is not watching the
        // screen always knows where they are.
        setActiveIndex((index) => Math.min(index + 1, last));
        break;
      }
      case "ArrowUp": {
        event.preventDefault();
        setActiveIndex((index) => Math.max(index - 1, 0));
        break;
      }
      case "End": {
        event.preventDefault();
        setActiveIndex(last);
        break;
      }
      case "Enter": {
        event.preventDefault();
        selectRow(rows[activeIndex]);
        break;
      }
      case "Escape": {
        // Answered here rather than left to the popover's own handling, so the ordinary dismissal
        // key is a guarantee of this component rather than a default it inherits.
        event.preventDefault();
        close();
        break;
      }
      case "Home": {
        event.preventDefault();
        setActiveIndex(0);
        break;
      }
      case "Tab": {
        // Tab leaves rather than walking the list. The rows are not tab stops, so the menu closes
        // and hands the keyboard back to the trigger it opened from, where the next Tab moves on.
        event.preventDefault();
        close();
        break;
      }
      // No default
    }
  };

  const handleRowClick = (row: SearchMenuRow) => (event: MouseEvent) => {
    // A modifier click on a linked row opens it elsewhere and leaves this one where it was, so the
    // menu stays open: the caller is still standing here and may well want another. A row with
    // nowhere to link to has no such behaviour to offer, so it answers a modifier click as an
    // ordinary one rather than appearing to promise something it cannot do.
    if (row.href && (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)) {
      return;
    }
    // The row is a real link for everything a link is good for, but a plain activation is answered
    // by `onSelect`, so choosing means exactly the same thing from the pointer and the keyboard.
    event.preventDefault();
    selectRow(row);
  };

  const renderRow = (row: SearchMenuRow, index: number) => {
    const isCurrent = row.id === currentId;
    const shared = {
      "aria-selected": index === activeIndex,
      "data-index": index,
      disableRipple: true,
      id: optionId(index),
      role: "option",
      selected: index === activeIndex,
      // Not a tab stop: focus stays in the search box for the life of the menu, which is what lets
      // typing and arrowing interleave and stops Tab from walking a hundred rows to leave.
      tabIndex: -1,
      ...(isCurrent ? { "aria-current": true } : {}),
      onClick: handleRowClick(row),
      onMouseMove: () => setActiveIndex(index),
    } as const;
    const content = (
      <>
        <ListItemText
          primary={row.primary}
          secondary={row.secondary}
          slotProps={{ primary: { sx: { fontWeight: 700 } } }}
        />
        {isCurrent ? (
          <CheckRounded color="primary" fontSize="small" titleAccess={currentHint} />
        ) : null}
      </>
    );

    return row.href === undefined ? (
      <ListItemButton key={row.id} {...shared}>
        {content}
      </ListItemButton>
    ) : (
      <ListItemButton component={Link} href={row.href as never} key={row.id} {...shared}>
        {content}
      </ListItemButton>
    );
  };

  return (
    <>
      {renderTrigger({
        "aria-expanded": open,
        "aria-haspopup": "dialog",
        "aria-label": ariaLabel,
        onClick: (event) => {
          setAnchor(event.currentTarget);
          onOpenChange?.(true);
        },
      })}
      <Popover
        anchorEl={anchor}
        anchorOrigin={{ horizontal: "left", vertical: "bottom" }}
        open={open}
        slotProps={{
          // Room at the edge rather than the whole viewport, so the menu is usable on a phone.
          paper: { sx: { maxWidth: "calc(100vw - 32px)", mt: 0.5, width: 420 } },
          // The field's own autofocus races the modal's focus handling. The end of the entry
          // transition is the point at which the input certainly exists and nothing else is about
          // to claim focus, so the keyboard is live from the moment the menu has opened.
          transition: {
            onEntered: () => {
              setActiveIndex(0);
              searchRef.current?.focus();
            },
          },
        }}
        onClose={close}
      >
        {/* Keys are answered here rather than on the field alone, so the menu keeps answering the
            keyboard wherever focus has ended up inside it. The dialog declares itself modal because
            the popover really does trap focus, and points its description at the footer note, so
            what choosing a row will do is announced on open rather than being visible only. */}
        <Box
          aria-describedby={footerNote === undefined ? undefined : footerId}
          aria-label={ariaLabel}
          aria-modal="true"
          role="dialog"
          onKeyDown={handleKeyDown}
        >
          <Box sx={{ p: 1.5, pb: 1 }}>
            <TextField
              fullWidth
              inputRef={searchRef}
              placeholder={searchPlaceholder}
              size="small"
              slotProps={{
                htmlInput: {
                  "aria-activedescendant": rows.length > 0 ? optionId(activeIndex) : undefined,
                  "aria-autocomplete": "list",
                  "aria-controls": listboxId,
                  "aria-expanded": open,
                  "aria-label": searchLabel,
                  role: "combobox",
                },
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRounded fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
            />
          </Box>
          {/* Typing narrows a list the caller may never arrow into, so how many rows it matched is
              said rather than only shown. The region is rendered with the menu and only its changes
              are announced, which is what makes this the search's own answer. */}
          <Box
            aria-label="Matches"
            aria-live="polite"
            role="status"
            sx={{
              border: 0,
              clip: "rect(0 0 0 0)",
              height: "1px",
              margin: "-1px",
              overflow: "hidden",
              padding: 0,
              position: "absolute",
              whiteSpace: "nowrap",
              width: "1px",
            }}
          >
            {isPending ? "" : `${rows.length} ${rows.length === 1 ? "match" : "matches"}`}
          </Box>
          <Box
            aria-label={listLabel}
            id={listboxId}
            ref={listRef}
            role="listbox"
            // Relative to the viewport rather than a fixed height: a long list uses the screen it
            // has, and a short one leaves no hole.
            sx={{ maxHeight: "min(60vh, 420px)", overflowY: "auto" }}
          >
            {isPending ? (
              <Typography color="text.secondary" sx={{ p: 2 }}>
                {pendingLabel}
              </Typography>
            ) : null}
            {!isPending && rows.length === 0 ? (
              <Typography color="text.secondary" sx={{ p: 2 }}>
                {emptyLabel(search)}
              </Typography>
            ) : null}
            {sections.map((section, sectionIndex) =>
              section.heading === undefined ? (
                <List dense disablePadding key={section.rows[0]?.id} role="presentation">
                  {section.rows.map((row, index) =>
                    renderRow(row, sectionStarts[sectionIndex] + index),
                  )}
                </List>
              ) : (
                // A group labelled by its own heading, rather than a presentational role that
                // discards it, so a Recent run is announced as one.
                <List
                  dense
                  disablePadding
                  aria-labelledby={headingId(sectionIndex)}
                  key={section.heading}
                  role="group"
                >
                  <ListSubheader id={headingId(sectionIndex)} role="presentation">
                    {section.heading}
                  </ListSubheader>
                  {section.rows.map((row, index) =>
                    renderRow(row, sectionStarts[sectionIndex] + index),
                  )}
                </List>
              ),
            )}
          </Box>
          <Divider />
          <Stack
            direction="row"
            sx={{
              alignItems: "center",
              gap: 2,
              justifyContent: "space-between",
              px: 1.5,
              py: 0.75,
            }}
          >
            <Stack direction="row" sx={{ gap: 1.5 }}>
              <Typography color="text.secondary" variant="caption">
                ↑↓ move
              </Typography>
              <Typography color="text.secondary" variant="caption">
                ↵ open
              </Typography>
            </Stack>
            {footerNote === undefined ? null : (
              <Typography color="text.secondary" id={footerId} variant="caption">
                {footerNote}
              </Typography>
            )}
          </Stack>
        </Box>
      </Popover>
    </>
  );
};
