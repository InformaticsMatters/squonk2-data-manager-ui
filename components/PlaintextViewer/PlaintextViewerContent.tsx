import { useState } from "react";
import { AutoSizer, List, WindowScroller } from "react-virtualized";

import { Box, Typography, useTheme } from "@mui/material";

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
    <Box
      flex="1 1 auto"
      ref={setScrollElement}
      sx={{
        // `overflow: auto` displays the scrollbars inside the container
        overflow: "auto",
        "& pre": {
          fontFamily: "'Fira Mono', monospace",
        },
      }}
    >
      {/** One WindowScroller for both of the columns. Use `window` until `ref` in the previous
       * div element resolves.
       */}
      <WindowScroller scrollElement={scrollElement || window}>
        {({ height, isScrolling, registerChild, onChildScroll, scrollTop }) => (
          <Box flex="1 1 auto">
            <AutoSizer
              disableHeight
              // By default this element has 0 width which results in the following flex div not
              // being displayed
              style={{ width: "auto" }}
            >
              {({ width }) => (
                <Box display="flex" gap={2} overflow="scroll" ref={registerChild}>
                  {/** Line numbers column */}
                  <List
                    autoContainerWidth
                    autoHeight
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
                    sx={{ userSelect: "none" }}
                    width={numberColumnWidth}
                    onScroll={onChildScroll}
                  />
                  {/** Lines column */}
                  <List
                    autoContainerWidth
                    autoHeight
                    containerStyle={{ overflow: "scroll" }}
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
                    width={width - numberColumnWidth - Number(theme.spacing(2).slice(0, -2)) - 1}
                    onScroll={onChildScroll}
                  />
                </Box>
              )}
            </AutoSizer>
          </Box>
        )}
      </WindowScroller>
    </Box>
  );
};
