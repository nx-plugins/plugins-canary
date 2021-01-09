export interface DepGraph {
    graph:            Graph;
    affectedProjects: any[];
    criticalPath:     any[];
}

export interface Graph {
    nodes:        Nodes;
    dependencies: Dependencies[];
}

export interface Dependencies {
    [key:string]: Dependency;
}

export interface Dependency {
    type:   string;
    source: string;
    target: string;
}

export interface Nodes {
    [key:string]: Node;
}

export interface Node {
    name: string;
    type: string;
    data: NodeData;
}

export interface NodeData {
    root:        string;
    sourceRoot:  string;
    projectType: string;
    schematics:  Schematics;
    architect:   Architect;
    tags:        string[];
    files:       NodeFile[];
}

export interface Architect {}
export interface Schematics {}

export interface NodeFile {
    file: any;
    hash: string;
    ext:  string;
}


