interface I18nBaseElement {
    file: string,
    metadata: {
        id: string;
        meaning: string;
        description: string;
    },
    target: string,
    project: string,
}

export interface I18nTransUnitElement extends I18nBaseElement {
    type: I18nElementType.Transunit,
}

export interface I18nPluralElement extends I18nBaseElement {
    type: I18nElementType.Plural,
}

export enum I18nElementType {
    Transunit = "TransUnit",
    Plural = "Plural",
}  