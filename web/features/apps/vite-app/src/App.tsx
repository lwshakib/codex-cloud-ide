import viteLogo from '/vite.svg'

function App() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
       <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <div className="relative flex place-items-center">
            <a href="https://vitejs.dev" target="_blank">
            <img src={viteLogo} className="relative h-16 w-16 dark:drop-shadow-[0_0_2em_#646cffaa]" alt="Vite logo" />
            </a>
        </div>
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left mt-10">
          <h1 className="max-w-xl text-4xl font-bold leading-tight tracking-tight text-black dark:text-zinc-50">
            Speed. Flow. Excellence.
          </h1>
          <p className="max-w-md text-lg leading-7 text-zinc-600 dark:text-zinc-400">
             Build high-performance web applications with Vite and React.
            <br className="hidden sm:block" />
             Edit <code className="font-mono font-bold">src/App.tsx</code> to start coding.
          </p>
        </div>
        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row mt-10 w-full sm:w-auto">
          <a
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-black text-white px-5 transition-colors hover:bg-[#383838] dark:bg-white dark:text-black dark:hover:bg-[#ccc] md:w-auto"
            href="https://vitejs.dev/guide/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Get Started
          </a>
          <a
            className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] dark:text-white md:w-auto"
            href="https://react.dev"
            target="_blank"
            rel="noopener noreferrer"
          >
            React Docs
          </a>
           <a
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] dark:text-white md:w-auto"
            href="https://github.com/StartdVibe/vibe-coding-platform"
            target="_blank"
            rel="noopener noreferrer"
          >
             <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-black dark:text-white"
            >
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
            </svg>
            GitHub
          </a>
        </div>
      </main>
    </div>
  )
}
export default App
