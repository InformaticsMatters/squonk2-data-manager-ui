import { Children, useState } from "react";

import type { CardActionsProps, CardProps } from "@mui/material";
import { Card, CardActions, CardContent } from "@mui/material";

import { DepictMolecule } from "./DepictMolecule";

export interface MolCardProps extends CardProps {
  smiles: string;
  children?: React.ReactNode;
  depictNoStereo?: boolean;
  depictWidth?: number;
  depictHeight?: number;
  depictmcs?: string;
  bgColor?: string;
  actions?: (hover?: boolean) => React.ReactNode;
  actionsProps?: CardActionsProps;
  onClick?: () => void;
}

/* Generic card rendering molecule depiction with optional content and actions. */
export const MolCard = ({
  children,
  smiles,
  depictNoStereo = false,
  depictWidth,
  depictHeight,
  depictmcs,
  bgColor,
  actions = () => undefined,
  actionsProps,
  onClick,
  ...cardProps
}: MolCardProps) => {
  const [hover, setHover] = useState<boolean>(false);

  return (
    <Card
      {...cardProps}
      sx={{ bgcolor: bgColor, cursor: onClick ? "pointer" : undefined }}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <CardContent>
        <DepictMolecule
          height={depictHeight}
          mcs={depictmcs}
          noStereo={depictNoStereo}
          smiles={smiles}
          width={depictWidth}
        />
        {Children.only(children)}
      </CardContent>
      <CardActions {...actionsProps} disableSpacing>
        {actions(hover)}
      </CardActions>
    </Card>
  );
};
