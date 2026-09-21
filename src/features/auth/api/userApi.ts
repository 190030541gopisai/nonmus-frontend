import apiClient from "../../../api/apiClient";

const USERS_PREFIX = "v1/users";

export interface UsernameAvailabilityResult {
  username: string;
  available: boolean;
}

export const checkUsernameAvailability = async (
  username: string,
): Promise<UsernameAvailabilityResult> => {
  const response = await apiClient.get(
    `${USERS_PREFIX}/username/available?username=${encodeURIComponent(username)}`,
  );
  return response.data;
};
