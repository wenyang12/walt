// @flow
import type { NodeType } from "../flow/types";

type WalkerType = (node: NodeType, childMapper?: any) => NodeType;
type VisitorType = { [string]: WalkerType };

// Dead simple AST walker, takes a visitor object and calls all methods for
// appropriate node Types.
function walker(visitor: VisitorType): WalkerType {
  const walkNode = (node: NodeType): NodeType => {
    if (node == null) {
      return node;
    }
    const { params } = node;

    const mappingFunction: WalkerType = (() => {
      if ("*" in visitor && typeof visitor["*"] === "function") {
        return visitor["*"];
      }

      if (node.Type in visitor && typeof visitor[node.Type] === "function") {
        return visitor[node.Type];
      }

      return () => node;
    })();

    if (mappingFunction.length === 2) {
      mappingFunction(node, walkNode);
      return node;
    }

    mappingFunction(node);
    params.forEach(walkNode);

    return node;
  };

  return walkNode;
}

export default walker;
