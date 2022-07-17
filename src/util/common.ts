export const SC_RED = 15929905; // color for #F31231

export const titleCase = (input: string) => input.charAt(0).toUpperCase() + input.slice(1);

export const standardObjects = {
  Object: 'Object',
  [typeof {}]: 'Object',
  Function: 'Function',
  [typeof function () {}]: 'Function',
  Boolean: 'Boolean',
  [typeof true]: 'Boolean',
  Symbol: 'Symbol',
  [typeof Symbol()]: 'Symbol',
  Error: 'Error',
  RangeError: 'RangeError',
  SyntaxError: 'SyntaxError',
  TypeError: 'TypeError',
  Number: 'Number',
  [typeof Infinity]: 'Number',
  BigInt: 'BigInt',
  [typeof 1337n]: 'BigInt',
  Date: 'Date',
  String: 'String',
  [typeof 'slash-create']: 'String',
  RegExp: 'RegExp',
  Array: 'Array',
  Map: 'Map',
  Set: 'Set',
  Promise: 'Promise'
};
