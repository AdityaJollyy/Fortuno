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
