import React, { useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';

export default function SwipeCard({ question, onVote, disabled }) {
  const [exitX, setExitX] = useState(0);
  const x = useMotionValue(0);

  // 1. Doğal Kart Dönüş Açısı
  const rotate = useTransform(x, [-200, 200], [-22, 22]);

  // 2. Anlık Rozet Görünürlüğü (10px kaydırmada hemen belirir)
  const opacityRed = useTransform(x, [-80, -10], [1, 0]);
  const opacityGreen = useTransform(x, [10, 80], [0, 1]);

  // 3. ANLIK RENK GEÇİŞLERİ (Kaydırırken kartın rengi ve kenarları değişir)
  const backgroundColor = useTransform(
    x,
    [-150, 0, 150],
    ['rgba(76, 5, 25, 0.95)', 'rgba(15, 23, 42, 0.95)', 'rgba(6, 78, 59, 0.95)']
  );

  const borderColor = useTransform(
    x,
    [-120, 0, 120],
    ['rgba(244, 63, 94, 0.9)', 'rgba(51, 65, 85, 0.8)', 'rgba(16, 185, 129, 0.9)']
  );

  // 4. Dinamik Neon Işık (Glow)
  const boxShadow = useTransform(
    x,
    [-150, 0, 150],
    [
      '0 0 45px -5px rgba(244, 63, 94, 0.6)',
      '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
      '0 0 45px -5px rgba(16, 185, 129, 0.6)'
    ]
  );

  const handleDragEnd = (_, info) => {
    if (disabled) return;
    const threshold = 90;

    if (info.offset.x < -threshold) {
      // Sola fırlatıldı -> RED FLAG
      setExitX(-400);
      if (navigator.vibrate) navigator.vibrate(60);
      onVote('red');
    } else if (info.offset.x > threshold) {
      // Sağa fırlatıldı -> GREEN FLAG
      setExitX(400);
      if (navigator.vibrate) navigator.vibrate(60);
      onVote('green');
    }
  };

  return (
    <div className="relative w-full max-w-sm h-[420px] flex items-center justify-center select-none touch-none">
      <motion.div
        drag={disabled ? false : true}
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.7}
        onDragEnd={handleDragEnd}
        style={{
          x,
          rotate,
          backgroundColor,
          borderColor,
          boxShadow
        }}
        animate={{ x: exitX }}
        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
        className="absolute w-full h-full border-2 rounded-3xl p-6 flex flex-col justify-between backdrop-blur-2xl cursor-grab active:cursor-grabbing transition-colors duration-75"
      >
        {/* GREEN FLAG Damgası (Sağa kaydırırken) */}
        <motion.div 
          style={{ opacity: opacityGreen }}
          className="absolute top-6 left-6 border-4 border-emerald-400 text-emerald-300 font-black text-xl px-4 py-1.5 rounded-2xl -rotate-12 bg-emerald-950/80 shadow-lg pointer-events-none"
        >
          GREEN FLAG 🟢
        </motion.div>

        {/* RED FLAG Damgası (Sola kaydırırken) */}
        <motion.div 
          style={{ opacity: opacityRed }}
          className="absolute top-6 right-6 border-4 border-rose-500 text-rose-300 font-black text-xl px-4 py-1.5 rounded-2xl rotate-12 bg-rose-950/80 shadow-lg pointer-events-none"
        >
          RED FLAG 🚩
        </motion.div>

        {/* Kategori Etiketi */}
        <div className="flex justify-center mt-1">
          <span className="bg-black/40 text-slate-300 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-white/10 backdrop-blur-sm">
            🏷️ {question?.category || "Genel"}
          </span>
        </div>

        {/* Soru Metni */}
        <div className="my-auto text-center px-3 py-4">
          <p className="text-xl md:text-2xl font-extrabold text-white leading-relaxed tracking-tight drop-shadow-md">
            "{question?.text}"
          </p>
        </div>

        {/* Alt Rehber */}
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300 pt-4 border-t border-white/10">
          <span className="flex items-center gap-1 text-rose-400 bg-rose-950/40 px-2 py-1 rounded-lg border border-rose-500/20">
            👈 Sola: Red
          </span>
          <span className="text-[11px] text-slate-400">veya Kaydır</span>
          <span className="flex items-center gap-1 text-emerald-400 bg-emerald-950/40 px-2 py-1 rounded-lg border border-emerald-500/20">
            Sağa: Green 👉
          </span>
        </div>
      </motion.div>
    </div>
  );
}