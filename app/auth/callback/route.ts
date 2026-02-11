import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const authUrl = new URL("/auth", requestUrl.origin);

  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");

  if (code) authUrl.searchParams.set("code", code);
  if (state) authUrl.searchParams.set("state", state);
  if (error) authUrl.searchParams.set("error", error);
  if (errorDescription) {
    authUrl.searchParams.set("error_description", errorDescription);
  }

  return NextResponse.redirect(authUrl);
}
