// @ts-ignore
// import * as render from "librender";
import {
  VirtualMachine,
  OPCODE_CREATE_ELEMENT,
  OPCODE_SET_ATTRIBUTE,
  OPCODE_APPEND_CHILD,
  OPCODE_TEXT_NODE,
  OPCODE_NOP,
  OPCODE_APPEND_SIBLING,
} from "./vm";
import { patch } from "./patch";
import { View, Text, Container, Button } from "./views";
import { charCodes } from "./utils";

const bytecode = new Uint8Array([
  OPCODE_CREATE_ELEMENT,
  6,
  ...charCodes("button"),
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

  OPCODE_CREATE_ELEMENT,
  6,
  ...charCodes("button"),

  OPCODE_TEXT_NODE,
  7,
  ...charCodes("hello 2"),

  OPCODE_APPEND_CHILD,

  OPCODE_APPEND_SIBLING,

  // ===
  OPCODE_CREATE_ELEMENT,
  3,
  ...charCodes("div"),
  OPCODE_TEXT_NODE,
  7,
  ...charCodes("hello 3"),
  OPCODE_APPEND_CHILD,
]);

// prettier-ignore
// const _app =
//   new View([
//     new Container([
//       new Text("text 1"),
//       new Text("text 2")
//     ]),
//     new Text("text 3"),
//   ]).render()

const _app =
  new Container([
    new Text("text 1"),
    new Text("text 2"),
    new Button("click"),
    new Container([
      new Text("other text 3"),
      new Text("other text 4"),
      new Container([
        new Text("other text 3"),
        new Button("click 2"),
        new Text("other text 4"),
      ]).tagName(Container.SECTION)
    ]).tagName(Container.ASIDE)
  ]).render()

// const vm = new VirtualMachine(bytecode);
const vm = new VirtualMachine(_app);
vm.run();

console.log(vm);

document.getElementById("root")?.appendChild(vm.peek() as HTMLElement);
