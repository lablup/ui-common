/**
 * Deep equality for form values and field metas, with lodash `isEqual`'s
 * semantics for the shapes a form holds: primitives (`NaN` equals `NaN`),
 * arrays and typed arrays, plain and class-instance objects (own enumerable
 * keys, then a constructor check), `Date`, `RegExp`, boxed primitives,
 * `Error`, `Map` and `Set` (order-insensitive), and cycles. Any other
 * built-in tag (`File`, `Blob`, DOM nodes, …) is equal only by reference, as
 * in lodash.
 */
const toTag = (value: unknown) => Object.prototype.toString.call(value);
const hasOwn = (value: object, key: PropertyKey) =>
  Object.prototype.hasOwnProperty.call(value, key);

type Stack = Array<[unknown, unknown]>;

function ownKeys(value: object): PropertyKey[] {
  return [
    ...Object.keys(value),
    ...Object.getOwnPropertySymbols(value).filter((s) =>
      Object.prototype.propertyIsEnumerable.call(value, s),
    ),
  ];
}

function equalUnordered(a: unknown[], b: unknown[], stack: Stack): boolean {
  if (a.length !== b.length) return false;
  const used = new Set<number>();
  return a.every((item) => {
    const index = b.findIndex((other, i) => !used.has(i) && equal(item, other, stack));
    if (index === -1) return false;
    used.add(index);
    return true;
  });
}

function equalSequence(a: ArrayLike<unknown>, b: ArrayLike<unknown>, stack: Stack) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (!equal(a[i], b[i], stack)) return false;
  }
  return true;
}

function equalObjects(a: object, b: object, stack: Stack): boolean {
  const keys = ownKeys(a);
  if (keys.length !== ownKeys(b).length) return false;
  for (const key of keys) {
    if (!hasOwn(b, key)) return false;
    if (
      !equal(
        (a as Record<PropertyKey, unknown>)[key],
        (b as Record<PropertyKey, unknown>)[key],
        stack,
      )
    )
      return false;
  }
  const ctorA = (a as { constructor?: unknown }).constructor;
  const ctorB = (b as { constructor?: unknown }).constructor;
  if (
    ctorA !== ctorB &&
    "constructor" in a &&
    "constructor" in b &&
    !(
      typeof ctorA === "function" &&
      ctorA instanceof ctorA &&
      typeof ctorB === "function" &&
      ctorB instanceof ctorB
    )
  ) {
    return false;
  }
  return true;
}

function equal(a: unknown, b: unknown, stack: Stack): boolean {
  if (a === b) return true;
  if (a == null || b == null || typeof a !== "object" || typeof b !== "object") {
    // Only NaN is unequal to itself; functions compare by reference.
    return a !== a && b !== b;
  }
  const tag = toTag(a);
  if (tag !== toTag(b)) return false;

  for (const [x, y] of stack) {
    if (x === a) return y === b;
  }
  stack.push([a, b]);
  try {
    switch (tag) {
      case "[object Array]":
        return equalSequence(a as unknown[], b as unknown[], stack);
      case "[object Object]":
      case "[object Arguments]":
        return equalObjects(a, b, stack);
      case "[object Date]":
      case "[object Number]":
      case "[object Boolean]": {
        const x = Number(a);
        const y = Number(b);
        return x === y || (x !== x && y !== y);
      }
      case "[object RegExp]":
      case "[object String]":
        return String(a) === String(b);
      case "[object Error]":
        return (
          (a as Error).name === (b as Error).name &&
          (a as Error).message === (b as Error).message
        );
      case "[object Map]":
        return equalUnordered(
          [...(a as Map<unknown, unknown>)],
          [...(b as Map<unknown, unknown>)],
          stack,
        );
      case "[object Set]":
        return equalUnordered(
          [...(a as Set<unknown>)],
          [...(b as Set<unknown>)],
          stack,
        );
      default:
        if (ArrayBuffer.isView(a) && ArrayBuffer.isView(b)) {
          return equalSequence(
            a as unknown as ArrayLike<unknown>,
            b as unknown as ArrayLike<unknown>,
            stack,
          );
        }
        return false;
    }
  } finally {
    stack.pop();
  }
}

export function isEqual(a: unknown, b: unknown): boolean {
  return equal(a, b, []);
}
