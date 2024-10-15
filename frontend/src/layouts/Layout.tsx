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
            <div className="header relative flex w-full h-14 px-4 bg-gray-100 shadow-lg items-center justify-between">
                <div className="flex items-center">
                    <a href="/" className="flex items-center">
                        <img className="w-32 h-auto" src="/logo.jpg" alt="Company Logo" />
                    </a>
                </div>
                <div className="flex items-center">
                    <button 
                        onClick={handleLogout} 
                        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 hover:shadow-md transition-all duration-200"
                    >
                        Logout
                    </button>
                </div>
            </div>
            <div className="flex w-full grow">
                <Outlet />
            </div>
        </div>
    );
}

export default Layout;