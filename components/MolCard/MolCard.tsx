import type { ReactNode } from "react";
import { useState } from "react";

import type { CardActionsProps, CardProps } from "@mui/material";
import { Card, CardActions, CardContent } from "@mui/material";

import type { DepictParameters, DepictVariants } from "./DepictMolecule";
import { DepictMolecule } from "./DepictMolecule";

export type MolCardProps = DepictVariants & {
  children?: ReactNode;
  actions?: (hover?: boolean) => ReactNode;
  actionsProps?: CardActionsProps;
  onClick?: () => void;
  depictParams: DepictParameters;
  cardProps?: CardProps;
};

/* Generic card rendering molecule depiction with optional content and actions. */
export const MolCard = ({
  children,
  actions = () => undefined,
  actionsProps,
  onClick,
  depictParams,
  cardProps,
  ...imgSrc
}: MolCardProps) => {
  const [hover, setHover] = useState<boolean>(false);

  const actionsContent = actions(hover);

  return (
    <Card
      {...cardProps}
      // bgcolor: bgColor,
      sx={{ cursor: onClick ? "pointer" : undefined }}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <CardContent>
        <DepictMolecule depictParams={depictParams} {...imgSrc} />
        {children}
      </CardContent>
      {actionsContent && (
        <CardActions {...actionsProps} disableSpacing>
          {actionsContent}
        </CardActions>
      )}
    </Card>
  );
};
