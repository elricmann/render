// Copyright (c) 2024 Elric Neumann. All rights reserved. MIT license.
import * as t from "@babel/types";
import { PluginObj } from "@babel/core";

type JSXChild =
  | t.JSXText
  | t.JSXElement
  | t.JSXFragment
  | t.JSXExpressionContainer
  | t.JSXSpreadChild;

interface Text {
  new (value: string): Text;
}

interface Container {
  new (children: any[]): Container;
  tagName(tag: string): Container;
}

const nonContainerElements = ["a", "input", "button"];
const isContainer = (ident: string) => !nonContainerElements.includes(ident);

const transformChildren = (children: JSXChild[]): t.Expression[] => {
  return children
    .map((child) => {
      if (t.isJSXText(child)) {
        return t.newExpression(t.identifier("Text"), [
          t.stringLiteral(child.value.trim()),
        ]);
      } else if (
        t.isJSXExpressionContainer(child) &&
        t.isExpression(child.expression)
      ) {
        return child.expression;
      } else if (t.isJSXElement(child)) {
        const tagName = (child.openingElement.name as t.JSXIdentifier).name;
        const nestedChildren = transformChildren(child.children);
        const nestedContainerExpr = t.newExpression(t.identifier("Container"), [
          t.arrayExpression(nestedChildren),
        ]);

        return t.callExpression(
          t.memberExpression(nestedContainerExpr, t.identifier("tagName")),
          [
            t.memberExpression(
              t.identifier("Container"),
              t.identifier(tagName.toUpperCase())
            ),
          ]
        );
      }

      return null;
    })
    .filter(Boolean) as t.Expression[];
};

const transformJSXPlugin = (): PluginObj => {
  return {
    name: "librender-plugin-transform-jsx",
    visitor: {
      JSXElement(path) {
        const openingElement = path.node.openingElement;
        const tagName = (openingElement.name as t.JSXIdentifier).name;
        const children = transformChildren(path.node.children);

        const containerExpr = t.newExpression(t.identifier("Container"), [
          t.arrayExpression(children),
        ]);

        const taggedContainerExpr = t.callExpression(
          t.memberExpression(containerExpr, t.identifier("tagName")),
          [
            t.memberExpression(
              t.identifier("Container"),
              t.identifier(tagName.toUpperCase())
            ),
          ]
        );

        path.replaceWith(t.expressionStatement(taggedContainerExpr));
      },
    },
  };
};

export default transformJSXPlugin;
