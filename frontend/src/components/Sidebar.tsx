import { HiChartPie } from "react-icons/hi";
import { IoCashOutline } from "react-icons/io5";
import { MdCallReceived } from "react-icons/md"
import { Link, useNavigate } from "react-router-dom";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen : React.Dispatch<React.SetStateAction<boolean>>
}

const SidebarComponent: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const navigate = useNavigate()

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
      <nav className="flex flex-col flex-grow mt-4" onClick={() => setIsOpen(false)}>
        <Link
          to="/dashboard"
          className="flex items-center px-4 py-3 hover:bg-gray-200 rounded-lg mx-3 mb-2 transition"
        >
          <HiChartPie size="24" className="mr-3" />
          <span className="text-lg font-semibold">Dashboard</span>
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
