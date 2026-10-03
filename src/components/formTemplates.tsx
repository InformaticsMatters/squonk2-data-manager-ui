import { type ComponentType } from "react";

import {
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Typography,
} from "@mui/material";
import { type FormProps } from "@rjsf/core";
import { type ErrorListProps, type IconButtonProps, TranslatableString } from "@rjsf/utils";

import {
  AddIcon,
  ClearIcon,
  CopyIcon,
  DeleteIcon,
  ErrorIcon,
  MoveDownIcon,
  MoveUpIcon,
} from "./icons";

/**
 * Form controls drawn with the application's icons. `@rjsf/mui` draws its array and error controls
 * with Material icons of its own; passing these as a form's `templates` keeps those forms in the
 * same vocabulary as the rest of the application.
 */
const iconButton = (
  Icon: ComponentType<{ fontSize?: "small" }>,
  label: TranslatableString,
  color?: "error" | "primary",
) => {
  const Button = ({
    registry,
    color: _color,
    icon: _icon,
    iconType: _iconType,
    uiSchema: _uiSchema,
    ...props
  }: IconButtonProps) => (
    <IconButton color={color} size="small" title={registry.translateString(label)} {...props}>
      <Icon fontSize="small" />
    </IconButton>
  );
  return Button;
};

const ErrorList = ({ errors, registry }: ErrorListProps) => (
  <Paper elevation={2} sx={{ mb: 2, p: 2 }}>
    <Typography variant="h6">{registry.translateString(TranslatableString.ErrorsLabel)}</Typography>
    <List dense>
      {errors.map((error) => (
        <ListItem key={error.stack}>
          <ListItemIcon>
            <ErrorIcon color="error" />
          </ListItemIcon>
          <ListItemText primary={error.stack} />
        </ListItem>
      ))}
    </List>
  </Paper>
);

export const formTemplates: FormProps["templates"] = {
  ButtonTemplates: {
    AddButton: iconButton(AddIcon, TranslatableString.AddItemButton, "primary"),
    ClearButton: iconButton(ClearIcon, TranslatableString.ClearButton),
    CopyButton: iconButton(CopyIcon, TranslatableString.CopyButton),
    MoveDownButton: iconButton(MoveDownIcon, TranslatableString.MoveDownButton),
    MoveUpButton: iconButton(MoveUpIcon, TranslatableString.MoveUpButton),
    RemoveButton: iconButton(DeleteIcon, TranslatableString.RemoveButton, "error"),
  },
  ErrorListTemplate: ErrorList,
};
