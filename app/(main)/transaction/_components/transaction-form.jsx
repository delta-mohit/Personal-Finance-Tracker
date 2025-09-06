"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";
import useFetch from "@/hooks/use-fetch";
import { toast } from "sonner";
import ReactSelect from "react-select";
import axios from "axios";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CreateAccountDrawer } from "@/components/create-account-drawer";
import { cn } from "@/lib/utils";
import { createTransaction, updateTransaction } from "@/actions/transaction";
import { transactionSchema } from "@/app/lib/schema";
import { ReceiptScanner } from "./recipt-scanner";

const FriendSelect = ({ value, onChange, styles }) => {
  const friendOptions = [
    { value: 'myself', label: 'Myself', isFixed: true },
    { value: 'friend1', label: 'Friend 1' },
    { value: 'friend2', label: 'Friend 2' },
    { value: 'friend3', label: 'Friend 3' },
    { value: 'friend4', label: 'Friend 4' },
  ];

  return (
    <ReactSelect
      isMulti
      value={value}
      options={friendOptions}
      styles={styles}
      onChange={onChange}
      className="basic-multi-select"
      classNamePrefix="select"
      isClearable={value.some(v => !v.isFixed)}
    />
  );
};

export function AddTransactionForm({
  accounts,
  categories,
  editMode = false,
  initialData = null,
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    getValues,
    reset,
  } = useForm({
    resolver: zodResolver(transactionSchema),
    defaultValues:
      editMode && initialData
        ? {
            type: initialData.type,
            amount: initialData.amount.toString(),
            description: initialData.description,
            accountId: initialData.accountId,
            category: initialData.category,
            date: new Date(initialData.date),
            isRecurring: initialData.isRecurring,
            ...(initialData.recurringInterval && {
              recurringInterval: initialData.recurringInterval,
            }),
          }
        : {
            type: "EXPENSE",
            amount: "",
            description: "",
            accountId: accounts.find((ac) => ac.isDefault)?.id,
            date: new Date(),
            isRecurring: false,
          },
  });

  const {
    loading: transactionLoading,
    fn: transactionFn,
    data: transactionResult,
  } = useFetch(editMode ? updateTransaction : createTransaction);

  const [selectedFriends, setSelectedFriends] = useState([]);
  const [mounted, setMounted] = useState(false);
  const [currencies, setCurrencies] = useState([]);

  useEffect(() => {
    setSelectedFriends([{ value: 'myself', label: 'Myself', isFixed: true }]);
    setMounted(true);

    // Fetch currency data from currencyapi
    const fetchCurrencies = async () => {
      try {
        const response = await axios.get('https://api.currencyapi.com/v3/latest', {
          params: {
            apikey: 'cur_live_PqdeuNeIJWQv2MyWrCUSSgbWjeqHMRY2KefIHcyb'
          }
        });
        const currencyData = response.data.data;
        const currencyOptions = Object.keys(currencyData).map((key) => ({
          value: key,
          label: key // Use only the currency short form
        }));
        setCurrencies(currencyOptions);
      } catch (error) {
        console.error("Error fetching currencies:", error);
        toast.error("Failed to load currencies");
      }
    };

    fetchCurrencies();
  }, []);

  const handleFriendChange = (newValue, actionMeta) => {
    switch (actionMeta.action) {
      case 'remove-value':
      case 'pop-value':
        if (actionMeta.removedValue.isFixed) return;
        break;
      case 'clear':
        newValue = [{ value: 'myself', label: 'Myself', isFixed: true }];
        break;
    }
    const orderedValue = orderOptions(newValue);
    setSelectedFriends(orderedValue);
    setValue("numberOfPeople", orderedValue.length);
  };

  const orderOptions = (values) => {
    return values
      .filter((v) => v.isFixed)
      .concat(values.filter((v) => !v.isFixed));
  };

  const selectStyles = {
    multiValue: (base, state) => {
      return state.data.isFixed ? { ...base, backgroundColor: '#cbd5e1' } : base;
    },
    multiValueLabel: (base, state) => {
      return state.data.isFixed
        ? { ...base, fontWeight: 'bold', color: 'black', paddingRight: 6 }
        : base;
    },
    multiValueRemove: (base, state) => {
      return state.data.isFixed ? { ...base, display: 'none' } : base;
    },
  };

  const onSubmit = (data) => {
    const amountToSave = isSplit && numberOfPeople
      ? parseFloat((parseFloat(data.amount) / parseInt(numberOfPeople)).toFixed(2))
      : parseFloat(data.amount);

    const formData = {
      ...data,
      amount: amountToSave,
      isSplitExpense: isSplit

    };

    if (editMode) {
      transactionFn(editId, formData);
    } else {
      transactionFn(formData);
    }
  };

  useEffect(() => {
    if (transactionResult?.success && !transactionLoading) {
      toast.success(
        editMode
          ? "Transaction updated successfully"
          : "Transaction created successfully"
      );
      reset();
      router.push(`/account/${transactionResult.data.accountId}`);
    }
  }, [transactionResult, transactionLoading, editMode]);

  const type = watch("type");
  const isRecurring = watch("isRecurring");
  const date = watch("date");
  const amount = watch("amount");
  const numberOfPeople = watch("numberOfPeople");
  const isSplit = watch("isSplit");

  const splitAmount = amount && numberOfPeople 
    ? (parseFloat(amount) / parseInt(numberOfPeople)).toFixed(2)
    : "0.00";

  const filteredCategories = categories.filter(
    (category) => category.type === type
  );

  const handleScanComplete = (scannedData) => {
    if (scannedData) {
      setValue("amount", scannedData.amount || "");
      setValue("description", scannedData.description || "");
      setValue("category", scannedData.category || "");
      setValue("date", scannedData.date ? new Date(scannedData.date) : new Date());
    }
  };

  const fetchConversionRate = async (currencyCode) => {
    try {
      const response = await axios.get('https://api.currencyapi.com/v3/latest', {
        params: {
          apikey: 'cur_live_PqdeuNeIJWQv2MyWrCUSSgbWjeqHMRY2KefIHcyb'
        }
      });
      console.log("API Response:", response.data); // Log the entire response for debugging

      // Extract the conversion rate for the selected currency code
      const conversionRate = response.data.data[currencyCode]?.value;
      console.log(`Fetched Conversion Rate for ${currencyCode}:`, conversionRate);
      return conversionRate;
    } catch (error) {
      console.error("Error fetching conversion rate:", error);
      toast.error("Failed to fetch conversion rate");
      return null;
    }
  };

  const handleCurrencyAmountChange = async (amount, currencyCode) => {
    const conversionRate = await fetchConversionRate(currencyCode);
    if (conversionRate) {
      const convertedAmount = (parseFloat(amount) / conversionRate).toFixed(2);
      console.log(`Exchange Rate: ${conversionRate}`);
      console.log(`Converted Amount: ${convertedAmount}`);
      setValue("amount", convertedAmount);
    } else {
      console.log("Conversion rate is not available.");
    }
  };

  useEffect(() => {
    const currencyCode = getValues("currency");
    const currencyAmount = getValues("currencyAmount");
    if (watch("changeCurrency") && currencyCode && currencyAmount) {
      handleCurrencyAmountChange(currencyAmount, currencyCode);
    }
  }, [watch("currencyAmount"), watch("currency")]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Receipt Scanner - Only show in create mode */}
      {!editMode && <ReceiptScanner onScanComplete={handleScanComplete} />}

      {/* Recurring Toggle */}
      <div className="flex flex-row items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <label className="text-base font-medium">Recurring Transaction</label>
          <div className="text-sm text-muted-foreground">
            Set up a recurring schedule for this transaction
          </div>
        </div>
        <Switch
          checked={isRecurring}
          onCheckedChange={(checked) => setValue("isRecurring", checked)}
        />
      </div>

      {/* Recurring Interval */}
      {isRecurring && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Recurring Interval</label>
          <Select
            onValueChange={(value) => setValue("recurringInterval", value)}
            defaultValue={getValues("recurringInterval")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select interval" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DAILY">Daily</SelectItem>
              <SelectItem value="WEEKLY">Weekly</SelectItem>
              <SelectItem value="MONTHLY">Monthly</SelectItem>
              <SelectItem value="YEARLY">Yearly</SelectItem>
            </SelectContent>
          </Select>
          {errors.recurringInterval && (
            <p className="text-sm text-red-500">
              {errors.recurringInterval.message}
            </p>
          )}
        </div>
      )}

      {/* Split Expense Toggle */}
      <div className="flex flex-row items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <label className="text-base font-medium">Split Expense</label>
          <div className="text-sm text-muted-foreground">
            Split this expense equally with others
          </div>
        </div>
        <Switch
          checked={watch("isSplit")}
          onCheckedChange={(checked) => setValue("isSplit", checked)}
        />
      </div>

      {/* Currency Toggle */}
      <div className="flex flex-row items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <label className="text-base font-medium">Change Currency</label>
          <div className="text-sm text-muted-foreground">
            Convert amount to different currency
          </div>
        </div>
        <Switch
          checked={watch("changeCurrency")}
          onCheckedChange={(checked) => setValue("changeCurrency", checked)}
        />
      </div>

      {/* Currency Selection */}
      {watch("changeCurrency") && (
        <div className="space-y-2">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium">Select Currency</label>
              <Select
                onValueChange={(value) => {
                  setValue("currency", value);
                  handleCurrencyAmountChange(getValues("currencyAmount"), value);
                }}
                defaultValue={getValues("currency")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.value} value={currency.value}>
                      {currency.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium">Enter Amount</label>
              <Input
                type="number"
                step="0.01"
                placeholder="Enter amount"
                {...register("currencyAmount")}
                onChange={(e) => handleCurrencyAmountChange(e.target.value, getValues("currency"))}
              />
            </div>
          </div>
          {errors.currency && (
            <p className="text-sm text-red-500">{errors.currency.message}</p>
          )}
        </div>
      )}

      {/* Split Details */}
      {watch("isSplit") && mounted && (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Number of People</label>
            <Input
              type="number"
              min="2"
              placeholder="2"
              disabled
              value={selectedFriends.length}
              {...register("numberOfPeople")}
            />
            {errors.numberOfPeople && (
              <p className="text-sm text-red-500">{errors.numberOfPeople.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Friends to Split With</label>
            <FriendSelect
              value={selectedFriends}
              onChange={handleFriendChange}
              styles={selectStyles}
            />
            {watch("amount") && selectedFriends.length > 1 && (
              <div className="mt-2 text-sm text-green-600">
                Total Amount: ${parseFloat(watch("amount")).toFixed(2)}
                <br />
                Each person pays: ${(parseFloat(watch("amount")) / selectedFriends.length).toFixed(2)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Amount and Account */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">
            {watch("isSplit") ? "Total Amount to Split" : "Amount"}
          </label>
          <Input
            type="number"
            step="0.01"
            placeholder="0.00"
            {...register("amount")}
          />
          {errors.amount && (
            <p className="text-sm text-red-500">{errors.amount.message}</p>
          )}
          {watch("isSplit") && amount && numberOfPeople && (
            <p className="text-sm text-green-600">
              Each person will pay: ${splitAmount}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Account</label>
          <Select
            onValueChange={(value) => setValue("accountId", value)}
            defaultValue={getValues("accountId")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select account" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name} (${parseFloat(account.balance).toFixed(2)})
                </SelectItem>
              ))}
              <CreateAccountDrawer>
                <Button
                  variant="ghost"
                  className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                >
                  Create Account
                </Button>
              </CreateAccountDrawer>
            </SelectContent>
          </Select>
          {errors.accountId && (
            <p className="text-sm text-red-500">{errors.accountId.message}</p>
          )}
        </div>
      </div>

      {/* Type */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Type</label>
        <Select
          onValueChange={(value) => setValue("type", value)}
          defaultValue={type}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="EXPENSE">Expense</SelectItem>
            <SelectItem value="INCOME">Income</SelectItem>
          </SelectContent>
        </Select>
        {errors.type && (
          <p className="text-sm text-red-500">{errors.type.message}</p>
        )}
      </div>

      {/* Category */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Category</label>
        <Select
          onValueChange={(value) => setValue("category", value)}
          defaultValue={getValues("category")}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {filteredCategories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.category && (
          <p className="text-sm text-red-500">{errors.category.message}</p>
        )}
      </div>

      {/* Date */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Date</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full pl-3 text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              {date ? format(date, "PPP") : <span>Pick a date</span>}
              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(date) => setValue("date", date)}
              disabled={(date) =>
                date > new Date() || date < new Date("1900-01-01")
              }
              initialFocus
            />
          </PopoverContent>
        </Popover>
        {errors.date && (
          <p className="text-sm text-red-500">{errors.date.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Description</label>
        <Input placeholder="Enter description" {...register("description")} />
        {errors.description && (
          <p className="text-sm text-red-500">{errors.description.message}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
        <Button type="submit" className="w-full" disabled={transactionLoading}>
          {transactionLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {editMode ? "Updating..." : "Creating..."}
            </>
          ) : editMode ? (
            "Update Transaction"
          ) : (
            "Create Transaction"
          )}
        </Button>
      </div>
    </form>
  );
}