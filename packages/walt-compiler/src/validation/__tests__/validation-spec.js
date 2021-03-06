import test from "ava";
import parser from "../../parser";
import semantics from "../../semantics";
import validate from "..";

const parseAndValidate = source =>
  validate(semantics(parser(source)), {
    lines: source.split("/n"),
    filename: "spec.walt",
  });

test("ast must have metadata attached", t => {
  const error = t.throws(() => validate({ meta: [] }, { filename: "test" }));
  t.snapshot(error);
});

test("typos throw", t => {
  const error = t.throws(() => parseAndValidate("expost const x: i32;"));
  t.snapshot(error, true);
});
test("global exports must have value", t => {
  const error = t.throws(() => parseAndValidate("export const x: i32;"));
  t.snapshot(error);
});

test("undefined types throw", t => {
  // Memory and Tables are fine
  parseAndValidate("import { memory: Memory, table: Table } from 'env';");
  const error = t.throws(() =>
    parseAndValidate("import { foo: Type } from 'env';")
  );
  t.snapshot(error);
});

test("const cannot be re-asigned", t => {
  const error = t.throws(() =>
    parseAndValidate(`
    function test() {
      const x: i32 = 0;
      x = 1;
      const y: i32 = 0;
      y += 1;
    }`)
  );
  t.snapshot(error);
});

test("unterminated declaration statements", t => {
  const error = t.throws(() =>
    parseAndValidate(`
    function test() {
      const x: i32 = 0
      x = 2;
    }`)
  );
  t.snapshot(error);
});

test("unterminated assignment statements", t => {
  const error = t.throws(() =>
    parseAndValidate(`
    function test() {
      let x: i32 = 0;
      let y: i32 = 0;
      x = 2
      y = 3 + 3;
    }`)
  );
  t.snapshot(error);
});

test("undefined object properties", t => {
  const error = t.throws(() =>
    parseAndValidate(`
    type T = { x: i32 };
    function test() {
      const obj: T = 0;
      obj = { y: 5 };
      obj.y = 5;
    }`)
  );
  t.snapshot(error);
});
