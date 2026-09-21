import apiClient from "../../../api/apiClient";

const AUTH_PREFIX = "v1/auth";

export interface VerificationCodeResult {
  codeExpiryInSeconds: number;
  resendInSeconds: number;
}

export interface VerifyCodeResult {
  verified: boolean;
}

export const sendVerificationCode = async (
  email: string,
): Promise<VerificationCodeResult> => {
  const response = await apiClient.post(`${AUTH_PREFIX}/email`, { email });
  return response.data;
};

export const verifyCode = async (
  email: string,
  code: string,
): Promise<VerifyCodeResult> => {
  const response = await apiClient.post(`${AUTH_PREFIX}/email/verify`, {
    email,
    code,
  });
  return response.data;
};

export interface SignUpPayload {
  firstName: string;
  lastName: string;
  username: string;
  password: string;
  confirmPassword: string;
}

export interface SignUpResult {
  message: string;
  username: string;
  email: string;
  avatar: string;
}

export const signUp = async (payload: SignUpPayload): Promise<SignUpResult> => {
  const response = await apiClient.post(`${AUTH_PREFIX}/signup`, payload);
  return response.data;
};
