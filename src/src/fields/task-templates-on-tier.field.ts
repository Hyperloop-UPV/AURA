import { defineField, FieldType, RelationType } from 'twenty-sdk/define';
import { PARTNER_TIER_UNIVERSAL_IDENTIFIER } from '../objects/partner-tier.object';
import { PARTNER_TIER_TASK_TEMPLATE_UNIVERSAL_IDENTIFIER } from '../objects/partner-tier-task-template.object';
import { TIER_ON_TEMPLATE_FIELD_ID, TEMPLATES_ON_TIER_FIELD_ID } from './tier-on-task-template.field';

export default defineField({
  universalIdentifier: TEMPLATES_ON_TIER_FIELD_ID,
  objectUniversalIdentifier: PARTNER_TIER_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'taskTemplates',
  label: 'Task Templates',
  icon: 'IconChecklist',
  relationTargetObjectMetadataUniversalIdentifier: PARTNER_TIER_TASK_TEMPLATE_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier: TIER_ON_TEMPLATE_FIELD_ID,
  universalSettings: { relationType: RelationType.ONE_TO_MANY },
});
