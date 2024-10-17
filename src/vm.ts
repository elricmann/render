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
export const OPCODE_APPEND_SIBLING = 99;

export type Stack = Int32Array;
export type Memory = Uint8Array;
export type Program = Uint8Array;
// export type ImmutableMap<K, V> = Omit<Map<K, V>, "delete" | "clear">;
export type DOMElement = HTMLElement | Text;
export type DOMAttributes = Record<string, string>;

const isGecko =
  typeof navigator !== "undefined" && /gecko/i.test(navigator.userAgent);

export class VirtualMachine {
  pc: number;
  stack: Stack;
  memory: Memory;
  program: Program;
  elementMap: Map<number, DOMElement>;
  elementCount: number;

  constructor(program: Program) {
    this.pc = 0;
    this.stack = new Int32Array(1024);
    this.memory = new Uint8Array(1024);
    this.program = program;
    this.elementMap = new Map();
    this.elementCount = 0;
  }

  peek(): NonNullable<DOMElement> {
    return this.elementMap.get(0) as DOMElement;
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
    const id = this.elementCount++;

    this.elementMap.set(id, element);
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

    const elementId = this.elementCount - 1; /* least recent element */
    const element = this.elementMap.get(elementId) as HTMLElement;

    if (element) {
      element.setAttribute(attrName, attrValue);
    } else {
      throw new Error("Invalid element ID");
    }
  }

  appendChild() {
    const childId = this.elementCount - 1;
    const parentId = this.elementCount - 2;

    const parent = this.elementMap.get(parentId) as HTMLElement;
    const child = this.elementMap.get(childId) as HTMLElement | Text;

    if (parent && child) {
      this.elementMap.delete(childId);

      if (this.elementCount > 0) {
        this.elementCount--;
      }

      parent.appendChild(child);
    } else {
      throw new Error("Invalid parent or child element ID");
    }
  }

  appendSibling() {
    const childId = this.elementCount - 1;
    const parentId = this.elementCount - 2;
    const insertionPosition = "afterend";

    const parent = this.elementMap.get(parentId) as HTMLElement;
    const child = this.elementMap.get(childId) as HTMLElement | Text;

    if (parent && child) {
      this.elementMap.delete(childId);

      if (this.elementCount > 0) {
        this.elementCount--;
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
    const parent = this.elementMap.get(parentId) as HTMLElement;
    const child = this.elementMap.get(childId) as HTMLElement;
    parent.removeChild(child);
  }

  replaceChild() {
    const newChildId = this.pop();
    const oldChildId = this.pop();
    const parentId = this.pop();
    const parent = this.elementMap.get(parentId) as HTMLElement;
    const newChild = this.elementMap.get(newChildId) as HTMLElement;
    const oldChild = this.elementMap.get(oldChildId) as HTMLElement;
    parent.replaceChild(newChild, oldChild);
  }

  createTextNode() {
    const textLength = this.program[this.pc++];
    const textStart = this.pc;
    const textBytes = this.program.slice(textStart, textStart + textLength);

    const textContent = String.fromCharCode(...textBytes);
    this.pc += textLength;

    const textNode = document.createTextNode(textContent);
    const id = this.elementCount++;

    this.elementMap.set(id, textNode);
    this.push(id); /* push idx of text node onto stack */
  }

  setText() {
    const textLength = this.pop();
    const text = this.decodeUTF16String(textLength);
    const id = this.pop();
    const textNode = this.elementMap.get(id) as Text;
    textNode.nodeValue = text;
  }

  removeAttribute() {
    const attrNameLength = this.pop();
    const attrName = this.decodeUTF16String(attrNameLength);
    const id = this.pop();
    const element = this.elementMap.get(id) as HTMLElement;
    element.removeAttribute(attrName);
  }

  setStyle() {
    const styleNameLength = this.pop();
    const styleName = this.decodeUTF16String(styleNameLength);
    const styleValueLength = this.pop();
    const styleValue = this.decodeUTF16String(styleValueLength);
    const id = this.pop();
    const element = this.elementMap.get(id) as HTMLElement;
    element.style[styleName as any] = styleValue;
  }

  setEventListener() {
    const eventTypeLength = this.pop();
    const eventType = this.decodeUTF16String(eventTypeLength);
    const id = this.pop();
    const element = this.elementMap.get(id) as HTMLElement;
    const callbackId = this.pop();
    element.addEventListener(eventType, () => this.runCallback(callbackId));
  }

  runCallback(callbackId: number) {
    this.push(callbackId);
    this.run();
  }
}
