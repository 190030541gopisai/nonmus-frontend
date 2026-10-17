export const forgotPasswordSteps = [
  {
    id: "email",
    next: "verify",
    previous: null,
  },
  {
    id: "verify",
    next: "reset",
    previous: "email",
  },
  {
    id: "reset",
    next: null,
    previous: "verify",
  },
] as const;
