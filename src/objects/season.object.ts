import {
    defineObject,
    FieldType,
} from 'twenty-sdk/define';

export const SEASON_UNIVERSAL_IDENTIFIER =
    '42ac6973-2c6b-4c6b-af7e-7a5d23c7cd76';

export const SEASON_NAME_FIELD_ID =
    '6556c4eb-330a-4303-96bb-ba67270d2252';

export const SEASON_START_DATE_FIELD_ID =
    'b2ac1dd9-1d09-408c-b205-b63dc308b787';

export const SEASON_END_DATE_FIELD_ID =
    'b5c9bcfb-c910-4a46-abf4-c2455d072354';

export const SEASON_ACTIVE_FIELD_ID =
    'fb0f1fe0-9fb5-4369-84dc-4bde8f376d64';

export default defineObject({
    universalIdentifier: SEASON_UNIVERSAL_IDENTIFIER,

    nameSingular: 'season',
    namePlural: 'seasons',

    labelSingular: 'Season',
    labelPlural: 'Seasons',

    description: 'Hyperloop UPV sponsorship seasons',

    icon: 'IconCalendar',

    fields: [
        {
            universalIdentifier: SEASON_NAME_FIELD_ID,
            name: 'name',
            label: 'Name',
            type: FieldType.TEXT,
        },

        {
            universalIdentifier: SEASON_START_DATE_FIELD_ID,
            name: 'startDate',
            label: 'Start Date',
            type: FieldType.DATE,
        },

        {
            universalIdentifier: SEASON_END_DATE_FIELD_ID,
            name: 'endDate',
            label: 'End Date',
            type: FieldType.DATE,
        },

        {
            universalIdentifier: SEASON_ACTIVE_FIELD_ID,
            name: 'active',
            label: 'Active',
            type: FieldType.BOOLEAN,
            defaultValue: true,
        },
    ],
});