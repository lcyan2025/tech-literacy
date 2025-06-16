import { submitComment } from "@/utils/notion";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const response = await submitComment(body);
    return new Response(JSON.stringify(response), { status: 200 });
  } catch (error) {
    console.error("Error submitting comment:", error);
    return new Response("Failed to submit", { status: 500 });
  }
}
