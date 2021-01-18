
import { BuildExecutorSchema } from './schema';
import { getWorkspaceGraph, extractTranslateElements, getNodesFiles, getProjectDeps, getProjectDepsFiles, getTranslations, writeTranslationFile, manageTranslatableContent, getWorkspaceScope } from '../../utils';
import { ProjectGraph } from '@nrwl/workspace/src/core/project-graph';
import { Frameworks } from '../../frameworks';
import { logger, TargetContext } from '@nrwl/devkit';
import * as chalk from 'chalk';
import * as chalkTable from 'chalk-table';
import { forEachOf } from "async";

async function extractor(options: BuildExecutorSchema, context: TargetContext) {
  switch (options.framework) {
    case (Frameworks.React): {
      logger.info(`Project: ${context.projectName}`);
      logger.info(`Framework: ${options.framework}`);

      const depGraph = getWorkspaceGraph() as ProjectGraph;
      const namespaces = {};

      const projectDeps = getProjectDeps(depGraph, context.projectName);
      const appTsxFiles = getNodesFiles(depGraph, context.projectName, '.tsx', '.spec');
      const projectDepsTsxFiles = getProjectDepsFiles(depGraph, projectDeps, '.tsx', '.spec');
      const elements2 = await extractTranslateElements([...appTsxFiles, ...projectDepsTsxFiles], depGraph, namespaces);
      const elementsApp = elements2.filter((i) => i.type === "app").map((i) => {
        const { file, project, path, dependencies } = i;
        let finalElements = [...i.elements];
        dependencies.forEach((dep) => {
          finalElements = [...finalElements, ...elements2.find((a) => a.project === dep.target)?.elements];
        });
        return { file, project, path, elements: finalElements }
      });

      const result = [];
      const chalkOptions = {
        leftPad: 2,
        columns: [
          { field: "id", name: chalk.cyan("ID") },
          { field: "type", name: chalk.magenta("Type") },
          { field: "source", name: chalk.green("Source") },
        ]
      };

      const table = chalkTable(chalkOptions,
        result.map((i) => ({
          id: i.metadata.id,
          type: i.type,
          source: i.file
        }))
      );



      forEachOf(options.locales, (locale, _key, callback) => {
        try {
          const translations = getTranslations(options.directory, locale);
          elementsApp.forEach((i) => {
            if (i.elements.length > 0) {
              const messages = manageTranslatableContent(i.elements, translations);
              console.log(`\n ${chalk.cyan('>')} ${chalk.inverse(chalk.bold(chalk.cyan(` Locale: ${locale} `)))}
              ${Object.keys(translations).length > 0 ?
                  '\n Messages file founded. Updating file' : '\n No translations founded. Creating a new messages file'}`);
              writeTranslationFile(`${options.directory}/pages/${i.path}`, { ...messages }, locale);
            }
          });

          Object.values(namespaces).forEach((i: any) => {
            if (i.elements.length > 0) {
              const messages = manageTranslatableContent(i.elements, {});
              writeTranslationFile(`${options.directory}/namespaces/${i.path}`, { ...messages }, locale);
            }
          });


        }
        catch (e) {
          return callback(e);
        }
        callback();
      }, err => {
        if (err) logger.fatal(err.message);
        logger.info(`NX I18n Statistics`);
        logger.log(table);
        logger.fatal(`Locales were save at: ${options.directory}`);
      });
      return { success: true };
    }
    default:
      logger.error("The current framework is not supported by I18n Nx");
      return { success: false };
  }
}


export default async function runExecutor(options: BuildExecutorSchema, context: TargetContext) {
  if (options.locales.length === 0) {
    logger.error('No locales defined!');
    logger.error(`Add 'locales' to the i18n configuration for the project.`);
  } else {
    options.locales = [...new Set(options.locales)];
    await extractor(options, context)
  }
}
