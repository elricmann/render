// Copyright (c) 2024 Elric Neumann. All rights reserved. MIT license.
import {
  OPCODE_CREATE_ELEMENT,
  OPCODE_SET_ATTRIBUTE,
  OPCODE_TEXT_NODE,
} from "./vm";

/**
 * Applies instruction-level patching of bytecodes
 * while iterating through strings and other structures
 *
 * @param prevBytecode old bytecode instance
 * @param nextBytecode new bytecode instance
 * @returns patched bytecode after merging
 */
export function patch(
  prevBytecode: Uint8Array,
  nextBytecode: Uint8Array
): Uint8Array {
  const patchedBytecode: number[] = [];

  let prevIndex = 0;
  let nextIndex = 0;

  while (prevIndex < prevBytecode.length && nextIndex < nextBytecode.length) {
    const prevOpcode = prevBytecode[prevIndex];
    const nextOpcode = nextBytecode[nextIndex];

    if (prevOpcode === nextOpcode) {
      // same opcode, copy to the patched bytecode
      patchedBytecode.push(nextOpcode);

      switch (nextOpcode) {
        case OPCODE_CREATE_ELEMENT:
          const prevTagNameLength = prevBytecode[prevIndex + 1];
          const nextTagNameLength = nextBytecode[nextIndex + 1];

          // if tag names are the same, copy each over
          if (prevTagNameLength === nextTagNameLength) {
            for (let i = 0; i <= nextTagNameLength; i++) {
              patchedBytecode.push(nextBytecode[nextIndex + i]);
            }
          } else {
            // if the tag names differ, use the new tag name
            patchedBytecode.push(nextTagNameLength);

            for (let i = 0; i < nextTagNameLength; i++) {
              patchedBytecode.push(nextBytecode[nextIndex + 2 + i]);
            }
          }

          prevIndex += prevTagNameLength + 2;
          nextIndex += nextTagNameLength + 2;

          break;

        case OPCODE_SET_ATTRIBUTE:
          // force same idx on both old and new attributes
          const prevAttrLength = prevBytecode[prevIndex + 1];
          const nextAttrLength = nextBytecode[nextIndex + 1];

          // copy the attribute setting operation from the new bytecode
          patchedBytecode.push(nextAttrLength);

          for (let i = 0; i < nextAttrLength; i++) {
            patchedBytecode.push(nextBytecode[nextIndex + 2 + i]);
          }

          prevIndex += prevAttrLength + 2;
          nextIndex += nextAttrLength + 2;

          break;

        case OPCODE_TEXT_NODE:
          // compare text content, and patch if different
          const prevTextLength = prevBytecode[prevIndex + 1];
          const nextTextLength = nextBytecode[nextIndex + 1];

          if (prevTextLength === nextTextLength) {
            for (let i = 0; i < nextTextLength; i++) {
              patchedBytecode.push(nextBytecode[nextIndex + 2 + i]);
            }
          } else {
            patchedBytecode.push(nextTextLength);

            for (let i = 0; i < nextTextLength; i++) {
              patchedBytecode.push(nextBytecode[nextIndex + 2 + i]);
            }
          }

          prevIndex += prevTextLength + 2;
          nextIndex += nextTextLength + 2;

          break;

        default:
          prevIndex++;
          nextIndex++;

          break;
      }
    } else {
      // if the opcodes differ, use the new one (representing the diff)
      patchedBytecode.push(nextOpcode);
      nextIndex++; // move to the next opcode in new bytecode
    }
  }

  // if there are leftover new bytecodes, add them to patched
  while (nextIndex < nextBytecode.length) {
    patchedBytecode.push(nextBytecode[nextIndex++]);
  }

  return new Uint8Array(patchedBytecode);
}
