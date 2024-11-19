// @ts-nocheck
// import * as render from "librender";
import {
  __eventStore,
  VirtualMachine,
  OPCODE_CREATE_ELEMENT,
  OPCODE_SET_ATTRIBUTE,
  OPCODE_APPEND_CHILD,
  OPCODE_TEXT_NODE,
  OPCODE_NOP,
  OPCODE_APPEND_SIBLING,
  OPCODE_EVENT_LISTENER,
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
  OPCODE_TEXT_NODE,
  5,
  ...charCodes("hello"),
  // =======================================

  // =======================================
  OPCODE_SET_ATTRIBUTE,
  3,
  ...charCodes("id"),
  OPCODE_NOP,
  1,
  ...charCodes("1"),

  OPCODE_EVENT_LISTENER,
  5,
  ...charCodes("click"),
  0x1,

  OPCODE_APPEND_CHILD, // <-------- defer append child instruction after attribute

  OPCODE_CREATE_ELEMENT,
  6,
  ...charCodes("button"),

  OPCODE_TEXT_NODE,
  7,
  ...charCodes("hello 2"),

  OPCODE_APPEND_CHILD,

  OPCODE_APPEND_SIBLING,

  // // ===
  // OPCODE_CREATE_ELEMENT,
  // 3,
  // ...charCodes("div"),
  // OPCODE_TEXT_NODE,
  // 7,
  // ...charCodes("hello 3"),
  // OPCODE_APPEND_CHILD,
]);

// prettier-ignore
const _app = new Container([
  new Container([ // <h3>
    new Text("librender tests")
  ]).tagName(Container.H3),
  new Text("text 1"),
  new Text("text 2"),
  new Button("click")
    .click(() => console.log("clicked 1")),
  new Container([ // <pre>
    new Text("const n = 0;")
  ]).tagName(Container.PRE),
  new Container([ // <aside>
    new Text("other text 3"),
    new Text("other text 4"),
    new Container([ // <section>
      new Text("other text 3"),
      new Button("click 2")
        .attr("id", "btn")
        .attr("style", "border: 0; padding: 5px 8px; border-radius: 3px; font-weight: bold;")
        .click(() => console.log("clicked 2")),
      new Text("other text 4"),
    ]).tagName(Container.SECTION).attr("style", "background-color: #ffea9a;"),
  ]).tagName(Container.ASIDE).attr("style", "font-family: sans-serif"),
]).render();

// __eventStore.set(0x1, () => console.log("clicked!"));

// const vm = new VirtualMachine(bytecode);
const vm = new VirtualMachine(_app);
vm.run();

// console.log(vm, __eventStore);

const App = () => {
  return (
    <div>
      hello <span>world</span>
    </div>
  );
};

const _vm = new VirtualMachine(App().render());
_vm.run();

console.log(_vm.peek());

document.getElementById("root")?.appendChild(_vm.peek() as HTMLElement);
