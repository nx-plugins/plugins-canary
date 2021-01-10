import { getTranslationById, getTranslations, getWorkspaceGraph } from './utils';
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

    describe('getWorkspaceGraph', ()=>{
        it('should call createProjectGraph and onlyWorkspaceProjects', ()=>{
            const createProjectGraphSpy = spyOn(projectGraph, 'createProjectGraph').and.returnValue({});
            const onlyWorkspaceProjectsSpy = spyOn(projectGraph, 'onlyWorkspaceProjects');

            getWorkspaceGraph();

            expect(createProjectGraphSpy).toHaveBeenLastCalledWith();
            expect(onlyWorkspaceProjectsSpy).toHaveBeenLastCalledWith({});

        })
    });
});