# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 1. Project overview

**AURA** is the internal partner and sponsorship management system for **Hyperloop UPV**.

AURA is built on:

* Frappe Framework
* Frappe CRM
* A custom Frappe application named `aura`

The primary purpose of AURA is **institutional memory and continuity between yearly
generations of the Hyperloop UPV Partners team**. AURA is not a generic sales CRM — its main
goal is that a new partner agent can open a company and understand its complete relationship
with Hyperloop UPV without needing to search through old spreadsheets, emails, or ask previous
team members.

The key UX principle is:

> The Organization page must behave as the complete historical file of a company.

The full domain model, sponsorship workflow, and data shapes AURA is built around are in
**[`docs/aura-domain-spec.md`](docs/aura-domain-spec.md)** — read it before implementing any
DocType, field, or workflow logic. This file (CLAUDE.md) holds the operating rules; the spec
file holds the business concepts.

---

## 2. Current repository state

This repository is currently at the **planning stage** — there is no Frappe bench or `apps/`
directory yet (no `apps/frappe`, `apps/crm`, or `apps/aura`). Only this CLAUDE.md and the
`docs/` folder exist.

Once the bench and `aura` app are scaffolded, add here:

* how to start the bench (`bench start`);
* how to run the AURA app's tests (`bench --site <site> run-tests --app aura`);
* how to run migrations (`bench --site <site> migrate`);
* any linting/formatting commands adopted for the app.

Do not assume these commands exist yet — verify the bench is actually present before running
them.

### `docs/` folder

`docs/` is a **Quarto project** (`_quarto.yml`, `template.qmd`, `headfoot.tex`, logo assets)
used to generate PDF **progress reports for the project owner's boss** about AURA's
development status. It is unrelated to the AURA application itself — don't treat its contents
as app code or app documentation.

---

## 3. Architecture

AURA must extend Frappe CRM rather than replace it.

The architecture is:

```text
Frappe Framework
├── Frappe CRM
└── AURA
```

The installed applications should conceptually remain:

```text
apps/
├── frappe/
├── crm/
└── aura/
```

### Important rule

**Never modify Frappe CRM core files unless explicitly requested.**

Do not implement AURA features directly inside:

```text
apps/crm/
```

AURA-specific behavior must live in:

```text
apps/aura/
```

Use supported Frappe extension mechanisms whenever possible:

* custom DocTypes;
* Custom Fields;
* Property Setters;
* fixtures;
* hooks;
* Python controllers;
* scheduler events;
* permissions;
* supported frontend extension points.

Avoid forks or direct modifications of Frappe CRM unless there is no reasonable alternative and
the trade-off has been explicitly discussed.

---

## 4. Customization strategy

AURA must be maintainable across Frappe CRM upgrades.

When modifying existing CRM objects:

### If an existing object only needs more information

Use:

```text
Custom Field
```

Example:

```text
CRM Deal
+ Season
+ Partner Tier
```

### If an entirely new business concept is required

Use:

```text
Custom DocType
```

Example:

```text
Season
Partner Assignment
Contribution
Handover
```

### If an existing standard field is irrelevant

Prefer hiding it rather than deleting it.

Examples that may be unnecessary for AURA include generic CRM fields such as:

```text
Territory
Annual Revenue
```

Use supported customization mechanisms such as Property Setters / Customize Form.

Do not remove standard database fields from Frappe CRM merely because the current UI does not
need them.

---

## 5. Configuration and source control

Use this mental model:

```text
AURA repository
= how AURA works

Database
= what happened in AURA
```

### Must be reproducible from the repository

Examples:

* custom DocTypes;
* Python logic;
* hooks;
* scheduler logic;
* Custom Fields;
* Property Setters;
* required workflows;
* required sponsorship statuses;
* roles and permissions when appropriate;
* fixtures;
* global branding assets;
* CSS/SCSS;
* stable configuration required on every AURA installation.

### Must NOT be committed as application configuration

Examples:

* real organizations;
* contacts;
* emails;
* actual tasks;
* agreements;
* production partner data;
* passwords;
* API keys;
* OAuth tokens;
* encryption keys;
* database passwords.

If a configuration change made through the UI is required to reproduce AURA on a clean site,
export/version it appropriately.

