import { useState } from 'react';
import { List } from 'react-virtualized';
import { WindowScroller } from 'react-virtualized';
import { AutoSizer } from 'react-virtualized';

import { css } from '@emotion/react';
import { Typography, useTheme } from '@material-ui/core';

/**
 * Height of a row in pixels.
 */
const ROW_HEIGHT = 18;
/**
 * Number of rows which are render above and below the currently displayed content. Prevents
 * flickering.
 */
const OVERSCAN = 2;

export interface PlaintextViewerContentProps {
  /**
   * Lines to be displayed.
   */
  lines: string[];
}

/**
 * Displays the lines of a content with a line number per line. The lines are virtualized for
 * performance reasons. The lines and the line numbers are in two separate columns, which prevents
 * text selection of the line numbers when highlighting the content of the lines.
 */
export const PlaintextViewerContent = ({ lines }: PlaintextViewerContentProps) => {
  const theme = useTheme();

  const [scrollElement, setScrollElement] = useState<Element | null>(null);

  const numberColumnWidth = String(lines.length + 1).length * 10;
  // A performance optimization, saves around 2ms on each frame the contents are scrolled
  const numberColumnColor = theme.palette.grey[400];

  return (
    <div
      // `overflow: auto` displays the scrollbars inside the container
      css={css`
        flex: 1 1 auto;
        overflow: auto;
        & pre {
          font-family: 'Fira Mono', monospace;
        }
      `}
      ref={setScrollElement}
    >
      {/** One WindowScroller for both of the columns. Use `window` until `ref` in the previous
       * div element resolves.
       */}
      <WindowScroller scrollElement={scrollElement || window}>
        {({ height, isScrolling, registerChild, onChildScroll, scrollTop }) => (
          <div
            css={css`
              flex: 1 1 auto;
            `}
          >
            <AutoSizer
              disableHeight
              // By default this element has 0 width which results in the following flex div not
              // being displayed
              css={css`
                width: unset !important;
              `}
            >
              {({ width }) => (
                <div
                  css={css`
                    display: flex;
                    gap: ${theme.spacing(2)}px;
                  `}
                  ref={registerChild}
                >
                  {/** Line numbers column */}
                  <List
                    autoContainerWidth
                    autoHeight
                    css={css`
                      user-select: none;
                    `}
                    height={height}
                    isScrolling={isScrolling}
                    overscanRowCount={OVERSCAN}
                    rowCount={lines.length}
                    rowHeight={ROW_HEIGHT}
                    rowRenderer={({ index, key, style }) => (
                      <Typography
                        align="right"
                        component="pre"
                        key={key}
                        // Styles are inlined due to performance, saves around 15 ms on each frame
                        // the contents are scrolled, using emotion here is a huge bottleneck
                        style={{ ...style, color: numberColumnColor }}
                      >
                        {index + 1}
                      </Typography>
                    )}
                    scrollTop={scrollTop}
                    width={numberColumnWidth}
                    onScroll={onChildScroll}
                  />
                  {/** Lines column */}
                  <List
                    autoContainerWidth
                    autoHeight
                    // Overflow is visible in case a line is longer than the width of the container
                    css={css`
                      overflow: visible !important;
                      & > div {
                        overflow: visible !important;
                      }
                    `}
                    height={height}
                    isScrolling={isScrolling}
                    overscanRowCount={OVERSCAN}
                    rowCount={lines.length}
                    rowHeight={ROW_HEIGHT}
                    rowRenderer={({ index, key, style }) => (
                      <Typography component="pre" key={key} style={style}>
                        {lines[index]}
                      </Typography>
                    )}
                    scrollTop={scrollTop}
                    // Account for the `gap` property. The `1` is subtracted as well since browsers
                    // can round the number which results in the display of unnecessary scrollbar on
                    // the X axis.
                    width={width - numberColumnWidth - theme.spacing(2) - 1}
                    onScroll={onChildScroll}
                  />
                </div>
              )}
            </AutoSizer>
          </div>
        )}
      </WindowScroller>
    </div>
  );
};
