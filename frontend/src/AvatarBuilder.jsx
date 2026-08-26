import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AVATAR_OPTIONS = {
  FEMALE_HAIR: {
    id: 'FEMALE_HAIR', label: '👩 Kadın Saç',
    items: [
      { val: 'straight01', label: 'Düz' },
      { val: 'bob', label: 'Kısa Bob' },
      { val: 'curly', label: 'Kıvırcık' },
      { val: 'curvy', label: 'Dalgalı' },
      { val: 'dreads', label: 'Rasta' },
      { val: 'frida', label: 'Frida' },
      { val: 'fro', label: 'Afro' },
      { val: 'miaWallace', label: 'Mia' },
      { val: 'straightAndStrand', label: 'Kahküllü' },
      { val: 'hijab', label: 'Başörtüsü' }
    ]
  },
  MALE_HAIR: {
    id: 'MALE_HAIR', label: '👨 Erkek Saç',
    items: [
      { val: 'shortFlat', label: 'Klasik' },
      { val: 'shortWaved', label: 'Dalgalı' },
      { val: 'shortCurly', label: 'Kıvırcık' },
      { val: 'theCaesar', label: 'Sezar' },
      { val: 'shaggyMullet', label: 'Mullet' },
      { val: 'dreads01', label: 'Rasta' },
      { val: 'frizzle', label: 'Dağınık' },
      { val: 'sides', label: 'Yanlar Kısa' },
      { val: 'noHair', label: 'Kel' }
    ]
  },
  HATS: {
    id: 'HATS', label: '🧢 Şapka',
    items: [
      { val: 'winterHat01', label: 'Bere 1' },
      { val: 'winterHat02', label: 'Bere 2' },
      { val: 'winterHat03', label: 'Kulaklıklı' },
      { val: 'winterHat04', label: 'Ponponlu' },
      { val: 'turban', label: 'Türban' }
    ]
  },
  HAIR_COLOR: {
    id: 'HAIR_COLOR', label: '🎨 Renk',
    items: [
      { val: 'black', label: 'Siyah', color: '#2c3e50' },
      { val: 'brown', label: 'Kahve', color: '#795548' },
      { val: 'blonde', label: 'Sarı', color: '#f1c40f' },
      { val: 'red', label: 'Kızıl', color: '#e74c3c' },
      { val: 'pastelPink', label: 'Pembe', color: '#ff9ff3' },
      { val: 'silverGray', label: 'Gri', color: '#bdc3c7' },
      { val: 'platinum', label: 'Platin', color: '#ecf0f1' }
    ]
  },
  FACIAL_HAIR: {
    id: 'FACIAL_HAIR', label: '🧔 Sakal',
    items: [
      { val: 'blank', label: '🚫 Yok' },
      { val: 'beardLight', label: 'Kirli Sakal' },
      { val: 'beardMedium', label: 'Normal Sakal' },
      { val: 'beardMajestic', label: 'Uzun Sakal' }
    ]
  },
  ACCESSORIES: {
    id: 'ACCESSORIES', label: '🕶️ Gözlük',
    items: [
      { val: 'blank', label: '🚫 Yok' },
      { val: 'prescription02', label: '👓 Klasik' },
      { val: 'round', label: '🥽 Yuvarlak' },
      { val: 'sunglasses', label: '🕶️ Güneş' },
      { val: 'wayfarers', label: '🕶️ Havalı' }
    ]
  }
};

const BG_COLORS = ['b6e3f4', 'c0aede', 'd1d4f9', 'ffdfbf', 'ffd5dc'];
const NO_HAIR_COLOR_TOPS = ['noHair', 'hijab', 'turban', 'winterHat01', 'winterHat02', 'winterHat03', 'winterHat04'];

