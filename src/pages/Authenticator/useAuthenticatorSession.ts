import React from "react";
import { useAuthenticatorLoginMutation } from "../../redux/api/authenticator";
import { extractAuthToken, getToken, setToken as setAuthToken } from "../../utils/auth";

export const AUTHENTICATOR_AUTO_LOGIN_CREDENTIALS = {
  username: "TPLSR0140",
  password: "elecon",
};

export const useAuthenticatorSession = () => {
  const [sessionReady, setSessionReady] = React.useState(false);
  const [bootstrapping, setBootstrapping] = React.useState(true);
  const [autoLoginError, setAutoLoginError] = React.useState("");
  const [authenticatorLogin] = useAuthenticatorLoginMutation();

  React.useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      try {
        setAutoLoginError("");

        const loginResponse = await authenticatorLogin(
          AUTHENTICATOR_AUTO_LOGIN_CREDENTIALS,
        ).unwrap();
        const token =
          extractAuthToken(loginResponse) ||
          loginResponse?.data?.token ||
          getToken();

        if (!token) {
          throw new Error("Authenticator auto-login token not found.");
        }

        localStorage.setItem(
          "loginIdentifier",
          AUTHENTICATOR_AUTO_LOGIN_CREDENTIALS.username,
        );
        setAuthToken(token);

        if (isMounted) {
          setSessionReady(true);
        }
      } catch (error) {
        console.error("Failed to initialize authenticator module", error);

        if (isMounted) {
          setAutoLoginError("Authenticator auto-login failed.");
          setSessionReady(false);
        }
      } finally {
        if (isMounted) {
          setBootstrapping(false);
        }
      }
    };

    void bootstrap();

    return () => {
      isMounted = false;
    };
  }, [authenticatorLogin]);

  return {
    sessionReady,
    bootstrapping,
    autoLoginError,
  };
};
