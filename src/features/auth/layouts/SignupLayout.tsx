import type { ReactNode } from "react";
import { BiArrowBack } from "react-icons/bi";
import { Link } from "react-router-dom";

interface SignUpLayoutProps {
  isFirstStep: boolean;
  goToPreviousStep: () => void;
  children: ReactNode;
}

function SignUpLayout({
  isFirstStep,
  goToPreviousStep,
  children,
}: SignUpLayoutProps) {
  return (
    <div className="h-screen">
      <div className="p-8 space-y-4 h-full max-w-sm mx-auto">
        {!isFirstStep && (
          <BiArrowBack onClick={goToPreviousStep} className="h-6 w-6" />
        )}

        <div className="w-full">{children}</div>

        <div className="w-full space-y-4">
          {/* <div className="flex items-center gap-3">
            <div className="flex-1 border-t border-black" />
            <p className="text-sm text-gray-500">or</p>
            <div className="flex-1 border-t border-black" />
          </div>

          <button className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500">
            Continue with google
          </button> */}

          <p className="text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-blue-600 hover:text-blue-700"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default SignUpLayout;
