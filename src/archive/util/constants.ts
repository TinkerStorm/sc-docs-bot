import { ApplicationCommandType } from "slash-create";

export const SC_RED = 15929905; // color for #F31231
export const ONE_HOUR = 1000 * 60 * 60;

export const standardObjects = {
  Object: "Object",
  [typeof {}]: "Object",
  Function: "Function",
  [typeof (() => { })]: "Function",
  Boolean: "Boolean",
  [typeof true]: "Boolean",
  Symbol: "Symbol",
  [typeof Symbol()]: "Symbol",
  Error: "Error",
  RangeError: "RangeError",
  SyntaxError: "SyntaxError",
  TypeError: "TypeError",
  Number: "Number",
  // biome-ignore lint/style/useNumberNamespace: <explanation>
  [typeof Infinity]: "Number",
  BigInt: "BigInt",
  [typeof 1337n]: "BigInt",
  Date: "Date",
  String: "String",
  [typeof "slash-create"]: "String",
  RegExp: "RegExp",
  Array: "Array",
  Map: "Map",
  Set: "Set",
  Promise: "Promise",
};

export const commandTypeStrings = {
  [ApplicationCommandType.CHAT_INPUT]: ["Chat Input", "/"],
  [ApplicationCommandType.MESSAGE]: ["Message", "*"],
  [ApplicationCommandType.USER]: ["User", "@"],
} as const;
