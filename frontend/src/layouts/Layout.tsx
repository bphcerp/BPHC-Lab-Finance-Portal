import { FunctionComponent } from "react";
import { Outlet, useNavigate } from "react-router-dom";

const Layout:FunctionComponent = () => {

    const navigate = useNavigate()

    const handleLogout = () => {
        fetch(`${import.meta.env.VITE_BACKEND_URL}/user/logout`, {
            method : "POST",
            credentials : "include"
        })
        navigate("/login")
    }

    return (
        <div className="flex flex-col w-screen h-screen">
            <div className="header relative flex w-full h-12 p-2 bg-gray-300 shadow-lg">
                <div className="flex justify-center items-center companyLogo h-full">
                    <a href="/"><img className="w-28 h-fit" src="/logo.jpg" /></a>
                </div>
                <div className="absolute right-3">
                    <button onClick={handleLogout} className="text-red-600 hover:underline hover:cursor-pointer">Logout</button>
                </div>
            </div>
            <div className="flex w-full grow">
                <Outlet />
            </div>
        </div>
    );
}

export default Layout;