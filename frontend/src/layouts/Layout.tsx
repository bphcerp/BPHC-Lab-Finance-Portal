import { FunctionComponent, useEffect, useState } from "react";
import { Link, Outlet } from "react-router";
import { RxHamburgerMenu, RxCross2 } from "react-icons/rx";
import SidebarComponent from "../components/Sidebar";
import NewFinancialYearModal from "../components/NewFinancialYearModal";
import OutsideClickHandler from "react-outside-click-handler";

const Layout: FunctionComponent = () => {
  const [isSideBarOpen, setISSideBarOpen] = useState(false);
  const [isReset, setIsReset] = useState(false);

  useEffect(() => {
    setIsReset(new Date().getMonth() === 3 && new Date().getDate() === 1);
  }, []);

  return (
    <div className="flex flex-col w-screen h-screen">
      <NewFinancialYearModal
        isOpen={isReset}
        onClose={() => setIsReset(false)}
      />
      <OutsideClickHandler onOutsideClick={() => setISSideBarOpen(false)}>
        <SidebarComponent isOpen={isSideBarOpen} setIsOpen={setISSideBarOpen} />
      </OutsideClickHandler>
      <div className="header relative shrink-0 shadow-lg z-10 flex w-full h-14 px-4 bg-gray-100 items-center justify-between">
        <div className="flex items-center space-x-3">
          {isSideBarOpen ? (
            <RxCross2
              className="hover:cursor-pointer"
              onClick={() => setISSideBarOpen(false)}
              size="30px"
            />
          ) : (
            <RxHamburgerMenu
              className="hover:cursor-pointer"
              onClick={() => setISSideBarOpen(true)}
              size="30px"
            />
          )}
          {import.meta.env.VITE_LOGO_AVAILABLE === "true" ? (
            <Link to="/" className="flex items-center">
              <img
                className="w-32 h-auto"
                src="/logo.jpg"
                alt={`${import.meta.env.VITE_LAB_NAME} Logo`}
              />
            </Link>
          ) : (
            <Link to="/" className="flex items-center">
              <span className="text-xl tracking-widest text-gray-600">
                {import.meta.env.VITE_LAB_NAME}
              </span>
            </Link>
          )}
        </div>
      </div>
      <div className="flex w-screen grow overflow-y-auto p-2">
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;
