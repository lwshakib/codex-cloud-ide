import OnBoarding from "@/components/OnBoarding";
import { useOnBoardingState } from "@/context";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import "../global.css";

import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { useColorScheme, View } from "react-native";

// Keep the splash screen visible while we fetch the onboarding state
SplashScreen.preventAutoHideAsync();

const customDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: "#000000",
    card: "#000000",
    surface: "#000000",
  },
};

const customDefaultTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "#ffffff",
    card: "#ffffff",
  },
};

export default function RootLayout() {
  const { isOnBoarding, setIsOnBoarding } = useOnBoardingState();
  const [isReady, setIsReady] = useState(false);
  const colorScheme = useColorScheme();

  useEffect(() => {
    // Check if state is hydrated from SecureStore
    const checkHydration = async () => {
      // If isOnBoarding is still null after hydration, we should default it to true
      if (isOnBoarding === null) {
        setIsOnBoarding(true);
      }

      setIsReady(true);
      await SplashScreen.hideAsync();
    };

    checkHydration();
  }, [isOnBoarding, setIsOnBoarding]);

  if (!isReady) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colorScheme === "dark" ? "#000000" : "#ffffff",
        }}
      />
    );
  }

  if (isOnBoarding) {
    return (
      <>
        <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
        <OnBoarding />
      </>
    );
  }

  return (
    <ThemeProvider
      value={colorScheme === "dark" ? customDarkTheme : customDefaultTheme}
    >
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: colorScheme === "dark" ? "#000000" : "#ffffff",
          },
        }}
      />
    </ThemeProvider>
  );
}
