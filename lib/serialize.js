export function serializeAccount(account) {
  return {
    ...account,
    balance: account.balance.toNumber(),
  };
}

export function serializeTransaction(transaction) {
  return {
    ...transaction,
    amount: transaction.amount.toNumber(),
  };
}

export function serializeBudget(budget) {
  return {
    ...budget,
    amount: budget.amount.toNumber(),
  };
}

// Aggregates (_sum, _avg) return a Decimal, or null when nothing matched.
export function decimalToNumber(value) {
  return value ? value.toNumber() : 0;
}
