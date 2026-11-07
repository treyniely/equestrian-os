// The session capacity column and booking guards expect a positive integer.
export const UNLIMITED_EVENT_CAPACITY = Number.MAX_SAFE_INTEGER;

export function isUnlimitedCapacity(capacity: number | undefined): boolean {
    return capacity === UNLIMITED_EVENT_CAPACITY;
}
