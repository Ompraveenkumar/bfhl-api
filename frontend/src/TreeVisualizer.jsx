import React from "react";

/**
 * Renders a tree node recursively with connector lines.
 */
function TreeNodeComponent({ name, children, prefix = "", isLast = true }) {
  const keys = Object.keys(children);
  const connector = prefix + (isLast ? "└─ " : "├─ ");
  const isLeaf = keys.length === 0;

  return (
    <div className="tree-node">
      <div className="tree-node-row">
        <span className="tree-connector">{connector}</span>
        <div className="tree-node-label">
          <div className="node-dot">{name}</div>
          <span className="node-name">{name}</span>
          {isLeaf && <span className="node-leaf">LEAF</span>}
        </div>
      </div>
      {keys.length > 0 && (
        <div className="tree-children">
          {keys.map((child, idx) => (
            <TreeNodeComponent
              key={child}
              name={child}
              children={children[child]}
              prefix={prefix + (isLast ? "   " : "│  ")}
              isLast={idx === keys.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function TreeVisualizer({ tree, root }) {
  const rootChildren = tree[root] || {};
  const childKeys = Object.keys(rootChildren);
  const isLeaf = childKeys.length === 0;

  return (
    <div className="tree-container">
      {/* Root node */}
      <div className="tree-node">
        <div className="tree-node-row">
          <span className="tree-connector">● </span>
          <div className="tree-node-label">
            <div className="node-dot">[{root}]</div>
            <span className="node-name">{root}</span>
            <span className="node-leaf" style={{ borderStyle: "dashed" }}>ROOT</span>
            {isLeaf && <span className="node-leaf">LEAF</span>}
          </div>
        </div>

        {childKeys.length > 0 && (
          <div className="tree-children">
            {childKeys.map((child, idx) => (
              <TreeNodeComponent
                key={child}
                name={child}
                children={rootChildren[child]}
                prefix=""
                isLast={idx === childKeys.length - 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
