import { defineField, FieldType, OnDeleteAction, RelationType } from 'twenty-sdk/define';
import { PARTNER_TIER_UNIVERSAL_IDENTIFIER } from '../objects/partner-tier.object';
import { PARTNER_TIER_TASK_TEMPLATE_UNIVERSAL_IDENTIFIER } from '../objects/partner-tier-task-template.object';

export const TIER_ON_TEMPLATE_FIELD_ID = '295cdbe4-867e-4a57-a87c-6dd74d11d905';
export const TEMPLATES_ON_TIER_FIELD_ID = 'ddf634c5-dc59-4c63-a810-166888852ae5';

export default defineField({
  universalIdentifier: TIER_ON_TEMPLATE_FIELD_ID,
  objectUniversalIdentifier: PARTNER_TIER_TASK_TEMPLATE_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'partnerTier',
  label: 'Partner Tier',
  icon: 'IconAward',
  relationTargetObjectMetadataUniversalIdentifier: PARTNER_TIER_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier: TEMPLATES_ON_TIER_FIELD_ID,
  isNullable: true,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'partnerTierId',
  },
});
