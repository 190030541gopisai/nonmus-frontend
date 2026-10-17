# Nonmus Frontend — Claude Code Guidelines

## Code Style

### useEffect
Every `useEffect` must have a comment explaining **why** it exists (not just what it does).

```tsx
// Decrement per-email cooldown countdown every second
useEffect(() => {
  const id = setInterval(() => { ... }, 1000);
  return () => clearInterval(id);
}, []);
```

Bad — no comment:
```tsx
useEffect(() => {
  fetchUser();
}, [userId]);
```

Good:
```tsx
// Fetch user profile whenever userId changes
useEffect(() => {
  fetchUser();
}, [userId]);
```
