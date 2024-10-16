// @ts-ignore
// import * as render from "librender";
import {
  VirtualMachine,
  OPCODE_CREATE_ELEMENT,
  OPCODE_SET_ATTRIBUTE,
  OPCODE_APPEND_CHILD,
  OPCODE_TEXT_NODE,
  charCodes,
  OPCODE_NOP,
} from "./";

const bytecode = new Uint8Array([
  OPCODE_CREATE_ELEMENT,
  3,
  ...charCodes("div"),
  // OPCODE_APPEND_CHILD, // ----> must fail
  OPCODE_SET_ATTRIBUTE,
  3,
  ...charCodes("id"),
  OPCODE_NOP,
  1,
  ...charCodes("1"),
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

const vm = new VirtualMachine(bytecode);
vm.run();

console.log(vm, bytecode);
