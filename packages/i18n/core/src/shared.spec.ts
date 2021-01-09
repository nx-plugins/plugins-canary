import { isUserOldEnough } from './shared';
import { getTranslatableContent, getMessageById } from './shared';

describe("Shared", () => {
    describe("getTranslatableContent", () => {
        it('should return the translatableContent when the value contains all the params', () => {
            expect(getTranslatableContent("Page Header | Header about dolphins @@@ pageHeader"))
                .toEqual({
                    meaning: "Page Header",
                    description: "Header about dolphins",
                    id: "pageHeader"
                });
        });
        it('should return the translatableContent when the value contains the meaning and the id', () => {
            expect(getTranslatableContent("Page Header @@@ pageHeader"))
                .toEqual({
                    meaning: "Page Header",
                    description: "",
                    id: "pageHeader"
                });
        });
        it('should return the translatableContent when the value contains the description and the id', () => {
            expect(getTranslatableContent("| Header about dolphins @@@ pageHeader"))
                .toEqual({
                    meaning: "",
                    description: "Header about dolphins",
                    id: "pageHeader"
                });
        });
        it('should return the translatableContent when the value contains only the id', () => {
            expect(getTranslatableContent(" @@ pageHeader"))
                .toEqual({
                    meaning: "",
                    description: "",
                    id: "pageHeader"
                });

            expect(getTranslatableContent("|@@ pageHeader"))
                .toEqual({
                    meaning: "",
                    description: "",
                    id: "pageHeader"
                });
        });
        it('should return empty when the value is not in the correct format', () => {
            expect(getTranslatableContent("pageHeader"))
                .toEqual({
                    meaning: "",
                    description: "",
                    id: ""
                });

            expect(getTranslatableContent("@"))
                .toEqual({
                    meaning: "",
                    description: "",
                    id: ""
                });

            expect(getTranslatableContent("|"))
                .toEqual({
                    meaning: "",
                    description: "",
                    id: ""
                });

            expect(getTranslatableContent("|"))
                .toEqual({
                    meaning: "",
                    description: "",
                    id: ""
                });
        });
        it('should return the translatableContent when the value is empty', () => {
            expect(getTranslatableContent(""))
                .toEqual({
                    meaning: "",
                    description: "",
                    id: ""
                });
        });
    });

    describe("getMessageById", () => {
        it("should return message not found if the config does not includes messages", () => {
            expect(getMessageById("pageHeader", {})).toEqual("Not found");
            expect(getMessageById("pageHeader", { messages: {} })).toEqual("Not found");
        });

        it('should return message not found if the messages does not includes the translation', () => {
            expect(getMessageById("pageHeader", {
                current: "en",
                messages: {
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
            })).toEqual("Not found");

        });
        it('should return the correct translation if the messages exist', () => {
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
            expect(getMessageById("pageFooter", {
                current: "en",
                messages 
            })).toEqual(messages.en.pageFooter);

        });
    });
});

describe('Unit test for userAge', () => {
    test('Age above voting age', () => {
        let user = {
            name: "TestUser",
            age: "20"
        }
        let ageResult = isUserOldEnough(user)
        expect(ageResult).toEqual(true)
    })
    test('Age euqals voting age', () => {
        let user = {
            name: "TestUser",
            age: "18"
        }
        let ageResult = isUserOldEnough(user)
        expect(ageResult).toEqual(true)
    })
    test('Age below voting age', () => {
        let user = {
            name: "TestUser",
            age: "9"
        }
        let ageResult = isUserOldEnough(user)
        expect(ageResult).toEqual(false)
    })
})