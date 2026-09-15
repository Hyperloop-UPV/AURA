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

const PartnerAdvantages = () => {
  const client = useMemo(() => new RestApiClient(), []);

  const [seasons, setSeasons] = useState<Season[]>([]);
  const [tiers, setTiers] = useState<PartnerTier[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [tasks, setTasks] = useState<PartnerTask[]>([]);
  const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMember[]>([]);
  const [links, setLinks] = useState<TaskTargetLink[]>([]);

  const [selectedSeasonId, setSelectedSeasonId] = useState('');
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

        const loadedOpportunities = opportunityRecords
          .map(normalizeOpportunity)
          .filter(
            (opportunity): opportunity is Opportunity => opportunity !== null,
          );

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

  const shellStyle = {
    width: '100%',
    boxSizing: 'border-box' as const,
    padding: '22px 24px 30px',
    fontFamily: 'sans-serif',
  };

  const cardStyle = {
    border: '1px solid rgba(127,127,127,0.20)',
    borderRadius: '10px',
    overflow: 'hidden',
    background: 'rgba(127,127,127,0.025)',
  };

  const buttonStyle = {
    border: '1px solid rgba(127,127,127,0.26)',
    borderRadius: '6px',
    padding: '7px 10px',
    background: 'transparent',
    color: 'inherit',
    cursor: 'pointer',
    fontSize: '13px',
  };

  if (isLoading) {
    return <div style={shellStyle}>Loading Partner advantages…</div>;
  }

  return (
    <div style={shellStyle}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '16px',
          alignItems: 'flex-end',
          flexWrap: 'wrap',
          marginBottom: '18px',
        }}
      >
        <div>
          <div style={{ fontSize: '20px', fontWeight: 650 }}>
            Ventajas Partners
          </div>
          <div style={{ marginTop: '4px', fontSize: '12px', opacity: 0.58 }}>
            Partner tasks grouped by sponsorship.
          </div>
        </div>

        <div>
          <div
            style={{
              marginBottom: '6px',
              fontSize: '11px',
              opacity: 0.58,
              textAlign: 'right',
            }}
          >
            Season
          </div>

          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
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
              aria-label="Previous season"
            >
              ‹
            </button>

            <select
              value={selectedSeasonId}
              onChange={(event) => setSelectedSeasonId(event.target.value)}
              style={{
                minWidth: '150px',
                minHeight: '34px',
                border: '1px solid rgba(127,127,127,0.28)',
                borderRadius: '6px',
                padding: '6px 9px',
                background: 'transparent',
                color: 'inherit',
                fontSize: '13px',
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
              aria-label="Next season"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {errorMessage ? (
        <div
          style={{
            marginBottom: '14px',
            padding: '10px 12px',
            border: '1px solid rgba(127,127,127,0.28)',
            borderRadius: '8px',
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
            gap: '12px',
            marginBottom: '14px',
            padding: '10px 12px',
            border: '1px solid rgba(127,127,127,0.20)',
            borderRadius: '8px',
            fontSize: '12px',
          }}
        >
          <span>
            {unassignedTaskCount} Partner task
            {unassignedTaskCount === 1 ? '' : 's'} belong to sponsorships with no
            Season assigned.
          </span>
          <button
            type="button"
            style={buttonStyle}
            onClick={() => setSelectedSeasonId(UNASSIGNED_SEASON_ID)}
          >
            Show them
          </button>
        </div>
      ) : null}

      {selectedSeasonId && groups.length > 0 ? (
        <div
          style={{
            marginBottom: '12px',
            fontSize: '12px',
            opacity: 0.62,
          }}
        >
          {groups.length} sponsorship{groups.length === 1 ? '' : 's'} ·{' '}
          {totalPending} pending task{totalPending === 1 ? '' : 's'}
        </div>
      ) : null}

      {!selectedSeasonId ? (
        <div style={{ ...cardStyle, padding: '28px', textAlign: 'center' }}>
          No Season is available.
        </div>
      ) : groups.length === 0 ? (
        <div style={{ ...cardStyle, padding: '28px', textAlign: 'center' }}>
          <div style={{ fontWeight: 600 }}>No Partner tasks for this Season</div>
          <div style={{ marginTop: '5px', fontSize: '12px', opacity: 0.58 }}>
            {tasks.length > 0
              ? `${tasks.length} AURA Partner task${tasks.length === 1 ? '' : 's'} exist, but none belong to sponsorships in this Season.`
              : 'No AURA Partner tasks were found.'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {groups.map((group) => {
            const tierName = group.opportunity.partnerTierId
              ? tierById.get(group.opportunity.partnerTierId)?.name
              : null;

            return (
              <details
                key={group.opportunity.id}
                style={cardStyle}
                open
              >
                <summary
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '16px',
                    alignItems: 'center',
                    padding: '13px 15px',
                    cursor: 'pointer',
                    listStyle: 'none',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 650 }}>
                      {group.opportunity.name}
                      {tierName ? (
                        <span style={{ fontWeight: 400, opacity: 0.58 }}>
                          {' '}
                          · {tierName}
                        </span>
                      ) : null}
                    </div>
                    <div
                      style={{
                        marginTop: '3px',
                        fontSize: '11px',
                        opacity: 0.58,
                      }}
                    >
                      {group.pendingCount} pending · Next delivery:{' '}
                      {formatDate(group.nextDueAt)}
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '12px',
                      opacity: 0.55,
                    }}
                  >
                    {group.tasks.length} task{group.tasks.length === 1 ? '' : 's'}
                    <span aria-hidden="true">▾</span>
                  </div>
                </summary>

                <div
                  style={{
                    borderTop: '1px solid rgba(127,127,127,0.15)',
                  }}
                >
                  {group.tasks.map((task, index) => {
                    const completed = isTaskCompleted(task);
                    const dueTime = toTime(task.dueAt);
                    const isOverdue =
                      !completed && dueTime !== null && dueTime < Date.now();
                    const isUpdating = updatingTaskIds.has(task.id);
                    const assigneeName =
                      task.assigneeName ??
                      (task.assigneeId
                        ? workspaceMemberById.get(task.assigneeId)?.name ??
                          'Assigned member'
                        : 'Unassigned');

                    return (
                      <div
                        key={task.id}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '34px minmax(220px, 1fr) 180px 125px',
                          gap: '10px',
                          alignItems: 'center',
                          padding: '10px 15px',
                          borderBottom:
                            index === group.tasks.length - 1
                              ? undefined
                              : '1px solid rgba(127,127,127,0.10)',
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => void setTaskCompleted(task, !completed)}
                          disabled={isUpdating}
                          title={completed ? 'Reopen task' : 'Mark as resolved'}
                          aria-label={completed ? 'Reopen task' : 'Mark as resolved'}
                          style={{
                            width: '26px',
                            height: '26px',
                            border: '1px solid rgba(127,127,127,0.28)',
                            borderRadius: '6px',
                            background: completed
                              ? 'rgba(127,127,127,0.14)'
                              : 'transparent',
                            color: 'inherit',
                            cursor: isUpdating ? 'wait' : 'pointer',
                            opacity: isUpdating ? 0.45 : completed ? 0.62 : 1,
                            fontSize: '14px',
                            lineHeight: 1,
                          }}
                        >
                          {completed ? '✓' : ''}
                        </button>

                        <div
                          style={{
                            fontSize: '13px',
                            opacity: completed ? 0.48 : 1,
                            textDecoration: completed ? 'line-through' : 'none',
                          }}
                        >
                          {task.title}
                        </div>

                        <div
                          style={{
                            fontSize: '11px',
                            opacity: completed ? 0.42 : 0.62,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={assigneeName}
                        >
                          {assigneeName}
                        </div>

                        <div
                          style={{
                            textAlign: 'right',
                            fontSize: '11px',
                            opacity: completed ? 0.42 : isOverdue ? 1 : 0.6,
                            fontWeight: isOverdue ? 650 : 400,
                          }}
                        >
                          {formatDate(task.dueAt)}
                          {isOverdue ? ' · Overdue' : ''}
                        </div>
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
    'AURA Partner tasks grouped by Opportunity, with assignee and inline completion.',
  component: PartnerAdvantages,
});
