import { defineField, FieldType, RelationType, STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS } from 'twenty-sdk/define';
import { PARTNER_TIER_UNIVERSAL_IDENTIFIER } from '../objects/partner-tier.object';
import { TIER_ON_OPPORTUNITY_FIELD_ID, OPPORTUNITIES_ON_TIER_FIELD_ID } from './tier-on-opportunity.field';

export default defineField({
  universalIdentifier: OPPORTUNITIES_ON_TIER_FIELD_ID,
  objectUniversalIdentifier: PARTNER_TIER_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'opportunities',
  label: 'Opportunities',
  icon: 'IconTargetArrow',
  relationTargetObjectMetadataUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier: TIER_ON_OPPORTUNITY_FIELD_ID,
  universalSettings: { relationType: RelationType.ONE_TO_MANY },
});
