import { FunctionComponent } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";

const ExpensesLayout: FunctionComponent = () => {
    const location = useLocation();
    const isMembersView = location.pathname.includes("/member-wise");

    return (
        <div className="flex flex-col w-full grow">
            <Link className="ml-4 mt-3 hover:underline text-blue-600" to={isMembersView ? "/expenses" : "/expenses/member-wise"}>
                {isMembersView ? "Show All Expenses" : "Show Members View"}
            </Link>
            <Outlet />
        </div>
    );
};

export default ExpensesLayout;