import { useEffect, useMemo, useState } from 'react';

import { RestApiClient } from 'twenty-client-sdk/rest';
import { defineFrontComponent } from 'twenty-sdk/define';

export const PARTNER_ADVANTAGES_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER =
  '337a928a-a9e1-4bfe-ba60-d573869a3e54';

type JsonRecord = Record<string, unknown>;

type Season = {
  id: string;
  name: string;
};

type PartnerTier = {
  id: string;
  name: string;
};

type Opportunity = {
  id: string;
  name: string;
  companyId: string | null;
  companyName: string | null;
  seasonId: string | null;
  partnerTierId: string | null;
};

type PartnerTask = {
  id: string;
  title: string;
  status: string | null;
  dueAt: string | null;
  assigneeId: string | null;
  assigneeName: string | null;
};

type WorkspaceMember = {
  id: string;
  name: string;
};

type TaskTargetLink = {
  taskId: string;
  opportunityId: string;
};

type OpportunityTaskGroup = {
  opportunity: Opportunity;
  tasks: PartnerTask[];
  pendingCount: number;
  nextDueAt: string | null;
};

const PAGE_SIZE = 60;
const UNASSIGNED_SEASON_ID = '__aura_unassigned_season__';

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const getString = (record: JsonRecord, key: string): string | null => {
  const value = record[key];
  return typeof value === 'string' && value !== '' ? value : null;
};

const getBoolean = (record: JsonRecord, key: string): boolean | null => {
  const value = record[key];
  if (typeof value === 'boolean') return value;
  if (value === 'true' || value === 1) return true;
  if (value === 'false' || value === 0) return false;
  return null;
};

const unwrapOne = (response: unknown, key?: string): JsonRecord => {
  if (!isRecord(response)) return {};

  if (key && isRecord(response[key])) {
    return response[key] as JsonRecord;
  }

  if (isRecord(response.data)) {
    if (key && isRecord(response.data[key])) {
      return response.data[key] as JsonRecord;
    }

    return response.data;
  }

  return response;
};

const unwrapList = (response: unknown, key: string): JsonRecord[] => {
  if (Array.isArray(response)) return response.filter(isRecord);
  if (!isRecord(response)) return [];

  const direct = response[key];
  if (Array.isArray(direct)) return direct.filter(isRecord);

  if (isRecord(direct) && Array.isArray(direct.edges)) {
    return direct.edges
      .filter(isRecord)
      .map((edge) => edge.node)
      .filter(isRecord);
  }

  const data = response.data;

  if (Array.isArray(data)) return data.filter(isRecord);

  if (isRecord(data)) {
    const nested = data[key];

    if (Array.isArray(nested)) return nested.filter(isRecord);

    if (isRecord(nested) && Array.isArray(nested.edges)) {
      return nested.edges
        .filter(isRecord)
        .map((edge) => edge.node)
        .filter(isRecord);
    }
  }

  return [];
};

const findPageInfo = (
  response: unknown,
  key: string,
): { hasNextPage: boolean; endCursor: string | null } | null => {
  if (!isRecord(response)) return null;

  const candidates: unknown[] = [
    response.pageInfo,
    isRecord(response.data) ? response.data.pageInfo : undefined,
    isRecord(response[key]) ? response[key].pageInfo : undefined,
    isRecord(response.data) && isRecord(response.data[key])
      ? response.data[key].pageInfo
      : undefined,
    isRecord(response.meta) ? response.meta.pageInfo : undefined,
  ];

  for (const candidate of candidates) {
    if (!isRecord(candidate)) continue;

    const hasNextPage = candidate.hasNextPage;
    const endCursor = candidate.endCursor;

    if (typeof hasNextPage === 'boolean') {
      return {
        hasNextPage,
        endCursor: typeof endCursor === 'string' ? endCursor : null,
      };
    }
  }

  return null;
};

const fetchAllRecords = async (
  client: RestApiClient,
  resource: string,
  maxPages = 50,
): Promise<JsonRecord[]> => {
  const records: JsonRecord[] = [];
  const seenIds = new Set<string>();
  let cursor: string | null = null;

  for (let page = 0; page < maxPages; page += 1) {
    const cursorPart = cursor
      ? `&starting_after=${encodeURIComponent(cursor)}`
      : '';

    const response = await client.get(
      `/rest/${resource}?limit=${PAGE_SIZE}${cursorPart}`,
    );

    const pageRecords = unwrapList(response, resource);

    for (const record of pageRecords) {
      const id = getString(record, 'id');
      if (!id || seenIds.has(id)) continue;
      seenIds.add(id);
      records.push(record);
    }

    const pageInfo = findPageInfo(response, resource);
    if (!pageInfo?.hasNextPage || !pageInfo.endCursor) break;
    if (pageInfo.endCursor === cursor) break;

    cursor = pageInfo.endCursor;
  }

  return records;
};

