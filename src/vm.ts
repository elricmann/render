// Copyright (c) 2024 Elric Neumann. All rights reserved. MIT license.
export const OPCODE_CREATE_ELEMENT = 0x01;
export const OPCODE_SET_ATTRIBUTE = 0x02;
export const OPCODE_APPEND_CHILD = 0x03;
export const OPCODE_REMOVE_CHILD = 0x04;
export const OPCODE_REPLACE_CHILD = 0x05;
export const OPCODE_TEXT_NODE = 0x06;
export const OPCODE_SET_TEXT = 0x07;
export const OPCODE_REMOVE_ATTRIBUTE = 0x08;
export const OPCODE_STYLE = 0x09;
export const OPCODE_EVENT_LISTENER = 0x0a;
export const OPCODE_NOP = 0x0b;
export const OPCODE_APPEND_SIBLING = 0x0c;

export type Stack = Int32Array;
export type Memory = Uint8Array;
export type Program = Uint8Array;
// export type ImmutableMap<K, V> = Omit<Map<K, V>, "delete" | "clear">;
export type DOMElement = HTMLElement | Text;
export type DOMAttributes = Record<string, string>;

const isGecko =
  typeof navigator !== "undefined" && /gecko/i.test(navigator.userAgent);

export const __eventStore = new Map<number, () => void>();

export class VirtualMachine {
  pc: number;
  stack: Stack;
  memory: Memory;
  program: Program;
  nodeIndexStack: Map<number, DOMElement>;
  nodeCount: number;

  constructor(program: Program) {
    this.pc = 0;
    this.stack = new Int32Array(1024);
    this.memory = new Uint8Array(1024);
    this.program = program;
    this.nodeIndexStack = new Map();
    this.nodeCount = 0;
  }

  peek(): NonNullable<DOMElement> {
    return this.nodeIndexStack.get(0) as DOMElement;
  }

  push(value: number) {
    this.stack[--this.stack[0]] = value;
  }

  pop(): number {
    return this.stack[this.stack[0]++];
  }

  decodeUTF16String(length: number): string {
    const chars = new Uint8Array(this.memory.buffer, this.stack[0], length);
    this.stack[0] += Math.ceil(length / (1 << 2));
    return String.fromCharCode(...chars);
  }

  run() {
    while (this.pc < this.program.length) {
      const opcode = this.program[this.pc++];
      switch (opcode) {
        case OPCODE_CREATE_ELEMENT:
          this.createElement();
          break;
        case OPCODE_SET_ATTRIBUTE:
          this.setAttribute();
          break;
        case OPCODE_APPEND_CHILD:
          this.appendChild();
          break;
        case OPCODE_APPEND_SIBLING:
          this.appendSibling();
          break;
        case OPCODE_REMOVE_CHILD:
          this.removeChild();
          break;
        case OPCODE_REPLACE_CHILD:
          this.replaceChild();
          break;
        case OPCODE_TEXT_NODE:
          this.createTextNode();
          break;
        case OPCODE_SET_TEXT:
          this.setText();
          break;
        case OPCODE_REMOVE_ATTRIBUTE:
          this.removeAttribute();
          break;
        case OPCODE_STYLE:
          this.setStyle();
          break;
        case OPCODE_EVENT_LISTENER:
          this.setEventListener();
          break;
        default:
          this.pc = this.program.length;
      }
    }
  }

  createElement() {
    const tagNameLength = this.program[this.pc++];
    const tagNameStart = this.pc;
    const tagNameBytes = this.program.slice(
      tagNameStart,
      tagNameStart + tagNameLength
    );

    const tagName = String.fromCharCode(...tagNameBytes);

    this.pc += tagNameLength;

    if (tagName.trim() === "") {
      throw new Error("Invalid tag name");
    }

    const element = document.createElement(tagName);
    const id = this.nodeCount++;

    this.nodeIndexStack.set(id, element);
    this.push(id);
  }

  setAttribute() {
    const attrNameLength = this.program[this.pc++] - 1;
    const attrNameStart = this.pc;
    const attrNameBytes = this.program.slice(
      attrNameStart,
      attrNameStart + attrNameLength
    );

    const attrName = String.fromCharCode(...attrNameBytes);
    this.pc += attrNameLength;

    if (this.program[this.pc++] !== OPCODE_NOP) {
      throw new Error(
        "Expected OPCODE_NOP delimiter between attribute name and value"
      );
    }

    const attrValueLength = this.program[this.pc++];
    const attrValueStart = this.pc;
    const attrValueBytes = this.program.slice(
      attrValueStart,
      attrValueStart + attrValueLength
    );

    const attrValue = String.fromCharCode(...attrValueBytes);
    this.pc += attrValueLength;

    // we use nodeIndexStack to pop off least recent nodes
    // which is why it correlates with a stack (by intent)

    const elementId = this.nodeCount - 2; /* 2nd least recent node */
    const element = this.nodeIndexStack.get(elementId) as HTMLElement;

    // @todo: views may require least recent element to not be the
    // element where the attribute is defined on. check the node type

    if (element) {
      element.setAttribute(attrName, attrValue);
    } else {
      throw new Error("Invalid element ID");
    }
  }

