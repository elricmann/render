// Copyright (c) 2024 Elric Neumann. All rights reserved. MIT license.
import * as t from "@babel/types";
import { PluginObj } from "@babel/core";

type JSXChild =
  | t.JSXText
  | t.JSXElement
  | t.JSXFragment
  | t.JSXExpressionContainer
  | t.JSXSpreadChild;

type FnExpr = t.ArrowFunctionExpression | t.FunctionExpression;

const transformAttributes = (
  attributes: (t.JSXAttribute | t.JSXSpreadAttribute)[]
) => {
  return attributes
    .map((attr) => {
      if (t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name)) {
        const attributeName = attr.name.name;

        if (attributeName.startsWith("on") && attributeName.length > 2) {
          const eventName =
            attributeName.charAt(2).toLowerCase() + attributeName.slice(3);
          return {
            method: "on",
            args: [
              t.stringLiteral(eventName),
              (attr.value as t.JSXExpressionContainer)?.expression as FnExpr,
            ],
          };
        } else {
          return {
            method: "attr",
            args: [t.stringLiteral(attributeName), attr.value],
          };
        }
      }

      return null;
    })
    .filter(Boolean);
};

const transformChildren = (children: JSXChild[]) => {
  return children
    .map((child) => {
      if (t.isJSXText(child)) {
        if (!child.value || /^\s*$/.test(child.value)) return null;
        return t.newExpression(t.identifier("Text"), [
          t.stringLiteral(child.value.trim()),
        ]);
      } else if (
        t.isJSXExpressionContainer(child) &&
        t.isExpression(child.expression)
      ) {
        return child.expression;
      } else if (t.isJSXElement(child)) {
        return transformElement(child);
      }
      return null;
    })
    .filter(Boolean) as t.Expression[];
};

const methodsChain = (baseExpr: t.Expression, methods: any[]) => {
  return methods.reduce(
    (expr, method) =>
      t.callExpression(
        t.memberExpression(expr, t.identifier(method.method)),
        method.args
      ),
    baseExpr
  );
};

const transformElement = (element: t.JSXElement) => {
  const openingElement = element.openingElement;
  const tagName = (openingElement.name as t.JSXIdentifier).name;

  const children = transformChildren(element.children);
  const baseContainer = t.callExpression(
    t.memberExpression(
      t.newExpression(t.identifier("Container"), [t.arrayExpression(children)]),
      t.identifier("tagName")
    ),
    [
      t.memberExpression(
        t.identifier("Container"),
        t.identifier(tagName.toUpperCase())
      ),
    ]
  );

  const attributes = transformAttributes(openingElement.attributes);
  return methodsChain(baseContainer, attributes);
};

const transformJSXPlugin = (): PluginObj => {
  return {
    name: "render-plugin-transform-jsx",
    visitor: {
      JSXElement(path) {
        const transformedElement = transformElement(path.node);
        path.replaceWith(transformedElement);
      },
    },
  };
};

export default transformJSXPlugin;
