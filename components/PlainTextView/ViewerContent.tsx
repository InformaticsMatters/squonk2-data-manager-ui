import { useState } from 'react';
import { List } from 'react-virtualized';
import { WindowScroller } from 'react-virtualized';
import { AutoSizer } from 'react-virtualized';

import { css } from '@emotion/react';
import { Typography, useTheme } from '@material-ui/core';

export interface ViewerContentProps {
  lines: string[];
}

export const ViewerContent = ({ lines }: ViewerContentProps) => {
  const theme = useTheme();

  const [scrollElement, setScrollElement] = useState<Element | null>(null);

  const numberColumnWidth = String(lines.length + 1).length * 10;
  // A performance optimization, saves around 2ms on each frame the contents are scrolled
  const numberColumnColor = theme.palette.grey[400];

  return (
    <div
      css={css`
        flex: 1 1 auto;
        overflow: auto;
        & pre {
          font-family: 'Fira Mono', monospace;
        }
      `}
      ref={setScrollElement}
    >
      <WindowScroller scrollElement={scrollElement || window}>
        {({ height, isScrolling, registerChild, onChildScroll, scrollTop }) => (
          <div
            css={css`
              flex: 1 1 auto;
            `}
          >
            <AutoSizer
              disableHeight
              css={css`
                width: unset !important;
              `}
              onResize={(t) => console.log(t)}
            >
              {({ width }) => (
                <div
                  css={css`
                    display: flex;
                    gap: ${theme.spacing(2)}px;
                  `}
                  ref={registerChild}
                >
                  <List
                    autoContainerWidth
                    autoHeight
                    height={height}
                    isScrolling={isScrolling}
                    overscanRowCount={2}
                    rowCount={lines.length}
                    rowHeight={18}
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
                  <List
                    autoContainerWidth
                    autoHeight
                    css={css`
                      overflow: visible !important;
                      & > div {
                        overflow: visible !important;
                      }
                    `}
                    height={height}
                    isScrolling={isScrolling}
                    overscanRowCount={2}
                    rowCount={lines.length}
                    rowHeight={18}
                    rowRenderer={({ index, key, style }) => (
                      <Typography component="pre" key={key} style={style}>
                        {lines[index]}
                      </Typography>
                    )}
                    scrollTop={scrollTop}
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
