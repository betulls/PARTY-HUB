import React, { useState, useEffect } from 'react';

// Dicebear 9.x Avataaars ile %100 uyumlu ten renkleri (Hex)
const SKINS = [
  { id: 'edb98a', label: 'Açık' },
  { id: 'fcd7b8', label: 'Buğday' },
  { id: 'd08b5b', label: 'Esmer' },
  { id: 'ae5d29', label: 'Koyu' },
  { id: '614335', label: 'Çok Koyu' }
];

// Dicebear 9.x Avataaars ile %100 uyumlu arka planlar
const BG_COLORS = [
  'b6e3f4', 'c0aede', 'd1d4f9', 'ffd5dc', 'ffdfbf', 'c5e1a5', 'fff59d'
];

// Dicebear 9.x Avataaars resmi kadın saç stilleri
const FEMALE_STYLES = [
  { id: 'straight01', label: 'Düz Saç' },
  { id: 'curly', label: 'Kıvırcık' },
  { id: 'bob', label: 'Bob Kesim' },
  { id: 'curvy', label: 'Dalgalı' },
  { id: 'fro', label: 'Afro' },
  { id: 'hijab', label: '🧕 Başörtü' }
];

// Dicebear 9.x Avataaars resmi erkek saç stilleri
const MALE_STYLES = [
  { id: 'shortFlat', label: 'Kısa Düz' },
  { id: 'shortCurly', label: 'Kıvırcık' },
  { id: 'shortWaved', label: 'Dalgalı' },
  { id: 'dreads01', label: 'Dreadlock' },
  { id: 'theCaesar', label: 'Klasik' },
  { id: 'frizzle', label: 'Dağınık' }
];

