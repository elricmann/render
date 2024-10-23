<h3>render</h3>

<img align="right" width="100" height="100" src="/.github/logo.png">

Experimental JavaScript UI rendering library. Render uses a lightweight stack-based VM with minimal opcodes to encode DOM trees and run DOM operations either immediately or in retained mode (by diffing and patching bytecodes). Components are defined as **views** that serialize their attributes and children into `Uint8Array` instances.

### Installation & usage

```
npm install librender
```

Refer to [main.tsx](https://github.com/elricmann/render/blob/main/src/main.tsx) for basic usage.

### Features

- [ ] Views
  - [x] `View` - view instance serializer
  - [x] `Text` - static text view with title
  - [x] `Button` - static button with label
  - [x] `Container` - dynamic view with optional attributes (e.g. tag name)
  - [x] Tags corresponding to semantic elements (`Container`)
  - [x] Attributes on views (`attr` method), deprecate opcode for inline styles
  - [x] Event listeners on views (`Button`)
- [ ] Virtual machine DOM
  - [x] Create DOM nodes (`OPCODE_CREATE_ELEMENT`)
  - [x] Decode 8-bit entries with static offsets (UTF-16 character codes)
  - [x] Set DOM node attribute to least recent node (`OPCODE_SET_ATTRIBUTE`)
  - [x] Append least recent nodes as parent-child (`OPCODE_APPEND_CHILD`)
  - [x] Create DOM text node (`OPCODE_TEXT_NODE`)
  - [ ] Set `innerHTML` with in-memory string source
  - [x] Append adjacent DOM nodes as siblings (`OPCODE_APPEND_SIBLING`)
  - [ ] Diffing and patching arbitrary bytecodes (partially complete)
  - [x] Event listeners on least recent node (`OPCODE_EVENT_LISTENER`, requires `__eventStore`)
- [x] Consistency in rendering with timed `requestAnimationFrame`
- [x] Streaming instruction blocks to VM (`createBytecodeStream`, `unsafe_streamBytecodeToVM`)
- [ ] Non-tracking reactive primitives in views
- [ ] Precompiled bytecode from views (requires build tools)
- [ ] Off the main thread view serialization (`ThreadView`)

### Quick overview

Render relies on **views** to return byte arrays with exact alignment of data values and offsets. The VM does not _fix_ program inputs which is why views form safe high-level wrappers representing extendable components. Aside, the default settings are supposed to be configurable.

Portability is the primary goal of this library. I wrote `librender` expecting that there could be a **single optimizing bytecode IR** for various web-based rendering libraries. To this effect, there is an imperative-procedural approach when defining view methods that correspond to raw bytecode.

<p align="center">
  <img src="/.github/graph.png">
</p>

#### Completeness of the virtual machine

The VM does not fully take the role of a DOM-based model and opcodes are only limited to DOM operations where inputs are serializable (e.g. event handlers are _not_ serializable). It lacks features like pausability and resumability, async batch streaming, per-batch scheduling, and virtual prioritization, that could essentially improve rendering.

<p align="center">
  <img src="/.github/vm.png">
</p>

The structural description of the VM is:

- The **stack** is reserved for holding references to handlers and raw strings
- The **memory** applies to enabled shared memory (e.g. temporal view states) between VM instances
- `nodeCount` is a counter that allows managing the `nodeIndexStack` in the DOM operations

#### Portability of the bytecode IR

WebAssembly modules are loaded as view slices into an array buffer representing a linear memory model. Since modules are precompiled, the bytecode could target `librender` with virtually no overhead. This would imply that optimizing the VM itself from the JavaScript source would improve existing programs without introducing layers of indirection.

<p align="center">
  <img src="/.github/portable.png">
</p>

With this enabled, various high-level libraries targeting the bytecode can be used as microfrontends with predictability. Currently, `librender` is barely useable so this will require major effort to put in place. Additionally, certain data structures can be linearly represented for uniformity, e.g. C-like structs with offsets require no deallocation in WebAssembly. Growing memory is as easy as incrementing a pointer.

Portability allows loading `.bin` files through a shared worker, which could be useful for monolithic SPAs that depend on server endpoints to fetch and render data in the main UI thread for client-side rendering.

### Acknowledgements

Render does not provide unique insights into the approach rendering is done or criteria for commiting DOM nodes for painting. Other libraries such as [React](https://react.dev/) (scheduling model) and [GlimmerVM](https://github.com/glimmerjs/glimmer-vm) (opcode-based rendering) are to be considered prior art in this regard.

### License

Copyright © 2024 Elric Neumann. MIT License.
