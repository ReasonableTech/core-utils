/**
 * Custom ESLint rule: no-null-undefined-checks
 *
 * Flags code that checks for both null and undefined on the same value,
 * which indicates a type mismatch. null and undefined are different types
 * in TypeScript, and you should only check for what's in your type union.
 */

import {
  ESLintUtils,
  AST_NODE_TYPES,
  type TSESLint,
  type TSESTree,
} from "@typescript-eslint/utils";

/**
 * Type guard for BinaryExpression
 * @param node The node to check
 * @returns True if the node is a BinaryExpression
 */
function isBinaryExpression(
  node: TSESTree.Node,
): node is TSESTree.BinaryExpression {
  return node.type === AST_NODE_TYPES.BinaryExpression;
}

/**
 * Type guard for Identifier
 * @param node The node to check
 * @returns True if the node is an Identifier
 */
function isIdentifier(node: TSESTree.Node): node is TSESTree.Identifier {
  return node.type === AST_NODE_TYPES.Identifier;
}

/**
 * Type guard for Literal
 * @param node The node to check
 * @returns True if the node is a Literal
 */
function isLiteral(node: TSESTree.Node): node is TSESTree.Literal {
  return node.type === AST_NODE_TYPES.Literal;
}

/**
 * Checks if a node is a null comparison (=== null, !== null, == null, != null)
 * @param node The node to check
 * @returns The variable being compared to null, or null if not a null comparison
 */
function getNullCheckVariable(node: TSESTree.Node): string | null {
  if (!isBinaryExpression(node)) {
    return null;
  }

  const { operator, left, right } = node;
  const isComparisonOp =
    operator === "===" ||
    operator === "!==" ||
    operator === "==" ||
    operator === "!=";

  if (!isComparisonOp) {
    return null;
  }

  // Check if right side is null literal
  if (isLiteral(right) && right.value === null && isIdentifier(left)) {
    return left.name;
  }

  // Check if left side is null literal
  if (isLiteral(left) && left.value === null && isIdentifier(right)) {
    return right.name;
  }

  return null;
}

/**
 * Checks if a node is an undefined comparison (=== undefined, !== undefined, == undefined, != undefined)
 * @param node The node to check
 * @returns The variable being compared to undefined, or null if not an undefined comparison
 */
function getUndefinedCheckVariable(node: TSESTree.Node): string | null {
  if (!isBinaryExpression(node)) {
    return null;
  }

  const { operator, left, right } = node;
  const isComparisonOp =
    operator === "===" ||
    operator === "!==" ||
    operator === "==" ||
    operator === "!=";

  if (!isComparisonOp) {
    return null;
  }

  // Check if right side is undefined identifier
  if (isIdentifier(right) && right.name === "undefined" && isIdentifier(left)) {
    return left.name;
  }

  // Check if left side is undefined identifier
  if (isIdentifier(left) && left.name === "undefined" && isIdentifier(right)) {
    return right.name;
  }

  return null;
}

/**
 * Creates the no-null-undefined-checks rule
 */
export const noNullUndefinedChecksRule = ESLintUtils.RuleCreator(
  () => "docs/standards/typescript-design-patterns.md",
)({
  name: "no-null-undefined-checks",
  meta: {
    type: "problem",
    docs: {
      description:
        "Flags checking for both null and undefined on the same value, which indicates a type mismatch. null and undefined are different types in TypeScript.",
    },
    messages: {
      checksBoth:
        "Checking for both null and undefined is likely a type mismatch. null and undefined are different types in TypeScript. Check your type union - you should only check for what's actually in the type.",
    },
    schema: [],
  },
  defaultOptions: [],
  create(context: TSESLint.RuleContext<"checksBoth", []>) {
    return {
      LogicalExpression(node: TSESTree.LogicalExpression): void {
        // Only check OR conditions (||)
        if (node.operator !== "||") {
          return;
        }

        // Get the variables being checked on each side
        const leftNullVar = getNullCheckVariable(node.left);
        const leftUndefinedVar = getUndefinedCheckVariable(node.left);
        const rightNullVar = getNullCheckVariable(node.right);
        const rightUndefinedVar = getUndefinedCheckVariable(node.right);

        // Look for a variable that appears in both null and undefined checks
        const nullVars = new Set<string>();
        const undefinedVars = new Set<string>();

        if (leftNullVar !== null) {
          nullVars.add(leftNullVar);
        }
        if (rightNullVar !== null) {
          nullVars.add(rightNullVar);
        }
        if (leftUndefinedVar !== null) {
          undefinedVars.add(leftUndefinedVar);
        }
        if (rightUndefinedVar !== null) {
          undefinedVars.add(rightUndefinedVar);
        }

        // Check if any variable is checked against both null and undefined
        for (const variable of nullVars) {
          if (undefinedVars.has(variable)) {
            context.report({
              node,
              messageId: "checksBoth",
            });
            break;
          }
        }
      },
    };
  },
});

/**
 * Creates the rule configuration for the null/undefined checks rule
 * @returns ESLint rule configuration
 */
export function createNullUndefinedChecksRules(): Record<string, string> {
  return {
    "@reasonabletech/no-null-undefined-checks": "error",
  };
}
