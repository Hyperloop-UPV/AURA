import {
  definePageLayout,
  PageLayoutTabLayoutMode,
} from 'twenty-sdk/define';

import {
  PARTNER_TIER_UNIVERSAL_IDENTIFIER,
} from '../objects/partner-tier.object';

import {
  OPPORTUNITIES_ON_TIER_FIELD_ID,
} from '../fields/tier-on-opportunity.field';

import {
  TEMPLATES_ON_TIER_FIELD_ID,
} from '../fields/tier-on-task-template.field';

export const PARTNER_TIER_RECORD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER =
  'cbee43ce-ee2b-4fdf-a0e3-f9fa59ad7383';

export default definePageLayout({
  universalIdentifier:
    PARTNER_TIER_RECORD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,

  name: 'Partner Tier Record Page',

  type: 'RECORD_PAGE',

  objectUniversalIdentifier:
    PARTNER_TIER_UNIVERSAL_IDENTIFIER,

  tabs: [
    {
      universalIdentifier:
        '88a93056-7fe7-4d2c-a8f8-ea176de26aaf',

      title: 'Details',
      position: 0,
      icon: 'IconInfoCircle',

      layoutMode:
        PageLayoutTabLayoutMode.VERTICAL_LIST,

      widgets: [
        {
          universalIdentifier:
            'd123a097-11a9-4c5e-bd0f-406e32f26b1b',

          title: 'Details',
          type: 'FIELDS',

          configuration: {
            configurationType: 'FIELDS',
          },
        },
      ],
    },

    {
      universalIdentifier:
        'c0e0cfb3-8893-4352-aa00-1d3f22572e76',

      title: 'Opportunities',
      position: 10,
      icon: 'IconTargetArrow',

      layoutMode:
        PageLayoutTabLayoutMode.VERTICAL_LIST,

      widgets: [
        {
          universalIdentifier:
            '7879ae77-7908-494d-8331-c6b225de9b9e',

          title: 'Opportunities',
          type: 'FIELD',

          position: {
            layoutMode:
              PageLayoutTabLayoutMode.VERTICAL_LIST,
            index: 0,
          },

          configuration: {
            configurationType: 'FIELD',
            fieldMetadataId:
              OPPORTUNITIES_ON_TIER_FIELD_ID,
            fieldDisplayMode: 'TABLE',
          },
        },
      ],
    },

    {
      universalIdentifier:
        '80c9d5be-28f4-4bcd-9f84-ba811669d46d',

      title: 'Task Templates',
      position: 20,
      icon: 'IconChecklist',

      layoutMode:
        PageLayoutTabLayoutMode.VERTICAL_LIST,

      widgets: [
        {
          universalIdentifier:
            '52906149-a432-49db-94f9-887231f3ded3',

          title: 'Task Templates',
          type: 'FIELD',

          position: {
            layoutMode:
              PageLayoutTabLayoutMode.VERTICAL_LIST,
            index: 0,
          },

          configuration: {
            configurationType: 'FIELD',
            fieldMetadataId:
              TEMPLATES_ON_TIER_FIELD_ID,
            fieldDisplayMode: 'TABLE',
          },
        },
      ],
    },
  ],
});
