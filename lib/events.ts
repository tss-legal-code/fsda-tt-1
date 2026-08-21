import { EventEmitter } from "events";

class ProposalEventBus {
  private emitter = new EventEmitter();

  constructor() {
    this.emitter.setMaxListeners(50);
  }

  emitChange() {
    this.emitter.emit("proposals:changed");
  }

  onChange(listener: () => void) {
    this.emitter.on("proposals:changed", listener);
    return () => {
      this.emitter.off("proposals:changed", listener);
    };
  }
}

const globalBus = globalThis as unknown as { __proposalEventBus?: ProposalEventBus };

if (!globalBus.__proposalEventBus) {
  globalBus.__proposalEventBus = new ProposalEventBus();
}

export const proposalEvents = globalBus.__proposalEventBus;
