type AuthEvent = "unauthorized";
type AuthEventListener = () => void;

const listenersByEvent = new Map<AuthEvent, Set<AuthEventListener>>();

export function onAuthEvent(event: AuthEvent, listener: AuthEventListener): () => void {
  let set = listenersByEvent.get(event);
  if (!set) {
    set = new Set();
    listenersByEvent.set(event, set);
  }
  set.add(listener);
  return () => {
    set!.delete(listener);
  };
}

export function emitAuthEvent(event: AuthEvent): void {
  const set = listenersByEvent.get(event);
  if (set) {
    for (const listener of set) {
      listener();
    }
  }
}
