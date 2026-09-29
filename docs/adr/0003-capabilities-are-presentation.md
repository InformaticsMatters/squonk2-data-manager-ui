# 3. Client capabilities are presentation, not enforcement

Date: 2026-08-14

## Status

Accepted. Delivered by [#1914](https://github.com/InformaticsMatters/squonk2-data-manager-ui/issues/1914)
and its build tickets #1915–#1945.

## Context

Authorization presentation was inconsistent with the generated API contracts: some controls were
hidden where the server would have allowed them, others were offered where it would not, and a
caller could not tell why an action was unavailable. The temptation in a redesign is to build one
permission engine that answers every such question centrally.

## Decision

The generated API contracts and the server's responses remain the authorization authority. Client
capabilities exist to make the UI understandable and safe to interact with, and never to enforce
anything.

- Each family owns pure, named, action-specific capability evaluators. Each takes caller identity
  and concrete generated resources, memberships and realm roles, and returns `enabled`, `disabled`
  with a concise reason, or `hidden`.
- Only exclusively platform-administrator actions are hidden from callers lacking the role. Ordinary
  actions that are known to be unavailable are disabled with a reason.
- Where facts are insufficient to establish authority, an ordinary action stays available and states
  what it requires. An authoritative server `403` is then handled as authorization feedback, without
  changing scope.
- There is no universal permission engine and no global capability context. Only small predicates
  are shared, and only after the generated semantics behind them are demonstrably common.

## Consequences

- Capability rules are exhaustively table-testable as pure functions over caller identity, resource
  facts, memberships and realm roles, and they are tested that way.
- A UI hint can never masquerade as security. A caller who reaches an endpoint another way is
  refused by the server, which is where refusal belongs.
- The three families each state the capability vocabulary in their own terms. What they share — the
  three statuses, how a reason is read off one, and the sentence used when authority is not yet
  confirmed — lives in `src/application/capability.ts`; the rules themselves do not.
