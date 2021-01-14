import { JsonObject } from '@angular-devkit/core';

export interface ExtractBuilderSchema extends JsonObject {
    framework: string;
    directory: string;
    locales: string[];
    verbose: boolean;
} // eslint-disable-line
