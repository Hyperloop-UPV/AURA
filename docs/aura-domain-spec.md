# AURA Domain Specification

This document is the detailed domain-model reference for AURA. It is linked from the root
`CLAUDE.md`, which holds the operating rules; this file holds the *what* — the business
concepts, workflow, and data shapes AURA is built around.

---

## Core domain model

### CRM Organization

`CRM Organization` represents a **company**.

Examples:

```text
DHL
Siemens
Mouser
Analog Devices
```

An Organization is permanent and must not represent a specific sponsorship season.

Do not create a duplicate custom `Partner` DocType unless there is a compelling architectural
reason.

The Organization should eventually become the main entry point for the complete company
history.

### CRM Contact

`CRM Contact` represents a **person** belonging to or associated with an Organization.

Example:

```text
Organization: DHL

Contacts:
- Juan García
- María López
```

Contacts may change over time, but the Organization remains the permanent company entity.

### CRM Deal

For AURA, a `CRM Deal` represents a **company sponsorship relationship for one specific
season**.

Example:

```text
Organization: DHL

Deals:
- DHL 2024/25
- DHL 2025/26
- DHL 2026/27
```

This differs slightly from the usual sales meaning of Deal.

In AURA:

> Deal ≈ sponsorship relationship for a company during one season.

This allows historical information to remain separated by season.

Never store season-dependent information only on the Organization when it belongs to a Deal.

For example, these belong to the Deal:

* sponsorship season;
* sponsorship workflow status;
* sponsorship tier;
* contributions;
* season-specific responsibilities;
* season-specific outcome.

---

## Leads

Frappe CRM includes Leads, but **AURA currently does not use Leads**.

The intended workflow is directly:

```text
Organization
    ↓
Deal
```

Do not introduce a Lead-based workflow unless explicitly requested.

Do not delete the Frappe CRM Lead DocType or modify CRM core merely to remove it.

If Leads need to be hidden from users later, prefer permissions or supported UI customization.

---

## Sponsorship workflow

The sponsorship relationship follows this state machine.

### Main sponsorship flow

```text
Potencial
    ↓
Contacto
    ↓
Negociación
    ↓
Partner
    ↓
En renovación
    ↓
Contacto
```

Transitions:

```text
Potencial
→ Contacto
Reason: Se realiza el contacto

Contacto
→ Negociación
Reason: Respuesta positiva

Negociación
→ Partner
Reason: Se materializa el acuerdo

Partner
→ En renovación
Reason: Fin de temporada

En renovación
→ Contacto
Reason: Se retoma el contacto
```

### Non-sponsorship states

There are also three states outside the normal sponsorship flow:

```text
Inactivo
Sin respuesta
No Partner
```

These represent different reasons why a company is not currently moving through the
sponsorship pipeline.

Relevant sponsorship states may transition into these states depending on the outcome of the
relationship.

`Inactivo` can return to:

```text
Inactivo
→ Contacto
Reason: Se reactiva el contacto
```

### Canonical state names

Use these names consistently unless explicitly changed:

```text
Potencial
Contacto
Negociación
Partner
En renovación
Inactivo
Sin respuesta
No Partner
```

Do not silently invent alternative statuses such as:

```text
Qualified
Won
Lost
Closed
Prospect
Proposal
```

unless the existing state model is explicitly being redesigned.

---

## Sponsorship status vs sponsorship tier

These are **different concepts** and must never be conflated.

### Sponsorship status

Answers:

> What stage is the relationship currently in?

Examples:

```text
Potencial
Contacto
Negociación
Partner
En renovación
Inactivo
Sin respuesta
No Partner
```

### Sponsorship tier

Answers:

> What sponsorship category or level does this agreement have?

Examples may include:

```text
Collaborator
Pro
```

Additional official tiers may be added later.

The sponsorship tier should be a separate field on the Deal.

Recommended conceptual field:

```text
partner_tier
```

Prefer a controlled field such as `Select` rather than arbitrary free text if the tiers are a
fixed set.

This enables reliable filtering and historical analysis.

Example:

```text
DHL 2024/25
Status: Partner
Tier: Collaborator

DHL 2025/26
Status: Partner
Tier: Pro

DHL 2026/27
Status: Negociación
Tier: Pro
```

---

## Season

AURA needs a custom DocType representing the Hyperloop sponsorship season.

Recommended DocType:

```text
Season
```

Initial fields:

```text
season_name
start_date
end_date
active
```

Possible future fields:

```text
previous_season
next_season
```

Example:

```text
Season
2026/27

Start Date:
2026-09-01

End Date:
2027-08-31

Active:
Yes
```

A `CRM Deal` should link to a `Season`.

Do not store seasons as arbitrary text if they can be represented as links to the Season
DocType.

---

## Historical ownership

AURA must preserve the history of which agents managed each company.

A single current `assigned_to` field is not sufficient.

