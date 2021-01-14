import { readFileSync } from 'fs';
import { createProjectGraph, onlyWorkspaceProjects, ProjectGraph, ProjectGraphDependency } from '@nrwl/workspace/src/core/project-graph';
import { readJsonFile } from '@nrwl/workspace';
import { fileExists, writeJsonFile } from '@nrwl/workspace/src/utils/fileutils';
import { getTranslatableContent } from './shared';
import { FileData } from '@nrwl/workspace/src/core/file-utils';
import * as parser from "@babel/parser";

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
    const deps = projectDeps.map((p: any) => {
        return getNodesFiles(depGraph, p.target, include, exclude);
    });
    const a = deps as any;
    return a.flat();
}

export function extractTranslateElements(files: FileData[]) {
    return files.map((file) => {
        const elements = [];
        const fileContent = readFileSync(file.file).toString();
        const ast = parser.parse(fileContent, {
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

                                elements.push({
                                    value,
                                    type: openingElementName
                                });
                            }
                        });
                    }
                });
            }
        });
        console.log(JSON.stringify(elements));
        return elements;
    })
}

// export function extractElementsByTagInFiles(tagName, files: NodeFile[]) {
//     return files.map((p) => {
//         const chain = [];
//         const fileContent = readFileSync(p.file).toString();
//         const elements = parse(strip(fileContent)) as [];
//         findElementsByTagName(chain, tagName, elements, p);
//         return chain;
//     });
// }

// function findElementsByTagName(chain, tagName, elements, p) {
//     for (let element of elements) {
//         if (element.tagName === tagName) {
//             chain.push({ ...element, file: p.file });
//         } else {
//             if (element.children) {
//                 findElementsByTagName(chain, tagName, element.children, p)
//             }
//         }
//     }
// }

export function manageMetadata(e) {
    const value = removeQuotes(e.attributes.find((a) => a.key === 'value'));
    const { meaning, description, id } = getTranslatableContent(value);
    const content = e.children.map((c) => {
        if (c.type === "text") {
            return c.content.trim();
        }
        else {
            console.error("Invalid element");
            // Throw an error here because the transunit contains elements inside
        }
    }).toString();

    return {
        value,
        id,
        description,
        meaning,
        content
    }
}

export function manageTrans(elements, translations) {
    let result = [];
    // FLAT is used to avoid empty arrays
    elements.flat().forEach((e) => {
        const { id, description, meaning, content } = manageMetadata(e);
        const previousTranslation = getTranslationById(translations, id);
        result[id] = {
            id,
            description,
            meaning,
            source: e.file,
            type: 'TransUnit',
            target: previousTranslation ? previousTranslation.target : content
        }
    });
    return result;
}

export function managePlural(elements, translations) {
    let result = [];
    elements.flat().forEach((e) => {
        const { id, description, meaning, content } = manageMetadata(e);
        const previousTranslation = getTranslationById(translations, id);
        result[id] = {
            id,
            description,
            meaning,
            source: e.file,
            type: 'Plural',
            target: {
                zero: previousTranslation ? previousTranslation.target.zero : content,
                one: previousTranslation ? previousTranslation.target.one : content,
                two: previousTranslation ? previousTranslation.target.two : content,
                other: previousTranslation ? previousTranslation.target.other : content,
            }
        }
    });
    return result;
}

export function removeQuotes(value: string) {
    return value.replace(/['"]+/g, '');
}

export function writeTranslationFile(directory: string, translations: any, locale: string) {
    writeJsonFile(`${directory}/messages.${locale}.json`, translations);
}

