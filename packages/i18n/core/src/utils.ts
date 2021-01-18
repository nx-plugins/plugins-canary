import { readFile } from 'fs';
import { basename, extname } from 'path';
import { createProjectGraph, onlyWorkspaceProjects, ProjectGraph, ProjectGraphDependency } from '@nrwl/workspace/src/core/project-graph';
import { readJsonFile } from '@nrwl/workspace';
import { fileExists, writeJsonFile } from '@nrwl/workspace/src/utils/fileutils';
import { getTranslatableContent } from './shared';
import { readNxJson } from '@nrwl/workspace/src/core/file-utils';
import * as parser from "@babel/parser";
import { TargetProjectLocator } from '@nrwl/workspace/src/core/target-project-locator';

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
        i.ext === include && !i.file.includes(exclude)).map((i) => ({
            ...i,
            project,
            type: depGraph.nodes[project].type,
            path: basename(i.file, extname(i.file))
        }));
}

export function getProjectDepsFiles(depGraph: ProjectGraph, projectDeps: ProjectGraphDependency[], include: string, exclude: string) {
    let result = [];
    projectDeps.forEach((p) => {
        result = result.concat(getNodesFiles(depGraph, p.target, include, exclude));
    });
    return result;
}

export function getWorkspaceScope() {
    const config = readNxJson();
    return config.npmScope;
}

export function extractTranslateElements(files: any[], depGraph: ProjectGraph, namespaces): Promise<any> {
    const promises = [];
    files.forEach((item) => {
        promises.push(new Promise((res, rej) => {
            const elements = [];
            const dependencies = [];

            const { file, project, type, path } = item;
            readFile(item.file, "utf8", (err, data) => {
                if (err) return rej(err);
                try {
                    const ast = parser.parse(data, {
                        sourceType: 'module',
                        plugins: ['typescript', 'jsx']
                    });
                    const targetProjectLocator = new TargetProjectLocator(depGraph.nodes);
                    ast.program.body.forEach((i: any) => {
                        const workspaceScope = getWorkspaceScope();
                        if (i.type === "ImportDeclaration" && i.source.value.includes(workspaceScope)) {
                            dependencies.push({
                                "type": "static",
                                "source": item.project,
                                "target": targetProjectLocator.findProjectWithImport(i.source.value, item.file, workspaceScope)
                            });
                        }
                        if (i.type === "ExportNamedDeclaration") {
                            i.declaration.body.body.forEach((bodyItem) => {
                                if (bodyItem.argument && bodyItem.argument.type !== "JSXText") {
                                    extractElements(item, bodyItem.argument.children, elements, dependencies, namespaces);
                                }
                            });
                        }
                    });
                } catch (e) {
                    return rej(e);
                }
                res({
                    file,
                    project,
                    type,
                    path,
                    dependencies,
                    elements
                })
            });
        }));
    });
    return Promise.all(promises);
}


export function extractElements(item, children, elements, dependencies, namespaces) {
    children.forEach((itemChild) => {
        let openingElementName = itemChild.openingElement?.name.name;
        if (itemChild.children) {
            extractElements(item, itemChild.children, elements, dependencies, namespaces);
        }
        if (itemChild.type === "JSXElement" && (openingElementName.includes('TransUnit') || openingElementName.includes('Plural'))) {
            const value = itemChild.openingElement.attributes.find((attribute) => {
                return attribute.name.name === "value"
            }).value.expression.value;
            const namespace = itemChild.openingElement.attributes.find((attribute) => {
                return attribute.name.name === "namespace"
            })?.value.expression.value;
            if (!namespaces[namespace] && namespace) {
                namespaces[namespace] = {
                    "elements": [],
                    "type": "namespace",
                    "path": namespace,

                };
            }
            if (namespace) {
                namespaces[namespace]["elements"].push({
                    file: item.file,
                    metadata: getTranslatableContent(value),
                    type: openingElementName,
                    target: extractTarget(itemChild),
                    project: item.project,
                    dependencies
                });
            } else {
                elements.push({
                    file: item.file,
                    metadata: getTranslatableContent(value),
                    type: openingElementName,
                    target: extractTarget(itemChild),
                    project: item.project,
                    dependencies
                });
            }
        }
    });
}

export function extractTarget(itemChild, contador = 0) {
    let content = '';
    itemChild.children.forEach((item) => {
        switch (item.type) {
            case "JSXElement":
                content += `<${contador}> ${extractTarget(item, contador + 1)}</${contador}>`
                contador += 1;
                break;
            case "JSXText":
                content += item.value.trim();
                break;
            case "JSXExpressionContainer":
                content += `{{${item.expression.name}}}`
                break;
        }
    });
    return content;
}

export function manageTranslatableContent(elements, translations) {
    let result = [];
    elements.forEach((e) => {
        const previousTranslation = getTranslationById(translations, e.metadata.id);
        switch (e.type) {
            case "TransUnit":
                const { metadata, file, dependencies } = e;
                result[e.metadata.id] = {
                    metadata,
                    file,
                    dependencies,
                    target: previousTranslation ? previousTranslation.target : e.target
                };
                break;
            case "Plural":
                result[e.metadata.id] = {
                    ...e,
                    file: e.file.file,
                    target: {
                        zero: previousTranslation ? previousTranslation.target.zero : e.target,
                        one: previousTranslation ? previousTranslation.target.one : e.target,
                        two: previousTranslation ? previousTranslation.target.two : e.target,
                        other: previousTranslation ? previousTranslation.target.other : e.target,
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