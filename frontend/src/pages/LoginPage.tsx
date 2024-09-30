import { FunctionComponent } from "react";
import SignInUpPane from "../components/SignInUpPane";

const LoginPage: FunctionComponent = () => {

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
}

export default LoginPage;