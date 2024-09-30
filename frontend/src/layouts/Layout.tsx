import { FunctionComponent } from "react";
import { Outlet } from "react-router-dom";

const Layout:FunctionComponent = () => {
    return (
        <div className="flex flex-col w-screen h-screen">
            <div className="header flex w-full h-12 p-2 bg-gray-300 shadow-lg">
                <div className="flex justify-center items-center companyLogo h-full">
                    <a href="/"><img className="w-28 h-fit" src="/logo.jpg" /></a>
                </div>
            </div>
            <div className="flex w-full grow">
                <Outlet />
            </div>
        </div>
    );
}

export default Layout;