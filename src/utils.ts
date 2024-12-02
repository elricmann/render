// Copyright (c) 2024 Elric Neumann. All rights reserved. MIT license.
import { VirtualMachine } from "./vm";

export const increment = (() => {
  let count = 0;

  return () => {
    count += 1;

    return count;
  };
})();

export function charCodes(...args: string[]): number[] {
  const acc: number[] = [],
    argslen = args.length;

  for (let i = 0; i < argslen; i++) {
    const str = args[i],
      strlen = str.length;

    for (let j = 0; j < strlen; j++) {
      acc.push(str.charCodeAt(j));
    }
  }

  return acc;
}

export function decodeString(vm: VirtualMachine, length: number): string {
  let acc = "";

  for (let i = 0; i < length; i++) {
    const charCode = vm.pop(); // pop from stack, not memory
    acc += String.fromCharCode(charCode);
  }

  return acc;
}
