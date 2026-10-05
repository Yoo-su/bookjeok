import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';

export interface DomainEvent<Name extends string, Payload> {
  readonly name: Name;
  /** 타입 연결만을 위한 필드. 런타임 객체에는 추가하지 않는다. */
  readonly payloadType?: Payload;
}

export function defineDomainEvent<Payload>() {
  return <Name extends string>(name: Name): DomainEvent<Name, Payload> => ({
    name,
  });
}

export type EventPayload<Event> =
  Event extends DomainEvent<string, infer Payload> ? Payload : never;

export type PendingDomainEvent<Event extends DomainEvent<string, unknown>> = {
  name: Event['name'];
  payload: EventPayload<Event>;
};

export function emitDomainEvent<Name extends string, Payload>(
  emitter: EventEmitter2,
  event: DomainEvent<Name, Payload>,
  payload: NoInfer<Payload>,
): boolean {
  return emitter.emit(event.name, payload);
}

export function emitDomainEventAsync<Name extends string, Payload>(
  emitter: EventEmitter2,
  event: DomainEvent<Name, Payload>,
  payload: NoInfer<Payload>,
): Promise<unknown[]> {
  return emitter.emitAsync(event.name, payload);
}

/** Nest의 옵션·스케줄링은 그대로 두고 리스너의 payload 계약을 검사한다. */
export function OnDomainEvent<Name extends string, Payload>(
  event: DomainEvent<Name, Payload>,
  options?: Parameters<typeof OnEvent>[1],
) {
  return <Handler extends (payload: never) => unknown>(
    target: object,
    key: string | symbol,
    descriptor: TypedPropertyDescriptor<Handler> &
      (Parameters<Handler> extends [Payload]
        ? [Payload] extends Parameters<Handler>
          ? unknown
          : never
        : never),
  ): void => {
    OnEvent(event.name, options)(target, key, descriptor);
  };
}
