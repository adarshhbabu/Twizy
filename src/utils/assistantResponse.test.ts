import { describe, expect, it } from 'vitest';
import { parseTwizyResponse } from './assistantResponse';

describe('Gemini response parsing', () => {
  it('parses schema JSON and markdown-fenced JSON', () => {
    const result = parseTwizyResponse('```json\n{"reply":"Done"}\n```');
    expect(result.reply).toBe('Done');
    expect(result.events_to_add).toEqual([]);
  });

  it('rejects malformed or schema-incomplete JSON for the server retry path', () => {
    expect(() => parseTwizyResponse('{not json')).toThrow();
    expect(() => parseTwizyResponse('{"events_to_add":[]}')).toThrow();
  });
});
