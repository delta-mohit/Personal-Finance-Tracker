// Import necessary dependencies
import { Suspense } from "react";
import { getAccountWithTransactions } from "@/actions/account";
import { BarLoader } from "react-spinners";
import { TransactionTable } from "../_components/transaction-table";
import { notFound } from "next/navigation";
import { AccountChart } from "../_components/account-chart";

/**
 * AccountPage - Server Component
 * Displays detailed information about a specific account including:
 * - Account name and type
 * - Current balance
 * - Transaction count
 * - Visual chart of transaction history
 * - Table of all transactions
 *
 * @param {Object} context - Next.js page context containing route parameters
 * @returns {JSX.Element} Account detail page
 */
export default async function AccountPage(context) {
  // Extract account ID from route parameters
  const { params } = await context;
  const { id } = await params;

  // Fetch account data and related transactions
  const accountData = await getAccountWithTransactions(id);

  // Handle case when account doesn't exist or can't be found
  if (!accountData) {
    notFound();
  }

  // Destructure account data and transactions
  const { transactions, ...account } = accountData;

  return (
    <div className="space-y-8 px-5">
      {/* Account header section - displays name, type, balance, and transaction count */}
      <div className="flex gap-4 items-end justify-between">
        <div>
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight gradient-title capitalize">
            {account.name}
          </h1>
          <p className="text-muted-foreground">
            {/* Capitalize first letter of account type */}
            {account.type.charAt(0) + account.type.slice(1).toLowerCase()}{" "}
            Account
          </p>
        </div>

        <div className="text-right pb-2">
          <div className="text-xl sm:text-2xl font-bold">
            {/* Format balance as currency with 2 decimal places */}
            ${parseFloat(account.balance).toFixed(2)}
          </div>
          <p className="text-sm text-muted-foreground">
            {account._count.transactions} Transactions
          </p>
        </div>
      </div>

      {/* Chart Section - Visualizes transaction history with loading fallback */}
      <Suspense
        fallback={<BarLoader className="mt-4" width={"100%"} color="#9333ea" />}
      >
        <AccountChart transactions={transactions} />
      </Suspense>

      {/* Transactions Table - Lists all transactions with loading fallback */}
      <Suspense
        fallback={<BarLoader className="mt-4" width={"100%"} color="#9333ea" />}
      >
        <TransactionTable transactions={transactions} />
      </Suspense>
    </div>
  );
}
