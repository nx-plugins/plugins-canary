import { readFile } from 'fs';
import { logger } from '@nrwl/devkit';
import { basename, extname } from 'path';
import {
  createProjectGraph,
  onlyWorkspaceProjects,
  ProjectGraph,
  ProjectGraphDependency,
} from '@nrwl/workspace/src/core/project-graph';
import { readJsonFile } from '@nrwl/workspace';
import { fileExists, writeJsonFile } from '@nrwl/workspace/src/utils/fileutils';
import { getTranslatableContent } from './shared';
import { readNxJson } from '@nrwl/workspace/src/core/file-utils';
import * as parser from '@babel/parser';
import { TargetProjectLocator } from '@nrwl/workspace/src/core/target-project-locator';
import * as mdx from '@mdx-js/mdx';
import * as chalk from 'chalk';
import * as chalkTable from 'chalk-table';
import { ProjectFile } from './models/project-file.model';
import { I18nNamespace, I18nNamespaceType } from './models/elements/namespace.model';
import { FileElements } from './models/file-elements.model';
import { I18nElementType } from './models/elements/element.model';
import { BuildExecutorSchema } from './executors/build/schema';


export function getMessages(directory: string, locale: string): { [k: string]: any } {
  if (!fileExists(`${directory}/messages.${locale}.json`)) {
    return { messages: {}, dependencies: [], file: ''};
  } else {
    try {
      return readJsonFile(`${directory}/messages.${locale}.json`);
    } catch (e) {
      throw Error(
        `Cannot read the messages translation file located at : ${directory}/messages.${locale}.json.`
      );
    }
  }
}

export function getTranslationById(translations: any, id: string) {
  return translations.hasOwnProperty(id) ? translations[id] : null;
}

export function getWorkspaceGraph(): ProjectGraph {
  return onlyWorkspaceProjects(createProjectGraph());
}

export function getProjectDeps(depGraph: ProjectGraph, project: string): ProjectGraphDependency[] {
  return depGraph.dependencies[project];
}

export function getNodesFiles(
  depGraph: ProjectGraph,
  project: string,
  include: string[],
  exclude: string[]
): ProjectFile[] {
  return depGraph.nodes[project].data.files
    .filter(
      (i) =>
        include.some((incl) => i.file.includes(incl)) &&
        !exclude.some((excl) => i.file.includes(excl))
    )
    .map((i) => ({
      ...i,
      project,
      type: depGraph.nodes[project].type,
      path: basename(i.file, extname(i.file)),
    }));
}

export function getProjectDepsFiles(
  depGraph: ProjectGraph,
  projectDeps: ProjectGraphDependency[],
  include: string[],
  exclude: string[]
): ProjectFile[] {
  let result = [];
  projectDeps.forEach((p) => {
    result = result.concat(getNodesFiles(depGraph, p.target, include, exclude));
  });
  return result;
}

export function getWorkspaceScope(): string {
  const config = readNxJson();
  return config.npmScope;
}

