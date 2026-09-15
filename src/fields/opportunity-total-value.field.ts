import {
  defineField,
  FieldType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

export const OPPORTUNITY_TOTAL_VALUE_FIELD_UNIVERSAL_IDENTIFIER =
  '7e555de8-3841-4b7b-971d-a35c3f949bad';

export default defineField({
  universalIdentifier:
    OPPORTUNITY_TOTAL_VALUE_FIELD_UNIVERSAL_IDENTIFIER,

  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier,

  type: FieldType.CURRENCY,

  name: 'totalValue',
  label: 'Total Value',

  description:
    'Total value of all products and services obtained through the sponsorship.',

  icon: 'IconCurrencyEuro',
});
