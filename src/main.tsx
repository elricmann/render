// @ts-ignore
// import * as render from "librender";
import {
  VirtualMachine,
  OPCODE_CREATE_ELEMENT,
  OPCODE_SET_ATTRIBUTE,
  OPCODE_APPEND_CHILD,
  OPCODE_TEXT_NODE,
  charCodes,
} from "./";

const vmProgram = new Uint8Array([
  OPCODE_CREATE_ELEMENT,
  3,
  ...charCodes("div"),
  // OPCODE_APPEND_CHILD,
  // OPCODE_SET_ATTRIBUTE,
  // 4,
  // "i".charCodeAt(0),
  // "d".charCodeAt(0),
  // "1".charCodeAt(0),
  // OPCODE_APPEND_CHILD,
  // OPCODE_TEXT_NODE,
  // 5,
  // "H".charCodeAt(0),
  // "e".charCodeAt(0),
  // "l".charCodeAt(0),
  // "l".charCodeAt(0),
  // "o".charCodeAt(0),
  // OPCODE_APPEND_CHILD,
]);

const vm = new VirtualMachine(vmProgram);
vm.run();

console.log(vm);
