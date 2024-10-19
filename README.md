## render

Experimental JavaScript UI rendering library. Render uses a lightweight stack-based VM with minimal opcodes to encode DOM trees and run DOM operations either immediately or in retained mode (by diffing and patching bytecodes). Components are defined as **views** that serialize their attributes and children into `Uint8Array` instances.

### Installation & usage

_This section is incomplete._

### Features

- [ ] Views
  - [x] `View` - view instance serializer
  - [x] `Text` - static text view with title
  - [x] `Button` - static button with label
  - [x] `Container` - dynamic view with optional attributes (e.g. tag name)
- [ ] Virtual machine DOM
  - [x] Create DOM nodes (`OPCODE_CREATE_ELEMENT`)
  - [x] Decode 8-bit entries with static offsets (UTF-16 character codes)
  - [x] Set DOM node attribute to least recent node (`OPCODE_SET_ATTRIBUTE`)
  - [x] Append least recent nodes as parent-child (`OPCODE_APPEND_CHILD`)
  - [x] Create DOM text node (`OPCODE_TEXT_NODE`)
  - [ ] Set `innerHTML` with in-memory string source
  - [x] Append adjacent DOM nodes as siblings (`OPCODE_APPEND_SIBLING`)
  - [ ] Diffing and patching arbitrary bytecodes
- [ ] Consistency in rendering with timed `requestAnimationFrame`
- [ ] Non-tracking reactive primitives in views
- [ ] Precompiled bytecode from views (requires build tools)
- [ ] Off the main thread view serialization (`ThreadView`)

### Quick overview

<p align="center">
  <img width="80%" src="/.github/graph.png">
</p>

### License

Copyright © 2024 Elric Neumann. MIT License.
