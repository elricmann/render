// Copyright (c) 2024 Elric Neumann. All rights reserved. MIT license.
import { increment } from "./utils";
import {
  OPCODE_APPEND_CHILD,
  OPCODE_APPEND_SIBLING,
  OPCODE_CREATE_ELEMENT,
  OPCODE_EVENT_LISTENER,
  OPCODE_NOP,
  OPCODE_SET_ATTRIBUTE,
  OPCODE_TEXT_NODE,
  __eventStore,
} from "./vm";

export type Uint8ArraySlice = {
  render: () => Uint8Array;
};

export class Text implements Uint8ArraySlice {
  constructor(private text: string = "") {}

  render(): Uint8Array {
    const textLength = this.text.length;
    const textBuffer = new Uint8Array(textLength + 2);

    textBuffer[0] = OPCODE_TEXT_NODE;
    textBuffer[1] = textLength;

    for (let i = 0; i < textLength; i++) {
      textBuffer[i + 2] = this.text.charCodeAt(i);
    }

    return textBuffer;
  }
}

export class Button implements Uint8ArraySlice {
  private attributeBuffer: Uint8Array[] = [];
  private attributeLength: number = 0;
  private eventBuffer: Uint8Array[] = [];
  private eventBufferLength: number = 0;

  constructor(private label: string = "") {}

  id(value: string) {
    this.attr("id", value);
    return this;
  }

  class(value: string) {
    this.attr("class", value);
    return this;
  }

  attr(key: string, value: string): this {
    const keyLength = key.length;
    const valueLength = value.length;
    const attrBuffer = new Uint8Array(3 + keyLength + 1 + valueLength);

    attrBuffer[0] = OPCODE_SET_ATTRIBUTE;
    attrBuffer[1] = keyLength + 1; // length of key + 1 for required OPCODE_NOP

    for (let i = 0; i < keyLength; i++) {
      attrBuffer[i + 2] = key.charCodeAt(i);
    }

    attrBuffer[keyLength + 2] = OPCODE_NOP;
    attrBuffer[keyLength + 3] = valueLength;

    for (let i = 0; i < valueLength; i++) {
      attrBuffer[keyLength + 4 + i] = value.charCodeAt(i);
    }

    this.attributeBuffer.push(attrBuffer);
    this.attributeLength += attrBuffer.length;

    return this;
  }

  // @todo: hold counters in the VM stack by growing from top to base

  on(event: string, callback: () => void): this {
    const eventIdx = increment();

    __eventStore.set(eventIdx, callback);

    const eventTypeLength = event.length;
    const eventBufferLength = event.length + 3; /* opcode, length, idx */

    const buffer = new Uint8Array(eventBufferLength);
    buffer[0] = OPCODE_EVENT_LISTENER;
    buffer[1] = eventTypeLength;

    for (let i = 0; i < eventTypeLength; i++) {
      buffer[i + 2] = event.charCodeAt(i);
    }

    buffer[eventTypeLength + 2] = eventIdx;

    this.eventBuffer.push(buffer);
    this.eventBufferLength += buffer.length;

    return this;
  }

  render(): Uint8Array {
    const labelLength = this.label.length;
    const totalLength =
      labelLength + 6 + 5 + this.attributeLength + this.eventBufferLength;
    const labelBuffer = new Uint8Array(totalLength);

    labelBuffer[0] = OPCODE_CREATE_ELEMENT;
    labelBuffer[1] = 6;
    labelBuffer[2] = 0x62;
    labelBuffer[3] = 0x75;
    labelBuffer[4] = 0x74;
    labelBuffer[5] = 0x74;
    labelBuffer[6] = 0x6f;
    labelBuffer[7] = 0x6e;
    labelBuffer[8] = OPCODE_TEXT_NODE;
    labelBuffer[9] = labelLength;

    for (let i = 0; i < labelLength; i++) {
      labelBuffer[i + 10] = this.label.charCodeAt(i);
    }

    let offset = labelLength + 10;

    for (let i = 0; i < this.attributeBuffer.length; i++) {
      labelBuffer.set(this.attributeBuffer[i], offset);
      offset += this.attributeBuffer[i].length;
    }

    for (let i = 0; i < this.eventBuffer.length; i++) {
      labelBuffer.set(this.eventBuffer[i], offset);
      offset += this.eventBuffer[i].length;
    }

    labelBuffer[offset++] = OPCODE_APPEND_CHILD;

    return labelBuffer;
  }
}

