import { NextResponse } from "next/server";
import { fetchDashboardData } from "@/lib/airtable";

export const revalidate = 300;

export async function GET() {
  try {
    const data = await fetchDashboardData();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch dashboard data",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
