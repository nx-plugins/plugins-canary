import { BuildExecutorSchema } from './schema';
import {
  getWorkspaceGraph,
  extractTranslateElements,
  getNodesFiles,
  getProjectDeps,
  getProjectDepsFiles,
  getTranslations,
  writeTranslationFile,
  manageTranslatableContent,
  getWorkspaceScope,
} from '../../utils';
import { ProjectGraph } from '@nrwl/workspace/src/core/project-graph';
import { Frameworks } from '../../frameworks';
import { logger, TargetContext } from '@nrwl/devkit';
import * as chalk from 'chalk';
import * as chalkTable from 'chalk-table';
import { forEachOf } from 'async';
import * as ora from 'ora';

async function extractor(options: BuildExecutorSchema, context: TargetContext) {
  switch (options.framework) {
    case Frameworks.React: {
      const spinner = ora('Extracting messages ').start();
      const chalkOptions = {
        leftPad: 2,
        columns: [
          { field: 'id', name: chalk.cyan('ID') },
          { field: 'type', name: chalk.magenta('Type') },
          { field: 'source', name: chalk.green('Source') },
        ],
      };
      const namespaces = {};
      const statistics = [];

      setTimeout(() => {
        spinner.color = 'yellow';
      }, 1000);

      logger.info(`Project: ${context.projectName}`);
      logger.info(`Framework: ${options.framework}`);

      const depGraph = getWorkspaceGraph() as ProjectGraph;

      const projectDeps = getProjectDeps(depGraph, context.projectName);
      const appFiles = getNodesFiles(depGraph, context.projectName, ['.jsx', '.tsx', '.mdx'], ['.spec']);
      const projectDepsFiles = getProjectDepsFiles(depGraph, projectDeps, ['.jsx', '.tsx', '.mdx'], ['.spec']);
      const response = await extractTranslateElements([...appFiles, ...projectDepsFiles], depGraph, namespaces);
      const elementsApp = response
        .filter((i) => i.type === 'app')
        .map((i) => {
          const { file, project, path, dependencies } = i;
          let finalElements = [...i.elements];
          dependencies.forEach((dep) => {
            finalElements = [
              ...finalElements,
              ...response.find((a) => a.project === dep.target)?.elements,
            ];
          });
          return { file, project, path, elements: finalElements };
        });

      elementsApp.forEach((i) => {
        i.elements.forEach((e) => {
          const { type, file, metadata } = e;
          statistics.push({
            id: metadata.id,
            type,
            source: file,
          });
        });
      });

      forEachOf(
        options.locales,
        (locale, _key, callback) => {
          try {
            const translations = getTranslations(options.directory, locale);
            elementsApp.forEach((i) => {
              if (i.elements.length > 0) {
                const messages = manageTranslatableContent(i.elements, translations);
                console.log(`\n ${chalk.cyan('>')} ${chalk.inverse(
                  chalk.bold(chalk.cyan(` Locale: ${locale} `))
                )}
              ${Object.keys(translations).length > 0
                    ? `\n Messages file founded. Updating file ${options.directory}/pages/${i.path}`
                    : `\n No translations founded. Creating a new messages file ${options.directory}/pages/${i.path}`
                  }`);

                writeTranslationFile(`${options.directory}/pages/${i.path}`, { ...messages }, locale);
              }
            });

            Object.values(namespaces).forEach((i: any) => {
              if (i.elements.length > 0) {
                const messages = manageTranslatableContent(i.elements, {});
                console.log('\n Namespace file founded. Updating file');
                writeTranslationFile(`${options.directory}/namespaces/${i.path}`, { ...messages }, locale);
              }
            });
          } catch (e) {
            return callback(e);
          }
          callback();
        },
        (err) => {
          if (err) logger.fatal(err.message);
          logger.info(`NX I18n Statistics`);
          if (statistics.filter((s) => Object.keys(s).length !== 0).length !== 0) {
            logger.log(chalkTable(chalkOptions, statistics));
            logger.fatal(`Locales were save at: ${options.directory}`);
          } else {
            logger.fatal(`Locales were not generated, please use the <TransUnit>, <Plural> in order to extract the messages`);
          }
        }
      );
      return { success: true };
    }
    default:
      logger.error('The current framework is not supported by I18n Nx');
      return { success: false };
  }
}

export default async function runExecutor(
  options: BuildExecutorSchema,
  context: TargetContext
) {
  if (options.locales.length === 0) {
    logger.error('No locales defined!');
    logger.error(`Add 'locales' to the i18n configuration for the project.`);
  } else {
    options.locales = [...new Set(options.locales)];
    await extractor(options, context);
  }
}
