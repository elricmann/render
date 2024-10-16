// Copyright (c) 2024 Elric Neumann. All rights reserved. MIT license.
export class View {
  render(): Uint8Array {
    return new Uint8Array([1, 2, 1]);
  }
}

// @view
export class Container {
  children: View[];

  constructor(children: View[]) {
    this.children = children;
  }

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
