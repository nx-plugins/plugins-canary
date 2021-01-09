import {
  BuilderContext,
  createBuilder,
} from '@angular-devkit/architect';
import { from, Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ExtractBuilderSchema } from './schema';
import { getWorkspaceGraph, extractElementsByTagInFiles, getNodesFiles, getProjectDeps, getProjectDepsFiles, getTranslations, managePlural, manageTrans, writeTranslationFile } from '../../utils';
import { ProjectGraph } from '@nrwl/workspace/src/core/project-graph';
import { Frameworks } from '../../frameworks';


export function runBuilder(
  options: ExtractBuilderSchema,
  context: BuilderContext
): Observable<any> {

  if (options.locales.length === 0) {
    context.logger.error('No locales defined!');
    context.logger.error(`Add 'locales' to the i18n configuration for the project.`);
  } else {
    from(extractor(options, context))
  }

  // const projects = Object.values(graph.nodes) as ProjectGraphNode[];
  // projects.sort((a, b) => {
  //   return a.name.localeCompare(b.name);
  // });
  // context.logger.info(JSON.stringify(graph));
  // context.logger.info(JSON.stringify(projects));

  return of({ success: true }).pipe(
    tap(() => {
      context.logger.warn(`i18n Nx extract run successfully`);
    })
  );
}

async function extractor(options: ExtractBuilderSchema, context: BuilderContext) {
  switch (options.framework) {
    case (Frameworks.React): {
      context.logger.warn(`Project: ${context.target.project}`);
      context.logger.warn(`Framework: ${options.framework}`);

      const depGraph = getWorkspaceGraph() as ProjectGraph;
      const projectDeps = getProjectDeps(depGraph, context.target.project);
      const appTsxFiles = getNodesFiles(depGraph, context.target.project, '.tsx', '.spec');
      const projectDepsTsxFiles = getProjectDepsFiles(depGraph, projectDeps, '.tsx', '.spec').flat();
      const transUnitsApp = extractElementsByTagInFiles('transunit', appTsxFiles);
      const transUnitsProjectDeps = extractElementsByTagInFiles('transunit', projectDepsTsxFiles);
      const pluralsApp = extractElementsByTagInFiles('plural', appTsxFiles);
      const pluralsProjectsDeps = extractElementsByTagInFiles('plural', projectDepsTsxFiles);

      const AppResume = appTsxFiles.map((a, index) => ({
        file: a.file,
        transUnits: Object.keys(transUnitsApp[index]).length,
        plurals: Object.keys(pluralsApp[index]).length,

      })
      ).reduce((acc, { file, ...x }) => { acc[file] = x; return acc }, {})

      const DepsResume = projectDepsTsxFiles.map((a, index) => ({
        file: a.file,
        transUnits: Object.keys(transUnitsProjectDeps[index]).length,
        plurals: Object.keys(pluralsProjectsDeps[index]).length,
      })
      ).reduce((acc, { file, ...x }) => { acc[file] = x; return acc }, {})


      options.locales.map((locale) => {
        context.logger.warn(`Extracting messages for locale: ${locale}`);

        try {
          const translations = getTranslations(options.directory, locale);
          context.logger.info(translations ? `No translations founded. Creating a new messages file` : `Translations founded. Updating messages file`);
          const translationsUnitsApp = manageTrans(transUnitsApp, translations);
          const translationsUnitsProjectDeps = manageTrans(transUnitsProjectDeps, translations);
          const translationsPluralsApp = managePlural(pluralsApp, translations);
          const translationsPluralsProjectsDeps = managePlural(pluralsProjectsDeps, translations);
          writeTranslationFile(options.directory, { ...translationsUnitsApp, ...translationsUnitsProjectDeps, ...translationsPluralsApp, ...translationsPluralsProjectsDeps }, locale);
          context.logger.fatal(`Locales were save at: ${options.directory}/messages.${locale}.json`);
        }
        catch (e) {
          context.logger.error(e.message);
          context.logger.error(`Please check that the file is not empty or contains some syntax errors`);

        }
      });
      context.logger.warn(`I18n Statistics`);
      console.table({ ...AppResume, ...DepsResume });
      return { success: true };
    }
    default:
      context.logger.error("The current framework is not supported by I18n Nx");
      return { success: false };
  }
}



export default createBuilder(runBuilder);
