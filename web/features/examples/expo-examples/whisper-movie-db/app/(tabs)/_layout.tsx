import { Ionicons } from "@expo/vector-icons";
import { BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";
import * as Haptics from "expo-haptics";
import { Tabs } from "expo-router";
import React from "react";
import {
  TouchableOpacity,
  useColorScheme,
  View,
  ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";

interface TabIconProps {
  color: string;
  focused: boolean;
}

const AnimatedIcon = ({
  name,
  focused,
  color,
}: {
  name: any;
  focused: boolean;
  color: string;
}) => {
  const animatedIconStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: withSpring(focused ? 1.2 : 1, {
            damping: 12,
            stiffness: 120,
          }),
        },
        {
          translateY: withSpring(focused ? -2 : 0, {
            damping: 12,
            stiffness: 120,
          }),
        },
      ],
    };
  });

  const animatedDotStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(focused ? 1 : 0, { duration: 250 }),
      transform: [
        {
          scale: withSpring(focused ? 1 : 0, {
            damping: 15,
            stiffness: 150,
          }),
        },
      ],
    };
  });

  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <Animated.View style={animatedIconStyle}>
        <Ionicons
          size={26}
          name={focused ? name : `${name}-outline`}
          color={color}
        />
      </Animated.View>
      <Animated.View
        style={[
          {
            width: 4,
            height: 4,
            borderRadius: 2,
            backgroundColor: "#ef4444",
            position: "absolute",
            bottom: -10,
          },
          animatedDotStyle,
        ]}
      />
    </View>
  );
};

export default function TabLayout(): React.JSX.Element {
  const colorScheme = useColorScheme();

  const tabBarStyle: ViewStyle = {
    backgroundColor: colorScheme === "dark" ? "#1A1A1A" : "#FFFFFF",
    borderTopWidth: 0,
    height: 70,
    borderRadius: 35,
    marginHorizontal: 30,
    marginBottom: 25,
    position: "absolute",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: colorScheme === "dark" ? 0.4 : 0.1,
    shadowRadius: 20,
    elevation: 20,
    zIndex: 50,
  };

  const renderTabBarButton = (
    props: BottomTabBarButtonProps
  ): React.JSX.Element => {
    const { style, onPress, children, ...rest } = props;

    return (
      <TouchableOpacity
        {...(rest as any)}
        onPress={(e) => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress?.(e);
        }}
        activeOpacity={0.7}
        style={[
          style as ViewStyle,
          {
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
        {typeof children === "function"
          ? (children as any)({ pressed: false })
          : children}
      </TouchableOpacity>
    );
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle,
        tabBarActiveTintColor: "#ef4444",
        tabBarInactiveTintColor: colorScheme === "dark" ? "#666666" : "#999999",
        tabBarShowLabel: false,
        tabBarButton: renderTabBarButton,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <AnimatedIcon name="home" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ color, focused }) => (
            <AnimatedIcon name="search" color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