export function extractTranslateElements(
  files: ProjectFile[],
  depGraph: ProjectGraph,
  namespaces: I18nNamespace,
  options: BuildExecutorSchema
): Promise<FileElements[]> {
  const promises = [];
  files.forEach((item) => {
    promises.push(
      new Promise((res, rej) => {
        const elements = [];
        const dependencies = [];

        const { file, project, type, path } = item;
        readFile(item.file, 'utf8', async (err, data) => {
          if (err) return rej(err);
          try {
            let code;
            const isMarkdown = ['.md', '.mdx'].some((v) =>
              item.file.includes(v)
            );

            if (isMarkdown) {
              code = await mdx(data);
            } else {
              code = data;
            }

            const ast = parser.parse(code, {
              sourceType: 'module',
              plugins: ['typescript', 'jsx'],
            });
            const targetProjectLocator = new TargetProjectLocator(
              depGraph.nodes
            );
            ast.program.body.forEach((i: any) => {
              const workspaceScope = getWorkspaceScope();
              if (
                i.type === 'ImportDeclaration' &&
                i.source.value.includes(workspaceScope)
              ) {
                dependencies.push({
                  type: 'static',
                  source: item.project,
                  target: targetProjectLocator.findProjectWithImport(
                    i.source.value,
                    item.file,
                    workspaceScope
                  ),
                });
              }
              if (
                i.type === 'ExportNamedDeclaration' ||
                i.type === 'ExportDefaultDeclaration'
              ) {
                i.declaration?.body?.body.forEach((bodyItem) => {
                  if (
                    bodyItem.argument &&
                    bodyItem.argument.type !== 'JSXText'
                  ) {
                    extractElements(
                      item,
                      bodyItem.argument.children,
                      elements,
                      dependencies,
                      namespaces
                    );
                  }
                });
              }
            });
            if(options.verbose){
              logger.debug(`${item.file}`);
              logger.debug(`✓ ${elements.length} Elements`);
            }
          } catch (e) {
            return rej(e);
          }
          res({
            file,
            project,
            type,
            path,
            dependencies,
            elements,
          });
        });
      })
    );
  });
  return Promise.all(promises);
}

export function extractElements(
  item,
  children: any[],
  elements,
  dependencies: string[],
  namespaces: I18nNamespace
) {
  children.forEach((itemChild) => {
    let openingElementName = itemChild.openingElement?.name.name;
    if (itemChild.children) {
      extractElements(
        item,
        itemChild.children,
        elements,
        dependencies,
        namespaces
      );
    }
    if (
      itemChild.type === 'JSXElement' &&
      (openingElementName.includes('TransUnit') ||
        openingElementName.includes('Plural'))
    ) {
      const value = itemChild.openingElement.attributes.find((attribute) => {
        return attribute.name.name === 'value';
      }).value.expression.value;
      const namespace = itemChild.openingElement.attributes.find(
        (attribute) => {
          return attribute.name.name === 'namespace';
        }
      )?.value.expression.value;
      if (!namespaces[namespace] && namespace) {
        namespaces[namespace] = {
          elements: [],
          file: item.file,
          type: I18nNamespaceType.Namespace,
          path: namespace,
          dependencies,
        };
      }
      if (namespace) {
        namespaces[namespace]['elements'].push({
          file: item.file,
          metadata: getTranslatableContent(value),
          type: openingElementName,
          target: extractTarget(itemChild),
          project: item.project,
        });
      } else {
        elements.push({
          file: item.file,
          metadata: getTranslatableContent(value),
          type: openingElementName,
          target: extractTarget(itemChild),
          project: item.project,
        });
      }
    }
  });
}

export function extractTarget(itemChild, contador = 0) {
  let content = '';
  itemChild.children.forEach((item) => {
    switch (item.type) {
      case 'JSXElement':
        content += `<${contador}> ${extractTarget(
          item,
          contador + 1
        )}</${contador}>`;
        contador += 1;
        break;
      case 'JSXText':
        content += item.value.trim();
        break;
      case 'JSXExpressionContainer':
        content += `{{${item.expression.name}}}`;
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
      case I18nElementType.Transunit:
        const { metadata, file } = e;
        result[e.metadata.id] = {
          metadata,
          file,
          target: previousTranslation ? previousTranslation.target : e.target,
        };
        break;
      case I18nElementType.Plural:
        result[e.metadata.id] = {
          ...e,
          file: e.file.file,
          target: {
            zero: previousTranslation
              ? previousTranslation.target.zero
              : e.target,
            one: previousTranslation
              ? previousTranslation.target.one
              : e.target,
            two: previousTranslation
              ? previousTranslation.target.two
              : e.target,
            other: previousTranslation
              ? previousTranslation.target.other
              : e.target,
          },
        };
        break;
    }
  });
  return result;
}