  appendChild() {
    const childId = this.nodeCount - 1;
    const parentId = this.nodeCount - 2;

    const parent = this.nodeIndexStack.get(parentId) as HTMLElement;
    const child = this.nodeIndexStack.get(childId) as HTMLElement | Text;

    if (parent && child) {
      this.nodeIndexStack.delete(childId);

      if (this.nodeCount > 0) {
        this.nodeCount--;
      }

      parent.appendChild(child);
    } else {
      throw new Error("Invalid parent or child element ID");
    }
  }

  appendSibling() {
    const childId = this.nodeCount - 1;
    const parentId = this.nodeCount - 2;
    const insertionPosition = "afterend";

    const parent = this.nodeIndexStack.get(parentId) as HTMLElement;
    const child = this.nodeIndexStack.get(childId) as HTMLElement | Text;

    if (parent && child) {
      this.nodeIndexStack.delete(childId);

      if (this.nodeCount > 0) {
        this.nodeCount--;
      }

      // avoids NoModificationAllowedError on FF which requires
      // skipping a single frame before inserting adjacent nodes/text
      if (child instanceof Text)
        if (isGecko)
          requestAnimationFrame(() =>
            parent.insertAdjacentText(
              insertionPosition,
              (child as Text).textContent as string
            )
          );
        else
          parent.insertAdjacentText(
            insertionPosition,
            (child as Text).textContent as string
          );
      else if (isGecko)
        requestAnimationFrame(() =>
          parent.insertAdjacentElement(insertionPosition, child as HTMLElement)
        );
      else
        parent.insertAdjacentElement(insertionPosition, child as HTMLElement);
    } else {
      throw new Error("Invalid parent or child element ID");
    }
  }

  removeChild() {
    const childId = this.pop();
    const parentId = this.pop();
    const parent = this.nodeIndexStack.get(parentId) as HTMLElement;
    const child = this.nodeIndexStack.get(childId) as HTMLElement;
    parent.removeChild(child);
  }

  replaceChild() {
    const newChildId = this.pop();
    const oldChildId = this.pop();
    const parentId = this.pop();
    const parent = this.nodeIndexStack.get(parentId) as HTMLElement;
    const newChild = this.nodeIndexStack.get(newChildId) as HTMLElement;
    const oldChild = this.nodeIndexStack.get(oldChildId) as HTMLElement;
    parent.replaceChild(newChild, oldChild);
  }

  createTextNode() {
    const textLength = this.program[this.pc++];
    const textStart = this.pc;
    const textBytes = this.program.slice(textStart, textStart + textLength);

    const textContent = String.fromCharCode(...textBytes);
    this.pc += textLength;

    const textNode = document.createTextNode(textContent);
    const id = this.nodeCount++;

    this.nodeIndexStack.set(id, textNode);
    this.push(id); /* push idx of text node onto stack */
  }

  setText() {
    const textLength = this.pop();
    const text = this.decodeUTF16String(textLength);
    const id = this.pop();
    const textNode = this.nodeIndexStack.get(id) as Text;
    textNode.nodeValue = text;
  }

  removeAttribute() {
    const attrNameLength = this.pop();
    const attrName = this.decodeUTF16String(attrNameLength);
    const id = this.pop();
    const element = this.nodeIndexStack.get(id) as HTMLElement;
    element.removeAttribute(attrName);
  }

  // @todo: since inline styles are done via attributes,
  // this may be used for pushing to an external stylesheet

  setStyle() {
    const styleNameLength = this.pop();
    const styleName = this.decodeUTF16String(styleNameLength);
    const styleValueLength = this.pop();
    const styleValue = this.decodeUTF16String(styleValueLength);
    const id = this.pop();
    const element = this.nodeIndexStack.get(id) as HTMLElement;
    element.style[styleName as any] = styleValue;
  }

  setEventListener() {
    const eventTypeLength = this.program[this.pc++];
    const eventTypeChars = new Uint8Array(eventTypeLength);

    for (let i = 0; i < eventTypeLength; i++) {
      eventTypeChars[i] = this.program[this.pc++];
    }

    const eventType = String.fromCharCode(...eventTypeChars);
    const callbackIndex = this.program[this.pc++];
    const node = this.nodeIndexStack.get(this.nodeCount - 2) as HTMLElement;

    node.addEventListener(eventType, () => {
      const callback = __eventStore.get(callbackIndex);

      if (callback) {
        callback();
      }
    });
  }

  runCallback(callbackId: number) {
    this.push(callbackId);
    this.run();
  }
}
