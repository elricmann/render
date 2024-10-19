// Copyright (c) 2024 Elric Neumann. All rights reserved. MIT license.
import {
  OPCODE_CREATE_ELEMENT,
  OPCODE_SET_ATTRIBUTE,
  OPCODE_TEXT_NODE,
} from "./vm";

export function patch(
  oldBytecode: Uint8Array,
  newBytecode: Uint8Array
): Uint8Array {
  const patchedBytecode: number[] = [];

  let oldIndex = 0;
  let newIndex = 0;

  while (oldIndex < oldBytecode.length && newIndex < newBytecode.length) {
    const oldOpcode = oldBytecode[oldIndex];
    const newOpcode = newBytecode[newIndex];

    if (oldOpcode === newOpcode) {
      // same opcode, copy to the patched bytecode
      patchedBytecode.push(newOpcode);

      switch (newOpcode) {
        case OPCODE_CREATE_ELEMENT:
          const oldTagNameLength = oldBytecode[oldIndex + 1];
          const newTagNameLength = newBytecode[newIndex + 1];

          // if tag names are the same, copy each over
          if (oldTagNameLength === newTagNameLength) {
            for (let i = 0; i <= newTagNameLength; i++) {
              patchedBytecode.push(newBytecode[newIndex + i]);
            }
          } else {
            // if the tag names differ, use the new tag name
            patchedBytecode.push(newTagNameLength);

            for (let i = 0; i < newTagNameLength; i++) {
              patchedBytecode.push(newBytecode[newIndex + 2 + i]);
            }
          }

          oldIndex += oldTagNameLength + 2;
          newIndex += newTagNameLength + 2;

          break;

        case OPCODE_SET_ATTRIBUTE:
          // force same idx on both old and new attributes
          const oldAttrLength = oldBytecode[oldIndex + 1];
          const newAttrLength = newBytecode[newIndex + 1];

          // copy the attribute setting operation from the new bytecode
          patchedBytecode.push(newAttrLength);

          for (let i = 0; i < newAttrLength; i++) {
            patchedBytecode.push(newBytecode[newIndex + 2 + i]);
          }

          oldIndex += oldAttrLength + 2;
          newIndex += newAttrLength + 2;

          break;

        case OPCODE_TEXT_NODE:
          // compare text content, and patch if different
          const oldTextLength = oldBytecode[oldIndex + 1];
          const newTextLength = newBytecode[newIndex + 1];

          if (oldTextLength === newTextLength) {
            for (let i = 0; i < newTextLength; i++) {
              patchedBytecode.push(newBytecode[newIndex + 2 + i]);
            }
          } else {
            patchedBytecode.push(newTextLength);

            for (let i = 0; i < newTextLength; i++) {
              patchedBytecode.push(newBytecode[newIndex + 2 + i]);
            }
          }

          oldIndex += oldTextLength + 2;
          newIndex += newTextLength + 2;

          break;

        default:
          oldIndex++;
          newIndex++;

          break;
      }
    } else {
      // if the opcodes differ, use the new one (representing the diff)
      patchedBytecode.push(newOpcode);
      newIndex++; // move to the next opcode in new bytecode
    }
  }

  // if there are leftover new bytecodes, add them to patched
  while (newIndex < newBytecode.length) {
    patchedBytecode.push(newBytecode[newIndex++]);
  }

  return new Uint8Array(patchedBytecode);
}
