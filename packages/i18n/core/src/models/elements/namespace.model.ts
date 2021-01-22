import { I18nPluralElement, I18nTransUnitElement } from "./element.model";

export interface I18nNamespace {
    [k: string]: NamespaceElement,
}

interface NamespaceElement{
    file: string,
    type: I18nNamespaceType.Namespace,
    path: string,
    elements: Array<I18nTransUnitElement | I18nPluralElement>,
    dependencies: string[],
}

export enum I18nNamespaceType {
    Namespace = "namespace"
}  