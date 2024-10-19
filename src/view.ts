// Copyright (c) 2024 Elric Neumann. All rights reserved. MIT license.
import {
  OPCODE_APPEND_CHILD,
  OPCODE_APPEND_SIBLING,
  OPCODE_CREATE_ELEMENT,
  OPCODE_TEXT_NODE,
} from "./vm";

export type Uint8ArraySlice = {
  render: () => Uint8Array;
};

export class Text implements Uint8ArraySlice {
  private text: string;

  constructor(text: string = "") {
    this.text = text;
  }

  render(): Uint8Array {
    const textBuffer = new Uint8Array(this.text.length + 2);

    textBuffer[0] = OPCODE_TEXT_NODE;
    textBuffer[1] = this.text.length;

    for (let i = 0; i < this.text.length; i++) {
      textBuffer[i + 2] = this.text.charCodeAt(i);
    }

    return textBuffer;
  }
}

export class Button implements Uint8ArraySlice {
  constructor(private label: string = "") {}

  render(): Uint8Array {
    const labelLength = this.label.length;
    const totalLength = labelLength + 6 + 5;
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

  constructor(public children: Uint8ArraySlice[] = []) {}

  tagName(tag: number[]): typeof this {
    this._tagName = tag;
    return this;
  }

  render(): Uint8Array {
    const containerBuffer = new Uint8Array([
      OPCODE_CREATE_ELEMENT,
      this._tagName.length,
      ...this._tagName,
    ]);

    let totalLength = containerBuffer.length,
      childrenLength = this.children.length;

    for (let i = 0; i < childrenLength; i++) {
      totalLength += this.children[i].render().length;

      // - 1 prevents rendering all adjacent nodes
      if (i < childrenLength /* - 1 */) {
        totalLength += 1;
      }
    }

    const buffer = new Uint8Array(totalLength);
    buffer.set(containerBuffer, 0);

    let offset = containerBuffer.length;

    for (let i = 0; i < childrenLength; i++) {
      const childBytes = this.children[i].render();

      buffer.set(childBytes, offset);
      offset += childBytes.length;

      // - 1 prevents rendering all adjacent nodes
      if (i < childrenLength /* - 1 */) {
        buffer[offset] = OPCODE_APPEND_CHILD;
        offset += 1;
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
