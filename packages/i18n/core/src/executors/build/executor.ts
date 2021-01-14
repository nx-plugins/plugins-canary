
import { from } from 'rxjs';
import { BuildExecutorSchema } from './schema';
import { getWorkspaceGraph, extractTranslateElements, getNodesFiles, getProjectDeps, getProjectDepsFiles, getTranslations, managePlural, manageTrans, writeTranslationFile } from '../../utils';
import { ProjectGraph } from '@nrwl/workspace/src/core/project-graph';
import { Frameworks } from '../../frameworks';
import { logger, TargetContext } from '@nrwl/devkit';


async function extractor(options: BuildExecutorSchema, context: TargetContext) {
  switch (options.framework) {
    case (Frameworks.React): {
      logger.warn(`Project: ${context.projectName}`);
      logger.warn(`Framework: ${options.framework}`);

      const depGraph = getWorkspaceGraph() as ProjectGraph;
      const projectDeps = getProjectDeps(depGraph, context.projectName);
      const appTsxFiles = getNodesFiles(depGraph, context.projectName, '.tsx', '.spec');
      const projectDepsTsxFiles = getProjectDepsFiles(depGraph, projectDeps, '.tsx', '.spec').flat();
      const elementsApp = (extractTranslateElements(appTsxFiles) as any).flat();
      const transUnitsApp = elementsApp.filter((i:any)=> i.type === "TransUnit");
      const pluralsApp = elementsApp.filter((i:any)=> i.type === "Plural")
      const elementsProjectDeps = (extractTranslateElements(projectDepsTsxFiles) as any).flat();
      const transUnitsProjectDeps = elementsProjectDeps.filter((i:any)=> i.type === "TransUnit");
      const pluralsProjectsDeps =  elementsProjectDeps.filter((i:any)=> i.type === "Plural");
      // const AppResume = appTsxFiles.map((a, index) => ({
      //   file: a.file,
      //   transUnits: Object.keys(extractTranslateElements.flat().filter((i)=> i.type === "TransUnit")[index]).length,
      //   plurals: Object.keys(extractTranslateElements[index]).length,

      // })
      // ).reduce((acc, { file, ...x }) => { acc[file] = x; return acc }, {})

      // const DepsResume = projectDepsTsxFiles.map((a, index) => ({
      //   file: a.file,
      //   transUnits: Object.keys(transUnitsProjectDeps[index]).length,
      //   plurals: Object.keys(pluralsProjectsDeps[index]).length,
      // })
      // ).reduce((acc, { file, ...x }) => { acc[file] = x; return acc }, {})


      options.locales.map((locale) => {
        logger.warn(`Extracting messages for locale: ${locale}`);

        try {
          const translations = getTranslations(options.directory, locale);
          logger.info(translations ? `No translations founded. Creating a new messages file` : `Translations founded. Updating messages file`);
          const translationsUnitsApp = manageTrans(transUnitsApp, translations);
          const translationsUnitsProjectDeps = manageTrans(transUnitsProjectDeps, translations);
          const translationsPluralsApp = managePlural(pluralsApp, translations);
          const translationsPluralsProjectsDeps = managePlural(pluralsProjectsDeps, translations);
          writeTranslationFile(options.directory, { ...translationsUnitsApp, ...translationsUnitsProjectDeps, ...translationsPluralsApp, ...translationsPluralsProjectsDeps }, locale);
          logger.fatal(`Locales were save at: ${options.directory}/messages.${locale}.json`);
        }
        catch (e) {
          logger.error(e.message);
          logger.error(`Please check that the file is not empty or contains some syntax errors`);

        }
      });
      logger.warn(`I18n Statistics`);
      // console.table({ ...AppResume, ...DepsResume });
      return { success: true };
    }
    default:
      logger.error("The current framework is not supported by I18n Nx");
      return { success: false };
  }
}


export default async function runExecutor(options: BuildExecutorSchema, context: TargetContext){
  if (options.locales.length === 0) {
    logger.error('No locales defined!');
    logger.error(`Add 'locales' to the i18n configuration for the project.`);
  } else {
    from(extractor(options, context))
  }
}
