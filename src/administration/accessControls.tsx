import { useState } from "react";

import { MenuItem, Stack, TextField } from "@mui/material";
import { useForm } from "@tanstack/react-form";
import { z } from "zod/mini";

import { ManageUsers } from "../components/ManageUsers";
import { ModalWrapper } from "../components/modals/ModalWrapper";
import { capitalise } from "../utils/app/language";
import {
  type AdministrationCapability,
  capabilityReason,
  isPersonalUnitResource,
} from "./capabilities";
import { type ProductPrivacy, productPrivacyLabel, productPrivacyValues } from "./privacy";
import { useAdministrationCommandFeedback } from "./useAdministrationFeedback";

/**
 * What the organisation overview and the unit's Access section share: how a unit is labelled, and
 * the controls an organisation and a unit present identically.
 *
 * Each control is a form over a command the caller supplies, so nothing here knows which resource it
 * is editing. That keeps the difference between the two resources in the views that own them rather
 * than in the fields they have in common.
 */

/** Resolved from the generated personal unit resource, never from the unit's name. */
export const unitTypeLabel = (unitIdentity: string, personalUnitId: string | undefined) =>
  isPersonalUnitResource(unitIdentity, personalUnitId) ? "Personal unit" : "Unit";

/** Only a form that collects an owner requires one; every other owner is decided by the server. */
const createResourceSchema = (existingNames: string[], subject: string, collectsOwner: boolean) =>
  z.object({
    name: z.string().check(
      z.minLength(2, "The name is too short"),
      z.refine((name) => !existingNames.includes(name), {
        message: `The name is already used for a ${subject}`,
      }),
    ),
    owner: collectsOwner
      ? z.string().check(z.minLength(1, "The username for the owner is required"))
      : z.string(),
  });

/**
 * Collects the name of a resource about to be created, and its owner when the resource names one.
 * An offered owner defaults to the caller but stays editable, because a platform administrator
 * creates organisations on behalf of other users.
 */
export const CreateResourceModal = ({
  defaultOwner,
  existingNames,
  id,
  onClose,
  onSubmit,
  open,
  subject,
  title,
}: {
  /** Present only for resources that name their own owner; absent forms neither show nor require one. */
  defaultOwner?: string;
  existingNames: string[];
  id: string;
  onClose: () => void;
  onSubmit: (created: { name: string; owner: string }) => Promise<void>;
  open: boolean;
  subject: string;
  title: string;
}) => {
  const collectsOwner = defaultOwner !== undefined;
  const form = useForm({
    defaultValues: { name: "", owner: defaultOwner ?? "" },
    validators: { onChange: createResourceSchema(existingNames, subject, collectsOwner) },
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
  });

  return (
    <ModalWrapper
      DialogProps={{ maxWidth: "sm", fullWidth: true }}
      id={id}
      open={open}
      submitDisabled={!form.state.canSubmit}
      submitText="Create"
      title={title}
      onClose={onClose}
      onSubmit={() => void form.handleSubmit()}
    >
      <Stack spacing={2} sx={{ my: 2 }}>
        <form.Field name="name">
          {(field) => (
            <TextField
              autoFocus
              fullWidth
              error={field.state.meta.errors.length > 0}
              helperText={field.state.meta.errors.map((error) => error?.message)[0]}
              label={`${capitalise(subject)} name`}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
            />
          )}
        </form.Field>
        {!!collectsOwner && (
          <form.Field name="owner">
            {(field) => (
              <TextField
                fullWidth
                // Prevents password managers from suggesting credentials for this field
                autoComplete="off"
                error={field.state.meta.errors.length > 0}
                helperText={field.state.meta.errors.map((error) => error?.message)[0]}
                label="Owner (username)"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
              />
            )}
          </form.Field>
        )}
      </Stack>
    </ModalWrapper>
  );
};

/**
 * Adds and removes one user at a time from a resource that owns a user list. Failures leave the
 * displayed list untouched; the refreshed generated resource is the only source of truth.
 */
export const ManageResourceUsers = ({
  add,
  capability,
  disabledUsers,
  noun,
  remove,
  resource,
  title,
  users,
}: {
  add: (userId: string) => Promise<unknown>;
  capability: AdministrationCapability;
  disabledUsers?: string[];
  noun: string;
  remove: (userId: string) => Promise<unknown>;
  resource: string;
  title: string;
  users: string[];
}) => {
  const feedback = useAdministrationCommandFeedback();
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState("");

  const change = async (
    username: string | undefined,
    verb: "added" | "removed",
    command: (userId: string) => Promise<unknown>,
  ) => {
    if (username === undefined) {
      feedback.warn("Username not found");
      return;
    }
    setIsLoading(true);
    try {
      await command(username);
      setInput("");
      feedback.announce(`${noun} ${username} ${verb}`);
    } catch (error) {
      feedback.report(error, `manage ${noun.toLowerCase()}s of`, resource);
    }
    setIsLoading(false);
  };

  return (
    <ManageUsers
      disabled={capability.status !== "enabled"}
      disabledUsers={disabledUsers}
      helperText={capabilityReason(capability)}
      inputValue={input}
      isLoading={isLoading}
      title={title}
      users={users}
      onInputChange={setInput}
      onRemove={async (_, changedUser) => change(changedUser, "removed", remove)}
      onSelect={async (_, changedUser) => {
        setInput(changedUser ?? "");
        await change(changedUser, "added", add);
      }}
    />
  );
};

/**
 * The default privacy a resource declares. While a change is in flight the field states the value
 * it is applying, and once the command has answered the addressed resource states its own value
 * again, so a rejected change never reads as one the server accepted.
 */
export const DefaultPrivacySelect = ({
  announcement,
  capability,
  privacy,
  resource,
  update,
}: {
  /** What a successful change is announced as; the resource itself names its own failures. */
  announcement: string;
  capability: AdministrationCapability;
  privacy: ProductPrivacy;
  resource: string;
  update: (privacy: ProductPrivacy) => Promise<unknown>;
}) => {
  const feedback = useAdministrationCommandFeedback();
  const [requested, setRequested] = useState<ProductPrivacy | undefined>();

  const change = async (next: ProductPrivacy) => {
    setRequested(next);
    try {
      await update(next);
      feedback.announce(announcement);
    } catch (error) {
      feedback.report(error, "update the default project privacy of", resource);
    }
    setRequested(undefined);
  };

  return (
    <TextField
      select
      disabled={requested !== undefined || capability.status !== "enabled"}
      helperText={capabilityReason(capability)}
      label="Default project privacy"
      value={requested ?? privacy}
      onChange={(event) => void change(event.target.value as ProductPrivacy)}
    >
      {productPrivacyValues.map((value) => (
        <MenuItem key={value} value={value}>
          {productPrivacyLabel(value)}
        </MenuItem>
      ))}
    </TextField>
  );
};
