// Import necessary React and Next.js dependencies
import { Suspense } from "react";
// Import data fetching actions
import { getUserAccounts } from "@/actions/dashboard";
import { getDashboardData } from "@/actions/dashboard";
import { getCurrentBudget } from "@/actions/budget";
// Import UI components
import { AccountCard } from "./_components/account-card";
import { CreateAccountDrawer } from "@/components/create-account-drawer";
import { BudgetProgress } from "./_components/budget-progress";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { DashboardOverview } from "./_components/transaction-overview";

/**
 * DashboardPage - Server Component
 * Main dashboard view that displays:
 * - Budget progress for the default account
 * - Transaction overview with insights
 * - List of user accounts with creation option
 *
 * @returns {JSX.Element} Dashboard page with financial overview
 */
export default async function DashboardPage() {
  // Fetch accounts and transaction data in parallel for better performance
  const [accounts, transactions] = await Promise.all([
    getUserAccounts(),
    getDashboardData(),
  ]);

  // Find the user's default account (if any)
  const defaultAccount = accounts?.find((account) => account.isDefault);

  // Get budget for default account
  let budgetData = null;
  if (defaultAccount) {
    budgetData = await getCurrentBudget(defaultAccount.id);
  }

  return (
    <div className="space-y-8">
      {/* Budget Progress - Shows spending vs budget for the default account */}
      <BudgetProgress
        initialBudget={budgetData?.budget}
        currentExpenses={budgetData?.currentExpenses || 0}
      />

      {/* Dashboard Overview - Displays charts and transaction summary */}
      <DashboardOverview
        accounts={accounts}
        transactions={transactions || []}
      />

      {/* Accounts Grid - Displays all user accounts and "Add New" option */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* "Add New Account" card with drawer functionality */}
        <CreateAccountDrawer>
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-dashed">
            <CardContent className="flex flex-col items-center justify-center text-muted-foreground h-full pt-5">
              <Plus className="h-10 w-10 mb-2" />
              <p className="text-sm font-medium">Add New Account</p>
            </CardContent>
          </Card>
        </CreateAccountDrawer>
        {/* Map through available accounts and render account cards */}
        {accounts.length > 0 &&
          accounts?.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
      </div>
    </div>
  );
}
