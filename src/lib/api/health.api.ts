import { config } from "~/lib/config";
import { fetchAbsolute } from "./api-client";

export interface HealthResponse {
  status: string;
  db: string;
}

export function getHealth(): Promise<HealthResponse> {
  return fetchAbsolute<HealthResponse>(config.api.healthUrl);
}
