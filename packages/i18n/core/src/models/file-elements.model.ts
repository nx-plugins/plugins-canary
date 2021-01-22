import { ProjectGraphDependency } from "@nrwl/workspace";
import { I18nPluralElement, I18nTransUnitElement } from "./elements/element.model";
import { ProjectFileBase } from "./project-file.model";

export interface FileElements extends ProjectFileBase{
  file: string,
  elements: Array<I18nTransUnitElement | I18nPluralElement>,
  dependencies: ProjectGraphDependency[]
}

