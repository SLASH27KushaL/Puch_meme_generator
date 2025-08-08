import { motion } from "framer-motion";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col justify-center items-center px-6 text-white overflow-hidden">
      {/* Inline gradient animation style */}
      <style>
        {`
          @keyframes gradientMove {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
        `}
      </style>

      {/* Animated gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(-45deg, #0f172a, #1e1b4b, #312e81, #1e3a8a)",
          backgroundSize: "300% 300%",
          animation: "gradientMove 10s ease infinite",
        }}
      />

      {/* Main Hero Content */}
      <div className="relative z-10 max-w-4xl text-center mb-16">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-6xl font-extrabold tracking-tight mb-6"
        >
          AutoMeme
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-xl text-gray-300 mb-10"
        >
          Create hilarious memes instantly.  
          One click. Endless laughs. No design skills needed.
        </motion.p>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-10 py-4 text-lg font-semibold border border-white rounded-full hover:bg-white hover:text-black transition-colors duration-200"
        >
          Generate Memes
        </motion.button>
      </div>

      {/* How it works */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-10 max-w-5xl"
      >
        <div className="flex flex-col items-center">
          <span className="text-3xl font-bold mb-3">1</span>
          <p className="text-gray-300">Pick a topic or get trending news</p>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-3xl font-bold mb-3">2</span>
          <p className="text-gray-300">Choose a meme template</p>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-3xl font-bold mb-3">3</span>
          <p className="text-gray-300">Generate and share instantly</p>
        </div>
      </motion.div>
    </section>
  );
}