const fetchRecordsById = async (
  client: RestApiClient,
  resource: string,
  ids: string[],
): Promise<JsonRecord[]> => {
  const result: JsonRecord[] = [];
  const uniqueIds = Array.from(new Set(ids));
  const chunkSize = 12;

  for (let index = 0; index < uniqueIds.length; index += chunkSize) {
    const chunk = uniqueIds.slice(index, index + chunkSize);

    const records = await Promise.all(
      chunk.map(async (id) => {
        try {
          const response = await client.get(
            `/rest/${resource}/${encodeURIComponent(id)}`,
          );
          const singular = resource.endsWith('ies')
            ? `${resource.slice(0, -3)}y`
            : resource.endsWith('s')
              ? resource.slice(0, -1)
              : resource;
          return unwrapOne(response, singular);
        } catch {
          return null;
        }
      }),
    );

    for (const record of records) {
      if (record && getString(record, 'id')) result.push(record);
    }
  }

  return result;
};

const relationId = (
  record: JsonRecord,
  idField: string,
  relationField: string,
): string | null => {
  const direct = getString(record, idField);
  if (direct) return direct;

  const relation = record[relationField];
  return isRecord(relation) ? getString(relation, 'id') : null;
};

const normalizeSeason = (record: JsonRecord): Season | null => {
  const id = getString(record, 'id');
  const name = getString(record, 'name');
  return id && name ? { id, name } : null;
};

const normalizeTier = (record: JsonRecord): PartnerTier | null => {
  const id = getString(record, 'id');
  const name = getString(record, 'name');
  return id && name ? { id, name } : null;
};

const normalizeOpportunity = (record: JsonRecord): Opportunity | null => {
  const id = getString(record, 'id');
  if (!id) return null;

  const company = record.company;
  const companyName = isRecord(company) ? getString(company, 'name') : null;

  return {
    id,
    name: getString(record, 'name') ?? companyName ?? 'Opportunity',
    companyId: relationId(record, 'companyId', 'company'),
    companyName,
    seasonId: relationId(record, 'seasonId', 'season'),
    partnerTierId: relationId(record, 'partnerTierId', 'partnerTier'),
  };
};

const getFullName = (value: unknown): string | null => {
  if (!isRecord(value)) return null;

  const firstName = getString(value, 'firstName') ?? '';
  const lastName = getString(value, 'lastName') ?? '';
  const fullName = `${firstName} ${lastName}`.trim();

  return fullName || null;
};

const normalizeWorkspaceMember = (record: JsonRecord): WorkspaceMember | null => {
  const id = getString(record, 'id');
  if (!id) return null;

  const nestedName = getFullName(record.name);
  const fallbackName =
    getString(record, 'displayName') ??
    getString(record, 'userEmail') ??
    getString(record, 'email');

  return {
    id,
    name: nestedName ?? fallbackName ?? 'Workspace member',
  };
};

const normalizeTask = (record: JsonRecord): PartnerTask | null => {
  const id = getString(record, 'id');
  const title = getString(record, 'title');

  if (!id || !title) return null;

  // The generated AURA tasks carry both markers. Accept either one because
  // some Twenty list responses can omit custom boolean fields while the
  // single-record endpoint still returns the custom text field.
  const isAuraPartnerTask = getBoolean(record, 'auraPartnerTask') === true;
  const auraTemplateId = getString(record, 'auraTaskTemplateId');

  if (!isAuraPartnerTask && !auraTemplateId) return null;

  const assignee = record.assignee;
  const nestedAssigneeName = isRecord(assignee)
    ? getFullName(assignee.name) ??
      getString(assignee, 'displayName') ??
      getString(assignee, 'userEmail')
    : null;

  return {
    id,
    title,
    status: getString(record, 'status'),
    dueAt: getString(record, 'dueAt'),
    assigneeId:
      relationId(record, 'assigneeId', 'assignee') ??
      relationId(record, 'workspaceMemberId', 'workspaceMember'),
    assigneeName: nestedAssigneeName,
  };
};

const normalizeTaskTargetLink = (record: JsonRecord): TaskTargetLink | null => {
  // Twenty exposes TaskTarget relations with `target*` names when reading
  // records (for example `targetOpportunityId`), even though creation accepts
  // `opportunityId`. Keep both forms for compatibility across versions.
  const taskId =
    relationId(record, 'taskId', 'task') ??
    relationId(record, 'targetTaskId', 'targetTask');

  const opportunityId =
    relationId(record, 'targetOpportunityId', 'targetOpportunity') ??
    relationId(record, 'opportunityId', 'opportunity');

  return taskId && opportunityId ? { taskId, opportunityId } : null;
};

