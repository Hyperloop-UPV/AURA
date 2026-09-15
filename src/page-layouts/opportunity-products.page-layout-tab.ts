import {
  definePageLayoutTab,
  PageLayoutTabLayoutMode,
  STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  OPPORTUNITY_PRODUCTS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
} from './opportunity-products.front-component';

export const OPPORTUNITY_PRODUCTS_PAGE_LAYOUT_TAB_UNIVERSAL_IDENTIFIER =
  'b3d16313-e49b-4b11-b390-821d1fc44db8';

export const OPPORTUNITY_PRODUCTS_WIDGET_UNIVERSAL_IDENTIFIER =
  'bb29e640-50f7-4aa8-b7e2-b78d22332991';

export default definePageLayoutTab({
  universalIdentifier:
    OPPORTUNITY_PRODUCTS_PAGE_LAYOUT_TAB_UNIVERSAL_IDENTIFIER,

  pageLayoutUniversalIdentifier:
    STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.opportunityRecordPage
      .universalIdentifier,

  title: 'Products',
  position: 60,
  icon: 'IconPackage',

  layoutMode: PageLayoutTabLayoutMode.CANVAS,

  widgets: [
    {
      universalIdentifier:
        OPPORTUNITY_PRODUCTS_WIDGET_UNIVERSAL_IDENTIFIER,

      title: 'Products',
      type: 'FRONT_COMPONENT',

      configuration: {
        configurationType: 'FRONT_COMPONENT',
        frontComponentUniversalIdentifier:
          OPPORTUNITY_PRODUCTS_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
      },
    },
  ],
});
