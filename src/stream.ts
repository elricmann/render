// Copyright (c) 2024 Elric Neumann. All rights reserved. MIT license.

// @todo: define a `StreamView` that chunks based on children
// and streams the chunks continuously in a new VM instance

import { VirtualMachine } from "./vm";

/**
 * Only defines a stream without validation of instruction blocks.
 *
 * @param bytecodeChunks the chunks representing instruction blocks
 * @returns a readable stream that enqueues chunks
 */
export function createBytecodeStream(
  bytecodeChunks: Uint8Array[]
): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      // bytecodeChunks.forEach((chunk) => controller.enqueue(chunk));

      for (const chunk of bytecodeChunks) {
        controller.enqueue(chunk);
      }

      controller.close();
    },
  });
}

/**
 * Asynchronously reads from a source but does not validate
 * the instruction block which may or may not be valid. For this,
 * we may require opcodes to start at a certain byte boundary.
 *
 * @param vm VM instance
 * @param stream reference to a managed readable stream
 */
export async function unsafe_streamBytecodeToVM(
  vm: VirtualMachine,
  stream: ReadableStream<Uint8Array>
) {
  const reader = stream.getReader();
  let done = false;

  while (!done) {
    const { done: streamDone, value: chunk } = await reader.read();
    done = streamDone;

    if (chunk) {
      // dirty copy to program
      vm.program = new Uint8Array([...vm.program, ...chunk]);
      vm.run();
    }
  }
}
