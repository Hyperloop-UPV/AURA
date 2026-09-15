import {
    defineField,
    FieldType,
    RelationType,
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import { SEASON_UNIVERSAL_IDENTIFIER } from '../objects/season.object';

import { OPPORTUNITY_SEASON_FIELD_ID } from './season-on-opportunity.field';

export const SEASON_SPONSORSHIPS_FIELD_ID =
    '6796d0ad-67d5-4877-a28b-66b88c112c02';

export default defineField({
    universalIdentifier: SEASON_SPONSORSHIPS_FIELD_ID,

    objectUniversalIdentifier: SEASON_UNIVERSAL_IDENTIFIER,

    type: FieldType.RELATION,

    name: 'sponsorships',
    label: 'Sponsorships',
    icon: 'IconBriefcase',

    relationTargetObjectMetadataUniversalIdentifier:
        STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier,

    relationTargetFieldMetadataUniversalIdentifier:
        OPPORTUNITY_SEASON_FIELD_ID,

    universalSettings: {
        relationType: RelationType.ONE_TO_MANY,
    },
});