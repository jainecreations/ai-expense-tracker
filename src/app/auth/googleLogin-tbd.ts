// src/lib/signInWithGoogle.ts
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import * as AuthSession from "expo-auth-session";
import { supabase } from "@/lib/supabase";

WebBrowser.maybeCompleteAuthSession();

/**
 * Sign in with Google via Supabase OAuth using Expo's AuthSession redirect.
 * Uses Expo proxy by default (works in Expo Go). If you run a standalone app,
 * set `useProxy: false` and register the produced redirect URI in your
 * Supabase OAuth provider settings.
 */
export async function signInWithGoogle() {
  try {
  // Create a redirect URI that works for Expo (useProxy=true for Expo Go/dev)
  // cast to any because some SDK type defs differ between versions
  const redirectUri = AuthSession.makeRedirectUri({ useProxy: true } as any);
console.log('====================================');
console.log(redirectUri);
console.log('====================================');
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        // Tell Supabase where to redirect after auth
        redirectTo: redirectUri,
      },
    });

    if (error) {
      console.error("Supabase OAuth error:", error.message);
      return;
    }

    if (data?.url) {
      console.log("Opening auth URL:", data.url);
      // Try AuthSession.startAsync first (works well with Expo AuthSession proxy)
      let result: any = null;
      try {
        // some SDK versions expose startAsync differently; cast to any to call it if present
        result = await (AuthSession as any).startAsync({ authUrl: data.url } as any);
        console.log("AuthSession.startAsync result:", result);
      } catch (e) {
        console.warn("AuthSession.startAsync failed, falling back to openAuthSessionAsync", e);
      }

      // fallback to WebBrowser if AuthSession didn't return success
      if (!result || result.type !== "success") {
        try {
          const wbResult = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);
          result = wbResult as any;
          console.log("WebBrowser.openAuthSessionAsync result:", wbResult);
        } catch (e) {
          console.error("openAuthSessionAsync failed:", e);
        }
      }

      if (result && result.type === "success" && result.url) {
        const parsed = Linking.parse(result.url);
        const accessToken = parsed.queryParams?.access_token as string | undefined;
        const refreshToken = parsed.queryParams?.refresh_token as string | undefined;
        console.log("Parsed redirect URL params:", parsed.queryParams);

        if (accessToken) {
          await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken ?? "" });
          console.log("Google login successful!");
        } else {
          try {
            // @ts-ignore
            if (typeof supabase.auth.getSessionFromUrl === "function") {
              // @ts-ignore
              await supabase.auth.getSessionFromUrl(result.url);
              console.log("Tried getSessionFromUrl after redirect");
            } else {
              console.warn("No access token found in redirect URL and getSessionFromUrl not available.");
            }
          } catch (e) {
            console.warn("No access token found in redirect URL and getSessionFromUrl failed", e);
          }
        }
      } else {
        console.log("User cancelled or dismissed login or no result/url returned", result);
      }
    }
  } catch (err) {
    console.error("Google sign-in error:", err);
  }
}
