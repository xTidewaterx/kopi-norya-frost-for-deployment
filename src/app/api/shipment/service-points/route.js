import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { postal_code } = await req.json();

    if (!postal_code) {
      return NextResponse.json(
        { error: "Missing postal_code in request." },
        { status: 400 }
      );
    }

    const user = process.env.SHIPMONDO_SANDBOX_USER;
    const key = process.env.SHIPMONDO_SANDBOX_KEY;

    if (!user || !key) {
      return NextResponse.json(
        { error: "Missing Shipmondo sandbox credentials." },
        { status: 500 }
      );
    }

    const credentials = Buffer.from(`${user}:${key}`).toString("base64");

    const endpoint = `https://sandbox.shipmondo.com/v3/service-points?postal_code=${postal_code}`;

    const response = await fetch(endpoint, {
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
    });

    let data;
    try {
      data = await response.json();
    } catch (err) {
      const text = await response.text();
      console.error("❌ Shipmondo returned non-JSON response:", text);
      return NextResponse.json(
        { error: "Shipmondo returned non-JSON response." },
        { status: 500 }
      );
    }

    if (!response.ok) {
      console.error("❌ Shipmondo API error:", data);
      return NextResponse.json({ error: data }, { status: response.status });
    }

    return NextResponse.json({ success: true, service_points: data });
  } catch (error) {
    console.error("💥 Error fetching service points:", error);
    return NextResponse.json({ error: "Failed to fetch service points" }, { status: 500 });
  }
}
