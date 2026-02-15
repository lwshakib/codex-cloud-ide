import {
  fallbackMoviePoster,
  fallbackPersonImage,
  fetchPersonDetails,
  fetchPersonMovies,
  image185,
  image500,
} from "@/TMDB/config";
import FloatingBackButton from "@/components/FloatingBackButton";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

const { width, height } = Dimensions.get("window");

const PersonInfoItem = ({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) => (
  <View className="mb-4 w-[48%] bg-neutral-50 dark:bg-neutral-900 p-3 rounded-lg border-0">
    <Text className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">
      {title}
    </Text>
    <Text className="text-gray-900 dark:text-gray-100 font-bold text-sm">
      {value || "N/A"}
    </Text>
  </View>
);

export default function PersonDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [person, setPerson] = useState<any>(null);
  const [movies, setMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      fetchPersonDetails(id as string),
      fetchPersonMovies(id as string),
    ]).then(([personRes, moviesRes]) => {
      setPerson(personRes);
      // Sort movies by popularity or release date
      const sortedMovies = (moviesRes.cast || []).sort((a: any, b: any) => {
        return (b.popularity || 0) - (a.popularity || 0);
      });
      setMovies(sortedMovies);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <View className="flex-1 bg-white dark:bg-black p-4 items-center justify-center">
        <View className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
      </View>
    );
  }

  if (!person) {
    return (
      <View className="flex-1 justify-center items-center bg-white dark:bg-black">
        <Text className="text-lg text-gray-700 dark:text-gray-200">
          Person not found.
        </Text>
      </View>
    );
  }

  const genderMap: Record<number, string> = {
    0: "Not set",
    1: "Female",
    2: "Male",
    3: "Non-binary",
  };

  return (
    <View
      className="flex-1"
      style={{ backgroundColor: isDark ? "#000000" : "#ffffff" }}
    >
      <FloatingBackButton />
      <StatusBar hidden />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 50 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Image */}
        <View className="w-full h-[500px] relative">
          <Image
            source={{
              uri: image500(person.profile_path) || fallbackPersonImage,
            }}
            className="w-full h-full"
            resizeMode="cover"
          />
          <LinearGradient
            colors={["transparent", isDark ? "#000000" : "#ffffff"]}
            style={{
              width: width,
              height: height * 0.4,
              position: "absolute",
              bottom: 0,
            }}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
        </View>

        {/* Name & Bio */}
        <Animated.View
          entering={FadeInDown.duration(400).springify()}
          className="px-4 -mt-12 mb-6"
        >
          <Text className="text-3xl font-black text-center text-gray-900 dark:text-white shadow-sm mb-2">
            {person.name}
          </Text>
          <Text className="text-gray-500 dark:text-gray-400 font-medium text-sm text-center uppercase tracking-widest mb-4">
            {person.known_for_department}
          </Text>

          <Text className="text-gray-600 dark:text-neutral-300 font-normal leading-6 text-base text-center mt-2">
            {person.biography || "No biography available."}
          </Text>
        </Animated.View>

        {/* Info Grid */}
        <View className="px-4 mb-4">
          <Text className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Personal Info
          </Text>
          <View className="flex-row flex-wrap justify-between">
            <PersonInfoItem
              title="Gender"
              value={genderMap[person.gender] || "Unknown"}
            />
            <PersonInfoItem title="Birthday" value={person.birthday} />
            <PersonInfoItem
              title="Place of Birth"
              value={person.place_of_birth}
            />
            <PersonInfoItem
              title="Popularity"
              value={person.popularity?.toFixed(0)}
            />
            {person.deathday && (
              <PersonInfoItem title="Deathday" value={person.deathday} />
            )}
            {person.also_known_as?.length > 0 && (
              <PersonInfoItem
                title="Also Known As"
                value={person.also_known_as[0]}
              />
            )}
          </View>
        </View>

        {/* Movies Section */}
        {movies.length > 0 && (
          <View className="mt-4 px-4">
            <Text className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Known For
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {movies.map((m: any, index: number) => (
                <TouchableOpacity
                  key={`${m.id}-${index}`}
                  className="mr-4 w-36"
                  onPress={() =>
                    router.push({
                      pathname: "/movie/[id]",
                      params: { id: m.id },
                    })
                  }
                >
                  <Image
                    source={{
                      uri: image185(m.poster_path) || fallbackMoviePoster,
                    }}
                    className="w-36 h-56 rounded-xl mb-2 bg-gray-200 dark:bg-gray-800"
                    resizeMode="cover"
                  />
                  <Text
                    className="text-xs font-bold text-gray-900 dark:text-white"
                    numberOfLines={2}
                  >
                    {m.title}
                  </Text>
                  <Text
                    className="text-[10px] text-gray-500 dark:text-gray-400"
                    numberOfLines={1}
                  >
                    {m.character ? `as ${m.character}` : "Cast"}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
