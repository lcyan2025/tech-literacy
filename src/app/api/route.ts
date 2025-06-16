import { findRouteData } from "@/utils/notion";
import { NextResponse } from "next/server";

export async function GET() {
    const data = await findRouteData("/");
    return NextResponse.json(data);
}

