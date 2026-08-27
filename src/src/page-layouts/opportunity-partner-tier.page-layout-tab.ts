import {
  definePageLayoutTab,
  PageLayoutTabLayoutMode,
  STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  OPPORTUNITY_PARTNER_TIER_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
} from '../front-components/opportunity-partner-tier.front-component';

export default definePageLayoutTab({
  universalIdentifier: '0744babb-70f8-4bc3-b405-a83e770b9bc9',
  pageLayoutUniversalIdentifier:
    STANDARD_PAGE_LAYOUT_UNIVERSAL_IDENTIFIERS.opportunityRecordPage
      .universalIdentifier,
  title: 'Partner Tier',
  position: 40,
  icon: 'IconAward',
  layoutMode: PageLayoutTabLayoutMode.CANVAS,
  widgets: [
    {
      universalIdentifier: 'c8b6c037-c54e-4548-a81d-0682de8d0dbf',
      title: 'Partner Tier',
      type: 'FRONT_COMPONENT',
      configuration: {
        configurationType: 'FRONT_COMPONENT',
        frontComponentUniversalIdentifier:
          OPPORTUNITY_PARTNER_TIER_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
      },
    },
  ],
});
