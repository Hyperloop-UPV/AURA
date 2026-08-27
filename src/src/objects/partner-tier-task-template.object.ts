import { defineObject, FieldType } from 'twenty-sdk/define';

export const PARTNER_TIER_TASK_TEMPLATE_UNIVERSAL_IDENTIFIER = '9a1c68ad-f3fa-45a9-b714-9c21bbd7d71a';

export default defineObject({
  universalIdentifier: PARTNER_TIER_TASK_TEMPLATE_UNIVERSAL_IDENTIFIER,
  nameSingular: 'partnerTierTaskTemplate',
  namePlural: 'partnerTierTaskTemplates',
  labelSingular: 'Tier Task Template',
  labelPlural: 'Tier Task Templates',
  icon: 'IconChecklist',
  fields: [
    {
      universalIdentifier: 'ea107cf9-99af-47aa-bd3b-bcb6866e98d5',
      type: FieldType.TEXT,
      name: 'name',
      label: 'Task Title Template',
      description: 'Use {name} to insert the company name.',
      icon: 'IconCheckbox',
    },
    {
      universalIdentifier: 'a309c010-088c-4a80-9c43-5d9999846548',
      type: FieldType.DATE_TIME,
      name: 'dueAt',
      label: 'Due At',
      description: 'Optional fixed due date and time.',
      icon: 'IconCalendarTime',
    },
    {
      universalIdentifier: '5fd07234-bb96-4372-9fc6-6e45ff0d7a8e',
      type: FieldType.TEXT,
      name: 'description',
      label: 'Description',
      icon: 'IconNotes',
    },
  ],
});
