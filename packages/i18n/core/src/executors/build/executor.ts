
import { from } from 'rxjs';
import { BuildExecutorSchema } from './schema';
import { getWorkspaceGraph, extractTranslateElements, getNodesFiles, getProjectDeps, getProjectDepsFiles, getTranslations, writeTranslationFile, manageTranslatableContent } from '../../utils';
import { ProjectGraph } from '@nrwl/workspace/src/core/project-graph';
import { Frameworks } from '../../frameworks';
import { logger, TargetContext } from '@nrwl/devkit';
import * as chalk from 'chalk';
import * as chalkTable from 'chalk-table';

async function extractor(options: BuildExecutorSchema, context: TargetContext) {
  switch (options.framework) {
    case (Frameworks.React): {
      logger.info(`Project: ${context.projectName}`);
      logger.info(`Framework: ${options.framework}`);

      const depGraph = getWorkspaceGraph() as ProjectGraph;
      const projectDeps = getProjectDeps(depGraph, context.projectName);
      const appTsxFiles = getNodesFiles(depGraph, context.projectName, '.tsx', '.spec');
      const projectDepsTsxFiles = getProjectDepsFiles(depGraph, projectDeps, '.tsx', '.spec');
      const elementsApp = (extractTranslateElements([...appTsxFiles,...projectDepsTsxFiles]) as any);

      const chalkOptions = {
        leftPad: 2,
        columns: [
          { field: "id", name: chalk.cyan("ID") },
          { field: "type", name: chalk.magenta("Type") },
          { field: "source", name: chalk.green("Source") },
        ]
      };

      ;
      const table = chalkTable(chalkOptions, 
        elementsApp.map((i) => ({
          id: i.metadata.id,
          type: i.type,
          source: i.file.file
        }))
      );

      logger.info(`NX I18n Statistics`);
      logger.log(table);


      options.locales.map((locale) => {
        logger.warn(`Extracting messages for locale: ${locale}`);

        try {
          const translations = getTranslations(options.directory, locale);
          logger.info(translations ? `No translations founded. Creating a new messages file` : `Translations founded. Updating messages file`);
          // const translationsUnitsApp = manageTranslatableContent(transUnitsApp, translations);
          // const translationsUnitsProjectDeps = manageTranslatableContent(transUnitsProjectDeps, translations);
          // const translationsPluralsApp = manageTranslatableContent(pluralsApp, translations);
          // const translationsPluralsProjectsDeps = manageTranslatableContent(pluralsProjectsDeps, translations);
          const messages = manageTranslatableContent(elementsApp, translations)
          writeTranslationFile(options.directory, { ...messages }, locale);
          logger.fatal(`Locales were save at: ${options.directory}/messages.${locale}.json`);
        }
        catch (e) {
          logger.error(e.message);
          logger.error(`Please check that the file is not empty or contains some syntax errors`);

        }
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
    from(extractor(options, context))
  }
}