const isTaskCompleted = (task: PartnerTask): boolean => {
  const status = (task.status ?? '').toUpperCase();
  return status === 'DONE' || status === 'COMPLETED';
};

const toTime = (value: string | null): number | null => {
  if (!value) return null;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : null;
};

const formatDate = (value: string | null): string => {
  if (!value) return '—';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleDateString(undefined, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const DAY_MS = 24 * 60 * 60 * 1000;

type DeadlineStyle = {
  background: string;
  border: string;
  color: string;
  label: string;
  daysRemaining: number | null;
};

const getDeadlineStyle = (
  dueAt: string | null,
  completed: boolean,
): DeadlineStyle => {
  if (completed) {
    return {
      background: 'rgba(127,127,127,0.08)',
      border: 'rgba(127,127,127,0.18)',
      color: 'inherit',
      label: 'Resuelta',
      daysRemaining: null,
    };
  }

  if (!dueAt) {
    return {
      background: 'rgba(127,127,127,0.06)',
      border: 'rgba(127,127,127,0.16)',
      color: 'inherit',
      label: 'Sin fecha',
      daysRemaining: null,
    };
  }

  const due = new Date(dueAt);
  if (Number.isNaN(due.getTime())) {
    return {
      background: 'rgba(127,127,127,0.06)',
      border: 'rgba(127,127,127,0.16)',
      color: 'inherit',
      label: 'Sin fecha',
      daysRemaining: null,
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  const daysRemaining = Math.ceil((due.getTime() - today.getTime()) / DAY_MS);

  if (daysRemaining < 0) {
    return {
      background: 'hsl(0 72% 50% / 0.12)',
      border: 'hsl(0 72% 50% / 0.34)',
      color: 'hsl(0 72% 48%)',
      label: `${Math.abs(daysRemaining)} d vencida`,
      daysRemaining,
    };
  }

  // 0 days = orange/red-orange; 30+ days = green. The hue moves
  // continuously as the delivery date approaches.
  const normalized = Math.min(daysRemaining, 30) / 30;
  const hue = Math.round(18 + normalized * 102);

  return {
    background: `hsl(${hue} 68% 45% / 0.12)`,
    border: `hsl(${hue} 68% 45% / 0.30)`,
    color: `hsl(${hue} 62% 40%)`,
    label:
      daysRemaining === 0
        ? 'Hoy'
        : daysRemaining === 1
          ? '1 día'
          : `${daysRemaining} días`,
    daysRemaining,
  };
};

const PartnerAdvantages = () => {
  const client = useMemo(() => new RestApiClient(), []);

  const [seasons, setSeasons] = useState<Season[]>([]);
  const [tiers, setTiers] = useState<PartnerTier[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [tasks, setTasks] = useState<PartnerTask[]>([]);
  const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMember[]>([]);
  const [links, setLinks] = useState<TaskTargetLink[]>([]);

  const [selectedSeasonId, setSelectedSeasonId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedOpportunityIds, setCollapsedOpportunityIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const [seasonRecords, tierRecords, targetRecords, memberRecords] =
          await Promise.all([
            fetchAllRecords(client, 'seasons'),
            fetchAllRecords(client, 'partnerTiers'),
            fetchAllRecords(client, 'taskTargets'),
            fetchAllRecords(client, 'workspaceMembers').catch(() => []),
          ]);

        const loadedSeasons = seasonRecords
          .map(normalizeSeason)
          .filter((season): season is Season => season !== null)
          .sort((a, b) => b.name.localeCompare(a.name));

        const loadedTiers = tierRecords
          .map(normalizeTier)
          .filter((tier): tier is PartnerTier => tier !== null);

        const loadedLinks = targetRecords
          .map(normalizeTaskTargetLink)
          .filter((link): link is TaskTargetLink => link !== null);

        const loadedWorkspaceMembers = memberRecords
          .map(normalizeWorkspaceMember)
          .filter((member): member is WorkspaceMember => member !== null);

        const taskIds = loadedLinks.map((link) => link.taskId);
        const opportunityIds = loadedLinks.map((link) => link.opportunityId);

        // Fetch single records deliberately. The existing AURA Tier component
        // already uses these endpoints and they reliably expose AURA custom
        // fields/relations such as auraPartnerTask, auraTaskTemplateId,
        // partnerTierId and seasonId.
        const [taskRecords, opportunityRecords] = await Promise.all([
          fetchRecordsById(client, 'tasks', taskIds),
          fetchRecordsById(client, 'opportunities', opportunityIds),
        ]);

        const loadedTasks = taskRecords
          .map(normalizeTask)
          .filter((task): task is PartnerTask => task !== null);

        const loadedOpportunitiesBase = opportunityRecords
          .map(normalizeOpportunity)
          .filter(
            (opportunity): opportunity is Opportunity => opportunity !== null,
          );

        const companyIds = loadedOpportunitiesBase
          .map((opportunity) => opportunity.companyId)
          .filter((id): id is string => id !== null);

        const companyRecords = await fetchRecordsById(
          client,
          'companies',
          companyIds,
        );

        const companyNameById = new Map<string, string>();
        for (const company of companyRecords) {
          const id = getString(company, 'id');
          const name = getString(company, 'name');
          if (id && name) companyNameById.set(id, name);
        }

        const loadedOpportunities = loadedOpportunitiesBase.map((opportunity) => ({
          ...opportunity,
          companyName:
            opportunity.companyName ??
            (opportunity.companyId
              ? companyNameById.get(opportunity.companyId) ?? null
              : null),
        }));

        setSeasons(loadedSeasons);
        setTiers(loadedTiers);
        setTasks(loadedTasks);
        setWorkspaceMembers(loadedWorkspaceMembers);
        setOpportunities(loadedOpportunities);
        setLinks(loadedLinks);

        setSelectedSeasonId((current) => {
          if (
            current === UNASSIGNED_SEASON_ID ||
            loadedSeasons.some((season) => season.id === current)
          ) {
            return current;
          }

          // AURA rule: default to the alphabetically last Season name.
          if (loadedSeasons.length > 0) return loadedSeasons[0].id;

          // If Season has not been assigned yet, do not hide existing tasks.
          return loadedOpportunities.some((opportunity) => !opportunity.seasonId)
            ? UNASSIGNED_SEASON_ID
            : '';
        });
      } catch (error) {
        console.error(error);
        setErrorMessage('Could not load Partner advantages.');
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [client]);

  const sortedSeasons = useMemo(
    () => [...seasons].sort((a, b) => b.name.localeCompare(a.name)),
    [seasons],
  );

  const tierById = useMemo(
    () => new Map(tiers.map((tier) => [tier.id, tier])),
    [tiers],
  );

  const taskById = useMemo(
    () => new Map(tasks.map((task) => [task.id, task])),
    [tasks],
  );

  const workspaceMemberById = useMemo(
    () => new Map(workspaceMembers.map((member) => [member.id, member])),
    [workspaceMembers],
  );

  const [updatingTaskIds, setUpdatingTaskIds] = useState<Set<string>>(
    () => new Set(),
  );

  const setTaskCompleted = async (task: PartnerTask, completed: boolean) => {
    if (updatingTaskIds.has(task.id)) return;

    setUpdatingTaskIds((current) => {
      const next = new Set(current);
      next.add(task.id);
      return next;
    });

    const previousStatus = task.status;
    const nextStatus = completed ? 'DONE' : 'TODO';

    setTasks((current) =>
      current.map((item) =>
        item.id === task.id ? { ...item, status: nextStatus } : item,
      ),
    );

    try {
      await client.patch(`/rest/tasks/${encodeURIComponent(task.id)}`, {
        status: nextStatus,
      });
    } catch (error) {
      console.error(error);
      setTasks((current) =>
        current.map((item) =>
          item.id === task.id ? { ...item, status: previousStatus } : item,
        ),
      );
      setErrorMessage('Could not update the task status.');
    } finally {
      setUpdatingTaskIds((current) => {
        const next = new Set(current);
        next.delete(task.id);
        return next;
      });
    }
  };

  const opportunityById = useMemo(
    () => new Map(opportunities.map((opportunity) => [opportunity.id, opportunity])),
    [opportunities],
  );

  const partnerLinks = useMemo(
    () => links.filter((link) => taskById.has(link.taskId)),
    [links, taskById],
  );

  const partnerOpportunityIds = useMemo(
    () => new Set(partnerLinks.map((link) => link.opportunityId)),
    [partnerLinks],
  );

  const unassignedOpportunityCount = useMemo(
    () =>
      opportunities.filter(
        (opportunity) =>
          partnerOpportunityIds.has(opportunity.id) && !opportunity.seasonId,
      ).length,
    [opportunities, partnerOpportunityIds],
  );

  const unassignedTaskCount = useMemo(() => {
    let count = 0;
    for (const link of partnerLinks) {
      const opportunity = opportunityById.get(link.opportunityId);
      if (opportunity && !opportunity.seasonId) count += 1;
    }
    return count;
  }, [partnerLinks, opportunityById]);

  const seasonOptions = useMemo(
    () => [
      ...sortedSeasons,
      ...(unassignedOpportunityCount > 0
        ? [{ id: UNASSIGNED_SEASON_ID, name: 'Sin temporada' }]
        : []),
    ],
    [sortedSeasons, unassignedOpportunityCount],
  );

  const selectedSeasonIndex = seasonOptions.findIndex(
    (season) => season.id === selectedSeasonId,
  );

  const groups = useMemo<OpportunityTaskGroup[]>(() => {
    if (!selectedSeasonId) return [];

    const seasonOpportunities = opportunities.filter((opportunity) =>
      selectedSeasonId === UNASSIGNED_SEASON_ID
        ? opportunity.seasonId === null
        : opportunity.seasonId === selectedSeasonId,
    );

    const selectedOpportunityById = new Map(
      seasonOpportunities.map((opportunity) => [opportunity.id, opportunity]),
    );

    const tasksByOpportunityId = new Map<string, Map<string, PartnerTask>>();

    for (const link of partnerLinks) {
      if (!selectedOpportunityById.has(link.opportunityId)) continue;

      const task = taskById.get(link.taskId);
      if (!task) continue;

      const current =
        tasksByOpportunityId.get(link.opportunityId) ??
        new Map<string, PartnerTask>();

      current.set(task.id, task);
      tasksByOpportunityId.set(link.opportunityId, current);
    }

    const result: OpportunityTaskGroup[] = [];

    for (const opportunity of seasonOpportunities) {
      const opportunityTasks = Array.from(
        tasksByOpportunityId.get(opportunity.id)?.values() ?? [],
      ).sort((a, b) => {
        const aDone = isTaskCompleted(a);
        const bDone = isTaskCompleted(b);

        if (aDone !== bDone) return aDone ? 1 : -1;

        const aDue = toTime(a.dueAt);
        const bDue = toTime(b.dueAt);

        if (aDue !== null && bDue !== null && aDue !== bDue) return aDue - bDue;
        if (aDue !== null && bDue === null) return -1;
        if (aDue === null && bDue !== null) return 1;

        return a.title.localeCompare(b.title);
      });

      if (opportunityTasks.length === 0) continue;

      const pendingTasks = opportunityTasks.filter(
        (task) => !isTaskCompleted(task),
      );

      const nextDueAt = pendingTasks.reduce<string | null>((earliest, task) => {
        const taskTime = toTime(task.dueAt);
        if (taskTime === null) return earliest;

        const earliestTime = toTime(earliest);
        if (earliestTime === null || taskTime < earliestTime) return task.dueAt;

        return earliest;
      }, null);

      result.push({
        opportunity,
        tasks: opportunityTasks,
        pendingCount: pendingTasks.length,
        nextDueAt,
      });
    }

    return result.sort((a, b) => {
      const aDue = toTime(a.nextDueAt);
      const bDue = toTime(b.nextDueAt);

      if (aDue !== null && bDue !== null && aDue !== bDue) return aDue - bDue;
      if (aDue !== null && bDue === null) return -1;
      if (aDue === null && bDue !== null) return 1;

      return a.opportunity.name.localeCompare(b.opportunity.name);
    });
  }, [opportunities, selectedSeasonId, partnerLinks, taskById]);

  const totalPending = groups.reduce(
    (sum, group) => sum + group.pendingCount,
    0,
  );

  const filteredGroups = useMemo<OpportunityTaskGroup[]>(() => {
    const query = searchQuery.trim().toLocaleLowerCase();
    if (!query) return groups;

    const result: OpportunityTaskGroup[] = [];

    for (const group of groups) {
      const tierName = group.opportunity.partnerTierId
        ? tierById.get(group.opportunity.partnerTierId)?.name ?? ''
        : '';

      const groupMatches = `${group.opportunity.companyName ?? ''} ${group.opportunity.name} ${tierName}`
        .toLocaleLowerCase()
        .includes(query);

      const matchingTasks = group.tasks.filter((task) => {
        const assigneeName =
          task.assigneeName ??
          (task.assigneeId
            ? workspaceMemberById.get(task.assigneeId)?.name ?? ''
            : 'Sin asignar');

        return `${task.title} ${assigneeName}`
          .toLocaleLowerCase()
          .includes(query);
      });

      if (groupMatches) {
        result.push(group);
      } else if (matchingTasks.length > 0) {
        result.push({ ...group, tasks: matchingTasks });
      }
    }

    return result;
  }, [groups, searchQuery, tierById, workspaceMemberById]);

  const visibleTaskCount = filteredGroups.reduce(
    (sum, group) => sum + group.tasks.length,
    0,
  );

  const shellStyle = {
    width: '100%',
    boxSizing: 'border-box' as const,
    padding: '16px 18px 24px',
    fontFamily: 'sans-serif',
  };

  const cardStyle = {
    border: '1px solid rgba(127,127,127,0.16)',
    borderRadius: '9px',
    overflow: 'hidden',
    background: 'rgba(127,127,127,0.018)',
    boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
  };

  const buttonStyle = {
    border: '1px solid rgba(127,127,127,0.22)',
    borderRadius: '7px',
    padding: '6px 9px',
    background: 'rgba(127,127,127,0.035)',
    color: 'inherit',
    cursor: 'pointer',
    fontSize: '12px',
  };

  if (isLoading) {
    return <div style={shellStyle}>Loading Partner advantages…</div>;
  }

  return (
    <div style={shellStyle}>
      <style>{`
        .aura-pa-task-row:hover {
          background: rgba(127,127,127,0.055);
        }
        .aura-pa-task-row:focus-visible {
          outline: 2px solid rgba(127,127,127,0.45);
          outline-offset: -2px;
        }
        .aura-pa-details[open] .aura-pa-chevron {
          transform: rotate(180deg);
        }
        .aura-pa-chevron {
          transition: transform 120ms ease;
        }
        @media (max-width: 760px) {
          .aura-pa-task-grid {
            grid-template-columns: 30px minmax(140px, 1fr) 110px !important;
          }
          .aura-pa-task-row > a {
            grid-template-columns: minmax(140px, 1fr) 110px !important;
          }
          .aura-pa-assignee-column {
            display: none !important;
          }
        }
      `}</style>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '12px',
          alignItems: 'center',
          flexWrap: 'wrap',
          marginBottom: '12px',
        }}
      >
        <div>
          <div style={{ fontSize: '18px', fontWeight: 700 }}>
            Ventajas Partners
          </div>
          <div style={{ marginTop: '2px', fontSize: '11px', opacity: 0.55 }}>
            Seguimiento de entregas por patrocinio
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '7px',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Buscar tarea, partner o persona…"
            aria-label="Buscar ventajas"
            style={{
              width: '250px',
              maxWidth: '72vw',
              minHeight: '32px',
              border: '1px solid rgba(127,127,127,0.22)',
              borderRadius: '7px',
              padding: '6px 10px',
              background: 'rgba(127,127,127,0.035)',
              color: 'inherit',
              fontSize: '12px',
              outline: 'none',
            }}
          />

          <button
            type="button"
            style={{
              ...buttonStyle,
              opacity:
                selectedSeasonIndex >= 0 &&
                selectedSeasonIndex < seasonOptions.length - 1
                  ? 1
                  : 0.35,
            }}
            disabled={
              selectedSeasonIndex < 0 ||
              selectedSeasonIndex >= seasonOptions.length - 1
            }
            onClick={() => {
              const previous = seasonOptions[selectedSeasonIndex + 1];
              if (previous) setSelectedSeasonId(previous.id);
            }}
            aria-label="Temporada anterior"
          >
            ‹
          </button>

          <select
            value={selectedSeasonId}
            onChange={(event) => setSelectedSeasonId(event.target.value)}
            aria-label="Temporada"
            style={{
              minWidth: '132px',
              minHeight: '32px',
              border: '1px solid rgba(127,127,127,0.22)',
              borderRadius: '7px',
              padding: '5px 8px',
              background: 'rgba(127,127,127,0.035)',
              color: 'inherit',
              fontSize: '12px',
            }}
          >
            {seasonOptions.length === 0 ? (
              <option value="">No Seasons</option>
            ) : null}

            {seasonOptions.map((season) => (
              <option key={season.id} value={season.id}>
                {season.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            style={{
              ...buttonStyle,
              opacity: selectedSeasonIndex > 0 ? 1 : 0.35,
            }}
            disabled={selectedSeasonIndex <= 0}
            onClick={() => {
              const next = seasonOptions[selectedSeasonIndex - 1];
              if (next) setSelectedSeasonId(next.id);
            }}
            aria-label="Temporada siguiente"
          >
            ›
          </button>
        </div>
      </div>

      {errorMessage ? (
        <div
          style={{
            marginBottom: '10px',
            padding: '8px 10px',
            border: '1px solid rgba(127,127,127,0.24)',
            borderRadius: '7px',
            fontSize: '12px',
          }}
        >
          {errorMessage}
        </div>
      ) : null}

      {unassignedTaskCount > 0 && selectedSeasonId !== UNASSIGNED_SEASON_ID ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '10px',
            padding: '7px 9px',
            border: '1px solid rgba(127,127,127,0.16)',
            borderRadius: '7px',
            fontSize: '11px',
          }}
        >
          <span>
            {unassignedTaskCount} ventaja{unassignedTaskCount === 1 ? '' : 's'} sin temporada asignada.
          </span>
          <button
            type="button"
            style={buttonStyle}
            onClick={() => setSelectedSeasonId(UNASSIGNED_SEASON_ID)}
          >
            Ver
          </button>
        </div>
      ) : null}

      {selectedSeasonId && groups.length > 0 ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            flexWrap: 'wrap',
            marginBottom: '9px',
            fontSize: '11px',
          }}
        >
          <span
            style={{
              padding: '3px 7px',
              borderRadius: '999px',
              background: 'rgba(127,127,127,0.08)',
            }}
          >
            {groups.length} patrocinio{groups.length === 1 ? '' : 's'}
          </span>
          <span
            style={{
              padding: '3px 7px',
              borderRadius: '999px',
              background: 'rgba(127,127,127,0.08)',
            }}
          >
            {totalPending} pendiente{totalPending === 1 ? '' : 's'}
          </span>
          {searchQuery.trim() ? (
            <span style={{ opacity: 0.58 }}>
              {visibleTaskCount} resultado{visibleTaskCount === 1 ? '' : 's'}
            </span>
          ) : null}
        </div>
      ) : null}

      {!selectedSeasonId ? (
        <div style={{ ...cardStyle, padding: '24px', textAlign: 'center' }}>
          No hay ninguna temporada disponible.
        </div>
      ) : filteredGroups.length === 0 ? (
        <div style={{ ...cardStyle, padding: '24px', textAlign: 'center' }}>
          <div style={{ fontWeight: 600 }}>
            {searchQuery.trim()
              ? 'No hay resultados para esta búsqueda'
              : 'No hay ventajas para esta temporada'}
          </div>
          <div style={{ marginTop: '4px', fontSize: '11px', opacity: 0.55 }}>
            {searchQuery.trim()
              ? 'Prueba con el nombre de una tarea, partner o persona asignada.'
              : tasks.length > 0
                ? `${tasks.length} ventaja${tasks.length === 1 ? '' : 's'} existen en AURA, pero ninguna pertenece a esta temporada.`
                : 'No se han encontrado tareas generadas por AURA.'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '8px' }}>
          {filteredGroups.map((group) => {
            const tierName = group.opportunity.partnerTierId
              ? tierById.get(group.opportunity.partnerTierId)?.name
              : null;
            const groupDeadline = getDeadlineStyle(group.nextDueAt, group.pendingCount === 0);

            return (
              <details
                key={group.opportunity.id}
                className="aura-pa-details"
                style={cardStyle}
                open={
                  searchQuery.trim() !== '' ||
                  !collapsedOpportunityIds.has(group.opportunity.id)
                }
                onToggle={(event) => {
                  if (searchQuery.trim() !== '') return;
                  const isOpen = event.currentTarget.open;
                  setCollapsedOpportunityIds((current) => {
                    const next = new Set(current);
                    if (isOpen) next.delete(group.opportunity.id);
                    else next.add(group.opportunity.id);
                    return next;
                  });
                }}
              >
                <summary
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(220px, 1fr) auto auto',
                    gap: '10px',
                    alignItems: 'center',
                    padding: '9px 11px',
                    cursor: 'pointer',
                    listStyle: 'none',
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: '5px',
                        minWidth: 0,
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <span
                        title={group.opportunity.companyName ?? 'Sin empresa'}
                        style={{
                          fontSize: '13px',
                          fontWeight: 750,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {group.opportunity.companyName ?? 'Sin empresa'}
                      </span>
                      <span style={{ opacity: 0.35, flexShrink: 0 }}>·</span>
                      <span
                        title={group.opportunity.name}
                        style={{
                          fontSize: '12px',
                          fontWeight: 600,
                          opacity: 0.76,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {group.opportunity.name}
                      </span>
                      <span style={{ opacity: 0.35, flexShrink: 0 }}>·</span>
                      <span
                        style={{
                          flexShrink: 0,
                          fontSize: '11px',
                          fontWeight: 650,
                          opacity: 0.62,
                        }}
                      >
                        {tierName ?? 'Sin tier'}
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '7px',
                      fontSize: '11px',
                    }}
                  >
                    <span style={{ opacity: 0.58 }}>
                      {group.pendingCount} pendiente{group.pendingCount === 1 ? '' : 's'}
                    </span>
                    {group.nextDueAt ? (
                      <span
                        title={`Próxima entrega: ${formatDate(group.nextDueAt)} · ${groupDeadline.label}`}
                        style={{
                          padding: '3px 7px',
                          borderRadius: '999px',
                          border: `1px solid ${groupDeadline.border}`,
                          background: groupDeadline.background,
                          color: groupDeadline.color,
                          fontWeight: 650,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {formatDate(group.nextDueAt)}
                      </span>
                    ) : null}
                  </div>

                  <span
                    className="aura-pa-chevron"
                    aria-hidden="true"
                    style={{ fontSize: '12px', opacity: 0.45 }}
                  >
                    ▾
                  </span>
                </summary>

                <div style={{ borderTop: '1px solid rgba(127,127,127,0.12)' }}>
                  <div
                    className="aura-pa-task-grid"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '30px minmax(220px, 1fr) minmax(135px, 180px) 128px',
                      gap: '8px',
                      alignItems: 'center',
                      padding: '6px 11px',
                      background: 'rgba(127,127,127,0.025)',
                      borderBottom: '1px solid rgba(127,127,127,0.10)',
                      fontSize: '10px',
                      fontWeight: 650,
                      opacity: 0.54,
                      textTransform: 'uppercase',
                      letterSpacing: '0.03em',
                    }}
                  >
                    <span />
                    <span>Tarea</span>
                    <span className="aura-pa-assignee-column">Persona asignada</span>
                    <span style={{ textAlign: 'right' }}>Entrega</span>
                  </div>

                  {group.tasks.map((task, index) => {
                    const completed = isTaskCompleted(task);
                    const isUpdating = updatingTaskIds.has(task.id);
                    const assigneeName =
                      task.assigneeName ??
                      (task.assigneeId
                        ? workspaceMemberById.get(task.assigneeId)?.name ??
                          'Miembro asignado'
                        : 'Sin asignar');
                    const deadline = getDeadlineStyle(task.dueAt, completed);

                    return (
                      <div
                        key={task.id}
                        className="aura-pa-task-row"
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '30px minmax(0, 1fr)',
                          gap: '8px',
                          alignItems: 'center',
                          padding: '7px 11px',
                          borderBottom:
                            index === group.tasks.length - 1
                              ? undefined
                              : '1px solid rgba(127,127,127,0.08)',
                          transition: 'background 100ms ease',
                        }}
                      >
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            void setTaskCompleted(task, !completed);
                          }}
                          onKeyDown={(event) => event.stopPropagation()}
                          disabled={isUpdating}
                          title={completed ? 'Reabrir tarea' : 'Marcar como resuelta'}
                          aria-label={completed ? 'Reabrir tarea' : 'Marcar como resuelta'}
                          style={{
                            width: '22px',
                            height: '22px',
                            border: '1px solid rgba(127,127,127,0.26)',
                            borderRadius: '6px',
                            background: completed
                              ? 'rgba(127,127,127,0.14)'
                              : 'transparent',
                            color: 'inherit',
                            cursor: isUpdating ? 'wait' : 'pointer',
                            opacity: isUpdating ? 0.45 : completed ? 0.62 : 1,
                            fontSize: '12px',
                            lineHeight: 1,
                          }}
                        >
                          {completed ? '✓' : ''}
                        </button>

                        <a
                          href={`/object/task/${encodeURIComponent(task.id)}`}
                          title="Abrir tarea en Twenty"
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'minmax(220px, 1fr) minmax(135px, 180px) 128px',
                            gap: '8px',
                            alignItems: 'center',
                            minWidth: 0,
                            color: 'inherit',
                            textDecoration: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          <div
                            style={{
                              minWidth: 0,
                              fontSize: '12px',
                              opacity: completed ? 0.45 : 0.94,
                              textDecoration: completed ? 'line-through' : 'none',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {task.title}
                          </div>

                          <div
                            className="aura-pa-assignee-column"
                            title={assigneeName}
                            style={{
                              minWidth: 0,
                              fontSize: '11px',
                              opacity: completed ? 0.40 : 0.66,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {assigneeName}
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <span
                              title={`${formatDate(task.dueAt)} · ${deadline.label}`}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                maxWidth: '100%',
                                padding: '3px 7px',
                                borderRadius: '999px',
                                border: `1px solid ${deadline.border}`,
                                background: deadline.background,
                                color: deadline.color,
                                fontSize: '10px',
                                fontWeight: 650,
                                whiteSpace: 'nowrap',
                                opacity: completed ? 0.55 : 1,
                              }}
                            >
                              {formatDate(task.dueAt)}
                            </span>
                          </div>
                        </a>
                      </div>
                    );
                  })}
                </div>
              </details>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default defineFrontComponent({
  universalIdentifier:
    PARTNER_ADVANTAGES_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  name: 'partner-advantages',
  description:
    'Compact AURA Partner advantages view with search, assignee, urgency and native Task navigation.',
  component: PartnerAdvantages,
});
