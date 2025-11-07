import { BrowserRouter, Routes, Route } from "react-router";
import MembersView from "./components/MembersView";
import NotFound from "./components/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import ExpensesLayout from "./layouts/ExpenseLayout";
import Layout from "./layouts/Layout";
import AccountPage from "./pages/AccountPage";
import AdminPage from "./pages/AdminPage";
import DashBoard from "./pages/Dashboard";
import DeveloperPage from "./pages/DeveloperPage";
import ExpensesPage from "./pages/Expenses";
import { InstituteExpensesPage } from "./pages/InstituteExpenses";
import LoginPage from "./pages/LoginPage";
import PDAccountPage from "./pages/PDAccountPage";
import ProjectDetails from "./pages/ProjectDetails";
import ProjectOverview from "./pages/ProjectOverview";
import { ProjectSAViewer } from "./pages/ProjectSAViewer";
import ReimbursementPage from "./pages/Reimbursement";
import { useUser } from "./context/UserContext";

export const Routing = () => {
  const { isAdmin, isAuthenticated, loading } = useUser();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ProtectedRoute homePage={true} />} />
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashBoard />} />
          <Route path="/projects" element={<ProjectOverview />} />
          <Route path="/project/:id" element={<ProjectDetails />} />
          <Route
            path="/project/:id/accounts/pdfviewer"
            element={<ProjectSAViewer />}
          />
          <Route path="/expenses" element={<ExpensesLayout />}>
            <Route index element={<ExpensesPage />} />
            <Route path="member-wise" element={<MembersView />} />
            <Route path="institute" element={<InstituteExpensesPage />} />
          </Route>
          <Route path="/reimbursements" element={<ReimbursementPage />} />
          {!loading && isAuthenticated && isAdmin && (
            <Route path="/admin" element={<AdminPage />} />
          )}
          <Route
            path="/account/savings"
            element={<AccountPage type="Savings" />}
          />
          <Route
            path="/account/current"
            element={<AccountPage type="Current" />}
          />
          <Route path="/pda" element={<PDAccountPage type="PDA" />} />
          <Route path="/pdf" element={<PDAccountPage type="PDF" />} />
          <Route path="/developers" element={<DeveloperPage />} />
        </Route>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};
