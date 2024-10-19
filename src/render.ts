// Copyright (c) 2024 Elric Neumann. All rights reserved. MIT license.
import type { VirtualMachine } from "./vm";

export function renderInChunksWithIdleCallback(
  tasks: Function[],
  deadline: IdleDeadline
) {
  while (tasks.length > 0 && deadline.timeRemaining() > 0) {
    const task = tasks.shift() as Function; // next task in the queue
    task();
  }

  if (tasks.length > 0) {
    requestIdleCallback((deadline) =>
      renderInChunksWithIdleCallback(tasks, deadline)
    ); // re-schedule if tasks remain
  }
}

export function renderInChunksWithAnimationFrame(tasks: Function[]) {
  function performTask() {
    if (tasks.length > 0) {
      const task = tasks.shift() as Function;
      task();

      requestAnimationFrame(performTask); // schedule next task
    }
  }

  requestAnimationFrame(performTask);
}

export function renderWithTimeSlicing(tasks: Function[], sliceDuration = 10) {
  function performTask(startTime: number) {
    let currentTime = performance.now();

    while (tasks.length > 0 && currentTime - startTime < sliceDuration) {
      const task = tasks.shift() as Function;

      task();
      currentTime = performance.now(); // update current time since delta
    }

    if (tasks.length > 0) {
      requestAnimationFrame(() => performTask(performance.now())); // <-- schedule next slice only once
    }
  }

  requestAnimationFrame(() => performTask(performance.now()));
}

export class TaskQueue {
  public highPriorityTasks: Function[] = [];
  public lowPriorityTasks: Function[] = [];

  addHighPriorityTask(task: Function) {
    this.highPriorityTasks.push(task);
  }

  addLowPriorityTask(task: Function) {
    this.lowPriorityTasks.push(task);
  }

  processTasks() {
    if (this.highPriorityTasks.length > 0) {
      const task = this.highPriorityTasks.shift() as Function;
      task();
    } else if (this.lowPriorityTasks.length > 0) {
      const task = this.lowPriorityTasks.shift() as Function;
      task();
    }

    requestAnimationFrame(() => this.processTasks());
  }

  start() {
    this.processTasks();
  }
}

export function processWithTimeSlicing(queue: TaskQueue, sliceDuration = 10) {
  function performTask(startTime: number) {
    let currentTime = performance.now();

    while (performance.now() - startTime < sliceDuration) {
      const taskProcessed =
        queue.highPriorityTasks.length > 0 || queue.lowPriorityTasks.length > 0;

      if (!taskProcessed) break;

      queue.processTasks();
      currentTime = performance.now();
    }

    if (
      queue.highPriorityTasks.length > 0 ||
      queue.lowPriorityTasks.length > 0
    ) {
      // in this case, tasks may remain so we always reuse the frame
      // the idea is to have this run irregardless of rendering method
      requestAnimationFrame(() => performTask(performance.now()));
    }
  }

  requestAnimationFrame(() => performTask(performance.now()));
}

export function scheduleVMsInQueue(
  vms: VirtualMachine[],
  queue: TaskQueue,
  highPriority: boolean = false
) {
  for (let i = 0, len = vms.length; i < len; i++) {
    const task = () => vms[i].run();

    if (highPriority) {
      queue.addHighPriorityTask(task);
    } else {
      queue.addLowPriorityTask(task);
    }
  }
}

export const DEFAULT_FRAME_RATE = 60;

export function withFrameRateBalancer(
  task: () => void,
  targetFrameRate: number
) {
  const targetFrameDuration = 1000 / targetFrameRate;
  let lastFrameTime = performance.now();

  function loop() {
    const currentTime = performance.now();
    const delta = currentTime - lastFrameTime;

    if (delta >= targetFrameDuration) {
      lastFrameTime = currentTime;
      task();
    }

    requestAnimationFrame(loop);
  }

  return {
    start: () => requestAnimationFrame(loop),
  };
}

export function renderAtFrameRate(
  renderTask: () => void,
  targetFrameRate: number = DEFAULT_FRAME_RATE
): void {
  const balancer = withFrameRateBalancer(renderTask, targetFrameRate);
  balancer.start();
}
