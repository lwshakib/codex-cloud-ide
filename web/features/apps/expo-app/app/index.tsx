import { View, Text, Image, Linking, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const openLink = (url: string) => Linking.openURL(url);

  return (
    <SafeAreaView className="flex-1 bg-zinc-50 dark:bg-black items-center justify-center">
       {/* Background Blobs Removed */}

      <View className="flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-8 z-10 sm:items-start"> 
        <Image
           source={{ uri: "https://reactnative.dev/img/tiny_logo.png" }} 
           className="w-[120px] h-[120px]"
           style={{ width: 120, height: 120 }}
           resizeMode="contain"
        />

        <View className="flex flex-col items-center gap-6 text-center mt-10">
          <Text className="max-w-xl text-4xl font-bold leading-tight tracking-tight text-black dark:text-zinc-50 text-center">
             Universal Native Experience
          </Text>
          <Text className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400 text-center">
            Build native apps for Android, iOS, and the Web from a single codebase.
            Edit <Text className="font-bold font-mono">app/index.tsx</Text> to start.
          </Text>
        </View>

        <View className="flex flex-col gap-4 w-full items-center mt-10 sm:flex-row sm:w-auto">
          <Pressable
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-black px-5 active:opacity-80 dark:bg-zinc-50 sm:w-auto"
            onPress={() => openLink('https://expo.dev')}
          >
            <Text className="text-white font-medium text-base dark:text-black">Deploy Now</Text>
          </Pressable>
          <Pressable
            className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 active:bg-black/[.04] dark:border-white/[.145] dark:active:bg-[#1a1a1a] sm:w-auto"
            onPress={() => openLink('https://docs.expo.dev')}
          >
             <Text className="text-black dark:text-white font-medium text-base">Documentation</Text>
          </Pressable>
           <Pressable
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-solid border-black/[.08] px-5 active:bg-black/[.04] dark:border-white/[.145] dark:active:bg-[#1a1a1a] sm:w-auto"
            onPress={() => openLink('https://github.com/StartdVibe/vibe-coding-platform')}
          >
             <Text className="text-black dark:text-white font-medium text-base">GitHub</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
