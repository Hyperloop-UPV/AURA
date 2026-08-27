import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const OPPORTUNITY_PRODUCTS_JSON_FIELD_UNIVERSAL_IDENTIFIER =
  'a3e850d0-3754-458b-ac90-e30e1bf967b8';

export default defineField({
  universalIdentifier:
    OPPORTUNITY_PRODUCTS_JSON_FIELD_UNIVERSAL_IDENTIFIER,

  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier,

  type: FieldType.RAW_JSON,

  name: 'sponsorshipProducts',
  label: 'Products',

  description:
    'Products and services obtained through the sponsorship, stored as structured JSON.',

  icon: 'IconPackage',
});
