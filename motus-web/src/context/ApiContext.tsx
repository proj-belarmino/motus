/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useMemo } from "react";
import { ApiClient } from "../api/ApiClient";
import { MotusApiClient } from "../api/MotusApiClient";

const ApiContext = createContext<ApiClient | undefined>(undefined);

export const ApiProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const apiClient = useMemo(() => new MotusApiClient(), []);

  return (
    <ApiContext.Provider value={apiClient}>{children}</ApiContext.Provider>
  );
};

export const useApi = (): ApiClient => {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error("useApi must be used within an ApiProvider");
  }
  return context;
};
