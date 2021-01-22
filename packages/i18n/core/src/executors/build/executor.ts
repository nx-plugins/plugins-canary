import { BuildExecutorSchema } from './schema';
import {
  getWorkspaceGraph,
  extractTranslateElements,
  getProjectDeps,
  getProjectsFiles,
  extractElementsWithDependencies,
  generateStatistics,
  writeAppMessagesFile,
  writeNamespacesMessagesFile,
} from '../../utils';
import { ProjectGraph } from '@nrwl/workspace/src/core/project-graph';
import { Frameworks } from '../../frameworks';
import { logger, TargetContext } from '@nrwl/devkit';

async function extractor(options: BuildExecutorSchema, context: TargetContext) {
  switch (options.framework) {
    case Frameworks.NextJs:
    case Frameworks.Gatsby: {
      logger.warn(`Project: ${context.projectName}`);
      logger.warn(`Framework: ${options.framework}`);
      
      const namespaces = {};
      const depGraph = getWorkspaceGraph() as ProjectGraph;
      const projectDeps = getProjectDeps(depGraph, context.projectName);
      const projectFiles = getProjectsFiles(depGraph, projectDeps, context.projectName);
      const fileElements = await extractTranslateElements(
        projectFiles,
        depGraph,
        namespaces,
        options
      );
      const elements = extractElementsWithDependencies(fileElements);      
      await Promise.all(writeAppMessagesFile(elements,options.locales, options.directory));

      writeNamespacesMessagesFile(namespaces,options.locales,options.directory);
      generateStatistics(elements, options.directory);

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
