import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

const EMOJI_LIST = ['🎉', '🎈', '🚩', '🕵️‍♂️', '✨', '🔥', '🎲', '🍿', '👑', '🥳', '👀', '💃'];

export default function SplashScreen() {
  const fallingEmojis = useMemo(() => {
    // 🚀 Performans için emoji sayısı optimize edildi
    return Array.from({ length: 15 }).map((_, index) => ({
      id: index,
      emoji: EMOJI_LIST[index % EMOJI_LIST.length],
      left: `${Math.random() * 95}%`,
      delay: Math.random() * 1.5,
      duration: 1.8 + Math.random() * 1.5, // Biraz daha tempolu akması için süreyi kısalttım
    }));
  }, []);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 overflow-hidden select-none"
    >
      {/* 🎊 Tepeden Dökülen Emojiler (GPU Optimize) */}
      {fallingEmojis.map((item) => (
        <motion.div
          key={item.id}
          initial={{ y: 0, opacity: 0 }}
          animate={{ y: '120vh', opacity: [0, 1, 1, 0] }}
          transition={{
            duration: item.duration,
            delay: item.delay,
            repeat: Infinity,
            ease: 'linear'
          }}
          style={{ 
            left: item.left, 
            top: '-10%',
            willChange: 'transform, opacity' // 🚀 Tarayıcıya GPU hızlandırması emri verir
          }}
          // drop-shadow kaldırıldı, kasma tamamen biter
          className="absolute text-4xl pointer-events-none"
        >
          {item.emoji}
        </motion.div>
      ))}

      {/* 🎭 Orta Logo */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 12, stiffness: 150 }}
        className="relative z-10 flex flex-col items-center"
        style={{ willChange: 'transform, opacity' }} // 🚀 Logo animasyonu için de GPU hızlandırması
      >
        <div className="bg-yellow-300 border-4 border-slate-950 px-8 py-4 rounded-[32px] shadow-[0_10px_0_#e11d48] flex items-center gap-3">
          <h1 className="text-4xl md:text-6xl font-black text-slate-950 tracking-tight">
            PARTY HUB
          </h1>
          <span className="text-4xl md:text-5xl">🎭</span>
        </div>
        <p className="text-xs font-black tracking-widest text-slate-400 uppercase mt-4 animate-pulse">
          Kaos Hazırlanıyor...
        </p>
      </motion.div>
    </motion.div>
  );
}