// prettier-ignore
export class Container implements Uint8ArraySlice {
  static readonly DIV = [0x64, 0x69, 0x76];
  static readonly SECTION = [0x73, 0x65, 0x63, 0x74, 0x69, 0x6f, 0x6e];
  static readonly HEADER = [0x68, 0x65, 0x61, 0x64, 0x65, 0x72];
  static readonly FOOTER = [0x66, 0x6f, 0x6f, 0x74, 0x65, 0x72];
  static readonly ARTICLE = [0x61, 0x72, 0x74, 0x69, 0x63, 0x6c, 0x65];
  static readonly ASIDE = [0x61, 0x73, 0x69, 0x64, 0x65];
  static readonly SPAN = [0x73, 0x70, 0x61, 0x6e];
  static readonly P = [0x70];
  static readonly H1 = [0x68, 0x31];
  static readonly H2 = [0x68, 0x32];
  static readonly H3 = [0x68, 0x33];
  static readonly H4 = [0x68, 0x34];
  static readonly H5 = [0x68, 0x35];
  static readonly H6 = [0x68, 0x36];
  static readonly UL = [0x75, 0x6c];
  static readonly OL = [0x6f, 0x6c];
  static readonly LI = [0x6c, 0x69];
  static readonly DL = [0x64, 0x6c];
  static readonly DT = [0x64, 0x74];
  static readonly DD = [0x64, 0x64];
  static readonly TABLE = [0x74, 0x61, 0x62, 0x6c, 0x65];
  static readonly BUTTON = [0x62, 0x75, 0x74, 0x74, 0x6f, 0x6e];
  static readonly TR = [0x74, 0x72];
  static readonly TD = [0x74, 0x64];
  static readonly TH = [0x74, 0x68];
  static readonly THEAD = [0x74, 0x68, 0x65, 0x61, 0x64];
  static readonly TBODY = [0x74, 0x62, 0x6f, 0x64, 0x79];
  static readonly TFOOT = [0x74, 0x66, 0x6f, 0x6f, 0x74];
  static readonly COLGROUP = [0x63, 0x6f, 0x6c, 0x67, 0x72, 0x6f, 0x75, 0x70];
  static readonly COL = [0x63, 0x6f, 0x6c];
  static readonly CAPTION = [0x63, 0x61, 0x70, 0x74, 0x69, 0x6f, 0x6e];
  static readonly BLOCKQUOTE = [0x62, 0x6c, 0x6f, 0x63, 0x6b, 0x71, 0x75, 0x6f, 0x74, 0x65];
  static readonly Q = [0x71];
  static readonly CODE = [0x63, 0x6f, 0x64, 0x65];
  static readonly KBD = [0x6b, 0x62, 0x64];
  static readonly SAMP = [0x73, 0x61, 0x6d, 0x70];
  static readonly VAR = [0x76, 0x61, 0x72];
  static readonly CITE = [0x63, 0x69, 0x74, 0x65];
  static readonly ABBR = [0x61, 0x62, 0x62, 0x72];
  static readonly DFN = [0x64, 0x66, 0x6e];
  static readonly ADDRESS = [0x61, 0x64, 0x64, 0x72, 0x65, 0x73, 0x73];
  static readonly FIGURE = [0x66, 0x69, 0x67, 0x75, 0x72, 0x65];
  static readonly FIGCAPTION = [0x66, 0x69, 0x67, 0x63, 0x61, 0x70, 0x74, 0x69, 0x6f, 0x6e];
  static readonly HR = [0x68, 0x72];
  static readonly BR = [0x62, 0x72];
  static readonly PRE = [0x70, 0x72, 0x65];

  private _tagName: number[] = Container.DIV;
  private attributeBuffer: Uint8Array[] = [];
  private attributeLength: number = 0;
  private eventBuffer: Uint8Array[] = [];
  private eventBufferLength: number = 0;

  constructor(public children: Uint8ArraySlice[] = []) {}

  tagName(tag: number[]): typeof this {
    this._tagName = tag;
    return this;
  }

