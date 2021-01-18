import { readFile } from 'fs';
import { createProjectGraph, onlyWorkspaceProjects, ProjectGraph, ProjectGraphDependency } from '@nrwl/workspace/src/core/project-graph';
import { readJsonFile } from '@nrwl/workspace';
import { fileExists, writeJsonFile } from '@nrwl/workspace/src/utils/fileutils';
import { getTranslatableContent } from './shared';
import { FileData, readNxJson } from '@nrwl/workspace/src/core/file-utils';
import * as parser from "@babel/parser";
import { forEachOf } from "async";
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
        i.ext === include && !i.file.includes(exclude)).map((i) => ({ ...i, project }));
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

export function extractTranslateElements(files: FileData[], depGraph: ProjectGraph): Promise<any> {
    return new Promise((res, rej) => {
        const result = [];
        const metadata = [];
        forEachOf(files, (item, _key, callback) => {
            readFile(item.file, "utf8", (err, data) => {
                const dependencies = [];
                if (err) return callback(err);
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
                                    extractElements(item, bodyItem.argument.children, result, dependencies);
                                }
                            });
                        }
                    });
                } catch (e) {
                    return callback(e);
                }
                metadata.push({
                    file: item.file,
                    project: item.project,
                    dependencies 
                });
                
                callback();
            });
        }, err => {
            if (err) rej(err.message);
            res({result, metadata});
        });
    });
}


export function extractElements(item, children, result, dependencies) {
    children.forEach((itemChild) => {
        let openingElementName = itemChild.openingElement?.name.name;
        if (itemChild.children) {
            extractElements(item, itemChild.children, result, dependencies);
        }
        if (itemChild.type === "JSXElement" && (openingElementName.includes('TransUnit') || openingElementName.includes('Plural'))) {
            const value = itemChild.openingElement.attributes.find((attribute) => {
                return attribute.name.name === "value"
            }).value.expression.value;
            result.push({
                file: item.file,
                metadata: getTranslatableContent(value),
                type: openingElementName,
                target: extractTarget(itemChild),
                project: item.project,
                dependencies
            });
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