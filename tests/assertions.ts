/**
 * Test Assertions
 * Assertion helpers for test validation with detailed error messages
 */

export class AssertionError extends Error {
  constructor(
    message: string,
    public expected: any,
    public actual: any
  ) {
    super(message);
    this.name = 'AssertionError';
  }
}

export function assert(condition: boolean, message?: string): void {
  if (!condition) {
    throw new AssertionError(message || 'Assertion failed', undefined, undefined);
  }
}

export function assertEquals<T>(actual: T, expected: T, message?: string): void {
  if (actual !== expected) {
    throw new AssertionError(
      message || `Expected ${expected} but got ${actual}`,
      expected,
      actual
    );
  }
}

export function assertNotEquals<T>(actual: T, expected: T, message?: string): void {
  if (actual === expected) {
    throw new AssertionError(
      message || `Expected value not to be ${expected}`,
      expected,
      actual
    );
  }
}

export function assertStrictEquals<T>(actual: T, expected: T, message?: string): void {
  if (actual !== expected) {
    throw new AssertionError(
      message || `Expected strict equality failed: ${actual} !== ${expected}`,
      expected,
      actual
    );
  }
}

export function assertArrayEquals(actual: any[], expected: any[], message?: string): void {
  if (actual.length !== expected.length) {
    throw new AssertionError(
      message || `Array length mismatch: ${actual.length} !== ${expected.length}`,
      expected,
      actual
    );
  }
  for (let i = 0; i < actual.length; i++) {
    if (actual[i] !== expected[i]) {
      throw new AssertionError(
        message || `Array mismatch at index ${i}`,
        expected[i],
        actual[i]
      );
    }
  }
}

export function assertContains(actual: string, expected: string, message?: string): void {
  if (!actual.includes(expected)) {
    throw new AssertionError(
      message || `String does not contain expected substring`,
      expected,
      actual
    );
  }
}

export function assertArrayContains<T>(actual: T[], expected: T, message?: string): void {
  if (!actual.includes(expected)) {
    throw new AssertionError(
      message || `Array does not contain expected element`,
      expected,
      actual
    );
  }
}

export function assertObjectMatches(actual: any, expected: Record<string, any>, message?: string): void {
  for (const key in expected) {
    if (actual[key] !== expected[key]) {
      throw new AssertionError(
        message || `Object property ${key} does not match`,
        expected[key],
        actual[key]
      );
    }
  }
}

export function assertExists<T>(value: T | null | undefined, message?: string): asserts value is T {
  if (value === null || value === undefined) {
    throw new AssertionError(message || 'Expected value to exist', 'exists', 'null/undefined');
  }
}

export function assertNotExists(value: any, message?: string): void {
  if (value !== null && value !== undefined) {
    throw new AssertionError(message || 'Expected value to not exist', 'null/undefined', 'exists');
  }
}

export function assertInRange(value: number, min: number, max: number, message?: string): void {
  if (value < min || value > max) {
    throw new AssertionError(
      message || `Value ${value} not in range [${min}, ${max}]`,
      `[${min}, ${max}]`,
      value
    );
  }
}

export function assertThrows<T extends Error = Error>(
  fn: () => void | Promise<void>,
  errorClass?: new (...args: any[]) => T,
  message?: string
): void {
  try {
    fn();
    throw new AssertionError(message || 'Expected function to throw', undefined, undefined);
  } catch (error) {
    if (errorClass && !(error instanceof errorClass)) {
      throw new AssertionError(
        message || `Expected error of type ${errorClass.name}`,
        errorClass.name,
        error instanceof Error ? error.constructor.name : typeof error
      );
    }
  }
}

export function assertHttpStatus(actual: number, expected: number, message?: string): void {
  if (actual !== expected) {
    throw new AssertionError(
      message || `Expected HTTP status ${expected} but got ${actual}`,
      expected,
      actual
    );
  }
}

export function assertJsonMatches(actual: any, expected: Record<string, any>, message?: string): void {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  if (actualJson !== expectedJson) {
    throw new AssertionError(
      message || 'JSON objects do not match',
      expected,
      actual
    );
  }
}

export function assertHasProperty(obj: any, property: string, message?: string): void {
  if (!Object.prototype.hasOwnProperty.call(obj, property)) {
    throw new AssertionError(
      message || `Object does not have property "${property}"`,
      property,
      Object.keys(obj)
    );
  }
}

export function assertNotEmpty(value: string | any[], message?: string): void {
  if (value.length === 0) {
    throw new AssertionError(message || 'Expected value to not be empty', 'non-empty', 'empty');
  }
}

export function assertIsEmpty(value: string | any[], message?: string): void {
  if (value.length !== 0) {
    throw new AssertionError(message || 'Expected value to be empty', 'empty', 'non-empty');
  }
}
