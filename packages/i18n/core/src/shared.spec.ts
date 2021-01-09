import { getTranslatableContent } from './shared';

describe("Shared", ()=>{
    describe("getTranslatableContent", ()=> {
        it('should return the translatableContent when the value contains all the params', ()=>{
            expect(getTranslatableContent("Page Header | Header about dolphins @@@ pageHeader"))
            .toEqual({
                meaning: "Page Header",
                description: "Header about dolphins",
                id: "pageHeader"
            });
        });
        it('should return the translatableContent when the value contains the meaning and the id', ()=>{
            expect(getTranslatableContent("Page Header @@@ pageHeader"))
            .toEqual({
                meaning: "Page Header",
                description: "",
                id: "pageHeader"
            });
        });
        it('should return the translatableContent when the value contains the description and the id', ()=>{
            expect(getTranslatableContent("| Header about dolphins @@@ pageHeader"))
            .toEqual({
                meaning: "",
                description: "Header about dolphins",
                id: "pageHeader"
            });
        });
        it('should return the translatableContent when the value contains only the id', ()=>{
            expect(getTranslatableContent(" @@@ pageHeader"))
            .toEqual({
                meaning: "",
                description: "",
                id: "pageHeader"
            });
        });
        it('should return empty when the value is not in the correct format', ()=>{
            expect(getTranslatableContent("pageHeader"))
            .toEqual({
                meaning: "",
                description: "",
                id: ""
            });
        });

        it('should return the translatableContent when the value is empty', ()=>{
            expect(getTranslatableContent(""))
            .toEqual({
                meaning: "",
                description: "",
                id: ""
            });
        });
    });
});