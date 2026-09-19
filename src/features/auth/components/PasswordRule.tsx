interface PasswordRuleProps {
  valid: boolean;
  text: string;
}

function PasswordRule({ valid, text }: PasswordRuleProps) {
  return (
    <div className="flex items-start gap-2">
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all duration-200 ${
          valid
            ? "border-green-500 bg-green-500 text-white"
            : "border-gray-300 bg-gray-50"
        }`}
      >
        {valid && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-3.5 w-3.5"
          >
            <path
              fillRule="evenodd"
              d="M16.704 5.29a1 1 0 010 1.42l-7.25 7.25a1 1 0 01-1.415 0l-3.25-3.25a1 1 0 111.415-1.42l2.543 2.544 6.543-6.544a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </span>
      <span>{text}</span>
    </div>
  );
}

export default PasswordRule;