export default function AvatarBuilder({ onAvatarChange = () => {} }) {
  const [baseSeed] = useState(() => Math.random().toString(36).substring(7));
  const [bgColor] = useState(() => BG_COLORS[Math.floor(Math.random() * BG_COLORS.length)]);

  const [activeCategory, setActiveCategory] = useState('FEMALE_HAIR');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [loadError, setLoadError] = useState(false);

  const [selections, setSelections] = useState({
    top: 'curvy',
    hairColor: 'brown',
    facialHair: 'blank',
    accessories: 'blank'
  });

  useEffect(() => {
    const params = new URLSearchParams();
    params.append('seed', baseSeed);
    params.append('backgroundColor', bgColor);
    params.append('top', selections.top);

    if (!NO_HAIR_COLOR_TOPS.includes(selections.top)) {
      const hairColorHex = AVATAR_OPTIONS.HAIR_COLOR.items.find(
        (c) => c.val === selections.hairColor
      )?.color?.replace('#', '');
      if (hairColorHex) {
        params.append('hairColor', hairColorHex);
      }
    }

    if (selections.facialHair !== 'blank') {
      params.append('facialHair', selections.facialHair);
      params.append('facialHairProbability', '100');
    }

    if (selections.accessories !== 'blank') {
      params.append('accessories', selections.accessories);
      params.append('accessoriesProbability', '100');
    }

    const finalUrl = `https://api.dicebear.com/10.x/avataaars/svg?${params.toString()}`;
    setAvatarUrl(finalUrl);
    setLoadError(false);
    onAvatarChange(finalUrl);
    
    // 🚀 DÜZELTME: Sonsuz render döngüsünü kırmak için onAvatarChange bağımlılıklardan çıkarıldı!
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selections, baseSeed, bgColor]);

  const handleSelect = (categoryKey, val) => {
    setSelections(prev => {
      const next = { ...prev };
      if (['FEMALE_HAIR', 'MALE_HAIR', 'HATS'].includes(categoryKey)) next.top = val;
      else if (categoryKey === 'HAIR_COLOR') next.hairColor = val;
      else if (categoryKey === 'FACIAL_HAIR') next.facialHair = val;
      else if (categoryKey === 'ACCESSORIES') next.accessories = val;
      return next;
    });
  };

  const handleRandomize = () => {
    const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)].val;
    const allTops = [...AVATAR_OPTIONS.FEMALE_HAIR.items, ...AVATAR_OPTIONS.MALE_HAIR.items, ...AVATAR_OPTIONS.HATS.items];
    setSelections({
      top: randomItem(allTops),
      hairColor: randomItem(AVATAR_OPTIONS.HAIR_COLOR.items),
      facialHair: Math.random() > 0.7 ? randomItem(AVATAR_OPTIONS.FACIAL_HAIR.items) : 'blank',
      accessories: Math.random() > 0.6 ? randomItem(AVATAR_OPTIONS.ACCESSORIES.items) : 'blank'
    });
  };

  const activeItems = AVATAR_OPTIONS[activeCategory].items;
  const isSelected = (val) => {
    if (['FEMALE_HAIR', 'MALE_HAIR', 'HATS'].includes(activeCategory)) return selections.top === val;
    if (activeCategory === 'HAIR_COLOR') return selections.hairColor === val;
    if (activeCategory === 'FACIAL_HAIR') return selections.facialHair === val;
    if (activeCategory === 'ACCESSORIES') return selections.accessories === val;
    return false;
  };

  return (
    <div className="w-full flex flex-col gap-3">
      <style>{`
        .cute-scrollbar::-webkit-scrollbar { height: 6px; }
        .cute-scrollbar::-webkit-scrollbar-track { background: #f8fafc; border-radius: 10px; }
        .cute-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .cute-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>

      <div className="flex items-center gap-3">
        <div className="relative w-24 h-24 bg-slate-100 rounded-3xl border-4 border-slate-950 shadow-[0_4px_0_#0f172a] overflow-hidden flex-shrink-0 flex items-center justify-center">
          <AnimatePresence mode="popLayout">
            {avatarUrl && !loadError ? (
              <motion.img
                key={avatarUrl}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', damping: 15 }}
                src={avatarUrl}
                alt="Avatar"
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.error('Avatar yüklenemedi:', avatarUrl, e);
                  setLoadError(true);
                }}
              />
            ) : loadError ? (
              <span className="text-[10px] text-red-500 font-bold text-center px-1">Görsel yüklenemedi ⚠️</span>
            ) : (
              <span className="text-xl animate-spin">⏳</span>
            )}
          </AnimatePresence>
        </div>

        <div className="flex-1 text-left">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Tarzını Yansıt</p>
          <button
            type="button"
            onClick={handleRandomize}
            className="w-full bg-yellow-300 hover:bg-yellow-400 text-slate-950 text-xs font-black py-2.5 rounded-2xl border-2 border-slate-950 border-b-4 border-b-slate-950 active:border-b-2 active:translate-y-0.5 transition-all flex items-center justify-center gap-2"
          >
            <span>🎲</span> Sürpriz Yap
          </button>
        </div>
      </div>

      <div className="w-full h-[2px] bg-slate-900/10 rounded-full my-1"></div>

      <div className="relative w-full">
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-100 to-transparent pointer-events-none z-10 rounded-r-2xl"></div>
        <div className="flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory pr-6 cute-scrollbar">
          {Object.values(AVATAR_OPTIONS).map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`snap-start relative z-20 whitespace-nowrap px-3 py-1.5 rounded-xl border-2 border-slate-950 text-[10px] font-black transition-all ${
                activeCategory === cat.id
                  ? 'bg-slate-950 text-white shadow-[0_2px_0_#e2e8f0]'
                  : 'bg-white text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative w-full bg-white border-2 border-slate-950/20 rounded-2xl p-2.5">
        <motion.div
          animate={{ x: [0, 5, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="absolute -top-3 right-2 bg-pink-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full border-2 border-slate-950 shadow-sm z-20 pointer-events-none"
        >
          Kaydır 👉
        </motion.div>

        <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-white to-transparent pointer-events-none z-10 rounded-r-2xl"></div>

        <div className="flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory pr-6 items-center min-h-[50px] cute-scrollbar">
          {activeItems.map((item) => (
            <button
              key={item.val}
              type="button"
              onClick={() => handleSelect(activeCategory, item.val)}
              // 🚀 DÜZELTME: Butonlara z-20 eklendi ki maskelerin altında kalıp tıklanmamazlık yapmasın
              className={`snap-start flex-shrink-0 relative z-20 overflow-hidden transition-all ${
                activeCategory === 'HAIR_COLOR'
                  ? 'w-10 h-10 rounded-full border-2 border-slate-950 flex items-center justify-center'
                  : 'px-3 py-2 rounded-xl border-2 border-slate-950 text-[11px] font-black whitespace-nowrap'
              } ${
                isSelected(item.val)
                  ? activeCategory === 'HAIR_COLOR'
                    ? 'scale-110 shadow-[0_0_0_2px_#ec4899]'
                    : 'bg-emerald-400 text-slate-950 shadow-[0_2px_0_#0f172a] -translate-y-0.5'
                  : activeCategory === 'HAIR_COLOR'
                    ? 'hover:scale-110'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-200'
              }`}
              style={activeCategory === 'HAIR_COLOR' ? { backgroundColor: item.color } : {}}
            >
              {activeCategory === 'HAIR_COLOR' && isSelected(item.val) && (
                <span className="text-white drop-shadow-md text-xs font-black">✓</span>
              )}
              {activeCategory !== 'HAIR_COLOR' && item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}