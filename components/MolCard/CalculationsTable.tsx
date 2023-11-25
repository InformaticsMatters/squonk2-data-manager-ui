import { Table, TableBody, TableCell, TableRow, Tooltip, Typography } from "@mui/material";

export interface CalculationsTableProps {
  properties: { name: string; value: string | undefined }[];
  tableWidth?: number;
  fontSize?: number | string;
}

const CalculationsTable = ({ properties, fontSize, tableWidth }: CalculationsTableProps) => {
  return (
    <Table>
      <TableBody>
        {properties.map(({ name, value = "" }, index) => {
          // TODO: round number-like value to 2 sf
          const displayName = name;
          return (
            <TableRow key={index}>
              <TableCell
                component="th"
                style={{ maxWidth: tableWidth ? `calc(${tableWidth - 32}px - 35px)` : "5rem" }}
                sx={{
                  fontSize,
                  paddingY: 0.5,
                  paddingX: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                <Tooltip arrow title={displayName}>
                  <span>{displayName}</span>
                </Tooltip>
              </TableCell>
              <TableCell
                align="left"
                sx={{ fontSize, paddingY: 0.5, paddingX: 0, width: "100%", pl: 1 }}
              >
                <Tooltip arrow title={value}>
                  <Typography noWrap sx={{ fontSize, width: 32, minWidth: "100%" }}>
                    {value}
                  </Typography>
                </Tooltip>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

export default CalculationsTable;
