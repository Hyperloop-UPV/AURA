import { defineField, FieldType, RelationType } from 'twenty-sdk/define';
import { PARTNER_TIER_UNIVERSAL_IDENTIFIER } from '../objects/partner-tier.object';
import { PARENT_TIER_FIELD_ID, CHILD_TIERS_FIELD_ID } from './parent-tier-on-partner-tier.field';

export default defineField({
  universalIdentifier: CHILD_TIERS_FIELD_ID,
  objectUniversalIdentifier: PARTNER_TIER_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'childTiers',
  label: 'Child Tiers',
  description:
    'Technical inverse of Parent Tier. Hidden from the AURA Partner Tier page.',
  icon: 'IconArrowDown',
  relationTargetObjectMetadataUniversalIdentifier: PARTNER_TIER_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier: PARENT_TIER_FIELD_ID,
  universalSettings: { relationType: RelationType.ONE_TO_MANY },
});
