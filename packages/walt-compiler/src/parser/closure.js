// @flow
import Syntax from "../Syntax";
import type Context from "./context";
import type { NodeType, TokenType } from "../flow/types";

export const makeResult = (node: NodeType | null) => ({
  range: [],
  ...node,
  meta: [],
  params: [],
  Type: Syntax.FunctionResult,
  value: "FUNCTION_RESULT",
});

export const makeArgs = (node: NodeType | null) => ({
  range: [],
  ...node,
  params: (() => {
    if (node == null) {
      return [];
    }
    return node.Type === Syntax.Sequence ? node.params : [node];
  })(),
  type: null,
  meta: [],
  value: "FUNCTION_ARGUMENTS",
  Type: Syntax.FunctionArguments,
});

export default function parselambda(
  ctx: Context,
  op: TokenType,
  operands: NodeType[]
): NodeType {
  const args = operands[0];
  const result = operands[1];
  const block = operands[2] || result || args;
  operands.splice(-3);

  let params = [];
  const lambda = {
    ...op,
    type: "i32",
    range: [ctx.token.start, ctx.token.end],
    meta: [],
    Type: Syntax.Closure,
    params: [],
  };
  // The reason why this is so tricky to parse is because there are too many
  // optional parts of a coluse definition, like arguments and return type
  if (args.Type === Syntax.Pair) {
    const [lhs, rhs] = args.params;
    if (lhs != null && rhs != null) {
      params =
        lhs.Type === Syntax.Pair
          ? [makeArgs(lhs), makeResult(rhs)]
          : [
              makeArgs(lhs.Type === Syntax.Sequence ? lhs : args),
              makeResult(rhs.Type === Syntax.Type ? rhs : null),
            ];
      return {
        ...lambda,
        params: [
          {
            ...lambda,
            Type: Syntax.FunctionDeclaration,
            params: [...params, block],
          },
        ],
      };
    }

    return {
      ...lambda,
      params: [
        {
          ...lambda,
          Type: Syntax.FunctionDeclaration,
          params: [makeArgs(null), makeResult(lhs), block],
        },
      ],
    };
  } else if (args.Type === Syntax.Sequence) {
    return {
      ...lambda,
      params: [
        {
          ...lambda,
          Type: Syntax.FunctionDeclaration,

          params: [
            makeArgs(args),
            makeResult(result.Type === Syntax.Type ? result : null),
            block,
          ],
        },
      ],
    };
  }

  return lambda;
}
