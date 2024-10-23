// Copyright (c) 2024 Elric Neumann. All rights reserved. MIT license.
import {
  OPCODE_APPEND_CHILD,
  OPCODE_APPEND_SIBLING,
  OPCODE_CREATE_ELEMENT,
  OPCODE_NOP,
  OPCODE_SET_ATTRIBUTE,
  OPCODE_TEXT_NODE,
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

  constructor(private label: string = "") {}

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

  render(): Uint8Array {
    const labelLength = this.label.length;
    const totalLength = labelLength + 6 + 5 + this.attributeLength;
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
      const attrBuffer = this.attributeBuffer[i];

      for (let j = 0; j < attrBuffer.length; j++) {
        labelBuffer[offset++] = attrBuffer[j];
      }
    }

    labelBuffer[totalLength - 1] = OPCODE_APPEND_CHILD;

    return labelBuffer;
  }
}

export class Container implements Uint8ArraySlice {
  static readonly DIV = [0x64, 0x69, 0x76];
  static readonly SECTION = [0x73, 0x65, 0x63, 0x74, 0x69, 0x6f, 0x6e];
  static readonly HEADER = [0x68, 0x65, 0x61, 0x64, 0x65, 0x72];
  static readonly FOOTER = [0x66, 0x6f, 0x6f, 0x74, 0x65, 0x72];
  static readonly ARTICLE = [0x61, 0x72, 0x74, 0x69, 0x63, 0x6c, 0x65];
  static readonly ASIDE = [0x61, 0x73, 0x69, 0x64, 0x65];

  private _tagName: number[] = Container.DIV;
  private attributeBuffer: Uint8Array[] = [];
  private attributeLength: number = 0;

  constructor(public children: Uint8ArraySlice[] = []) {}

  tagName(tag: number[]): typeof this {
    this._tagName = tag;
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

  render(): Uint8Array {
    const tagNameLength = this._tagName.length;
    let totalLength = tagNameLength + 2 + this.attributeLength;

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