export default function AvatarBuilder({ onAvatarChange }) {
  const [gender, setGender] = useState('female');
  const [selectedTop, setSelectedTop] = useState('straight01');
  const [skinColor, setSkinColor] = useState('fcd7b8');
  const [bgColor, setBgColor] = useState('ffd5dc');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Dicebear 9.x Avataaars için en güvenli, asla kırılmayan URL motoru
  const buildDicebearUrl = (top, skin, bg, seed = 'party') => {
    return `https://api.dicebear.com/9.x/avataaars/svg?seed=${seed}&top=${top}&skinColor=${skin}&backgroundColor=${bg}`;
  };

  // Rastgele Avatar Üretici
  const randomizeAvatar = (targetGender = null) => {
    const activeGender = targetGender || (Math.random() > 0.5 ? 'female' : 'male');
    const styles = activeGender === 'female' ? FEMALE_STYLES : MALE_STYLES;

    const randomStyle = styles[Math.floor(Math.random() * styles.length)].id;
    const randomSkin = SKINS[Math.floor(Math.random() * SKINS.length)].id;
    const randomBg = BG_COLORS[Math.floor(Math.random() * BG_COLORS.length)];
    const randomSeed = `${activeGender}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    setGender(activeGender);
    setSelectedTop(randomStyle);
    setSkinColor(randomSkin);
    setBgColor(randomBg);

    const url = buildDicebearUrl(randomStyle, randomSkin, randomBg, randomSeed);
    setAvatarUrl(url);
    if (onAvatarChange) onAvatarChange(url);
  };

  // Sayfa ilk yüklendiğinde otomatik rastgele avatarla başla
  useEffect(() => {
    randomizeAvatar();
  }, []);

  const handleGenderChange = (newGender) => {
    setGender(newGender);
    const styles = newGender === 'female' ? FEMALE_STYLES : MALE_STYLES;
    const defaultStyle = styles[0].id;
    setSelectedTop(defaultStyle);

    const newSeed = `${newGender}_${Date.now()}`;
    const url = buildDicebearUrl(defaultStyle, skinColor, bgColor, newSeed);
    setAvatarUrl(url);
    if (onAvatarChange) onAvatarChange(url);
  };

  const handleStyleChange = (topId) => {
    setSelectedTop(topId);
    const url = buildDicebearUrl(topId, skinColor, bgColor, `${gender}_${topId}`);
    setAvatarUrl(url);
    if (onAvatarChange) onAvatarChange(url);
  };

  const handleSkinChange = (colorHex) => {
    setSkinColor(colorHex);
    const url = buildDicebearUrl(selectedTop, colorHex, bgColor, `${gender}_${selectedTop}`);
    setAvatarUrl(url);
    if (onAvatarChange) onAvatarChange(url);
  };

  const handleBgChange = (colorHex) => {
    setBgColor(colorHex);
    const url = buildDicebearUrl(selectedTop, skinColor, colorHex, `${gender}_${selectedTop}`);
    setAvatarUrl(url);
    if (onAvatarChange) onAvatarChange(url);
  };

  const currentStyles = gender === 'female' ? FEMALE_STYLES : MALE_STYLES;

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-xs mx-auto">
      {/* Avatar Önizleme Kutusu */}
      <div className="relative">
        <div className="w-24 h-24 rounded-full border-4 border-slate-950 bg-slate-100 overflow-hidden shadow-[0_4px_0_#0f172a] flex items-center justify-center">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Avatar Önizleme"
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-2xl animate-spin">⏳</span>
          )}
        </div>
        <button
          type="button"
          onClick={() => randomizeAvatar(gender)}
          title="Rastgele Karakter Üret"
          className="absolute -bottom-1 -right-1 p-2 bg-yellow-300 hover:bg-yellow-400 border-2 border-slate-950 rounded-full text-xs shadow-[0_2px_0_#0f172a] transition active:scale-90"
        >
          🎲
        </button>
      </div>

      {/* Cinsiyet Seçimi */}
      <div className="flex gap-2 bg-white p-1 rounded-2xl border-2 border-slate-950 shadow-[0_2px_0_#0f172a] w-full">
        <button
          type="button"
          onClick={() => handleGenderChange('female')}
          className={`flex-1 py-1.5 text-xs font-black rounded-xl transition ${
            gender === 'female'
              ? 'bg-pink-500 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Kadın 💇‍♀️
        </button>
        <button
          type="button"
          onClick={() => handleGenderChange('male')}
          className={`flex-1 py-1.5 text-xs font-black rounded-xl transition ${
            gender === 'male'
              ? 'bg-indigo-500 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Erkek 💇‍♂️
        </button>
      </div>

      {/* Saç / Stil Seçimi */}
      <div className="w-full">
        <span className="text-[10px] uppercase font-black text-slate-600 block mb-1">
          Saç / Stil
        </span>
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {currentStyles.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleStyleChange(item.id)}
              className={`flex-shrink-0 px-2.5 py-1 text-[11px] font-black rounded-xl border-2 transition ${
                selectedTop === item.id
                  ? 'bg-yellow-300 border-slate-950 text-slate-950 shadow-[0_2px_0_#0f172a] -translate-y-0.5'
                  : 'bg-white border-slate-300 text-slate-600 hover:border-slate-400'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Ten Rengi Paleti */}
      <div className="w-full">
        <span className="text-[10px] uppercase font-black text-slate-600 block mb-1">
          Ten Rengi
        </span>
        <div className="flex gap-2 justify-between">
          {SKINS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSkinChange(item.id)}
              style={{ backgroundColor: `#${item.id}` }}
              className={`w-7 h-7 rounded-full border-2 border-slate-950 transition active:scale-95 ${
                skinColor === item.id
                  ? 'scale-110 shadow-[0_3px_0_#0f172a] ring-2 ring-yellow-400'
                  : 'opacity-90 hover:opacity-100'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Arka Plan Rengi Paleti */}
      <div className="w-full">
        <span className="text-[10px] uppercase font-black text-slate-600 block mb-1">
          Arka Plan Rengi
        </span>
        <div className="flex gap-2 justify-between">
          {BG_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => handleBgChange(color)}
              style={{ backgroundColor: `#${color}` }}
              className={`w-6 h-6 rounded-xl border-2 border-slate-950 transition active:scale-95 ${
                bgColor === color
                  ? 'scale-110 shadow-[0_3px_0_#0f172a] ring-2 ring-yellow-400'
                  : 'opacity-85 hover:opacity-100'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}