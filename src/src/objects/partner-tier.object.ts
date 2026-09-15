import { defineObject, FieldType } from 'twenty-sdk/define';

export const PARTNER_TIER_UNIVERSAL_IDENTIFIER =
  'eda9eeaa-275b-40ae-863a-683ef6140094';

export const PARTNER_TIER_NAME_FIELD_UNIVERSAL_IDENTIFIER =
  'ec041113-476e-4e9b-bb35-cefe767ee45b';

export const PARTNER_TIER_DESCRIPTION_FIELD_UNIVERSAL_IDENTIFIER =
  'bd0ac300-36a5-49d7-b604-d60f441cd2b8';

export default defineObject({
  universalIdentifier: PARTNER_TIER_UNIVERSAL_IDENTIFIER,

  nameSingular: 'partnerTier',
  namePlural: 'partnerTiers',

  labelSingular: 'Partner Tier',
  labelPlural: 'Partner Tiers',

  icon: 'IconAward',

  fields: [
    {
      universalIdentifier:
        PARTNER_TIER_NAME_FIELD_UNIVERSAL_IDENTIFIER,

      type: FieldType.TEXT,

      name: 'name',
      label: 'Name',

      description: 'Name of the sponsorship tier.',

      icon: 'IconAward',
    },
    {
      universalIdentifier:
        PARTNER_TIER_DESCRIPTION_FIELD_UNIVERSAL_IDENTIFIER,

      type: FieldType.TEXT,

      name: 'description',
      label: 'Description',

      description:
        'Optional description of the sponsorship tier.',

      icon: 'IconNotes',
    },
  ],
});
