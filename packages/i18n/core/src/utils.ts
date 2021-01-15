import { readFile } from 'fs';
import { createProjectGraph, onlyWorkspaceProjects, ProjectGraph, ProjectGraphDependency } from '@nrwl/workspace/src/core/project-graph';
import { readJsonFile } from '@nrwl/workspace';
import { fileExists, writeJsonFile } from '@nrwl/workspace/src/utils/fileutils';
import { getTranslatableContent } from './shared';
import { FileData } from '@nrwl/workspace/src/core/file-utils';
import * as parser from "@babel/parser";
import { forEachOf } from "async";

export function getTranslations(directory: string, locale: string) {
    if (!fileExists(`${directory}/messages.${locale}.json`)) {
        return {}
    } else {
        try {
            return readJsonFile(`${directory}/messages.${locale}.json`);
        } catch (e) {
            throw Error(`Cannot read the messages translation file located at : ${directory}/messages.${locale}.json.`);
        }
    }
}

export function getTranslationById(translations: any, id: string) {
    return translations.hasOwnProperty(id) ? translations[id] : null;
}

export function getWorkspaceGraph() {
    return onlyWorkspaceProjects(createProjectGraph());
}

export function getProjectDeps(depGraph: ProjectGraph, project: string) {
    return depGraph.dependencies[project];
}

export function getNodesFiles(depGraph: ProjectGraph, project: string, include: string, exclude: string) {
    return depGraph.nodes[project].data.files.filter((i) =>
        i.ext === include && !i.file.includes(exclude));
}

export function getProjectDepsFiles(depGraph: ProjectGraph, projectDeps: ProjectGraphDependency[], include: string, exclude: string) {
    let result = [];
    projectDeps.forEach((p) => {
        result = result.concat(getNodesFiles(depGraph, p.target, include, exclude));
    });
    return result;
}

export function extractTranslateElements(files: FileData[]): Promise<any[]> {
    return new Promise((res, rej) => {
        let result = [];
        forEachOf(files, (item, _key, callback) => {
            readFile(item.file, "utf8", (err, data) => {
                if (err) return callback(err);
                try {
                    const ast = parser.parse(data, {
                        sourceType: 'module',
                        plugins: ['typescript', 'jsx']
                    });
                    ast.program.body.forEach((i: any) => {
                        if (i.type === "ExportNamedDeclaration") {
                            i.declaration.body.body.forEach((bodyItem) => {
                                if (bodyItem.argument && bodyItem.argument.type === "JSXFragment") {
                                    bodyItem.argument.children.forEach((itemChild) => {
                                        let openingElementName = itemChild.openingElement?.name.name;
                                        if (itemChild.type === "JSXElement" && (openingElementName.includes('TransUnit') || openingElementName.includes('Plural'))) {
                                            const value = itemChild.openingElement.attributes.find((attribute) => {
                                                return attribute.name.name === "value"
                                            }).value.expression.value;
    
                                            result.push({
                                                ...value,
                                                metadata: getTranslatableContent(value),
                                                type: openingElementName,
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    });
                } catch (e) {
                    return callback(e);
                }
                callback();
            });
        }, err => {
            if (err) rej(err.message);
            res(result);
        });
    

    });
}

export function manageTranslatableContent(elements, translations) {
    let result = [];
    elements.forEach((e) => {
        const previousTranslation = getTranslationById(translations, e.metadata.id);
        switch (e.type) {
            case "TransUnit":
                result[e.metadata.id] = {
                    ...e,
                    file: e.file.file,
                    target: previousTranslation ? previousTranslation.target : 'empty'
                };
                break;
            case "Plural":
                result[e.metadata.id] = {
                    ...e,
                    file: e.file.file,
                    target: {
                        zero: previousTranslation ? previousTranslation.target.zero : "empty",
                        one: previousTranslation ? previousTranslation.target.one : "empty",
                        two: previousTranslation ? previousTranslation.target.two : "empty",
                        other: previousTranslation ? previousTranslation.target.other : "empty",
                    }
                };
                break;
        }
    });
    return result;
}

export function writeTranslationFile(directory: string, translations: any, locale: string) {
    writeJsonFile(`${directory}/messages.${locale}.json`, translations);
}