export function writeTranslationFile(
  directory: string,
  translations: any,
  locale: string
) {
  return new Promise<void>((res, rej) => {
    writeJsonFile(`${directory}/messages.${locale}.json`, translations);
    res();
  })
}

export function getProjectsFiles(depGraph: ProjectGraph, projectDeps: ProjectGraphDependency[], projectName: string) {
  const includeFilesExt = ['.jsx', '.tsx', '.mdx'];
  const excludeFilesExt = ['.spec']
  const appFiles = getNodesFiles(
    depGraph,
    projectName,
    includeFilesExt,
    excludeFilesExt
  );
  const projectDepsFiles = getProjectDepsFiles(
    depGraph,
    projectDeps,
    includeFilesExt,
    excludeFilesExt
  );
  return [...appFiles, ...projectDepsFiles]
}

export function extractElementsWithDependencies(elements: FileElements[]): FileElements[] {
  return elements
    .filter((i) => i.type === 'app')
    .map((i) => {
      const { file, project, path, dependencies, type } = i;
      let finalElements = [...i.elements];
      dependencies.forEach((dep) => {
        finalElements = [
          ...finalElements,
          ...elements.find((a) => a.project === dep.target)?.elements,
        ];
      });
      return { file, type, project, path, elements: finalElements, dependencies };
    });
}

export function writeAppMessagesFile(elements, locales: string[], directory: string): Promise<void>[] {
  const prom = [];
  elements.forEach((i) => {
    prom.push(new Promise<void>((res, rej) => {
      const writes = [];
      if (i.elements.length > 0) {
        console.log(`\n ${chalk.cyan('>')} ${chalk.inverse(chalk.bold(chalk.cyan(` Source: ${i.file} `)))}`);

        locales.forEach((locale) => {
          const savedMessages = getMessages(`${directory}/pages/${i.path}`, locale).messages;
          const messages = manageTranslatableContent(i.elements, {});

          console.log(`${Object.keys(savedMessages).length > 0
            ? `Messages file founded. Updating file ${directory}/pages/${i.path}/messages.${locale}.json`
            : `No translations founded. Creating a new messages file ${directory}/pages/${i.path}/messages.${locale}.json`}`);
          writes.push(writeTranslationFile(`${directory}/pages/${i.path}`, {messages: {...messages}, dependencies: i.dependencies, file: i.file }, locale));
        });
      }
      Promise.all(writes).then(() => res());
    }))
  });
  return prom;
}

export function writeNamespacesMessagesFile(namespaces: I18nNamespace, locales: string[], directory: string) {
  Object.values(namespaces).forEach((i: any) => {
    if (i.elements.length > 0) {
      locales.forEach((locale) => {

        const messages = manageTranslatableContent(i.elements, {});
        console.log('\n Namespace file founded. Updating file');
        writeTranslationFile(`${directory}/namespaces/${i.path}`, {messages: {...messages}, dependencies: i.dependencies, file: i.file }, locale);
      });
    }
  });
}

export function generateStatistics(elements: FileElements[], directory: string) {
  const chalkOptions = {
    leftPad: 2,
    columns: [
      { field: 'id', name: chalk.cyan('ID') },
      { field: 'type', name: chalk.magenta('Type') },
      { field: 'source', name: chalk.green('Source') },
    ],
  };
  const statistics = [];
  elements.forEach((i) => {
    i.elements.forEach((e) => {
      const { type, file, metadata } = e;
      statistics.push({
        id: metadata.id,
        type,
        source: file,
      });
    });
  });
  logger.info(`NX I18n Statistics`);
  if (
    statistics.filter((s) => Object.keys(s).length !== 0).length !== 0
  ) {
    logger.log(chalkTable(chalkOptions, statistics));
    logger.fatal(`Locales were save at: ${directory}`);

  } else {
    logger.fatal(
      `Locales were not generated, please use the <TransUnit>, <Plural> in order to extract the messages`
    );
  }
}