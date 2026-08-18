import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "react-email";

import { formatCurrency } from "@/lib/format";

// Also the defaults below, so `npm run email:dev` renders something.
const PREVIEW_DATA = {
  userName: "Aditya",
  type: "monthly-report",
  data: {
    month: "July",
    stats: {
      totalIncome: 185000,
      totalExpenses: 96500,
      byCategory: {
        housing: 32000,
        groceries: 11500,
        transportation: 6400,
        entertainment: 4200,
        utilities: 3800,
      },
    },
    insights: [
      "Housing is a third of your spending this month — worth a look if you want to free up cash.",
      "Entertainment stayed well under control. Nice work.",
      "Automating a transfer on payday could push your savings rate up by a fifth.",
    ],
  },
};

export default function EmailTemplate({
  userName = PREVIEW_DATA.userName,
  type = PREVIEW_DATA.type,
  data = PREVIEW_DATA.data,
}) {
  if (type === "monthly-report") {
    const net = data.stats.totalIncome - data.stats.totalExpenses;

    return (
      <Html>
        <Head />
        <Preview>Your Monthly Financial Report</Preview>
        <Body style={styles.body}>
          <Container style={styles.container}>
            <Heading style={styles.title}>Monthly Financial Report</Heading>

            <Text style={styles.text}>Hello {userName},</Text>
            <Text style={styles.text}>
              Here&rsquo;s your financial summary for {data.month}:
            </Text>

            <Section style={styles.statsContainer}>
              <div style={styles.stat}>
                <Text style={styles.text}>Total Income</Text>
                <Text style={styles.heading}>
                  {formatCurrency(data.stats.totalIncome)}
                </Text>
              </div>
              <div style={styles.stat}>
                <Text style={styles.text}>Total Expenses</Text>
                <Text style={styles.heading}>
                  {formatCurrency(data.stats.totalExpenses)}
                </Text>
              </div>
              <div style={styles.stat}>
                <Text style={styles.text}>Net</Text>
                <Text style={styles.heading}>{formatCurrency(net)}</Text>
              </div>
            </Section>

            {data.stats.byCategory && (
              <Section style={styles.section}>
                <Heading style={styles.heading}>Expenses by Category</Heading>
                {Object.entries(data.stats.byCategory).map(
                  ([category, amount]) => (
                    <div key={category} style={styles.row}>
                      <Text style={styles.text}>{category}</Text>
                      <Text style={styles.text}>{formatCurrency(amount)}</Text>
                    </div>
                  ),
                )}
              </Section>
            )}

            {data.insights && (
              <Section style={styles.section}>
                <Heading style={styles.heading}>Fortuno Insights</Heading>
                {data.insights.map((insight) => (
                  <Text key={insight} style={styles.text}>
                    • {insight}
                  </Text>
                ))}
              </Section>
            )}

            <Text style={styles.footer}>
              Thank you for using Fortuno. Keep tracking your finances for
              better financial health!
            </Text>
          </Container>
        </Body>
      </Html>
    );
  }

  if (type === "budget-alert") {
    const remaining = data.budgetAmount - data.totalExpenses;

    return (
      <Html>
        <Head />
        <Preview>Budget Alert</Preview>
        <Body style={styles.body}>
          <Container style={styles.container}>
            <Heading style={styles.title}>Budget Alert</Heading>

            <Text style={styles.text}>Hello {userName},</Text>
            <Text style={styles.text}>
              You&rsquo;ve used {data.percentageUsed.toFixed(1)}% of your
              monthly budget for {data.accountName}.
            </Text>

            <Section style={styles.statsContainer}>
              <div style={styles.stat}>
                <Text style={styles.text}>Budget Amount</Text>
                <Text style={styles.heading}>
                  {formatCurrency(data.budgetAmount)}
                </Text>
              </div>
              <div style={styles.stat}>
                <Text style={styles.text}>Spent So Far</Text>
                <Text style={styles.heading}>
                  {formatCurrency(data.totalExpenses)}
                </Text>
              </div>
              <div style={styles.stat}>
                <Text style={styles.text}>Remaining</Text>
                <Text style={styles.heading}>{formatCurrency(remaining)}</Text>
              </div>
            </Section>
          </Container>
        </Body>
      </Html>
    );
  }

  return null;
}

const styles = {
  body: {
    backgroundColor: "#f6f9fc",
    fontFamily: "-apple-system, sans-serif",
  },
  container: {
    backgroundColor: "#ffffff",
    margin: "0 auto",
    padding: "20px",
    borderRadius: "5px",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
  },
  title: {
    color: "#1f2937",
    fontSize: "32px",
    fontWeight: "bold",
    textAlign: "center",
    margin: "0 0 20px",
  },
  heading: {
    color: "#1f2937",
    fontSize: "20px",
    fontWeight: "600",
    margin: "0 0 16px",
  },
  text: {
    color: "#4b5563",
    fontSize: "16px",
    margin: "0 0 16px",
  },
  section: {
    marginTop: "32px",
    padding: "20px",
    backgroundColor: "#f9fafb",
    borderRadius: "5px",
    border: "1px solid #e5e7eb",
  },
  statsContainer: {
    margin: "32px 0",
    padding: "20px",
    backgroundColor: "#f9fafb",
    borderRadius: "5px",
  },
  stat: {
    marginBottom: "16px",
    padding: "12px",
    backgroundColor: "#fff",
    borderRadius: "4px",
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    padding: "12px 0",
    borderBottom: "1px solid #e5e7eb",
  },
  footer: {
    color: "#6b7280",
    fontSize: "14px",
    textAlign: "center",
    marginTop: "32px",
    paddingTop: "16px",
    borderTop: "1px solid #e5e7eb",
  },
};
