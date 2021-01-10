import { getNodesFiles, getProjectDeps, getProjectDepsFiles, getTranslationById, getTranslations, getWorkspaceGraph } from './utils';
import * as fileUtils from '@nrwl/workspace/src/utils/fileutils';
import * as workspace from '@nrwl/workspace';
import * as projectGraph from '@nrwl/workspace/src/core/project-graph';

jest.mock('@nrwl/workspace/src/utils/fileutils');
jest.mock('@nrwl/workspace/src/core/project-graph');
jest.mock('@nrwl/workspace');

describe("Utils", () => {
    describe('getTranslations', () => {
        it('should call fileExist with the right parameters', () => {
            const fileExistsSpy = spyOn(fileUtils, 'fileExists').and.returnValue(false);
            getTranslations("i18n", "en");
            expect(fileExistsSpy).toHaveBeenCalledWith(`i18n/messages.en.json`);
        });
        it('should call readJsonFile with the right parameters', () => {
            const readJSONFileSpy = spyOn(workspace, 'readJsonFile').and.returnValue({});
            spyOn(fileUtils, 'fileExists').and.returnValue(true);

            getTranslations("i18n", "en");
            expect(readJSONFileSpy).toHaveBeenCalledWith(`i18n/messages.en.json`);
        });
        it('should return the translations', () => {
            const messages = {
                "en": {
                    "pageFooter": {
                        "id": "pageFooter",
                        "description": "Footer about dolphins",
                        "intent": "Page Footer",
                        "source": "apps/i18n/pages/inbox.tsx",
                        "type": "TransUnit",
                        "target": "Welcome to the dolphins world !"
                    }
                }
            }
            spyOn(fileUtils, 'fileExists').and.returnValue(true);
            spyOn(workspace, 'readJsonFile').and.returnValue(messages);
            expect(getTranslations("i18n", "en")).toEqual(messages);
        });
        it('should return an error because the file exist but contains errors ', () => {
            spyOn(fileUtils, 'fileExists').and.returnValue(true);
            spyOn(workspace, 'readJsonFile').and.throwError("Cannot parse the file");
            expect(() => { getTranslations("i18n", "en") }).toThrowError(`Cannot read the messages translation file located at : i18n/messages.en.json.`);
        });
        it('should return empty because the path file does not exist ', () => {
            spyOn(fileUtils, 'fileExists').and.returnValue(false);
            expect(getTranslations("i18n", "en")).toEqual({});
        });
    });
    describe('getTranslationById', () => {
        it('should return the translation by Id', () => {
            const messages = {
                "pageFooter": {
                    "id": "pageFooter",
                    "description": "Footer about dolphins",
                    "intent": "Page Footer",
                    "source": "apps/i18n/pages/inbox.tsx",
                    "type": "TransUnit",
                    "target": "Welcome to the dolphins world !"
                }
            };

            expect(getTranslationById(messages, "pageFooter")).toMatchObject(messages.pageFooter);
        });
        it('should return null if the translation is not founded', () => {
            const messages = {
                "pageFooter": {
                    "id": "pageFooter",
                    "description": "Footer about dolphins",
                    "intent": "Page Footer",
                    "source": "apps/i18n/pages/inbox.tsx",
                    "type": "TransUnit",
                    "target": "Welcome to the dolphins world !"
                }
            };

            expect(getTranslationById(messages, "pageHeader")).toEqual(null);
        });

        it('should return null if translations are empty', () => {
            expect(getTranslationById({}, "pageHeader")).toEqual(null);
        });
    });

    describe('getWorkspaceGraph', () => {
        it('should call createProjectGraph and onlyWorkspaceProjects', () => {
            const createProjectGraphSpy = spyOn(projectGraph, 'createProjectGraph').and.returnValue({});
            const onlyWorkspaceProjectsSpy = spyOn(projectGraph, 'onlyWorkspaceProjects');

            getWorkspaceGraph();

            expect(createProjectGraphSpy).toHaveBeenLastCalledWith();
            expect(onlyWorkspaceProjectsSpy).toHaveBeenLastCalledWith({});

        })
    });

    describe('getProjectDeps', () => {
        it('should return the project', () => {
            const depGraph = {
                "nodes": {
                    "sample-app": {
                        "name": "sample-app",
                        "type": "app",
                        "data": {
                            "root": "apps/sample-app",
                            "sourceRoot": "apps/sample-app",
                            "projectType": "application",
                            "schematics": {},
                            "architect": {

                            },
                            "tags": [],
                            "files": []
                        }
                    }
                },
                "dependencies": {
                    "sample-app-e2e": [
                        {
                            "type": "implicit",
                            "source": "sample-app-e2e",
                            "target": "sample-app"
                        }
                    ],
                    "sample-app": [
                    ]
                }
            };

            expect(getProjectDeps(depGraph, 'sample-app')).toMatchObject(depGraph.dependencies['sample-app']);
        });
    });

    describe('getNodesFiles', () => {
        it('should return the files', () => {
            const depGraph = {
                "nodes": {
                    "sample-app": {
                        "name": "sample-app",
                        "type": "app",
                        "data": {
                            "root": "apps/sample-app",
                            "sourceRoot": "apps/sample-app",
                            "projectType": "application",
                            "schematics": {},
                            "architect": {

                            },
                            "tags": [],
                            "files": [
                                {
                                    "file": "libs/sample-app/README.md",
                                    "hash": "6124d290bd8110366a3d490c9bc17cfe5ccb761a",
                                    "ext": ".spec.ts"
                                },
                                {
                                    "file": "libs/sample-app/src/index.ts",
                                    "hash": "8401411923c163e04554874baae8ee936c09aa64",
                                    "ext": ".ts"
                                },
                                {
                                    "file": "libs/sample-app/src/lib/inbox-messages/inbox-messages.tsx",
                                    "hash": "34a095c968ebcfc757883b7707650dd0e267a2be",
                                    "ext": ".tsx"
                                },
                                {
                                    "file": "libs/sample-app/tsconfig.json",
                                    "hash": "d8eb687121eddfbb13549fcb4f716217dfdddea8",
                                    "ext": ".json"
                                },
                            ]
                        }
                    }
                },
                "dependencies": {
                    "sample-app-e2e": [
                        {
                            "type": "implicit",
                            "source": "sample-app-e2e",
                            "target": "sample-app"
                        }
                    ],
                    "sample-app": [
                    ]
                }
            };

            expect(getNodesFiles(depGraph, 'sample-app', '.tsx', '.spec')).toMatchObject(
                [depGraph.nodes["sample-app"].data.files[2]]
            );
        });
    });

    describe('getProjectDepsFiles', () => {
        it('should return project files', () => {
            const depGraph = {
                "nodes": {
                    "sample-app": {
                        "name": "sample-app",
                        "type": "app",
                        "data": {
                            "root": "apps/sample-app",
                            "sourceRoot": "apps/sample-app",
                            "projectType": "application",
                            "schematics": {},
                            "architect": {

                            },
                            "tags": [],
                            "files": [
                                {
                                    "file": "libs/sample-app/README.md",
                                    "hash": "6124d290bd8110366a3d490c9bc17cfe5ccb761a",
                                    "ext": ".spec.ts"
                                },
                                {
                                    "file": "libs/sample-app/src/index.ts",
                                    "hash": "8401411923c163e04554874baae8ee936c09aa64",
                                    "ext": ".ts"
                                },
                                {
                                    "file": "libs/sample-app/src/lib/inbox-messages/inbox-messages.tsx",
                                    "hash": "34a095c968ebcfc757883b7707650dd0e267a2be",
                                    "ext": ".tsx"
                                },
                                {
                                    "file": "libs/sample-app/tsconfig.json",
                                    "hash": "d8eb687121eddfbb13549fcb4f716217dfdddea8",
                                    "ext": ".json"
                                },
                            ]
                        }
                    },
                    "sample-app-ui": {
                        "name": "sample-app-ui",
                        "type": "lib",
                        "data": {
                            "root": "libs/sample-app-ui",
                            "sourceRoot": "libs/sample-app-ui/src",
                            "projectType": "library",
                            "schematics": {},
                            "architect": {},
                            "tags": [],
                            "files": [
                                {
                                    "file": "libs/sample-app-ui/babel-jest.config.json",
                                    "hash": "bf04d5f81f7c40fce68a2e051f1d4652f7b7c9c9",
                                    "ext": ".json"
                                },
                                {
                                    "file": "libs/sample-app-ui/jest.config.js",
                                    "hash": "b33a2c975c6ffe73a8225b91e2ad04647132b6a3",
                                    "ext": ".js"
                                },
                                {
                                    "file": "libs/sample-app-ui/README.md",
                                    "hash": "6124d290bd8110366a3d490c9bc17cfe5ccb761a",
                                    "ext": ".md"
                                },
                                {
                                    "file": "libs/sample-app-ui/src/index.ts",
                                    "hash": "8401411923c163e04554874baae8ee936c09aa64",
                                    "ext": ".spec.tsx"
                                },
                                {
                                    "file": "libs/sample-app-ui/src/lib/inbox-messages/inbox-messages.tsx",
                                    "hash": "34a095c968ebcfc757883b7707650dd0e267a2be",
                                    "ext": ".tsx"
                                },
                            ]
                        }
                    },
                },
                "dependencies": {
                    "sample-app-e2e": [
                        {
                            "type": "implicit",
                            "source": "sample-app-e2e",
                            "target": "sample-app"
                        }
                    ],
                    "sample-app": [
                        {
                            "type": "static",
                            "source": "sample-app",
                            "target": "sample-app-ui"
                        }
                    ],
                    "sample-app-ui": []
                }
            };

            expect(getProjectDepsFiles(depGraph, [{
                "type": "static",
                "source": "sample-app",
                "target": "sample-app-ui"
            }], '.tsx', '.spec')).toMatchObject(
                [depGraph.nodes["sample-app-ui"].data.files[4]]
            );
        });
    });
});