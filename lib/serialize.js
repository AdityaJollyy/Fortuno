// Prisma returns Decimal objects, but a value that has crossed an Inngest
// step boundary has been JSON-serialized and arrives as a string. Number()
// reads all three — Decimal (via valueOf), string, and plain number.
export function decimalToNumber(value) {
  return value === null || value === undefined ? 0 : Number(value);
}

export function serializeAccount(account) {
  return {
    ...account,
    balance: decimalToNumber(account.balance),
  };
}

export function serializeTransaction(transaction) {
  return {
    ...transaction,
    amount: decimalToNumber(transaction.amount),
  };
}

export function serializeBudget(budget) {
  return {
    ...budget,
    amount: decimalToNumber(budget.amount),
  };
}
