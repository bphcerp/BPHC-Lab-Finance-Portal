import { HiChartPie } from "react-icons/hi";
import { IoCashOutline } from "react-icons/io5";
import { MdCallReceived, MdWorkOutline, MdAccountCircle, MdOutlineSavings } from "react-icons/md"
import { FaBuildingColumns } from "react-icons/fa6";
import { IoSettingsOutline } from "react-icons/io5";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
}

const SidebarComponent: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const navigate = useNavigate()

  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false)

  const handleLogout = () => {
    fetch(`${import.meta.env.VITE_BACKEND_URL}/user/logout`, {
      method: "POST",
      credentials: "include",
    });
    navigate("/login");
  };

  return (
    <div
      className={`fixed z-10 top-16 left-0 w-64 h-[calc(100vh-4rem)] bg-gray-100 text-gray-900 flex flex-col shadow-md transform transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
    >
      <nav className="flex flex-col flex-grow mt-4" >
        <Link
          to="/dashboard"
          className="flex items-center px-4 py-3 hover:bg-gray-200 rounded-lg mx-3 mb-2 transition"
        >
          <HiChartPie size="24" className="mr-3" />
          <span className="text-lg font-semibold">Dashboard</span>
        </Link>
        <Link
          to="/projects"
          className="flex items-center px-4 py-3 hover:bg-gray-200 rounded-lg mx-3 mb-2 transition"
        >
          <MdWorkOutline size="24" className="mr-3" />
          <span className="text-lg font-semibold">Projects</span>
        </Link>
        <Link
          to="/expenses"
          className="flex items-center px-4 py-3 hover:bg-gray-200 rounded-lg mx-3 mb-2 transition"
        >
          <IoCashOutline size="24" className="mr-3" />
          <span className="text-lg font-semibold">Expenses</span>
        </Link>
        <Link
          to="/reimbursements"
          className="flex items-center px-4 py-3 hover:bg-gray-200 rounded-lg mx-3 mb-2 transition"
        >
          <MdCallReceived size="24" className="mr-3" />
          <span className="text-lg font-semibold">Reimbursements</span>
        </Link>
        <div className="w-full max-w-sm mx-auto">
          <button
            onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
            className={`flex items-center px-7 py-3 w-full hover:bg-gray-200 ${isAccountMenuOpen?"bg-gray-200":""} transition-colors duration-200 ease-in-out`}
          >
            <MdAccountCircle size="24" className="mr-3" />
            <span className="text-lg font-semibold">Account</span>
          </button>

          <div
            className={`flex justify-center bg-gray-200 overflow-hidden transition-all duration-300 ease-in-out ${isAccountMenuOpen ? "h-32" : "h-0"}`}
          >
            <div className="grid grid-rows-2 mb-2">
              <Link
                to="/savings"
                className="flex items-center px-7 py-3 hover:bg-gray-300 rounded-lg transition"
              >
                <MdOutlineSavings size="24" className="mr-3" />
                <span className="text-lg font-semibold">Savings</span>
              </Link>
              <Link
                to="/current"
                className="flex items-center px-7 py-3 hover:bg-gray-300 rounded-lg transition"
              >
                <FaBuildingColumns size="24" className="mr-3" />
                <span className="text-lg font-semibold">Current</span>
              </Link>
            </div>
          </div>
        </div>
        <Link
          to="/admin"
          className="flex items-center px-4 py-3 hover:bg-gray-200 rounded-lg mx-3 mb-2 transition"
        >
          <IoSettingsOutline size="24" className="mr-3" />
          <span className="text-lg font-semibold">Admin</span>
        </Link>

      </nav>
      <div className="px-4 py-3 border-t border-gray-300">
        <button className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-lg transition" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default SidebarComponent;
