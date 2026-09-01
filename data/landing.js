import { Gauge, Mail, Receipt, Wallet } from "lucide-react";

// The trust line under the hero buttons. Three things that are true, not three
// invented numbers. This used to be a full-width band of its own.
export const trustPoints = ["Rupees only", "No bank logins", "No ads, ever"];

// "What it does"
export const featuresData = [
  {
    id: "one-balance",
    icon: Wallet,
    title: "All your accounts, one balance",
    description:
      "Salary account, savings, the UPI wallet you actually spend from. Add them by hand — Fortuno never asks for your bank password.",
  },
  {
    id: "budget-pace",
    icon: Gauge,
    title: "A budget that tells you the pace",
    description:
      "Set one monthly number. Fortuno shows what's left and whether you're ahead of the month — a warning at 80%, not a lecture at 100%.",
  },
  {
    id: "receipt-scanner",
    icon: Receipt,
    title: "Photograph the bill, skip the typing",
    description:
      "Point your camera at a restaurant bill or a Zepto slip. Amount, date and merchant come back filled in for you to check.",
  },
  {
    id: "monthly-email",
    icon: Mail,
    title: "One email at the end of the month",
    description:
      "A short written summary of where the money went and what changed since last month. One email. No notifications.",
  },
];

// "Getting started" — numbered, not iconed. The numeral is the whole point.
export const howItWorksData = [
  {
    id: "add-account",
    step: 1,
    title: "Add an account",
    description: "Name and current balance. Thirty seconds.",
  },
  {
    id: "set-budget",
    step: 2,
    title: "Set your monthly number",
    description: "What you want to stay under, all in.",
  },
  {
    id: "log-as-you-go",
    step: 3,
    title: "Log as you go",
    description: "Scan bills, or type them in. Recurring ones log themselves.",
  },
];

// "Fair questions" — what the section that used to hold invented testimonials
// now holds instead. Every answer describes behaviour the app actually has.
export const faqData = [
  {
    id: "bank-login",
    question: "Do I have to connect my bank?",
    answer:
      "No, and you can't. Accounts are added by hand with a name and a balance. Fortuno never asks for a bank password, a UPI PIN or an OTP, so there is nothing here worth stealing.",
  },
  {
    id: "what-counts",
    question: "What counts against my budget?",
    answer:
      "Expenses on your default account, for the current calendar month. Switch which account is the default from the dashboard and the budget follows it. Everything else is still tracked, just not counted here.",
  },
  {
    id: "scan-accuracy",
    question: "How accurate is the receipt scan?",
    answer:
      "It reads the total, the date and the merchant off a photo and fills the form in for you. Nothing is saved until you press save, so a bad read costs you one correction — never a wrong balance.",
  },
  {
    id: "notifications",
    question: "Will it nag me?",
    answer:
      "Twice a month at most. One email when you cross 80% of the budget, and one short summary once the month is over. No push notifications, no streaks.",
  },
  {
    id: "recurring",
    question: "What about things I pay every month?",
    answer:
      "Mark a transaction recurring and pick the interval. Fortuno posts it on schedule and moves the balance with it, so rent and subscriptions stop being the ones you forget.",
  },
];
