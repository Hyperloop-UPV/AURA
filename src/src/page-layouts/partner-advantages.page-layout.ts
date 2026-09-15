import {
  definePageLayout,
  PageLayoutTabLayoutMode,
} from 'twenty-sdk/define';

import {
  PARTNER_ADVANTAGES_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
} from '../front-components/partner-advantages.front-component';

export const PARTNER_ADVANTAGES_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER =
  'b1402f8c-c515-49b1-a831-43032bd8ca18';

export default definePageLayout({
  universalIdentifier:
    PARTNER_ADVANTAGES_PAGE_LAYOUT_UNIVERSAL_IDENTIFIER,
  name: 'Ventajas Partners',
  type: 'STANDALONE_PAGE',
  tabs: [
    {
      universalIdentifier: '5a741967-07a7-4ec8-9df2-6861b2eccc8b',
      title: 'Ventajas Partners',
      position: 0,
      icon: 'IconChecklist',
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [
        {
          universalIdentifier: '4bf0ea32-b59d-434a-ae14-5be2d7827014',
          title: 'Ventajas Partners',
          type: 'FRONT_COMPONENT',
          position: {
            layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
            index: 0,
          },
          configuration: {
            configurationType: 'FRONT_COMPONENT',
            frontComponentUniversalIdentifier:
              PARTNER_ADVANTAGES_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
          },
        },
      ],
    },
  ],
});
