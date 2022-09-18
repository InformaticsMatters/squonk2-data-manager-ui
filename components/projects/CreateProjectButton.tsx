import { useState } from "react";

import type { ProductDetail, UnitDetail } from "@squonk/account-server-client";

import { Button } from "@mui/material";

import { CreateProjectForm } from "./CreateProjectForm";

export interface CreateProjectButtonProps {
  unit: UnitDetail;
  product?: ProductDetail;
  buttonText?: string;
}

/**
 * Button which allows user to create a new project.
 */
export const CreateProjectButton = ({
  unit,
  product,
  buttonText = "Create",
}: CreateProjectButtonProps) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>{buttonText}</Button>

      <CreateProjectForm
        modal={{
          id: "create-project",
          title: "Create Project",
          submitText: "Create",
          open,
          onClose: () => setOpen(false),
        }}
        product={product}
        unitId={unit.id}
      />
    </>
  );
};
