# BFHL Node Hierarchy Analyzer

A full-stack application built to process hierarchical node relationships, detect cycles, build trees, and return structured insights.

## Architecture
- **Backend**: Node.js + Express
  - Features: Multi-parent resolution (first-wins), cycle detection via DFS, graph mapping, and tree construction.
- **Frontend**: React + Vite
  - Features: Retro Cyberpunk Terminal UI, ASCII block data modeling, instant JSON visualization, and interactive quick-example switchboards.

---

## 🚀 Quick Start (Local Setup)

### 1. Prerequisites
- Node.js `v16+` or higher
- npm or yarn

### 2. Backend Setup
```bash
cd backend
npm install
npm start
```
*Note: Due to macOS services often occupying port 5000, the backend defaults to `5001`. The server will print: `✅ BFHL Backend running on http://localhost:5001`*

### 3. Frontend Setup
Open a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
*The React app will open on `http://localhost:5173`.*

---

## ☁️ Deployments

This project has been fully deployed natively to **Render** (Backend API) and **Vercel** (Frontend React Application).

### Deploying the Backend (to Render)
1. Push the repository to GitHub.
2. Sign in to your preferred hosting provider (e.g., Render, Railway).
3. Create a **New Web Service**.
4. Point to the `backend` directory (or use the provided `Procfile`).
5. **Build Command**: `npm install`
6. **Start Command**: `npm start`
7. Ensure PORT environment variable is automatically assigned or set to 5000.
8. Once deployed, note down the deployed API URL.

### Deploying the Frontend (to Vercel)
1. On Vercel, create a new site and connect your GitHub repository.
2. Set the **Root Directory** to `frontend`.
3. **Build Command**: `npm run build`
4. **Publish Directory**: `dist`
5. **Environment Variables**: Add `VITE_API_URL` and set its value to your Render backend API URL (e.g., `https://ompraveenkumar-bfhl.onrender.com`).
6. Deploy the site.

*(Note: The frontend architecture natively binds this URL explicitly via `import.meta.env.VITE_API_URL` inside `App.jsx` avoiding static hardcoding of routes).*

---

## 🧪 Example Test Cases

Here are various scenarios handled by the API:

### Test Case 1: Simple Tree (Normal)
**Payload:**
```json
{
  "data": ["A->B", "A->C", "B->D"]
}
```
**Expected Behavior:** Builds a tree with root A, depth 3.

### Test Case 2: Deep Chain (Linear)
**Payload:**
```json
{
  "data": ["A->B", "B->C", "C->D", "D->E"]
}
```
**Expected Behavior:** Creates a straight path tree with one branch mapping depth 5.

### Test Case 3: Ignored Edges (Invalid & Duplicates)
**Payload:**
```json
{
  "data": ["A->B", "hello", "1->2", "A->A", "AB->C", "A->C", "A->B"]
}
```
**Expected Behavior:** Rejects strings not matching X->Y, rejects self-loops (`A->A`), and marks the second `A->B` occurrence under `duplicate_edges`. Leaves only valid edges.

### Test Case 4: Multiple Parents
**Payload:**
```json
{
  "data": ["A->B", "C->B"]
}
```
**Expected Behavior:** First parent wins. `A->B` is validated. `C->B` is ignored for tree construction.

### Test Case 5: Circular Dependency (Cycle)
**Payload:**
```json
{
  "data": ["A->B", "B->C", "C->A"]
}
```
**Expected Behavior:** DFS catches the cycle. Highlights `has_cycle: true`, returns no valid tree, increments `total_cycles`, and isolates the component without breaking the server.

### Test Case 6: Multiple Disconnected Roots
**Payload:**
```json
{
  "data": ["A->B", "D->E", "D->F"]
}
```
**Expected Behavior:** Distinguishes 2 isolated valid trees (Root `A` and Root `D`) and returns them separately within `hierarchies`. Calculates the largest tree root appropriately.