  id(value: string) {
    this.attr("id", value);
    return this;
  }

  class(value: string) {
    this.attr("class", value);
    return this;
  }

  attr(key: string, value: string): this {
    const keyLength = key.length;
    const valueLength = value.length;
    const attrBuffer = new Uint8Array(3 + keyLength + 1 + valueLength);

    attrBuffer[0] = OPCODE_SET_ATTRIBUTE;
    attrBuffer[1] = keyLength + 1;

    for (let i = 0; i < keyLength; i++) {
      attrBuffer[i + 2] = key.charCodeAt(i);
    }

    attrBuffer[keyLength + 2] = OPCODE_NOP;
    attrBuffer[keyLength + 3] = valueLength;

    for (let i = 0; i < valueLength; i++) {
      attrBuffer[keyLength + 4 + i] = value.charCodeAt(i);
    }

    this.attributeBuffer.push(attrBuffer);
    this.attributeLength += attrBuffer.length;

    return this;
  }

  on(event: string, callback: () => void): this {
    const eventIdx = increment();

    __eventStore.set(eventIdx, callback);

    const eventTypeLength = event.length;
    const eventBufferLength = event.length + 3; /* opcode, length, idx */

    const buffer = new Uint8Array(eventBufferLength);
    buffer[0] = OPCODE_EVENT_LISTENER;
    buffer[1] = eventTypeLength;

    for (let i = 0; i < eventTypeLength; i++) {
      buffer[i + 2] = event.charCodeAt(i);
    }

    buffer[eventTypeLength + 2] = eventIdx;

    this.eventBuffer.push(buffer);
    this.eventBufferLength += buffer.length;

    return this;
  }

  render(): Uint8Array {
    const tagNameLength = this._tagName.length;
    let totalLength = tagNameLength + 2 + this.attributeLength + this.eventBufferLength;

    for (let i = 0; i < this.children.length; i++) {
      totalLength += this.children[i].render().length;
      totalLength += 1; // for each OPCODE_APPEND_CHILD
    }

    const buffer = new Uint8Array(totalLength);

    buffer[0] = OPCODE_CREATE_ELEMENT;
    buffer[1] = tagNameLength;
    buffer.set(this._tagName, 2);

    let offset = tagNameLength + 2;

    for (let i = 0; i < this.attributeBuffer.length; i++) {
      const attrBuffer = this.attributeBuffer[i];

      for (let j = 0; j < attrBuffer.length; j++) {
        buffer[offset++] = attrBuffer[j];
      }
    }

    for (let i = 0; i < this.eventBuffer.length; i++) {
      buffer.set(this.eventBuffer[i], offset);
      offset += this.eventBuffer[i].length;
    }

    for (let i = 0; i < this.children.length; i++) {
      const childBuffer = this.children[i].render();

      buffer.set(childBuffer, offset);
      offset += childBuffer.length;

      if (i < this.children.length) {
        buffer[offset++] = OPCODE_APPEND_CHILD;
      }
    }

    return buffer;
  }
}

export class View implements Uint8ArraySlice {
  constructor(public children: Uint8ArraySlice[] = []) {}

  render(): Uint8Array {
    let totalLength = 0,
      childrenLength = this.children.length;

    for (let i = 0; i < childrenLength; i++) {
      totalLength += this.children[i].render().length;
    }

    const buffer = new Uint8Array(totalLength);
    let offset = 0;

    for (let i = 0; i < childrenLength; i++) {
      const childArray = this.children[i].render();

      buffer.set(childArray, offset);
      offset += childArray.length;
    }

    return buffer;
  }
}

export function view(constructorRef: any, metadata: any): any {
  const initialConstructor = constructorRef;

  function createInstance(classConstructor: any, parameters: any[]) {
    const instance: any = function () {
      // @ts-ignore
      return classConstructor.apply(this as any, parameters);
    };

    instance.prototype = classConstructor.prototype;

    return new instance();
  }

  const updatedConstructor: any = function (...params: any[]) {
    return createInstance(initialConstructor, params);
  };

  updatedConstructor.prototype.render = function (): Uint8Array {
    return new Uint8Array();
  };

  updatedConstructor.prototype = initialConstructor.prototype;

  return updatedConstructor;
}
