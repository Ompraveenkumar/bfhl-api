const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// ─── Constants ────────────────────────────────────────────────────────────────
const USER_ID = "ompraveenkumard_11102005";
const EMAIL_ID = "od9035@srmist.edu.in";
const COLLEGE_ROLL_NUMBER = "RA2311030050030";

// ─── Validators ───────────────────────────────────────────────────────────────
/**
 * Validates a single edge string.
 * Returns { valid: boolean, reason?: string, from?: string, to?: string }
 */
function validateEdge(entry) {
  if (typeof entry !== "string" || entry.trim() === "") {
    return { valid: false, reason: "empty or non-string" };
  }

  const trimmed = entry.trim();

  // Must match exactly X->Y pattern
  const match = trimmed.match(/^([A-Z])->([A-Z])$/);
  if (!match) {
    return { valid: false, reason: "invalid format" };
  }

  const from = match[1];
  const to = match[2];

  // Self-loop check
  if (from === to) {
    return { valid: false, reason: "self-loop" };
  }

  return { valid: true, from, to };
}

// ─── Graph Builder ────────────────────────────────────────────────────────────
/**
 * Processes raw data array and returns:
 *  - adjacency list (first-parent wins, duplicates filtered)
 *  - invalid_entries
 *  - duplicate_edges
 */
function buildGraph(data) {
  const invalid_entries = [];
  const duplicate_edges = [];
  const edgeSet = new Set(); // "X->Y" for dedup tracking
  const children = new Map(); // node -> [child1, child2, ...]
  const parentMap = new Map(); // child -> first parent

  for (const entry of data) {
    const result = validateEdge(entry);

    if (!result.valid) {
      invalid_entries.push(entry);
      continue;
    }

    const { from, to } = result;
    const edgeKey = `${from}->${to}`;

    // Duplicate check
    if (edgeSet.has(edgeKey)) {
      // Only store once per repeated edge
      if (!duplicate_edges.includes(edgeKey)) {
        duplicate_edges.push(edgeKey);
      }
      continue;
    }

    edgeSet.add(edgeKey);

    // Multi-parent rule: first parent wins for a given child
    if (parentMap.has(to)) {
      // Ignore subsequent parents for same child
      continue;
    }

    parentMap.set(to, from);

    if (!children.has(from)) children.set(from, []);
    children.get(from).push(to);

    // Ensure `to` node exists in map too
    if (!children.has(to)) children.set(to, []);
  }

  return { children, parentMap, invalid_entries, duplicate_edges };
}

// ─── Cycle Detection ──────────────────────────────────────────────────────────
/**
 * Detects cycles in the graph using DFS.
 * Returns Set of nodes that are part of cycles.
 */
function detectCycles(children) {
  const allNodes = new Set(children.keys());
  const visited = new Set();
  const recStack = new Set();
  const cycleNodes = new Set();

  function dfs(node) {
    visited.add(node);
    recStack.add(node);

    const neighbors = children.get(node) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) {
          cycleNodes.add(node);
          return true;
        }
      } else if (recStack.has(neighbor)) {
        cycleNodes.add(node);
        cycleNodes.add(neighbor);
        return true;
      }
    }

    recStack.delete(node);
    return false;
  }

  for (const node of allNodes) {
    if (!visited.has(node)) {
      dfs(node);
    }
  }

  return cycleNodes;
}

// ─── Tree Builder ─────────────────────────────────────────────────────────────
/**
 * Recursively builds a nested tree object from root.
 */
function buildTree(node, children, visited = new Set()) {
  if (visited.has(node)) return {}; // cycle guard
  visited.add(node);

  const obj = {};
  const nodeChildren = children.get(node) || [];
  for (const child of nodeChildren) {
    obj[child] = buildTree(child, children, new Set(visited));
  }
  return obj;
}

/**
 * Calculates the depth (longest root-to-leaf path, counting nodes).
 */
function calcDepth(node, children, memo = new Map()) {
  if (memo.has(node)) return memo.get(node);

  const nodeChildren = children.get(node) || [];
  if (nodeChildren.length === 0) {
    memo.set(node, 1);
    return 1;
  }

  let max = 0;
  for (const child of nodeChildren) {
    max = Math.max(max, calcDepth(child, children, memo));
  }

  const depth = 1 + max;
  memo.set(node, depth);
  return depth;
}