Use Frappe mechanisms such as:

```text
Export Customizations
fixtures
hooks.py
developer_mode
```

where appropriate.

---

## 6. Data integrity principles

Prefer structured data over arbitrary strings when the information has known semantics.

Examples:

Prefer:

```text
Season → Link to Season
```

over:

```text
Season → "26-27"
```

Prefer:

```text
Partner Tier → Select
```

over unrestricted text.

Prefer:

```text
Organization → Link to CRM Organization
```

over storing `"DHL"` as text.

Avoid duplicating data across Organization and Deal unless there is a deliberate
denormalization strategy.

Historical values must remain historically correct. Do not overwrite historical sponsorship
information merely because the current season changes.

---

## 7. UI philosophy

AURA should reduce cognitive load.

Do not preserve generic CRM fields merely because they exist. The user interface should
emphasize information relevant to Hyperloop UPV Partners. Fields that do not provide value
should normally be hidden rather than deleted from the underlying CRM.

Do not build a custom frontend merely for cosmetic reasons.

Prefer:

1. standard Frappe CRM UI;
2. standard Desk UI;
3. supported customization;
4. small targeted extensions.

Only implement substantial custom frontend code when the workflow genuinely requires it.

---

## 8. Branding

The product name is:

```text
AURA
```

Users should think of the system as AURA, not simply "the CRM".

Global branding should eventually include: AURA name, logo, favicon, common visual identity,
global colors where maintainable. Branding that defines AURA should preferably be reproducible
from the `aura` repository.

Do not prioritize deep visual customization over correct workflows and data integrity.

---

## 9. Development principles

When implementing a feature:

1. Check whether Frappe or Frappe CRM already provides it.
2. Prefer configuration over custom code where configuration is sufficient.
3. Prefer AURA app code over modifying CRM core.
4. Preserve historical information.
5. Keep the solution reproducible from source control.
6. Avoid unnecessary frontend development.
7. Avoid overengineering.
8. Design for future team members who did not build the system.
9. Explain non-obvious architectural decisions in code comments or documentation.
10. Keep migration and future Frappe upgrades in mind.

## 10. Coding principles

Prefer clear, conventional Frappe code. Use descriptive names. Avoid clever abstractions unless
they reduce meaningful duplication. Keep business logic out of UI code whenever possible. Use
Python for backend business logic. When behavior becomes stable and important, prefer
application code over ad-hoc Server Scripts.

Before introducing a new dependency, explain why existing Frappe functionality is insufficient.

Never put secrets in source code. Never commit production data.

---

## 11. Before making structural changes

For significant architectural changes, first inspect the existing implementation. Do not
assume a DocType, field or configuration does not already exist.

Before creating something new, check for:

* existing Frappe CRM functionality;
* existing AURA DocTypes;
* existing Custom Fields;
* existing hooks;
* fixtures;
* existing naming conventions.

Avoid creating duplicate concepts.

---

## 12. Current implementation priority

The current priority is building the core sponsorship data model before advanced integrations.

Preferred order:

```text
1. Understand existing Frappe CRM entities
2. Organizations
3. Contacts
4. Deals
5. Season
6. Sponsorship status model
7. Partner Tier
8. Historical Partner Assignment
9. Organization historical view
10. Tasks and activities
11. Handover
12. Contributions
13. Email integration
14. Drive integration
15. Automations
16. Reporting
17. Branding polish
```

Do not jump directly to AI features or complex integrations while the underlying relationship
history is incomplete. See `docs/aura-domain-spec.md` for what each of these concepts means in
detail, and the acceptance criterion that defines when AURA is "done" for a given company.

---

## 13. Working with the user

The project owner is comfortable programming but is still learning Frappe and CRM concepts.

When discussing implementation:

* explain Frappe-specific concepts when first used;
* do not assume familiarity with CRM terminology;
* distinguish clearly between standard Frappe CRM behavior and AURA-specific behavior;
* explain why a proposed data model is appropriate before introducing significant complexity;
* favor incremental implementation;
* when there are multiple viable approaches, explain the trade-offs and recommend one.

Do not redesign already-decided architecture without a concrete technical reason.

When unsure whether something should be standard Frappe configuration or custom AURA code,
prefer the most maintainable solution and explain the choice.
