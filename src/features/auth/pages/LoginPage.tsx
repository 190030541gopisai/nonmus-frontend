import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../api/authApi";
import { LoginSchema, type LoginFormData } from "../validation/login.schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

function LoginPage() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      credential: "",
      password: "",
    },
    mode: "onSubmit",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = handleSubmit(async (data) => {
    setIsSubmitting(true);
    try {
      await login(data);
      void navigate("/");
    } catch (err: unknown) {
      const axiosError = err as {
        response?: { data?: { error?: string; message?: string } };
      };
      const data_ = axiosError?.response?.data;

      if (
        data_?.error === "MISSING_COOKIE" ||
        data_?.error === "INVALID_VERIFICATION_TOKEN"
      ) {
        window.location.href = "/login";
        return;
      }

      setError("root", {
        message: data_?.message ?? "Login failed. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <div className="h-screen">
      <div className="p-8 space-y-4 h-full max-w-sm mx-auto">
        <div className="w-full">
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="credential"
                className="block text-sm font-medium mb-1"
              >
                Email / Username <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="credential"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register("credential")}
              />
              {errors.credential && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.credential.message}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-1"
              >
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-2 flex items-center text-sm text-gray-500"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gray-600 text-white py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Logging in..." : "Login"}
            </button>
            {errors.root && (
              <p className="text-sm text-red-500">{errors.root.message}</p>
            )}
          </form>
        </div>

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
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="font-medium text-blue-600 hover:text-blue-700"
            >
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