// ─── Main Processing ──────────────────────────────────────────────────────────
function processData(data) {
  const { children, parentMap, invalid_entries, duplicate_edges } =
    buildGraph(data);

  const allNodes = new Set(children.keys());

  if (allNodes.size === 0) {
    return {
      user_id: USER_ID,
      email_id: EMAIL_ID,
      college_roll_number: COLLEGE_ROLL_NUMBER,
      hierarchies: [],
      invalid_entries,
      duplicate_edges,
      summary: {
        total_trees: 0,
        total_cycles: 0,
        largest_tree_root: "",
      },
    };
  }

  // Detect cycle nodes
  const cycleNodes = detectCycles(children);

  // Find roots: nodes that are never a child
  const childSet = new Set(parentMap.keys());

  // Group nodes into connected components using undirected adjacency
  const undirected = new Map();
  for (const node of allNodes) {
    if (!undirected.has(node)) undirected.set(node, new Set());
  }
  for (const [parent, kids] of children.entries()) {
    for (const kid of kids) {
      undirected.get(parent).add(kid);
      undirected.get(kid).add(parent);
    }
  }

  const componentVisited = new Set();
  const components = [];

  function bfsComponent(start) {
    const queue = [start];
    const comp = new Set();
    componentVisited.add(start);
    while (queue.length) {
      const n = queue.shift();
      comp.add(n);
      for (const neighbor of undirected.get(n) || []) {
        if (!componentVisited.has(neighbor)) {
          componentVisited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }
    return comp;
  }

  for (const node of allNodes) {
    if (!componentVisited.has(node)) {
      components.push(bfsComponent(node));
    }
  }

  const hierarchies = [];

  for (const component of components) {
    // Check if any node in this component has a cycle
    const compHasCycle = [...component].some((n) => cycleNodes.has(n));

    // Find root(s) of this component: nodes not in childSet
    const compRoots = [...component]
      .filter((n) => !childSet.has(n))
      .sort();

    if (compHasCycle) {
      // If no root found (all are children), pick lexicographically smallest
      const root =
        compRoots.length > 0
          ? compRoots[0]
          : [...component].sort()[0];

      hierarchies.push({
        root,
        tree: {},
        has_cycle: true,
      });
    } else {
      // Non-cyclic component — may have multiple roots (disconnected sub-graphs within component shouldn't happen, but handle gracefully)
      const roots = compRoots.length > 0
        ? compRoots
        : [[...component].sort()[0]];

      for (const root of roots) {
        const tree = { [root]: buildTree(root, children) };
        const depth = calcDepth(root, children);
        hierarchies.push({ root, tree, depth });
      }
    }
  }

  // Summary
  const validTrees = hierarchies.filter((h) => !h.has_cycle);
  const cyclicTrees = hierarchies.filter((h) => h.has_cycle);

  let largest_tree_root = "";
  if (validTrees.length > 0) {
    let maxDepth = -1;
    for (const h of validTrees) {
      if (
        h.depth > maxDepth ||
        (h.depth === maxDepth && h.root < largest_tree_root)
      ) {
        maxDepth = h.depth;
        largest_tree_root = h.root;
      }
    }
  }

  return {
    user_id: USER_ID,
    email_id: EMAIL_ID,
    college_roll_number: COLLEGE_ROLL_NUMBER,
    hierarchies,
    invalid_entries,
    duplicate_edges,
    summary: {
      total_trees: validTrees.length,
      total_cycles: cyclicTrees.length,
      largest_tree_root,
    },
  };
}

// ─── Routes ───────────────────────────────────────────────────────────────────
app.post("/bfhl", (req, res) => {
  try {
    const { data } = req.body;

    if (!Array.isArray(data)) {
      return res.status(400).json({ error: "`data` must be an array" });
    }

    const result = processData(data);
    return res.status(200).json(result);
  } catch (err) {
    console.error("Error processing request:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/", (req, res) => {
  res.json({ status: "BFHL API is running", endpoint: "POST /bfhl" });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`✅ BFHL Backend running on http://localhost:${PORT}`);
});
