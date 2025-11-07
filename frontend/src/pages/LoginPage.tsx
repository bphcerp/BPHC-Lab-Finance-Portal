import { FunctionComponent } from "react";
import SignInUpPane from "../components/SignInUpPane";
import { Navigate, useSearchParams } from "react-router";
import { useUser } from "../context/UserContext";

const LoginPage: FunctionComponent = () => {
  const { isAuthenticated, loading } = useUser();
  const [searchParams] = useSearchParams();

  if (!loading && isAuthenticated) {
    return <Navigate to={searchParams.get("next") ?? "/dashboard"} />;
  }

  return (
    <div className="loginPage flex w-screen h-screen">
      <div className="flex justify-center items-center w-[40%] h-full bg-gray-200">
        <SignInUpPane />
      </div>
      <div className="flex justify-center items-center w-[60%] h-full">
        <img className="h-full" src="/banner.jpg" />
      </div>
    </div>
  );
};

export default LoginPage;
