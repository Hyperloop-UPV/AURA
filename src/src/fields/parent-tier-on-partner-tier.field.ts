import { defineField, FieldType, OnDeleteAction, RelationType } from 'twenty-sdk/define';
import { PARTNER_TIER_UNIVERSAL_IDENTIFIER } from '../objects/partner-tier.object';

export const PARENT_TIER_FIELD_ID = 'aa389497-86fc-47c1-a855-aab1191a32a8';
export const CHILD_TIERS_FIELD_ID = '2b9af45e-4f52-4002-b438-7c9a082bfd1e';

export default defineField({
  universalIdentifier: PARENT_TIER_FIELD_ID,
  objectUniversalIdentifier: PARTNER_TIER_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'parentTier',
  label: 'Parent Tier',
  icon: 'IconArrowUp',
  relationTargetObjectMetadataUniversalIdentifier: PARTNER_TIER_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier: CHILD_TIERS_FIELD_ID,
  isNullable: true,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'parentTierId',
  },
});
