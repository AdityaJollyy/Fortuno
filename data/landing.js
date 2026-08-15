import {
  BarChart3,
  Receipt,
  PieChart,
  CreditCard,
  Globe,
  Zap,
} from "lucide-react";

// Stats Data
export const statsData = [
  {
    id: "active-users",
    value: "50K+",
    label: "Active Users",
  },
  {
    id: "transactions-tracked",
    value: "$2B+",
    label: "Transactions Tracked",
  },
  {
    id: "uptime",
    value: "99.9%",
    label: "Uptime",
  },
  {
    id: "user-rating",
    value: "4.9/5",
    label: "User Rating",
  },
];

// Features Data
export const featuresData = [
  {
    id: "advanced-analytics",
    icon: BarChart3,
    title: "Advanced Analytics",
    description:
      "Get detailed insights into your spending patterns with AI-powered analytics",
  },
  {
    id: "smart-receipt-scanner",
    icon: Receipt,
    title: "Smart Receipt Scanner",
    description:
      "Extract data automatically from receipts using advanced AI technology",
  },
  {
    id: "budget-planning",
    icon: PieChart,
    title: "Budget Planning",
    description: "Create and manage budgets with intelligent recommendations",
  },
  {
    id: "multi-account-support",
    icon: CreditCard,
    title: "Multi-Account Support",
    description: "Manage multiple accounts and credit cards in one place",
  },
  {
    id: "multi-currency",
    icon: Globe,
    title: "Multi-Currency",
    description: "Support for multiple currencies with real-time conversion",
  },
  {
    id: "automated-insights",
    icon: Zap,
    title: "Automated Insights",
    description: "Get automated financial insights and recommendations",
  },
];

// How It Works Data
export const howItWorksData = [
  {
    id: "create-account",
    icon: CreditCard,
    step: 1,
    title: "Create Your Account",
    description:
      "Get started in minutes with our simple and secure sign-up process",
  },
  {
    id: "track-spending",
    icon: BarChart3,
    step: 2,
    title: "Track Your Spending",
    description:
      "Automatically categorize and track your transactions in real-time",
  },
  {
    id: "get-insights",
    icon: PieChart,
    step: 3,
    title: "Get Insights",
    description:
      "Receive AI-powered insights and recommendations to optimize your finances",
  },
];

// Testimonials Data
export const testimonialsData = [
  {
    id: "sarah-johnson",
    name: "Sarah Johnson",
    role: "Small Business Owner",
    image: "https://randomuser.me/api/portraits/women/75.jpg",
    quote:
      "Welth has transformed how I manage my business finances. The AI insights have helped me identify cost-saving opportunities I never knew existed.",
  },
  {
    id: "michael-chen",
    name: "Michael Chen",
    role: "Freelancer",
    image: "https://randomuser.me/api/portraits/men/75.jpg",
    quote:
      "The receipt scanning feature saves me hours each month. Now I can focus on my work instead of manual data entry and expense tracking.",
  },
  {
    id: "emily-rodriguez",
    name: "Emily Rodriguez",
    role: "Financial Advisor",
    image: "https://randomuser.me/api/portraits/women/74.jpg",
    quote:
      "I recommend Welth to all my clients. The multi-currency support and detailed analytics make it perfect for international investors.",
  },
];
