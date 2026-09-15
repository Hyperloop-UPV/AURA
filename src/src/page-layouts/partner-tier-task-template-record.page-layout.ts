import {
  definePageLayout,
  PageLayoutTabLayoutMode,
} from 'twenty-sdk/define';

import {
  PARTNER_TIER_TASK_TEMPLATE_UNIVERSAL_IDENTIFIER,
} from '../objects/partner-tier-task-template.object';

export const PARTNER_TIER_TASK_TEMPLATE_RECORD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER =
  'a1ba0613-b347-4752-b60d-9f753944141e';

export default definePageLayout({
  universalIdentifier:
    PARTNER_TIER_TASK_TEMPLATE_RECORD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,

  name: 'Tier Task Template Record Page',

  type: 'RECORD_PAGE',

  objectUniversalIdentifier:
    PARTNER_TIER_TASK_TEMPLATE_UNIVERSAL_IDENTIFIER,

  tabs: [
    {
      universalIdentifier:
        '118305f1-33f4-4790-a94b-58af68dd5dc7',

      title: 'Details',
      position: 0,
      icon: 'IconInfoCircle',

      layoutMode:
        PageLayoutTabLayoutMode.VERTICAL_LIST,

      widgets: [
        {
          universalIdentifier:
            '7c854877-cf5d-495e-ae64-c44d2f7fe949',

          title: 'Details',
          type: 'FIELDS',

          configuration: {
            configurationType: 'FIELDS',
          },
        },
      ],
    },
  ],
});
