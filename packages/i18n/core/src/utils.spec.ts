import { getTranslations } from './utils';
import * as fileUtils from '@nrwl/workspace/src/utils/fileutils';
import * as workspace from '@nrwl/workspace';

jest.mock('@nrwl/workspace/src/utils/fileutils');
jest.mock('@nrwl/workspace');

describe.only("Utils", () => {
    it('should call fileExist with the right parameters', ()=>{
        const fileExistsSpy = spyOn(fileUtils, 'fileExists').and.returnValue(false);
        getTranslations("i18n", "en");
        expect(fileExistsSpy).toHaveBeenCalledWith(`i18n/messages.en.json`);
    });

    it('should call readJsonFile with the right parameters', ()=>{
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