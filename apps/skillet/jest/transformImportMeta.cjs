module.exports = function transformImportMeta({ types: t }) {
  return {
    visitor: {
      MetaProperty(path) {
        if (path.node.meta.name === "import" && path.node.property.name === "meta") {
          path.replaceWith(
            t.objectExpression([
              t.objectProperty(
                t.identifier("url"),
                t.memberExpression(
                  t.callExpression(
                    t.memberExpression(
                      t.callExpression(t.identifier("require"), [t.stringLiteral("url")]),
                      t.identifier("pathToFileURL")
                    ),
                    [t.identifier("__filename")]
                  ),
                  t.identifier("href")
                )
              ),
              t.objectProperty(
                t.identifier("env"),
                t.memberExpression(t.identifier("process"), t.identifier("env"))
              ),
            ])
          );
        }
      },
    },
  };
};
