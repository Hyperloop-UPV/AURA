import { useEffect, useMemo, useState } from 'react';

import { RestApiClient } from 'twenty-client-sdk/rest';
import { defineFrontComponent } from 'twenty-sdk/define';
import { enqueueSnackbar, useSelectedRecordIds } from 'twenty-sdk/front-component';

export const OPPORTUNITY_PARTNER_TIER_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER =
  '5d403444-9a7a-48c0-96d6-b208235a6af0';

type JsonRecord = Record<string, unknown>;

type Tier = {
  id: string;
  name: string;
  parentTierId: string | null;
};

type Template = {
  id: string;
  name: string;
  dueAt: string | null;
  partnerTierId: string | null;
};

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const getString = (record: JsonRecord, key: string): string | null => {
  const value = record[key];
  return typeof value === 'string' && value !== '' ? value : null;
};


const unwrapOne = (response: unknown, key?: string): JsonRecord => {
  if (!isRecord(response)) return {};
  if (key && isRecord(response[key])) return response[key] as JsonRecord;

  if (isRecord(response.data)) {
    if (key && isRecord(response.data[key])) return response.data[key] as JsonRecord;
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

const normalizeTier = (record: JsonRecord): Tier | null => {
  const id = getString(record, 'id');
  const name = getString(record, 'name');
  if (!id || !name) return null;

  return {
    id,
    name,
    parentTierId: relationId(record, 'parentTierId', 'parentTier'),
  };
};

const normalizeTemplate = (record: JsonRecord): Template | null => {
  const id = getString(record, 'id');
  const name = getString(record, 'name');
  if (!id || !name) return null;

  return {
    id,
    name,
    dueAt: getString(record, 'dueAt'),
    partnerTierId: relationId(record, 'partnerTierId', 'partnerTier'),
  };
};

const getInheritedTierIds = (selectedTierId: string, tiers: Tier[]): string[] => {
  const byId = new Map(tiers.map((tier) => [tier.id, tier]));
  const chain: string[] = [];
  const visited = new Set<string>();
  let currentId: string | null = selectedTierId;

  while (currentId && !visited.has(currentId) && chain.length < 20) {
    visited.add(currentId);
    chain.unshift(currentId);
    currentId = byId.get(currentId)?.parentTierId ?? null;
  }

  return chain;
};

const extractCreatedId = (response: unknown, key: string): string | null =>
  getString(unwrapOne(response, key), 'id');

const replaceCompanyName = (value: string, companyName: string): string =>
  value.split('{name}').join(companyName);

const OpportunityPartnerTier = () => {
  const selectedRecordIds = useSelectedRecordIds();
  const recordId = selectedRecordIds.length === 1 ? selectedRecordIds[0] : null;
  const client = useMemo(() => new RestApiClient(), []);

  const [tiers, setTiers] = useState<Tier[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTierId, setSelectedTierId] = useState('');
  const [companyName, setCompanyName] = useState('Company');
  const [companyId, setCompanyId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSavingTier, setIsSavingTier] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreatingDefaults, setIsCreatingDefaults] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadData = async () => {
    if (!recordId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const [opportunityResponse, tiersResponse, templatesResponse] =
        await Promise.all([
          client.get(`/rest/opportunities/${recordId}`),
          client.get('/rest/partnerTiers?limit=60'),
          client.get('/rest/partnerTierTaskTemplates?limit=60'),
        ]);

      const opportunity = unwrapOne(opportunityResponse, 'opportunity');

      const loadedTiersUnsorted = unwrapList(
        tiersResponse,
        'partnerTiers',
      )
        .map(normalizeTier)
        .filter((tier): tier is Tier => tier !== null);

      const tierByIdForSorting = new Map(
        loadedTiersUnsorted.map((tier) => [tier.id, tier]),
      );

      const getTierDepth = (tier: Tier): number => {
        let depth = 0;
        let parentId = tier.parentTierId;
        const visited = new Set<string>();

        while (
          parentId &&
          !visited.has(parentId) &&
          depth < 20
        ) {
          visited.add(parentId);
          depth += 1;
          parentId =
            tierByIdForSorting.get(parentId)?.parentTierId ??
            null;
        }

        return depth;
      };

      const loadedTiers = [...loadedTiersUnsorted].sort(
        (a, b) =>
          getTierDepth(a) - getTierDepth(b) ||
          a.name.localeCompare(b.name),
      );

      const loadedTemplates = unwrapList(
        templatesResponse,
        'partnerTierTaskTemplates',
      )
        .map(normalizeTemplate)
        .filter((template): template is Template => template !== null);

      setTiers(loadedTiers);
      setTemplates(loadedTemplates);

      setSelectedTierId(
        relationId(opportunity, 'partnerTierId', 'partnerTier') ?? '',
      );

      const oppCompanyId = relationId(opportunity, 'companyId', 'company');
      setCompanyId(oppCompanyId);

      const companyRelation = opportunity.company;
      const nestedName = isRecord(companyRelation)
        ? getString(companyRelation, 'name')
        : null;

      if (nestedName) {
        setCompanyName(nestedName);
      } else if (oppCompanyId) {
        const companyResponse = await client.get(
          `/rest/companies/${oppCompanyId}`,
        );
        const company = unwrapOne(companyResponse, 'company');
        setCompanyName(getString(company, 'name') ?? 'Company');
      } else {
        setCompanyName('Company');
      }
    } catch (error) {
      console.error(error);
      setErrorMessage('Could not load Partner Tier data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [recordId]);

  const inheritedIds = selectedTierId
    ? getInheritedTierIds(selectedTierId, tiers)
    : [];

  const order = new Map(inheritedIds.map((id, index) => [id, index]));

  const inheritedTemplates = templates
    .filter(
      (template) =>
        template.partnerTierId !== null && order.has(template.partnerTierId),
    )
    .sort((a, b) => {
      const aOrder = a.partnerTierId ? order.get(a.partnerTierId) ?? 0 : 0;
      const bOrder = b.partnerTierId ? order.get(b.partnerTierId) ?? 0 : 0;
      return aOrder - bOrder || a.name.localeCompare(b.name);
    });

  const saveTier = async () => {
    if (!recordId || isSavingTier) return;

    setIsSavingTier(true);
    setErrorMessage(null);

    try {
      await client.patch(`/rest/opportunities/${recordId}`, {
        partnerTierId: selectedTierId === '' ? null : selectedTierId,
      });

      await enqueueSnackbar({
        message: 'Partner Tier saved',
        variant: 'success',
      });
    } catch (error) {
      console.error(error);
      setErrorMessage('Could not save Partner Tier.');
    } finally {
      setIsSavingTier(false);
    }
  };

  const createDefaultTiers = async () => {
    if (isCreatingDefaults || tiers.length !== 0) return;

    setIsCreatingDefaults(true);
    setErrorMessage(null);

    try {
      const collaboratorResponse = await client.post('/rest/partnerTiers', {
        name: 'Collaborator',
        description: 'Base sponsorship tier.',
      });

      const collaboratorId = extractCreatedId(
        collaboratorResponse,
        'partnerTier',
      );

      if (!collaboratorId) throw new Error('Missing Collaborator id');

      const silverResponse = await client.post('/rest/partnerTiers', {
        name: 'Silver',
        description: 'Includes Collaborator tasks plus Silver tasks.',
        parentTierId: collaboratorId,
      });

      const silverId = extractCreatedId(silverResponse, 'partnerTier');
      if (!silverId) throw new Error('Missing Silver id');

      await client.post('/rest/partnerTiers', {
        name: 'Gold',
        description:
          'Includes Collaborator and Silver tasks plus Gold tasks.',
        parentTierId: silverId,
      });

      await enqueueSnackbar({
        message: 'Collaborator, Silver and Gold created',
        variant: 'success',
      });

      await loadData();
    } catch (error) {
      console.error(error);
      setErrorMessage('Could not create default tiers.');
    } finally {
      setIsCreatingDefaults(false);
    }
  };

  const generateTasks = async () => {
    if (!recordId || !selectedTierId || isGenerating) return;

    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const targetResponse = await client.get(
        `/rest/taskTargets?opportunityId=${encodeURIComponent(recordId)}&limit=60`,
      );

      const taskTargets = unwrapList(targetResponse, 'taskTargets');

      const taskIds = Array.from(
        new Set(
          taskTargets
            .map((target) => {
              const direct = getString(target, 'taskId');
              if (direct) return direct;

              return isRecord(target.task)
                ? getString(target.task, 'id')
                : null;
            })
            .filter((id): id is string => id !== null),
        ),
      );

      const existingTemplateIds = new Set<string>();

      for (const taskId of taskIds) {
        try {
          const taskResponse = await client.get(`/rest/tasks/${taskId}`);
          const task = unwrapOne(taskResponse, 'task');

          if (task.auraPartnerTask === true) {
            const templateId = getString(task, 'auraTaskTemplateId');
            if (templateId) existingTemplateIds.add(templateId);
          }
        } catch {
          // Deleted tasks are intentionally ignored so they can be recreated.
        }
      }

      let created = 0;
      let skipped = 0;

      for (const template of inheritedTemplates) {
        if (existingTemplateIds.has(template.id)) {
          skipped += 1;
          continue;
        }

        const rendered = replaceCompanyName(template.name, companyName);
        const title = `[${companyName}] ${rendered}`;

        const taskPayload: JsonRecord = {
          title,
          status: 'TODO',
          auraPartnerTask: true,
          auraTaskTemplateId: template.id,
        };

        if (template.dueAt) taskPayload.dueAt = template.dueAt;

        const taskResponse = await client.post('/rest/tasks', taskPayload);
        const taskId = extractCreatedId(taskResponse, 'task');

        if (!taskId) throw new Error('Task created without an id');

        const targetPayload: JsonRecord = {
          taskId,
          opportunityId: recordId,
        };

        if (companyId) targetPayload.companyId = companyId;

        await client.post('/rest/taskTargets', targetPayload);
        created += 1;
      }

      await enqueueSnackbar({
        message: `${created} task(s) created, ${skipped} already existed`,
        variant: 'success',
      });
    } catch (error) {
      console.error(error);
      setErrorMessage('Could not generate Partner tasks.');
    } finally {
      setIsGenerating(false);
    }
  };

  const tierById = new Map(tiers.map((tier) => [tier.id, tier]));

  const shellStyle = {
    width: '100%',
    boxSizing: 'border-box' as const,
    padding: '20px 22px 24px',
    fontFamily: 'sans-serif',
  };

  const cardStyle = {
    border: '1px solid rgba(127,127,127,0.20)',
    borderRadius: '10px',
    overflow: 'hidden',
    background: 'rgba(127,127,127,0.025)',
  };

  const buttonStyle = {
    border: '1px solid rgba(127,127,127,0.28)',
    borderRadius: '6px',
    padding: '8px 12px',
    background: 'transparent',
    color: 'inherit',
    cursor: 'pointer',
    fontSize: '13px',
  };

  const primaryButtonStyle = {
    ...buttonStyle,
    background: 'rgba(127,127,127,0.13)',
    fontWeight: 600,
  };

  if (!recordId) {
    return <div style={shellStyle}>Open one Opportunity.</div>;
  }

  if (isLoading) {
    return <div style={shellStyle}>Loading Partner Tier…</div>;
  }

  return (
    <div style={shellStyle}>
      <div style={{ marginBottom: '14px' }}>
        <div style={{ fontSize: '16px', fontWeight: 600 }}>
          Partner Tier
        </div>
        <div
          style={{
            marginTop: '3px',
            fontSize: '12px',
            opacity: 0.58,
          }}
        >
          Select a sponsorship tier and generate inherited tasks.
        </div>
      </div>

      {errorMessage ? (
        <div
          style={{
            marginBottom: '12px',
            padding: '9px 11px',
            border: '1px solid rgba(127,127,127,0.30)',
            borderRadius: '7px',
          }}
        >
          {errorMessage}
        </div>
      ) : null}

      {tiers.length === 0 ? (
        <div
          style={{
            ...cardStyle,
            padding: '28px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontWeight: 600 }}>No Partner Tiers yet</div>
          <div
            style={{
              margin: '6px 0 16px',
              opacity: 0.58,
              fontSize: '12px',
            }}
          >
            Create Collaborator → Silver → Gold.
          </div>
          <button
            type="button"
            onClick={createDefaultTiers}
            disabled={isCreatingDefaults}
            style={primaryButtonStyle}
          >
            {isCreatingDefaults ? 'Creating…' : 'Create default tiers'}
          </button>
        </div>
      ) : (
        <>
          <div
            style={{
              ...cardStyle,
              padding: '16px',
              marginBottom: '14px',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: '10px',
                alignItems: 'end',
              }}
            >
              <label>
                <div
                  style={{
                    marginBottom: '6px',
                    fontSize: '12px',
                    opacity: 0.62,
                  }}
                >
                  Selected tier
                </div>
                <select
                  value={selectedTierId}
                  onChange={(event) => setSelectedTierId(event.target.value)}
                  style={{
                    width: '100%',
                    minHeight: '36px',
                    border: '1px solid rgba(127,127,127,0.28)',
                    borderRadius: '6px',
                    padding: '7px 9px',
                    background: 'transparent',
                    color: 'inherit',
                  }}
                >
                  <option value="">No Partner Tier</option>
                  {tiers.map((tier) => (
                    <option key={tier.id} value={tier.id}>
                      {tier.name}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                onClick={saveTier}
                disabled={isSavingTier}
                style={primaryButtonStyle}
              >
                {isSavingTier ? 'Saving…' : 'Save tier'}
              </button>
            </div>
          </div>

          <div style={cardStyle}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
                padding: '13px 15px',
                borderBottom: '1px solid rgba(127,127,127,0.16)',
              }}
            >
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600 }}>
                  Inherited task templates
                </div>
                <div
                  style={{
                    marginTop: '2px',
                    fontSize: '11px',
                    opacity: 0.56,
                  }}
                >
                  Parent-tier templates are included automatically.
                </div>
              </div>

              <button
                type="button"
                onClick={generateTasks}
                disabled={
                  !selectedTierId ||
                  inheritedTemplates.length === 0 ||
                  isGenerating
                }
                style={{
                  ...primaryButtonStyle,
                  opacity:
                    !selectedTierId ||
                    inheritedTemplates.length === 0 ||
                    isGenerating
                      ? 0.45
                      : 1,
                }}
              >
                {isGenerating ? 'Generating…' : 'Generate Partner Tasks'}
              </button>
            </div>

            {!selectedTierId ? (
              <div
                style={{
                  padding: '24px 15px',
                  textAlign: 'center',
                  opacity: 0.58,
                }}
              >
                Select a Partner Tier.
              </div>
            ) : inheritedTemplates.length === 0 ? (
              <div
                style={{
                  padding: '24px 15px',
                  textAlign: 'center',
                  opacity: 0.58,
                }}
              >
                No templates are defined for this tier or its parents.
              </div>
            ) : (
              inheritedTemplates.map((template, index) => {
                const tier = template.partnerTierId
                  ? tierById.get(template.partnerTierId)
                  : undefined;

                return (
                  <div
                    key={template.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '34px 1fr 130px',
                      gap: '10px',
                      alignItems: 'center',
                      padding: '10px 15px',
                      borderBottom:
                        index === inheritedTemplates.length - 1
                          ? undefined
                          : '1px solid rgba(127,127,127,0.12)',
                    }}
                  >
                    <div style={{ opacity: 0.46, fontSize: '12px' }}>
                      {index + 1}
                    </div>

                    <div>
                      <div style={{ fontSize: '13px' }}>
                        {template.name}
                      </div>
                      <div
                        style={{
                          marginTop: '2px',
                          fontSize: '11px',
                          opacity: 0.52,
                        }}
                      >
                        {tier?.name ?? 'Tier'}
                      </div>
                    </div>

                    <div
                      style={{
                        textAlign: 'right',
                        fontSize: '11px',
                        opacity: 0.58,
                      }}
                    >
                      {template.dueAt
                        ? new Date(template.dueAt).toLocaleDateString()
                        : 'No due date'}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div
            style={{
              marginTop: '10px',
              fontSize: '11px',
              opacity: 0.52,
            }}
          >
            Existing generated tasks are skipped. Deleted generated tasks are
            recreated the next time you generate.
          </div>
        </>
      )}
    </div>
  );
};

export default defineFrontComponent({
  universalIdentifier:
    OPPORTUNITY_PARTNER_TIER_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  name: 'opportunity-partner-tier',
  description:
    'Select an AURA Partner Tier and generate inherited sponsorship tasks.',
  component: OpportunityPartnerTier,
});
