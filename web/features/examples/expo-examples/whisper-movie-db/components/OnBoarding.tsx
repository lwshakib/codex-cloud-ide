import { useOnBoardingState } from "@/context";
import { LinearGradient } from "expo-linear-gradient";
import React, { useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeInUp,
  interpolate,
  SharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

const { width, height } = Dimensions.get("window");

const onboardingData = [
  {
    id: 1,
    title: "Welcome to Whisper",
    description:
      "Your ultimate destination for discovering movies, TV shows, and everything in between.",
    image:
      "https://image.tmdb.org/t/p/w600_and_h900_face/cjXLrg4R7FRPFafvuQ3SSznQOd9.jpg",
  },
  {
    id: 2,
    title: "Discover & Explore",
    description:
      "Search through millions of movies, view details, trailers, and cast information instantly.",
    image:
      "https://image.tmdb.org/t/p/w600_and_h900_face/cVxVGwHce6xnW8UaVUggaPXbmoE.jpg",
  },
  {
    id: 3,
    title: "Track Favorites",
    description:
      "Save movies to your favorites list and define your personal cinematic taste.",
    image:
      "https://image.tmdb.org/t/p/w600_and_h900_face/2zmTngn1tYC1AvfnrFLhxeD82hz.jpg",
  },
];

const OnBoardingItem = ({
  item,
  index,
  scrollX,
}: {
  item: any;
  index: number;
  scrollX: SharedValue<number>;
}) => {
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * width,
      index * width,
      (index + 1) * width,
    ];

    // Animate Opacity: fade in when centered, fade out when scrolling away
    const opacity = interpolate(scrollX.value, inputRange, [0, 1, 0]);

    // Animate TranslateY: Move up when entering, move down when leaving
    const translateY = interpolate(scrollX.value, inputRange, [100, 0, 100]);

    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  return (
    <View style={{ width, height }}>
      <Image
        source={{ uri: item.image }}
        style={{ width: "100%", height: "100%" }}
        resizeMode="cover"
      />
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.6)", "rgba(0,0,0,0.95)"]}
        style={{
          position: "absolute",
          bottom: 0,
          width: "100%",
          height: "60%",
          justifyContent: "flex-end",
          paddingBottom: 150,
          paddingHorizontal: 24,
        }}
      >
        <Animated.View style={animatedStyle}>
          <Text className="text-white text-4xl font-black text-center mb-4">
            {item.title}
          </Text>
          <Text className="text-gray-300 text-base text-center leading-6 font-medium">
            {item.description}
          </Text>
        </Animated.View>
      </LinearGradient>
    </View>
  );
};

export default function OnBoarding() {
  const { setIsOnBoarding } = useOnBoardingState();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollX.value = event.contentOffset.x;
  });

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
      setCurrentIndex(currentIndex + 1);
    } else {
      setIsOnBoarding(false);
    }
  };

  const onMomentumScrollEnd = (event: any) => {
    const newIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(newIndex);
  };

  return (
    <View className="flex-1 bg-black">
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      <Animated.FlatList
        ref={flatListRef}
        data={onboardingData}
        renderItem={({ item, index }) => (
          <OnBoardingItem item={item} index={index} scrollX={scrollX} />
        )}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        onMomentumScrollEnd={onMomentumScrollEnd}
        bounces={false}
      />

      {/* Footer / Controls */}
      <View className="absolute bottom-12 w-full px-6 flex-row justify-between items-center z-50">
        {/* Paginator */}
        <View className="flex-row space-x-2">
          {onboardingData.map((_, index) => {
            const isActive = index === currentIndex;
            return (
              <View
                key={index}
                className={`h-2 rounded-full transition-all duration-300 ${
                  isActive ? "w-8 bg-red-600" : "w-2 bg-gray-500"
                }`}
              />
            );
          })}
        </View>

        {/* Button */}
        <TouchableOpacity
          onPress={handleNext}
          className="bg-red-600 py-3 px-8 rounded-full shadow-lg shadow-red-900 overflow-hidden"
          activeOpacity={0.8}
        >
          <Animated.Text
            key={currentIndex} // Re-animate text on index change
            entering={FadeInUp.duration(300)} // Subtle entry for button text
            className="text-white font-bold text-lg uppercase tracking-wide"
          >
            {currentIndex === onboardingData.length - 1
              ? "Get Started"
              : "Next"}
          </Animated.Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
