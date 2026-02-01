import { createServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");
  const userType = (requestUrl.searchParams.get("type") as "b2b" | "b2c") || "b2b";

  console.log("OAuth callback received - code:", !!code, "error:", error, "userType:", userType);

  if (error) {
    return NextResponse.redirect(
      `${requestUrl.origin}/auth?error=${encodeURIComponent(error)}&type=${userType}`,
    );
  }

  if (code) {
    try {
      const supabase = await createServerClient();

      const { data, error: exchangeError } =
        await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        console.error("Code exchange error:", exchangeError);
        return NextResponse.redirect(
          `${requestUrl.origin}/auth?error=${encodeURIComponent(exchangeError.message)}&type=${userType}`,
        );
      }

      if (data.user) {
        console.log("User authenticated:", data.user.id);

        // Check if user profile exists
        const { data: existingProfile, error: fetchError } = await supabase
          .from("users")
          .select("id, user_type, company_id")
          .eq("id", data.user.id)
          .single();

        if (fetchError && fetchError.code !== "PGRST116") {
          console.error("Error fetching profile:", fetchError);
          return NextResponse.redirect(
            `${requestUrl.origin}/auth?error=profile_fetch_failed&type=${userType}`,
          );
        }

        // If user profile doesn't exist, create it with the userType from query
        if (!existingProfile) {
          const fullName =
            data.user.user_metadata?.full_name ||
            data.user.user_metadata?.name ||
            "User";
          const avatarUrl = data.user.user_metadata?.avatar_url;

          const { data: insertedProfile, error: insertError } = await supabase.from("users").insert({
            id: data.user.id,
            email: data.user.email || "",
            full_name: fullName,
            avatar_url: avatarUrl,
            user_type: userType,
          }).select().single();

          if (insertError) {
            console.error("Error creating user profile:", insertError);
            return NextResponse.redirect(
              `${requestUrl.origin}/auth?error=profile_creation_failed&type=${userType}`,
            );
          }

          console.log("User profile created successfully:", insertedProfile);

          // Redirect based on user type for new users
          // B2C users go directly to dashboard, B2B users need onboarding
          if (userType === "b2c") {
            return NextResponse.redirect(`${requestUrl.origin}/b2c`);
          } else {
            return NextResponse.redirect(`${requestUrl.origin}/onboarding`);
          }
        }

        // Existing user - redirect based on their stored user_type and company_id
        if (existingProfile.user_type === "b2c") {
          return NextResponse.redirect(`${requestUrl.origin}/b2c`);
        } else if (existingProfile.company_id) {
          return NextResponse.redirect(`${requestUrl.origin}/overview`);
        } else {
          return NextResponse.redirect(`${requestUrl.origin}/onboarding`);
        }
      }

      // Fallback redirect
      return NextResponse.redirect(`${requestUrl.origin}/onboarding`);
    } catch (error) {
      console.error("Unexpected error in callback:", error);
      return NextResponse.redirect(
        `${requestUrl.origin}/auth?error=unexpected_error&type=${userType}`,
      );
    }
  }

  return NextResponse.redirect(`${requestUrl.origin}/auth?error=no_code&type=${userType}`);
}
