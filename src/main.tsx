// @ts-ignore
// import * as render from "librender";
import {
  VirtualMachine,
  OPCODE_CREATE_ELEMENT,
  OPCODE_SET_ATTRIBUTE,
  OPCODE_APPEND_CHILD,
  OPCODE_TEXT_NODE,
  OPCODE_NOP,
} from "./";
import { View, Container } from "./view";
import { charCodes } from "./utils";

const bytecode = new Uint8Array([
  OPCODE_CREATE_ELEMENT,
  3,
  ...charCodes("div"),
  // OPCODE_APPEND_CHILD, // ----> must fail
  // =======================================

  // =======================================
  OPCODE_SET_ATTRIBUTE,
  3,
  ...charCodes("id"),
  OPCODE_NOP,
  1,
  ...charCodes("1"),
  // =======================================

  // =======================================
  OPCODE_TEXT_NODE,
  5,
  ...charCodes("hello"),
  // =======================================

  OPCODE_APPEND_CHILD,
]);

const vm = new VirtualMachine(bytecode);
vm.run();

const view1 = new View();
const view2 = new View();
const container = new Container([view1, view2]);
console.log({ out: container.render() });

console.log(vm);
console.table({ bytecode });

document
  .getElementById("root")
  ?.appendChild(vm.elementMap.get(0) as HTMLElement);
