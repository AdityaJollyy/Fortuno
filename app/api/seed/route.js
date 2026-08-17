import { seedTransactions } from "@/actions/seed";

export async function POST() {
  const result = await seedTransactions();
  return Response.json(result, { status: result.success ? 200 : 400 });
}
