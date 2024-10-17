// Copyright (c) 2024 Elric Neumann. All rights reserved. MIT license.
import {
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
    const textBytes = new Uint8Array(this.text.length + 2);

    textBytes[0] = OPCODE_TEXT_NODE;
    textBytes[1] = this.text.length;

    for (let i = 0; i < this.text.length; i++) {
      textBytes[i + 2] = this.text.charCodeAt(i);
    }

    return textBytes;
  }
}

export class Container implements Uint8ArraySlice {
  constructor(public children: Uint8ArraySlice[] = []) {}

  render(): Uint8Array {
    const containerBytes = new Uint8Array([
      OPCODE_CREATE_ELEMENT,
      3,
      0x64,
      0x69,
      0x76,
    ]);

    let totalLength = containerBytes.length,
      childrenLength = this.children.length;

    for (let i = 0; i < childrenLength; i++) {
      totalLength += this.children[i].render().length;

      if (i < childrenLength - 1) {
        totalLength += 1; /* add 1 byte for OPCODE_APPEND_SIBLING for all but the last child */
      }
    }

    const buffer = new Uint8Array(totalLength);
    buffer.set(containerBytes, 0);

    let offset = containerBytes.length;

    for (let i = 0; i < childrenLength; i++) {
      const childBytes = this.children[i].render();

      buffer.set(childBytes, offset);
      offset += childBytes.length;

      if (i < childrenLength - 1) {
        buffer[offset] = OPCODE_APPEND_SIBLING;
        offset += 1; /* add OPCODE_APPEND_SIBLING after each child, except the last one */
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

function view(constructorRef: any, metadata: any): any {
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