Create/use a custom DocType conceptually similar to:

```text
Partner Assignment
```

It should support multiple simultaneous agents and historical assignments.

Recommended fields:

```text
organization
deal
season
user
role
from_date
until_date
notes
```

Examples:

```text
DHL | 2024/25 | María
DHL | 2025/26 | Carlos
DHL | 2025/26 | Pedro
DHL | 2026/27 | Javier
DHL | 2026/27 | Laura
```

Historical assignments are a central part of AURA, not optional metadata.

---

## Organization as historical dossier

This is a core product requirement.

The Organization page should eventually provide an aggregated historical view such as:

```text
DHL
════════════════════════════════════

CURRENT

Season:
2026/27

Status:
Negociación

Tier:
Pro

Agents:
Agent A
Agent B

Next action:
Follow up sponsorship proposal


HISTORY
────────────────────────────────────

2025/26
Partner
Pro
Agents: ...

2024/25
Partner
Collaborator
Agents: ...

2023/24
Partner
Collaborator
Agents: ...


CONTACTS
────────────────────────────────────

Juan García
María López


RECENT ACTIVITY
────────────────────────────────────

Email
Meeting
Note
Task


PENDING
────────────────────────────────────

Follow up proposal
Request logo
Prepare renewal
```

A new agent should not need to manually search the Deals list and apply a company filter
merely to reconstruct the relationship.

When implementing features, prefer designs that strengthen the Organization as the company's
historical dossier.

---

## Contributions

AURA should eventually track what each sponsor contributes during a season.

Recommended custom DocType:

```text
Contribution
```

Potential fields:

```text
organization
deal
season
type
description
estimated_value
notes
```

Initial contribution types may include:

```text
Money
Material
Services
Discount
Manufacturing
Transport
Other
```

Contributions are season-specific and must therefore be related to the relevant Deal/Season.

---

## Handover

Agent rotation is one of the main reasons AURA exists.

Handover functionality is part of the core product rather than an optional future enhancement.

A handover should eventually be able to record:

```text
organization
previous_season
new_season
previous_agents
new_agents
pending_tasks
important_documents
notes
checklist
completion_state
completion_date
```

The goal is to transfer not only responsibility but also contextual knowledge.

---

## Tasks and activities

Prefer existing Frappe CRM functionality when it already solves the problem.

Use standard CRM Tasks where appropriate rather than creating an unnecessary parallel task
system.

Typical tasks include:

```text
Follow up proposal
Prepare meeting
Request logo
Confirm contribution
Contact sponsor
Prepare renewal
```

Activities, emails, notes and tasks should remain associated with the relevant company/Deal so
future agents can understand the history.

---

## Email architecture

Hyperloop UPV uses a real Google Workspace Gmail account for Partners.

The email account remains the **source of truth for email**.

AURA is the **source of truth for relationship context**.

Conceptually:

```text
Google Workspace
= email archive

AURA
= why the email matters and which relationship it belongs to
```

Do not design a solution where emails exist only inside AURA.

The system should eventually support:

```text
sender email
    ↓
CRM Contact
    ↓
CRM Organization
    ↓
current Deal / Season
    ↓
Communication / timeline
```

Association rules should generally prefer:

1. exact Contact email match;
2. known company-domain suggestion;
3. manual assignment if uncertain.

Avoid aggressive automatic domain association where it may cause incorrect company
attribution.

Outgoing email should be able to use the shared Partners Gmail account while retaining
internally which actual AURA user performed the action.

Do not implement production Gmail integration before the core data model is stable unless
explicitly requested.

---

## Google Drive

Google Drive should remain the source of truth for relevant documents when practical.

AURA should provide relationship context and links to files.

Conceptually:

```text
Google Drive
= file

AURA
= which company / season / sponsorship the file belongs to
```

Avoid unnecessarily duplicating files if an appropriate Drive integration is available.

---

## Filtering and reporting

Data should be modeled so users can easily filter Deals by combinations such as:

```text
Season = 2026/27
Status = Partner
Tier = Pro
```

or:

```text
Season = 2026/27
Agent = <current user>
Status != No Partner
```

Potential useful views include:

```text
Current Partners
My Partners
Pro Partners
Collaborators
Negotiating
In Renewal
No Response
Needs Attention
```

When designing fields, consider whether they will need to be:

* filtered;
* grouped;
* sorted;
* reported;
* historically compared.

---

## Main acceptance criterion

AURA succeeds when a new member of the Partners team can be assigned several unfamiliar
companies and, using only AURA, quickly answer:

* What is this company?
* What is our current relationship with it?
* What happened in previous seasons?
* Was it previously a partner?
* At what sponsorship tier?
* Who managed it?
* Who are the relevant contacts?
* What has the company contributed?
* What were the latest communications?
* What tasks are still pending?
* What should I do next?

If answering those questions still requires searching old spreadsheets or asking the previous
agent, the feature is not complete.
