import { parseScanResult } from "../index";

test("parses a JSON string array", () => {
  expect(parseScanResult('["/a","/b"]')).toEqual(["/a", "/b"]);
});

test("rejects non-array and non-string payloads", () => {
  expect(() => parseScanResult('{"a":1}')).toThrow();
  expect(() => parseScanResult('[1,2]')).toThrow();
});
