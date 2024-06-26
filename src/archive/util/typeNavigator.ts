import { filter } from "fuzzy";

import type { AnyStructureDescriptor, DocumentationRoot } from "./metaTypes";

const exclusionRegex = /(?:^_|\[|\])/;
const targetURI =
  "https://raw.githubusercontent.com/Snazzah/slash-create/docs/latest.json";

interface TypeMap {
  class: { [className: string]: number };
  event: { [eventName: string]: [classIndex: number, eventIndex: number] };
  method: { [methodKey: string]: [number, number] };
  prop: { [memberKey: string]: [number, number] };
  typedef: { [typeName: string]: number };
  all: { [keyName: string]: Exclude<keyof TypeMap, "all"> };
}

export default class TypeNavigator {
  constructor() {
    throw new Error("TypeNavigator is a static class.");
  }

  static indexSymbol = Symbol("index");
  static data: DocumentationRoot;
  static typeMap: TypeMap;
  static knownFiles: string[] = [];

  static knownSymbols = { METHOD: "#", PROP: "~", EVENT: "$" };

  static get classes() {
    return this.data.classes;
  }

  static get meta() {
    return this.data.meta;
  }

  static getClassDescriptor(className: string) {
    const classIndex = this.typeMap.class[className];
    return this.classes[classIndex];
  }

  static getMethodDescriptor(className: string, methodName: string) {
    const resolvedKey = this.joinKey(
      [className, methodName],
      this.knownSymbols.METHOD,
    );
    const [classIndex, methodIndex] = this.typeMap.method[resolvedKey];
    return this.classes[classIndex].methods[methodIndex];
  }

  static getEventDescriptor(className: string, eventName: string) {
    const resolvedKey = this.joinKey(
      [className, eventName],
      this.knownSymbols.EVENT,
    );
    const [classIndex, eventIndex] = this.typeMap.event[resolvedKey];
    return this.classes[classIndex].events[eventIndex];
  }

  static getPropDescriptor(className: string, propName: string) {
    const resolvedKey = this.joinKey(
      [className, propName],
      this.knownSymbols.PROP,
    );
    const [classIndex, propIndex] = this.typeMap.prop[resolvedKey];
    return this.classes[classIndex].props[propIndex];
  }

  static getTypeDescriptor(typeName: string) {
    const typeIndex = this.typeMap.typedef[typeName];
    return this.data.typedefs[typeIndex];
  }

  /**
   * Autocomplete queries have a uniform query handler meaning typeName is never specified until the main command is run.
   * To work around this, the entry path can be provided as an array of strings - then filter out the null values before joining them with the {@param connector}.
   * This does result in some unnecessary repititions of 'key resolving' to ensure the accessor is both valid and existing within the target container.
   */
  static joinKey = (entryPath: string[], connector: string) =>
    entryPath.filter(Boolean).join(connector);

  static findFirstMatch(
    className: string,
    typeName?: string,
  ): AnyStructureDescriptor {
    for (const connector of Object.values(this.knownSymbols)) {
      const assumedKey = this.joinKey([className, typeName], connector);
      const entityType = this.typeMap.all[assumedKey];

      switch (entityType) {
        case undefined:
        case null:
          continue;
        case "class":
          return this.getClassDescriptor(className);
        case "event":
          return this.getEventDescriptor(className, typeName);
        case "method":
          return this.getMethodDescriptor(className, typeName);
        case "prop":
          return this.getPropDescriptor(className, typeName);
        case "typedef":
          return this.getTypeDescriptor(className);
      }
    }

    return undefined;
  }

  static fuzzyFilter = (
    entityPath: string,
    typeFilter: keyof TypeMap = "all",
    limit = 25,
  ) =>
    filter(entityPath, Object.keys(this.typeMap[typeFilter])).slice(0, limit);

  static registerKnownFile(path: string | string[]) {
    const [filePath] = (Array.isArray(path) ? path.join("/") : path).split("#");
    if (!filePath.startsWith("src")) return;
    if (!this.knownFiles.includes(filePath)) this.knownFiles.push(filePath);
  }

  static {
    fetch(targetURI).then(async (res) => {
      this.data = (await res.json()) as DocumentationRoot;
      this.generateTypeMap();
    });
  }

  static generateTypeMap() {
    this.typeMap = {
      class: {},
      event: {},
      method: {},
      typedef: {},
      prop: {},
      all: {},
    };

    for (const [classIndex, classEntry] of this.data.classes.entries()) {
      this.typeMap.class[classEntry.name] = classIndex;
      this.typeMap.all[classEntry.name] = "class";
      this.registerKnownFile([classEntry.meta.path, classEntry.meta.file]);

      if (classEntry.events) {
        for (const [eventIndex, eventEntry] of classEntry.events.entries()) {
          const key = `${classEntry.name}$${eventEntry.name}`;
          this.typeMap.event[key] = [classIndex, eventIndex];
          this.typeMap.all[key] = "event";
          this.registerKnownFile([eventEntry.meta.path, eventEntry.meta.file]);
        }
      }

      if (classEntry.methods) {
        for (const [methodIndex, methodEntry] of classEntry.methods.entries()) {
          const shouldSkip = exclusionRegex.test(methodEntry.name);
          const key = `${classEntry.name}#${methodEntry.name}`;
          if (!shouldSkip) {
            this.typeMap.method[key] = [classIndex, methodIndex];
            this.typeMap.all[key] = "method";
          }
          this.registerKnownFile([
            methodEntry.meta.path,
            methodEntry.meta.file,
          ]);
        }
      }

      if (classEntry.props) {
        for (const [propIndex, propEntry] of classEntry.props.entries()) {
          const shouldSkip = exclusionRegex.test(propEntry.name);
          const key = `${classEntry.name}~${propEntry.name}`;
          if (!shouldSkip) {
            this.typeMap.prop[key] = [classIndex, propIndex];
            this.typeMap.all[key] = "prop";
          }
          this.registerKnownFile([propEntry.meta.path, propEntry.meta.file]);
        }
      }
    }

    for (const [typeIndex, typeEntry] of this.data.typedefs.entries()) {
      this.typeMap.typedef[typeEntry.name] = typeIndex;
      this.typeMap.all[typeEntry.name] = "typedef";
      this.registerKnownFile([typeEntry.meta.path, typeEntry.meta.file]);
    }
  }
}
