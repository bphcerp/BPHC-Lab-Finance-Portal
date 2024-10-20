import { HiChartPie } from "react-icons/hi";
import { IoCashOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";

interface SidebarProps {
  isOpen: boolean;
}

const SidebarComponent: React.FC<SidebarProps> = ({ isOpen }) => {
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
      className={`fixed top-0 left-0 h-full w-64 bg-gray-100 text-gray-900 flex flex-col shadow-md transform transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex items-center justify-center h-16 border-b border-gray-300">
        <h1 className="text-xl font-bold">Dashboard</h1>
      </div>
      <nav className="flex flex-col flex-grow mt-4">
        <a
          href="/dashboard"
          className="flex items-center px-4 py-3 hover:bg-gray-200 rounded-lg mx-3 mb-2 transition"
        >
          <HiChartPie size="24" className="mr-3" />
          <span className="text-lg font-semibold">Dashboard</span>
        </a>
        <a
          href="/expenses"
          className="flex items-center px-4 py-3 hover:bg-gray-200 rounded-lg mx-3 mb-2 transition"
        >
          <IoCashOutline size="24" className="mr-3" />
          <span className="text-lg font-semibold">Expenses</span>
        </a>
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
