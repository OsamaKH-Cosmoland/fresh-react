import type { Clock } from "../../domain/shared/Clock";

export class FakeClock implements Clock {
  private current: Date;

  constructor(startAt: Date | string | number = new Date()) {
    this.current = new Date(startAt);
  }

  now(): Date {
    return new Date(this.current.getTime());
  }

  set(time: Date | string | number) {
    this.current = new Date(time);
  }

  advanceMs(ms: number) {
    this.current = new Date(this.current.getTime() + ms);
  }

  advanceSeconds(seconds: number) {
    this.advanceMs(seconds * 1000);
  }
}
