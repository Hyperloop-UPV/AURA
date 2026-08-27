import { defineField, FieldType, OnDeleteAction, RelationType, STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS } from 'twenty-sdk/define';
import { PARTNER_TIER_UNIVERSAL_IDENTIFIER } from '../objects/partner-tier.object';

export const TIER_ON_OPPORTUNITY_FIELD_ID = '259564f8-251a-4b0c-9cd2-6694b916216c';
export const OPPORTUNITIES_ON_TIER_FIELD_ID = 'aed30cf8-604e-4d4c-9906-f77483b47732';

export default defineField({
  universalIdentifier: TIER_ON_OPPORTUNITY_FIELD_ID,
  objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier,
  type: FieldType.RELATION,
  name: 'partnerTier',
  label: 'Partner Tier',
  icon: 'IconAward',
  relationTargetObjectMetadataUniversalIdentifier: PARTNER_TIER_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier: OPPORTUNITIES_ON_TIER_FIELD_ID,
  isNullable: true,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'partnerTierId',
  },
});
