import { supabase } from '@/lib/supabase';
import { useEffect } from 'react';
import { TouchableOpacity } from 'react-native';

// import { expo } from '@/app.json';
import { Text } from '@react-navigation/elements';
// import { Image } from 'expo-image';
import * as WebBrowser from "expo-web-browser";
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

WebBrowser.maybeCompleteAuthSession();

export default function GoogleSignInButton() {
  const router = useRouter();

  function extractParamsFromUrl(url: string) {
    const parsedUrl = new URL(url);
    const hash = parsedUrl.hash.substring(1); // Remove the leading '#'
    const params = new URLSearchParams(hash);

    return {
      access_token: params.get("access_token"),
      expires_in: parseInt(params.get("expires_in") || "0"),
      refresh_token: params.get("refresh_token"),
      token_type: params.get("token_type"),
      provider_token: params.get("provider_token"),
      code: params.get("code"),
    };
  };

  async function onSignInButtonPress() {
    console.debug('onSignInButtonPress - start');
    const res = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `ai-expense-manager://auth`,
        queryParams: { prompt: "consent" },
        skipBrowserRedirect: true,
      },
    });

    const googleOAuthUrl = res.data.url;

    if (!googleOAuthUrl) {
      console.error("no oauth url found!");
      return;
    }

    const result = await WebBrowser.openAuthSessionAsync(
      googleOAuthUrl,
      `ai-expense-manager://auth`,
      { showInRecents: true },
    ).catch((err) => {
      console.error('onSignInButtonPress - openAuthSessionAsync - error', { err });
      console.log(err);
    });

    console.debug('onSignInButtonPress - openAuthSessionAsync - result', { result });

    if (result && result.type === "success") {
      console.debug('onSignInButtonPress - openAuthSessionAsync - success');
      const params = extractParamsFromUrl(result.url);
      console.debug('onSignInButtonPress - openAuthSessionAsync - success', { params });

      if (params.access_token && params.refresh_token) {
        console.debug('onSignInButtonPress - setSession');
        const { data, error } = await supabase.auth.setSession({
          access_token: params.access_token,
          refresh_token: params.refresh_token,
        });
        console.debug('onSignInButtonPress - setSession - success', { data, error });
        // navigate to the nested profile tab using an absolute path
        router.replace("/(tabs)");
        return;
      } else {
        console.error('onSignInButtonPress - setSession - failed');
        // sign in/up failed
      }
    } else {
      console.error('onSignInButtonPress - openAuthSessionAsync - failed');
    }
  }

  // to warm up the browser
  useEffect(() => {
    WebBrowser.warmUpAsync();

    return () => {
      WebBrowser.coolDownAsync();
    };
  }, []);

  return (
    <TouchableOpacity
      onPress={onSignInButtonPress}
      className="flex-row items-center justify-center bg-white border border-gray-300 rounded-full py-3"
      activeOpacity={0.8}
    >
      <Ionicons name="logo-google" size={20} color="#EA4335" />
      <Text className="ml-2 pl-4 text-gray-700 font-medium">  Continue with Google</Text>
    </TouchableOpacity>
  );
}