import { FileData } from "@nrwl/workspace/src/core/file-utils";

export interface ProjectFileBase {
    project: string,
    type: string,
    path: string,
}

export interface ProjectFile extends FileData,ProjectFileBase {}
