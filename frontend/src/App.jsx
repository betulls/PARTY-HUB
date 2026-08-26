import React, { useState, useEffect, useMemo } from 'react';
import * as signalR from '@microsoft/signalr';
import { motion, AnimatePresence } from 'framer-motion';
import { QUESTIONS as FLAG_QUESTIONS } from './questions';
import { WHO_QUESTIONS } from './whoQuestions';
import { JEALOUSY_QUESTIONS } from './jealousyQuestions';
import { IMPOSTER_CATEGORIES } from './imposterWords';
import SwipeCard from './SwipeCard';
import AvatarBuilder from './AvatarBuilder';
import SplashScreen from './SplashScreen';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || `http://${window.location.hostname}:5184/gamehub`;

const RANDOM_NICKS = [
  'KaosMakinesi', 'GölgeAjan', 'BalerinPanda', 'GeceKuşu',
  'ToksikPrens', 'Dedektif', 'KahveBağımlısı', 'DramKraliçesi',
  'GizliStalker', 'Şakamatik', 'RetroKedi', 'BayKritik'
];

// 🚀 SORULARI KARIŞTIRMAK İÇİN ÖZEL ALGORİTMA
// Oda kodunu kullanarak karıştırır. Böylece odadaki herkes aynı rastgele soruları görür!
const getSeededRandom = (seedStr) => {
  let h = 0xdeadbeef;
  for(let i = 0; i < seedStr.length; i++)
      h = Math.imul(h ^ seedStr.charCodeAt(i), 2654435761);
  return function() {
      h = Math.imul(h ^ (h >>> 16), 2246822507);
      h = Math.imul(h ^ (h >>> 13), 3266489909);
      return (h ^= h >>> 16) >>> 0;
  }
};

const shuffleArray = (array, seedStr) => {
  if (!seedStr || !array) return array || [];
  const shuffled = [...array];
  const rand = getSeededRandom(seedStr);
  for (let i = shuffled.length - 1; i > 0; i--) {
      const j = rand() % (i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export default function App() {
  const [isAppLoading, setIsAppLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAppLoading(false);
    }, 2200);
    return () => clearTimeout(timer);
  }, []);

  const [imposterFinalResult, setImposterFinalResult] = useState(null);
  const [connection, setConnection] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState('');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [activeGuideTab, setActiveGuideTab] = useState('JOIN'); 
  
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const [roomCode, setRoomCode] = useState('');
  const [players, setPlayers] = useState([]);
  const [isHost, setIsHost] = useState(false);
  const [gameState, setGameState] = useState('LOBBY'); 
  
  const [gameMode, setGameMode] = useState('FLAGWARS'); 
  const [whoSubMode, setWhoSubMode] = useState('GROUP');
  const [questionCount, setQuestionCount] = useState(10);
  const [imposterCategory, setImposterCategory] = useState('YEMEKLER');
  const [imposterRounds, setImposterRounds] = useState(3);

  const [myImposterRole, setMyImposterRole] = useState({ isImposter: false, secretWord: '', category: '' });
  const [imposterClues, setImposterClues] = useState([]);
  const [currentClueInput, setCurrentClueInput] = useState('');
  const [hasSentClueThisRound, setHasSentClueThisRound] = useState(false);
  const [imposterCurrentRound, setImposterCurrentRound] = useState(1);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [hasVotedThisRound, setHasVotedThisRound] = useState(false);
  const [selectedTargetUser, setSelectedTargetUser] = useState(null);
  const [jealousyValue, setJealousyValue] = useState(5);
  
  const [latestRoundResult, setLatestRoundResult] = useState(null);
  const [finalGameReport, setFinalGameReport] = useState(null);

  const [pokedMessage, setPokedMessage] = useState('');
  const [isScreenShaking, setIsScreenShaking] = useState(false);
  const [floatingEmojis, setFloatingEmojis] = useState([]);
  const [countdownNumber, setCountdownNumber] = useState(null);

  const calculateFlagStats = (resultData) => {
    const votes = resultData?.votes || resultData?.Votes || resultData?.roundVotes || [];
    if (!votes || votes.length === 0) {
      const r = resultData?.redPercentage ?? resultData?.RedPercentage ?? 50;
      const g = resultData?.greenPercentage ?? resultData?.GreenPercentage ?? 50;
      return { redPercent: r, greenPercent: g, redPct: r, greenPct: g, redCount: 0, greenCount: 0 };
    }
    const redCount = votes.filter(v => {
      const val = v.vote ?? v.Vote ?? v.choice ?? v.Choice ?? v;
      return val === false || val === 'RED' || val === 'Red' || val === 'red';
    }).length;
    const greenCount = votes.filter(v => {
      const val = v.vote ?? v.Vote ?? v.choice ?? v.Choice ?? v;
      return val === true || val === 'GREEN' || val === 'Green' || val === 'green';
    }).length;
    const total = redCount + greenCount;
    if (total === 0) return { redPercent: 50, greenPercent: 50, redPct: 50, greenPct: 50, redCount: 0, greenCount: 0 };
    const redPercent = Math.round((redCount / total) * 100);
    const greenPercent = 100 - redPercent;
    return { redPercent, greenPercent, redPct: redPercent, greenPct: greenPercent, redCount, greenCount };
  };

  // 🚀 DÜZELTME: Sorular artık oda koduna göre rastgele karıştırılıyor!
  const activeQuestions = useMemo(() => {
    let baseQuestions = FLAG_QUESTIONS || [];
    if (gameMode === 'MOST_LIKELY') {
      baseQuestions = (WHO_QUESTIONS && WHO_QUESTIONS[whoSubMode]) || (WHO_QUESTIONS && WHO_QUESTIONS.GROUP) || [];
    } else if (gameMode === 'JEALOUSY') {
      baseQuestions = JEALOUSY_QUESTIONS || [];
    }
    return shuffleArray(baseQuestions, roomCode || 'LOBBY');
  }, [gameMode, whoSubMode, roomCode]);

  const currentQuestion = activeQuestions.length > 0
    ? activeQuestions[currentQuestionIndex % activeQuestions.length]
    : { text: "Soru yükleniyor...", category: "Genel" };

  useEffect(() => {
    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(BACKEND_URL)
      .withAutomaticReconnect()
      .build();

    newConnection.start()
      .then(() => {
        setIsConnected(true);

        newConnection.on('UpdatePlayers', (updatedPlayers) => {
          setPlayers(updatedPlayers);
          const me = updatedPlayers.find(p => p.connectionId === newConnection.connectionId);
          if (me) setIsHost(me.isHost);
        });

        newConnection.on('GameModeChanged', (data) => {
          if (data) {
            setGameMode(data.gameMode);
            setWhoSubMode(data.subMode);
            setQuestionCount(data.questionCount);
          }
        });

        newConnection.on('PlayerPoked', (senderName) => {
          if (navigator.vibrate) {
            try { navigator.vibrate([150, 50, 150]); } catch (e) {}
          }
          setIsScreenShaking(true);
          setPokedMessage(`⚡ ${senderName} seni dürttü!`);
          setTimeout(() => setIsScreenShaking(false), 600);
          setTimeout(() => setPokedMessage(''), 2500);
        });

        newConnection.on('EmojiReceived', ({ username: sender, emoji }) => {
          const id = Date.now() + Math.random();
          const randomLeft = Math.floor(Math.random() * 60) + 20;
          setFloatingEmojis(prev => [...prev, { id, emoji, sender, left: `${randomLeft}%` }]);
          setTimeout(() => setFloatingEmojis(prev => prev.filter(e => e.id !== id)), 2000);
        });

        newConnection.on('GameStarted', (data) => {
          if (data) {
            setGameMode(data.gameMode);
            setWhoSubMode(data.subMode);
            setQuestionCount(data.questionCount);
          }
          triggerCountdown(() => {
            setCurrentQuestionIndex(0);
            setHasVotedThisRound(false);
            setSelectedTargetUser(null);
            setJealousyValue(5);
            setLatestRoundResult(null);
            setFinalGameReport(null);
            setPlayers(prev => prev.map(p => ({ ...p, currentVote: null })));
            setGameState('VOTING');
          });
        });

        newConnection.on('ImposterGameStarted', (data) => {
          setMyImposterRole(data);
          setImposterClues([]);
          setHasSentClueThisRound(false);
          setImposterCurrentRound(1);
          triggerCountdown(() => {
            setGameState('IMPOSTER_CLUES');
          });
        });

        newConnection.on('UpdateImposterClues', (clues) => {
          setImposterClues(clues);
        });

        newConnection.on('ImposterNextClueRound', (nextRound) => {
          setImposterCurrentRound(nextRound);
          setHasSentClueThisRound(false);
          setCurrentClueInput('');
        });

        newConnection.on('ImposterStartVoting', () => {
          setHasVotedThisRound(false);
          setSelectedTargetUser(null);
          setGameState('IMPOSTER_VOTE');
        });

        newConnection.on('ImposterGameOver', (data) => {
          setImposterFinalResult(data);
          setGameState('IMPOSTER_REVEAL');
        });

        newConnection.on('PlayerVoted', (voterName) => {
          setPlayers(prev => prev.map(p => p.username === voterName ? { ...p, currentVote: 'voted' } : p));
        });

        newConnection.on('AllVotesCompleted', (data) => {
          setPlayers(data.players);
          setLatestRoundResult(data.roundResult);
          setGameState('REVEAL');
        });

        newConnection.on('NextQuestionStarted', (qIndex) => {
          setCurrentQuestionIndex(qIndex);
          setHasVotedThisRound(false);
          setSelectedTargetUser(null);
          setJealousyValue(5);
          setLatestRoundResult(null);
          setPlayers(prev => prev.map(p => ({ ...p, currentVote: null })));
          setGameState('VOTING');
        });

        newConnection.on('StartNextClueRound', (nextRoundNumber) => {
          setImposterCurrentRound(nextRoundNumber);
          setHasSentClueThisRound(false);
          setCurrentClueInput('');
        });

        newConnection.on('GameOver', (report) => {
          setFinalGameReport(report);
          setGameState('GAMEOVER');
        });

        newConnection.on('ReturnedToLobby', (updatedPlayers) => {
          setPlayers(updatedPlayers.map(p => ({ ...p, currentVote: null })));
          setGameState('LOBBY');
          setLatestRoundResult(null);
          setFinalGameReport(null);
          setHasVotedThisRound(false);
          setSelectedTargetUser(null);
          setJealousyValue(5);
          setCountdownNumber(null);
          setImposterClues([]);
        });

        newConnection.on('HostChanged', (newHostName) => {
          setPokedMessage(`👑 Yeni Kurucu: ${newHostName}`);
          setTimeout(() => setPokedMessage(''), 3000);
        });
      })
      .catch(err => {
        setIsConnected(false);
        console.error('SignalR Bağlantı Hatası:', err);
      });

    setConnection(newConnection);

    return () => {
      newConnection.stop();
    };
  }, []);

  const triggerCountdown = (callback) => {
    setGameState('COUNTDOWN');
    setCountdownNumber(3);
    setTimeout(() => setCountdownNumber(2), 1000);
    setTimeout(() => setCountdownNumber(1), 2000);
    setTimeout(() => {
      setCountdownNumber('BAŞLA! 🔥');
      setTimeout(() => {
        setCountdownNumber(null);
        callback();
      }, 700);
    }, 3000);
  };

  const handleCopyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setPokedMessage(`📋 Kodu Kopyaladın: ${code}`);
      setTimeout(() => setPokedMessage(''), 2000);
    } catch (err) {
      console.error('Kopyalama başarısız', err);
    }
  };

  const handleModeChange = (newMode, newSub = whoSubMode, newCount = questionCount) => {
    setGameMode(newMode);
    setWhoSubMode(newSub);
    setQuestionCount(newCount);
    if (connection && isHost) {
      connection.invoke('ChangeGameMode', roomCode, newMode, newSub, newCount);
    }
  };

  const handleStartGame = () => {
    if (!connection || !isHost) return;
    if (gameMode === 'IMPOSTER' && players.length < 3) {
      alert('🕵️‍♂️ Ajan Kim oyununu başlatmak için en az 3 oyuncu gerekiyor!');
      return;
    }
    if (gameMode === 'IMPOSTER') {
      const cat = IMPOSTER_CATEGORIES[imposterCategory];
      const randomWord = cat.words[Math.floor(Math.random() * cat.words.length)];
      connection.invoke('StartImposterGame', roomCode, cat.label, randomWord, imposterRounds);
    } else {
      connection.invoke('StartGame', roomCode);
    }
  };

  const handleSendClue = () => {
    if (!connection || !currentClueInput.trim() || hasSentClueThisRound) return;
    const inputWord = currentClueInput.trim().toLocaleLowerCase('tr-TR');
    const secret = (myImposterRole?.secretWord || '').toLocaleLowerCase('tr-TR');
    if (!myImposterRole?.isImposter && secret && inputWord === secret) {
      alert('⚠️ Gizli kelimenin kendisini ipucu olarak veremezsiniz!');
      return;
    }
    const alreadyUsed = imposterClues.some(
      (c) => (c.clueText || c.ClueText || '').trim().toLocaleLowerCase('tr-TR') === inputWord
    );
    if (alreadyUsed) {
      alert(`⚠️ "${currentClueInput.trim()}" kelimesi daha önce kullanıldı! Farklı bir kelime yazın.`);
      return;
    }
    setHasSentClueThisRound(true);
    connection.invoke('SubmitImposterClue', roomCode, currentClueInput.trim())
      .catch(err => {
        console.error("İpucu gönderme hatası:", err);
        setHasSentClueThisRound(false);
      });
    setCurrentClueInput('');
  };

  const handleRandomNick = () => {
    const random = RANDOM_NICKS[Math.floor(Math.random() * RANDOM_NICKS.length)];
    setUsername(random);
  };

  const handleCreateRoom = async () => {
    if (!username.trim()) return alert('Lütfen bir kullanıcı adı gir!');
    if (!connection || !isConnected) return alert('Sunucuya bağlanılamadı!');
    try {
      const code = await connection.invoke('CreateRoom', username, avatar);
      setRoomCode(code);
      setIsHost(true);
    } catch (err) {
      alert('Oda kurulamadı: ' + err.toString());
    }
  };

  const handleJoinRoom = async () => {
    if (!username.trim() || !roomCodeInput.trim()) return alert('İsim ve Oda Kodu gerekli!');
    if (!connection || !isConnected) return alert('Sunucuya bağlanılamadı!');
    try {
      const success = await connection.invoke('JoinRoom', roomCodeInput, username, avatar);
      if (success) setRoomCode(roomCodeInput.toUpperCase());
      else alert('Oda bulunamadı!');
    } catch (err) {
      alert('Odaya girilemedi: ' + err.toString());
    }
  };

  const handleLeaveRoom = async () => {
    if (connection && roomCode) {
      await connection.invoke('LeaveRoom', roomCode);
      setRoomCode('');
      setGameState('LOBBY');
    }
  };

  const handleReturnToLobby = async () => {
    if (connection && roomCode) {
      await connection.invoke('ReturnToLobby', roomCode);
    }
  };

  const handleFlagVote = async (choice) => {
    if (hasVotedThisRound) return;
    setHasVotedThisRound(true);
    let formattedChoice = 'RED';
    if (choice === true || choice === 'GREEN' || choice === 'green' || choice === 'Green') {
      formattedChoice = 'GREEN';
    } else if (choice === false || choice === 'RED' || choice === 'red' || choice === 'Red') {
      formattedChoice = 'RED';
    }
    await connection.invoke('SubmitVote', roomCode, formattedChoice);
  };

  const handleTargetVote = async (targetUsername) => {
    if (hasVotedThisRound) return;
    setHasVotedThisRound(true);
    setSelectedTargetUser(targetUsername);
    await connection.invoke('SubmitVote', roomCode, targetUsername);
  };

  const handleJealousyVote = async () => {
    if (hasVotedThisRound) return;
    setHasVotedThisRound(true);
    await connection.invoke('SubmitVote', roomCode, jealousyValue.toString());
  };

  const handleNextQuestion = async () => {
    await connection.invoke('NextQuestion', roomCode);
  };

  const getMostVotedPerson = () => {
    if (!latestRoundResult?.votes) return null;
    const countMap = {};
    latestRoundResult.votes.forEach(v => {
      countMap[v.choice] = (countMap[v.choice] || 0) + 1;
    });
    let max = 0;
    let winner = null;
    let isTie = false;
    for (const [target, count] of Object.entries(countMap)) {
      if (count > max) {
        max = count;
        winner = target;
        isTie = false;
      } else if (count === max) {
        isTie = true;
      }
    }
    return { winner, count: max, isTie };
  };

  const mostVoted = getMostVotedPerson();

  // 🚀 DÜZELTME: Oyun sonu "Kim Yapar" raporu için güvenli hesaplama ve LOG
  const getOverallMostVotedName = () => {
    if (!finalGameReport) return null;

    // 🚨 HATA AYIKLAMA: F12 Konsolunda C#'tan gelen datanın tam yapısını görmek için
    console.log("📊 OYUN SONU DATASI:", finalGameReport);

    // 1. İhtimal: Backend (C#) direkt kazananı hesaplayıp gönderiyorsa
    if (finalGameReport.mostVoted) return { name: finalGameReport.mostVoted.username || finalGameReport.mostVoted.name, count: finalGameReport.mostVoted.count || finalGameReport.mostVoted.votes || finalGameReport.mostVoted.voteCount };
    if (finalGameReport.topTarget) return { name: finalGameReport.topTarget.username || finalGameReport.topTarget.name, count: finalGameReport.topTarget.voteCount || finalGameReport.topTarget.count };
    if (finalGameReport.theMostLikely) return { name: finalGameReport.theMostLikely.username, count: finalGameReport.theMostLikely.voteCount };

    // 2. İhtimal: Backend geçmişi liste olarak gönderiyorsa biz hesaplıyoruz
    const history = finalGameReport.history || finalGameReport.History || finalGameReport.roundResults || finalGameReport.RoundResults;

    if (!history || history.length === 0) return null;

    const counts = {};
    history.forEach(round => {
      const votes = round.votes || round.Votes || [];
      votes.forEach(v => {
        const choice = v.choice || v.Choice || v.votedTarget || v.VotedTarget || v.VotedUsername;
        if (choice) counts[choice] = (counts[choice] || 0) + 1;
      });
    });

    let topName = null;
    let maxVotes = 0;
    for (const [name, cnt] of Object.entries(counts)) {
      if (cnt > maxVotes) {
        maxVotes = cnt;
        topName = name;
      }
    }
    return topName ? { name: topName, count: maxVotes } : null;
  };
  const overallTopTarget = getOverallMostVotedName();

  const getJealousyEmoji = (val) => {
    if (val <= 2) return '😌 Rahat / Sıfır Toksik';
    if (val <= 5) return '🤨 Hafif Kıllandım';
    if (val <= 8) return '🔥 Yangın Başladı';
    return '🚨 KAOS & ENGEL';
  };

  return (
    // 🚀 DİKKAT: Mobil scroll sorununu çözmek için `h-[100dvh] overflow-hidden` kullanıldı
    <div className={`h-[100dvh] w-full overflow-hidden party-bg-pattern text-slate-900 flex flex-col items-center justify-center p-4 relative select-none transition-transform duration-75 ${
      isScreenShaking ? 'translate-x-2 -translate-y-2 rotate-1' : ''
    }`}>
      
      {/* 🚪 ÇIKIŞ ONAY MODALI */}
      <AnimatePresence>
        {showLeaveConfirm && (
          <div className="fixed inset-0 z-[60] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white border-4 border-slate-950 rounded-3xl p-6 max-w-xs w-full text-center shadow-[0_8px_0_#0f172a]"
            >
              <span className="text-4xl block mb-2">🚪</span>
              <h3 className="text-lg font-black text-slate-900">Odadan Çık?</h3>
              <p className="text-xs font-bold text-slate-500 mt-1 mb-4">Tüm ilerlemeni kaybedebilirsin.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowLeaveConfirm(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black py-2.5 rounded-xl border-2 border-slate-950"
                >
                  Vazgeç
                </button>
                <button
                  onClick={() => {
                    setShowLeaveConfirm(false);
                    handleLeaveRoom();
                  }}
                  className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-black py-2.5 rounded-xl border-2 border-slate-950 shadow-[0_2px_0_#0f172a]"
                >
                  Evet, Çık
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🎉 AÇILIŞ EKRANI (SPLASH SCREEN) */}
      <AnimatePresence>
        {isAppLoading && <SplashScreen />}
      </AnimatePresence>

      {/* EMOJİLER */}
      <AnimatePresence>
        {floatingEmojis.map(item => (
          <motion.div
            key={item.id}
            initial={{ opacity: 1, y: 50, scale: 0.6, left: item.left }}
            animate={{ opacity: 0, y: -450, scale: 1.8 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.8, ease: "easeOut" }}
            className="absolute bottom-12 text-6xl pointer-events-none z-50 drop-shadow-[0_8px_12px_rgba(0,0,0,0.5)]"
          >
            {item.emoji}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* DÜRTÜLME UYARISI / KOPYALANDI BİLDİRİMİ */}
      <AnimatePresence>
        {pokedMessage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            className="fixed top-6 bg-yellow-300 text-slate-950 font-black px-6 py-3.5 rounded-2xl shadow-[0_8px_0_#0f172a] z-50 flex items-center gap-2 border-4 border-slate-950 text-sm tracking-wide -rotate-2"
          >
            {pokedMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= 🚀 3-2-1 GERİ SAYIM & FÜZE ANİMASYONU ================= */}
      {gameState === 'COUNTDOWN' && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={countdownNumber}
              initial={{ scale: 0.2, opacity: 0, rotate: -20 }}
              animate={{ scale: 1.2, opacity: 1, rotate: 0 }}
              exit={{ scale: 2, opacity: 0 }}
              transition={{ duration: 0.5, ease: "backOut" }}
              className="text-7xl md:text-9xl font-black text-yellow-300 drop-shadow-[0_12px_0_#0f172a] border-8 border-slate-950 bg-pink-500 px-10 py-6 rounded-[48px] shadow-[0_20px_0_#0f172a]"
            >
              {countdownNumber}
            </motion.div>
          </AnimatePresence>

          <div className="absolute bottom-6 flex gap-4">
            {players.map((p, idx) => (
              <motion.div
                key={p.connectionId}
                initial={{ y: 250, opacity: 0, rotate: 0 }}
                animate={{
                  y: -600,
                  opacity: [0, 1, 1, 0],
                  rotate: (idx % 2 === 0 ? 1 : -1) * (15 + idx * 10)
                }}
                transition={{
                  duration: 1.4,
                  delay: 1.8 + idx * 0.15,
                  ease: "easeInOut"
                }}
                className="flex flex-col items-center bg-white border-4 border-slate-950 p-3 rounded-3xl shadow-[0_8px_0_#0f172a]"
              >
                <img src={p.avatar} alt="avatar" className="w-16 h-16 rounded-full bg-yellow-300 object-cover border-2 border-slate-950" />
                <span className="text-xs font-black text-slate-950 mt-1">{p.username}</span>
                <span className="text-xl mt-1">🚀</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ================= 1. GİRİŞ EKRANI ================= */}
      {!roomCode && (
        // GİRİŞ EKRANI kapsayıcısı
        <div className="w-full max-w-sm flex flex-col items-center max-h-[95dvh] overflow-y-auto py-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="w-full flex justify-end mb-2">
            <button
              type="button"
              onClick={() => setShowHowToPlay(true)}
              className="flex items-center gap-1.5 bg-white border-2 border-slate-950 px-3 py-1 rounded-2xl font-black text-xs text-slate-800 shadow-[0_3px_0_#0f172a] hover:bg-slate-50 active:translate-y-0.5 transition"
            >
              <span className="bg-yellow-300 w-4 h-4 rounded-full flex items-center justify-center text-[10px] border border-slate-950 font-black">?</span>
              Nasıl Oynanır?
            </button>
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full bg-white border-4 border-slate-950 rounded-[36px] p-6 shadow-[0_12px_0_#0f172a] relative z-10"
          >
            <div className="text-center mb-5">
              <div className="inline-block transform -rotate-2 bg-yellow-300 border-4 border-slate-950 px-4 py-1.5 rounded-2xl shadow-[0_4px_0_#0f172a]">
                <h1 className="text-3xl font-black tracking-tight text-slate-950">
                  PARTY HUB 🎭
                </h1>
              </div>
              <p className="text-xs font-black text-slate-500 mt-2 uppercase tracking-wider">Arkadaş Grubunun Kaos Durağı</p>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-100 p-3.5 rounded-3xl border-2 border-slate-900/20">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 block mb-1 text-center">
                  ✨ Karakterini Tasarla
                </label>
                <AvatarBuilder onAvatarChange={(url) => setAvatar(url)} />
              </div>

              <div>
                <label className="text-sm font-black uppercase tracking-wider text-slate-700 block mb-0.5">
                  Kullanıcı Adın
                </label>
                <p className="text-[10px] text-slate-500 font-bold mb-2">
                  Arkadaşlarının seni göreceği isim
                </p>
                <div className="flex gap-2">
                  <div className="relative w-full">
                    <input
                      type="text"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      className="w-full bg-slate-100 border-2 border-slate-950 focus:border-pink-500 rounded-2xl px-4 py-3 text-sm focus:outline-none text-slate-900 font-black shadow-inner pr-10"
                    />
                    {username.length >= 3 && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 font-black">
                        ✓
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleRandomNick}
                    title="Rastgele İsim"
                    className="bg-yellow-300 hover:bg-yellow-400 border-2 border-slate-950 border-b-4 border-b-slate-950 active:border-b-2 active:translate-y-0.5 px-4 rounded-2xl text-lg transition-all"
                  >
                    🎲
                  </button>
                </div>
              </div>

              <button
                onClick={handleCreateRoom}
                className="w-full bg-pink-500 hover:bg-pink-400 text-white font-black text-base py-4 rounded-2xl transition-all border-2 border-slate-950 border-b-4 border-b-slate-950 active:border-b-2 active:translate-y-0.5 shadow-md flex items-center justify-center gap-2 tracking-wide"
              >
                <span>👑</span> YENİ ODA KUR
              </button>

              <div className="flex items-center gap-3 my-1">
                <div className="h-[2px] bg-slate-200 flex-1"></div>
                <span className="text-[11px] uppercase font-black text-slate-400 tracking-wider">veya</span>
                <div className="h-[2px] bg-slate-200 flex-1"></div>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="KOD"
                  value={roomCodeInput}
                  onChange={e => setRoomCodeInput(e.target.value.toUpperCase())}
                  maxLength={4}
                  className="w-2/5 bg-slate-100 border-2 border-slate-950 focus:border-emerald-500 rounded-2xl px-3 py-3 text-base uppercase text-center font-black tracking-widest text-slate-900 placeholder-slate-400 focus:outline-none shadow-inner"
                />
                <button
                  onClick={handleJoinRoom}
                  className="w-3/5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-sm py-3.5 rounded-2xl transition-all border-2 border-slate-950 border-b-4 border-b-slate-950 active:border-b-2 active:translate-y-0.5 shadow-md flex items-center justify-center gap-1.5 tracking-wide"
                >
                  ODAYA GİR <span>🚀</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* ================= 📖 NASIL OYNANIR REHBER MODALI ================= */}
      <AnimatePresence>
        {showHowToPlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-lg bg-white border-4 border-slate-950 rounded-[32px] p-5 sm:p-6 shadow-[0_12px_0_#0f172a] max-h-[85vh] flex flex-col justify-between"
            >
              <div className="flex justify-between items-center border-b-2 border-slate-200 pb-3">
                <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  📖 Oyun Rehberi & Kurallar
                </h2>
                <button
                  onClick={() => setShowHowToPlay(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 border-2 border-slate-950 font-black text-slate-700 hover:bg-rose-500 hover:text-white transition flex items-center justify-center text-sm shadow-[0_2px_0_#0f172a]"
                >
                  ✕
                </button>
              </div>

              <div className="flex gap-1.5 overflow-x-auto py-3 no-scrollbar">
                {[
                  { id: 'JOIN', label: '🚀 Başlarken', color: 'bg-emerald-400' },
                  { id: 'FLAGWARS', label: '🚩 FlagWars', color: 'bg-rose-500 text-white' },
                  { id: 'MOST_LIKELY', label: '🪧 Kim Yapar?', color: 'bg-yellow-400' },
                  { id: 'JEALOUSY', label: '🌡️ Kıskançlık', color: 'bg-purple-500 text-white' },
                  { id: 'IMPOSTER', label: '🕵️‍♂️ Ajan Kim?', color: 'bg-indigo-600 text-white' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveGuideTab(tab.id)}
                    className={`px-3 py-1.5 rounded-xl border-2 border-slate-950 font-black text-xs whitespace-nowrap transition ${
                      activeGuideTab === tab.id
                        ? `${tab.color} shadow-[0_2px_0_#0f172a] -translate-y-0.5`
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto pr-1 text-slate-800 text-xs font-bold leading-relaxed space-y-3">
                {activeGuideTab === 'JOIN' && (
                  <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                    <p className="font-black text-sm text-emerald-700">🚀 Odaya Katılma ve Başlatma</p>
                    <ul className="space-y-1.5 list-disc list-inside text-slate-700">
                      <li>Önce kendine bir <b>Avatar</b> ve <b>Kullanıcı Adı</b> belirle.</li>
                      <li><b>Oda Kur:</b> Yeni bir 4 haneli oda oluşturur. Arkadaşlarınla bu kodu paylaş!</li>
                      <li><b>Odaya Katıl:</b> Arkadaşının paylaştığı 4 haneli kodu girerek lobiye dahil ol.</li>
                      <li>Lobi ekranında oyuncuların profiline dokunarak onları ⚡ <b>dürtebilir</b> veya alt kısımdan emoji fırlatabilirsin.</li>
                      <li>Oyun modunu ve tur sayısını sadece <b>👑 Kurucu</b> değiştirebilir.</li>
                    </ul>
                  </div>
                )}

                {activeGuideTab === 'FLAGWARS' && (
                  <div className="space-y-2 bg-rose-50 p-3.5 rounded-2xl border border-rose-200">
                    <p className="font-black text-sm text-rose-700">🚩 FlagWars (Swipe Modu)</p>
                    <p>Ekrana gelen ilişki veya karakter senaryolarını oyla:</p>
                    <ul className="space-y-1.5 list-disc list-inside text-slate-700">
                      <li><b>Sola Kaydır / Sola Buton:</b> 🚩 Kırmızı Bayrak (Kabul edilemez, toksik veya falso).</li>
                      <li><b>Sağa Kaydır / Sağa Buton:</b> 🟢 Yeşil Bayrak (Normal, tatlı veya kabul edilebilir).</li>
                      <li>Tüm oylar tamamlandığında gruptaki Kırmızı/Yeşil bayrak yüzdesi ortaya çıkar!</li>
                    </ul>
                  </div>
                )}

                {activeGuideTab === 'MOST_LIKELY' && (
                  <div className="space-y-2 bg-yellow-50 p-3.5 rounded-2xl border border-yellow-200">
                    <p className="font-black text-sm text-amber-800">🪧 Kim Yapar? (Pankart Kaldırma)</p>
                    <p>Ekrana gelen soruyu odadaki hangi arkadaşının yapmaya daha yatkın olduğunu seç:</p>
                    <ul className="space-y-1.5 list-disc list-inside text-slate-700">
                      <li>Herkes soruyu okur ve masadaki bir arkadaşının avatarına tıklar.</li>
                      <li>Oylar açıldığında kimin kime oy verdiği ve masanın <b>"En Çok Seçileni"</b> gösterilir.</li>
                    </ul>
                  </div>
                )}

                {activeGuideTab === 'JEALOUSY' && (
                  <div className="space-y-2 bg-purple-50 p-3.5 rounded-2xl border border-purple-200">
                    <p className="font-black text-sm text-purple-800">🌡️ Kıskançlık & Toksiklik Metresi</p>
                    <p>Gelen senaryo karşısında ne kadar kıskançlık veya tepki hissedeceğini puanla:</p>
                    <ul className="space-y-1.5 list-disc list-inside text-slate-700">
                      <li>Kaydırma çubuğu ile <b>1 (Hiç Umrumda Olmaz)</b> ile <b>10 (Kıyamet Kopar)</b> arasında puan ver.</li>
                      <li>Tur sonunda masanın kıskançlık ortalaması ve en chill / en toksik tepkiyi verenler listelenir.</li>
                    </ul>
                  </div>
                )}

                {activeGuideTab === 'IMPOSTER' && (
                  <div className="space-y-2 bg-indigo-50 p-3.5 rounded-2xl border border-indigo-200">
                    <p className="font-black text-sm text-indigo-900">🕵️‍♂️ Ajan Kim? (Spyfall Gizli Kelime)</p>
                    <ul className="space-y-1.5 list-disc list-inside text-slate-700">
                      <li>Masumlar gizli kelimeyi görür, <b>Ajan</b> ise kelimeyi bilmez (sadece kategoriyi görür).</li>
                      <li>Sırayla herkes kelimeyle alakalı tek bir <b>ipucu</b> yazar.</li>
                      <li><b>Ajanın Amacı:</b> Çaktırmadan uyumlu ipuçları yazıp kelimeyi tahmin etmek veya masumları birbirine düşürmek.</li>
                      <li><b>Erken Zafer:</b> Ajan gizli kelimeyi ipucu turunda doğrudan tahmin edip yazarsa anında oyunu kazanır!</li>
                      <li>İpucu turları bitince oylama başlar; masumlar ajanı bulursa kazanır, bulamazsa ajan kazanır.</li>
                    </ul>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-200 mt-2">
                <button
                  onClick={() => setShowHowToPlay(false)}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-3 rounded-2xl border-2 border-slate-950 shadow-[0_4px_0_#0f172a] active:translate-y-0.5 transition text-xs uppercase tracking-wider"
                >
                  Anladım, Oyuna Dön 🎮
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= 2. LOBİ EKRANI ================= */}
      {roomCode && gameState === 'LOBBY' && (
        // LOBİ EKRANI kapsayıcısı
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white border-4 border-slate-950 rounded-[36px] p-6 shadow-[0_12px_0_#0f172a] space-y-4 relative z-10 max-h-[95dvh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          <div className="flex justify-between items-center bg-yellow-300 p-4 rounded-3xl border-4 border-slate-950 shadow-[0_4px_0_#0f172a]">
            <div>
              <span className="text-[10px] uppercase font-black text-slate-800 tracking-widest block mb-1">
                ODA KODU
              </span>
              <div className="flex items-center gap-2">
                <h2 className="text-4xl font-black text-slate-950 tracking-widest leading-none">#{roomCode}</h2>
                <button 
                  onClick={() => handleCopyCode(roomCode)}
                  className="bg-white border-2 border-slate-950 p-1.5 rounded-xl hover:bg-slate-50 transition active:scale-95 shadow-sm"
                  title="Kodu Kopyala"
                >
                  🔗
                </button>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="text-right">
                <span className="text-xl font-black text-slate-950 block leading-none">{players.length}</span>
                <span className="text-[10px] uppercase font-black text-slate-800 tracking-widest">Oyuncu</span>
              </div>
              <button
                onClick={() => setShowLeaveConfirm(true)}
                className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white border-2 border-slate-950 rounded-xl transition font-black text-[11px] active:scale-95 shadow-[0_2px_0_#0f172a] flex items-center gap-1"
              >
                🚪 ÇIK
              </button>
            </div>
          </div>

          {/* OYUN SEÇİMİ (4 Oyun) */}
          <div className="bg-slate-100 border-2 border-slate-950/20 p-4 rounded-3xl space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-xs font-black text-slate-900 uppercase tracking-wide">🎮 1. Oyun Modu Seç</span>
              {!isHost && <span className="text-[10px] text-amber-800 font-bold bg-amber-200 px-2 py-0.5 rounded-md">(Kurucu Seçer)</span>}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={!isHost}
                onClick={() => handleModeChange('FLAGWARS')}
                className={`p-3 rounded-2xl border-2 border-slate-950 text-xs font-black transition-all text-left ${
                  gameMode === 'FLAGWARS'
                    ? 'bg-rose-500 text-white border-b-4 shadow-md -translate-y-0.5'
                    : 'bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                🚩 FlagWars
                <span className="block text-[9px] font-bold mt-0.5 opacity-90">Swipe</span>
              </button>

              <button
                type="button"
                disabled={!isHost}
                onClick={() => handleModeChange('MOST_LIKELY')}
                className={`p-3 rounded-2xl border-2 border-slate-950 text-xs font-black transition-all text-left ${
                  gameMode === 'MOST_LIKELY'
                    ? 'bg-yellow-400 text-slate-950 border-b-4 shadow-md -translate-y-0.5'
                    : 'bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                🪧 Kim Yapar?
                <span className="block text-[9px] font-bold mt-0.5 opacity-90">Pankart</span>
              </button>

              <button
                type="button"
                disabled={!isHost}
                onClick={() => handleModeChange('JEALOUSY')}
                className={`p-3 rounded-2xl border-2 border-slate-950 text-xs font-black transition-all text-left ${
                  gameMode === 'JEALOUSY'
                    ? 'bg-purple-500 text-white border-b-4 shadow-md -translate-y-0.5'
                    : 'bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                🌡️ Kıskançlık
                <span className="block text-[9px] font-bold mt-0.5 opacity-90">1-10 Scale</span>
              </button>

              <button
                type="button"
                disabled={!isHost}
                onClick={() => handleModeChange('IMPOSTER')}
                className={`p-3 rounded-2xl border-2 border-slate-950 text-xs font-black transition-all text-left ${
                  gameMode === 'IMPOSTER'
                    ? 'bg-indigo-600 text-white border-b-4 shadow-md -translate-y-0.5'
                    : 'bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                🕵️‍♂️ Ajan Kim?
                <span className="block text-[9px] font-bold mt-0.5 opacity-90">Gizli Kelime</span>
              </button>
            </div>
          </div>

          {/* SORU & KATEGORİ AYARLARI */}
          <div className="bg-slate-100 border-2 border-slate-950/20 p-4 rounded-3xl space-y-2">
            <span className="text-xs font-black text-slate-900 uppercase tracking-wide">📋 2. Oyun Ayarları</span>

            {gameMode === 'IMPOSTER' ? (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-slate-600 block mb-1 text-[11px] font-bold">Kategori Seç</label>
                  <select
                    disabled={!isHost}
                    value={imposterCategory}
                    onChange={e => setImposterCategory(e.target.value)}
                    className="w-full bg-white border-2 border-indigo-500 rounded-2xl p-2.5 text-indigo-950 disabled:opacity-60 font-black focus:outline-none"
                  >
                    {Object.entries(IMPOSTER_CATEGORIES).map(([key, item]) => (
                      <option key={key} value={key}>{item.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-600 block mb-1 text-[11px] font-bold">İpucu Turu</label>
                  <select
                    disabled={!isHost}
                    value={imposterRounds}
                    onChange={e => setImposterRounds(Number(e.target.value))}
                    className="w-full bg-white border-2 border-slate-950 rounded-2xl p-2.5 text-slate-900 disabled:opacity-60 font-black focus:outline-none"
                  >
                    <option value={2}>2 Tur</option>
                    <option value={3}>3 Tur</option>
                    <option value={4}>4 Tur</option>
                  </select>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-slate-600 block mb-1 text-[11px] font-bold">Tur Sayısı</label>
                  <select
                    disabled={!isHost}
                    value={questionCount}
                    onChange={e => handleModeChange(gameMode, whoSubMode, Number(e.target.value))}
                    className="w-full bg-white border-2 border-slate-950 rounded-2xl p-2.5 text-slate-900 disabled:opacity-60 font-black focus:outline-none"
                  >
                    <option value={5}>5 Soru</option>
                    <option value={10}>10 Soru</option>
                    <option value={20}>20 Soru</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-600 block mb-1 text-[11px] font-bold">Soru Paketi</label>
                  {gameMode === 'MOST_LIKELY' ? (
                    <select
                      disabled={!isHost}
                      value={whoSubMode}
                      onChange={e => handleModeChange(gameMode, e.target.value, questionCount)}
                      className="w-full bg-white border-2 border-amber-500 rounded-2xl p-2.5 text-amber-700 disabled:opacity-60 font-black focus:outline-none"
                    >
                      <option value="GROUP">👯 Arkadaş Grubu</option>
                      <option value="COUPLE">💑 Çift (Sen/Ben)</option>
                    </select>
                  ) : gameMode === 'JEALOUSY' ? (
                    <div className="bg-purple-100 border-2 border-purple-300 rounded-2xl p-2.5 text-purple-800 text-[11px] font-black truncate">
                      🌡️ Toksik Senaryolar
                    </div>
                  ) : (
                    <div className="bg-rose-100 border-2 border-rose-300 rounded-2xl p-2.5 text-rose-800 text-[11px] font-black truncate">
                      🚩 Kırmızı/Yeşil Karışık
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Oyuncu Listesi */}
          <div>
            <h3 className="text-xs font-black uppercase text-slate-500 mb-2">Lobidekiler <span className="text-[10px] text-slate-400 font-normal lowercase">(dürtmek için dokun ⚡)</span></h3>
            <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
              {players.map(p => (
                <button
                  key={p.connectionId}
                  onClick={() => p.connectionId !== connection?.connectionId && connection.invoke('PokePlayer', roomCode, p.connectionId)}
                  className={`flex items-center gap-2.5 p-2.5 rounded-2xl border-2 border-slate-950 text-left transition active:scale-95 ${
                    p.isHost ? 'bg-amber-100 shadow-[0_2px_0_#0f172a]' : 'bg-slate-100 shadow-[0_2px_0_#cbd5e1]'
                  }`}
                >
                  <img src={p.avatar} alt="avatar" className="w-9 h-9 rounded-full bg-white object-cover border-2 border-slate-950 flex-shrink-0" />
                  <div className="overflow-hidden">
                    <p className="text-xs font-black truncate text-slate-900">{p.username}</p>
                    {p.isHost && <span className="text-[9px] text-amber-700 font-black">👑 Kurucu</span>}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Emojiler */}
          <div className="flex justify-center gap-2 py-1 border-t border-slate-200">
            {['🔥', '💀', '🚩', '👀', '🍿', '🤡'].map(emoji => (
              <button
                key={emoji}
                onClick={() => connection.invoke('SendReaction', roomCode, emoji)}
                className="text-xl p-2 bg-slate-100 rounded-2xl border-2 border-slate-950 hover:scale-110 transition active:scale-90 shadow-[0_2px_0_#0f172a]"
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* OYUNU BAŞLAT BUTONU */}
          {isHost ? (
            gameMode === 'IMPOSTER' && players.length < 3 ? (
              <div className="space-y-1.5">
                <button
                  disabled
                  className="w-full bg-slate-200 text-slate-400 font-black py-4 rounded-2xl border-2 border-slate-300 cursor-not-allowed text-base tracking-wider"
                >
                  OYUNU BAŞLAT 🚀
                </button>
                <p className="text-[11px] font-black text-rose-600 bg-rose-100 py-1.5 px-3 rounded-xl border border-rose-300 text-center">
                  ⚠️ Ajan Kim modu için en az 3 oyuncu gerekiyor! (Şu an: {players.length})
                </p>
              </div>
            ) : (
              <button
                onClick={handleStartGame}
                className="w-full bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black py-4 rounded-2xl transition-all border-2 border-slate-950 border-b-4 border-b-slate-950 active:border-b-2 active:translate-y-0.5 shadow-md text-base tracking-wider"
              >
                OYUNU BAŞLAT 🚀
              </button>
            )
          ) : (
            <div className="text-center py-3.5 bg-slate-100 rounded-2xl border-2 border-slate-200 text-xs font-black text-slate-500">
              ⏳ Kurucunun oyunu başlatması bekleniyor...
            </div>
          )}
        </motion.div>
      )}

      {/* 👤 OYUN ESNASINDA EN TEPEDE SABİT PROFİL ÇUBUĞU */}
      {roomCode && gameState !== 'LOBBY' && (
        <div className="w-full max-w-md flex justify-between items-center bg-white/95 backdrop-blur-md border-4 border-slate-950 px-3.5 py-1.5 rounded-2xl shadow-[0_4px_0_#0f172a] relative z-20 mb-4 mt-2">
          <div className="flex items-center gap-2.5">
            <img
              src={avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`}
              alt={username}
              className="w-9 h-9 rounded-full border-2 border-slate-950 bg-slate-100 object-cover flex-shrink-0"
            />
            <div className="flex flex-col text-left">
              <span className="text-[9px] font-black text-slate-400 uppercase leading-none">SENİN KİMLİĞİN</span>
              <span className="text-sm font-black text-slate-900 leading-tight truncate max-w-[130px]">{username}</span>
            </div>
          </div>
          
          <div className="bg-amber-300 border-2 border-slate-950 px-3 py-1 rounded-xl text-xs font-black text-slate-950 shadow-[0_2px_0_#0f172a]">
            #{roomCode}
          </div>
        </div>
      )}

      {/* ================= 🕵️‍♂️ AJAN KİM: İPUCU GİRME EKRANI ================= */}
      {roomCode && gameState === 'IMPOSTER_CLUES' && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white border-4 border-slate-950 rounded-[36px] p-6 shadow-[0_12px_0_#0f172a] space-y-4 relative z-10 max-h-[85dvh] overflow-y-auto no-scrollbar"
        >
          <div className="flex justify-between items-center border-b-2 border-slate-100 pb-2">
            <button
              type="button"
              onClick={() => setShowLeaveConfirm(true)}
              className="bg-rose-500 hover:bg-rose-600 text-white text-[11px] font-black px-3 py-1.5 rounded-xl border-2 border-slate-950 shadow-[0_2px_0_#0f172a] active:translate-y-0.5 transition flex items-center gap-1 cursor-pointer"
            >
              🚪 Çık
            </button>
            <span className="bg-slate-100 text-slate-800 text-xs px-3 py-1 rounded-full border-2 border-slate-950 font-black">
              #{roomCode}
            </span>
          </div>

          <div className={`p-4 rounded-3xl border-4 border-slate-950 shadow-[0_4px_0_#0f172a] text-center ${
            myImposterRole.isImposter ? 'bg-rose-500 text-white' : 'bg-yellow-300 text-slate-950'
          }`}>
            <span className="text-[10px] uppercase font-black tracking-widest block opacity-90">
              Kategori: {myImposterRole.category}
            </span>
            {myImposterRole.isImposter ? (
              <div className="mt-1">
                <h3 className="text-2xl font-black">🚨 SEN AJANSIN! 🚨</h3>
                <p className="text-xs font-bold mt-1">Kelimeyi bilmiyorsun, çaktırmadan uyumlu bir kelime yaz!</p>
              </div>
            ) : (
              <div className="mt-1">
                <span className="text-xs font-bold">Gizli Kelime</span>
                <h3 className="text-3xl font-black tracking-wider uppercase mt-0.5">{myImposterRole.secretWord}</h3>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center px-1 text-xs font-black text-slate-600">
            <span>Tur: {imposterCurrentRound} / {myImposterRole.totalRounds || 3}</span>
            <span>
              Verilen İpucu: {imposterClues.filter(c => (c.roundNumber || c.RoundNumber) === imposterCurrentRound).length} / {players.length}
            </span>
          </div>

          {!hasSentClueThisRound ? (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Tek bir ipucu kelimesi yaz..."
                value={currentClueInput}
                onChange={e => setCurrentClueInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleSendClue();
                }}
                maxLength={20}
                className="w-full bg-slate-100 border-2 border-slate-950 rounded-2xl px-4 py-3 text-sm font-black focus:outline-none focus:border-indigo-500 text-slate-900 shadow-inner"
              />
              <button
                type="button"
                onClick={handleSendClue}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-black px-5 py-3 rounded-2xl border-2 border-slate-950 border-b-4 border-b-slate-950 active:border-b-2 active:translate-y-0.5 text-sm"
              >
                Gönder
              </button>
            </div>
          ) : (
            <div className="p-3 bg-emerald-100 border-2 border-slate-950 rounded-2xl text-center text-xs font-black text-emerald-950">
              ✅ Bu tur için ipucun kaydedildi! Diğerleri yazıyor...
            </div>
          )}

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Masanın İpuçları</span>
            {imposterClues.map((item, idx) => {
              const uName = item.username || item.Username || 'Oyuncu';
              const uAvatar = item.avatar || item.Avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${uName}`;
              const uClue = item.clueText || item.ClueText || '';
              const uRound = item.roundNumber || item.RoundNumber || 1;

              return (
                <div key={idx} className="flex items-center justify-between bg-slate-100 border-2 border-slate-950/20 p-2 rounded-2xl">
                  <div className="flex items-center gap-2">
                    <img 
                      src={uAvatar} 
                      alt="avatar" 
                      className="w-7 h-7 rounded-full bg-white object-cover border border-slate-950" 
                    />
                    <span className="text-xs font-bold text-slate-900">{uName}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black bg-yellow-300 border border-slate-950 px-2.5 py-0.5 rounded-xl shadow-sm text-slate-950">
                      "{uClue}"
                    </span>
                    <span className="text-[9px] font-bold text-slate-400">T{uRound}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ================= 🕵️‍♂️ AJAN KİM: OYLAMA EKRANI ================= */}
      {roomCode && gameState === 'IMPOSTER_VOTE' && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white border-4 border-slate-950 rounded-[36px] p-6 shadow-[0_12px_0_#0f172a] space-y-4 relative z-10 max-h-[85dvh] overflow-y-auto no-scrollbar"
        >
          <div className="text-center">
            <span className="bg-rose-500 text-white text-xs px-3.5 py-1 rounded-full font-black uppercase tracking-wider border-2 border-slate-950 shadow-[0_2px_0_#0f172a]">
              🕵️‍♂️ AJANI YAKALAMA ZAMANI!
            </span>
            <h3 className="text-base font-black text-slate-900 mt-2">
              İpuçlarına göre aranızdaki ajan kim?
            </h3>
          </div>

          {!hasVotedThisRound ? (
            <div className="grid grid-cols-2 gap-2.5">
              {players.map(p => (
                <button
                  key={p.connectionId}
                  onClick={() => handleTargetVote(p.username)}
                  className="flex items-center gap-2.5 p-3 bg-slate-100 hover:bg-rose-100 border-2 border-slate-950 border-b-4 border-b-slate-950 active:border-b-2 active:translate-y-0.5 rounded-2xl transition-all text-left shadow-sm"
                >
                  <img src={p.avatar} alt="avatar" className="w-10 h-10 rounded-full bg-white object-cover border-2 border-slate-950" />
                  <span className="text-xs font-black truncate text-slate-900">{p.username}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center space-y-2">
              <div className="text-5xl animate-bounce">🔍</div>
              <h4 className="text-base font-black text-slate-900">Şüphelin Seçildi!</h4>
              <p className="text-xs text-slate-500">Oyun: <span className="font-black text-rose-600">{selectedTargetUser}</span></p>
            </div>
          )}
        </motion.div>
      )}

      {/* ================= 🕵️‍♂️ AJAN KİM: OYUN SONU RAPORU ================= */}
      {roomCode && gameState === 'IMPOSTER_REVEAL' && imposterFinalResult && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white border-4 border-slate-950 rounded-[36px] p-6 shadow-[0_12px_0_#0f172a] space-y-4 text-center relative z-10 max-h-[85dvh] overflow-y-auto no-scrollbar"
        >
          <div className={`p-5 rounded-3xl border-4 border-slate-950 shadow-[0_6px_0_#0f172a] text-slate-950 font-black relative overflow-hidden ${
            imposterFinalResult.status === 'CAUGHT'
              ? 'bg-emerald-300'
              : imposterFinalResult.status === 'IMPOSTER_GUESSED'
              ? 'bg-amber-300'
              : imposterFinalResult.status === 'TIE'
              ? 'bg-sky-200'
              : 'bg-rose-400 text-white'
          }`}>
            <motion.div 
              animate={{ scale: [1, 1.15, 1] }} 
              transition={{ repeat: Infinity, duration: 2 }}
              className="text-5xl mb-2 inline-block"
            >
              {imposterFinalResult.status === 'CAUGHT' && '🎯'}
              {imposterFinalResult.status === 'ESCAPED' && '🎭'}
              {imposterFinalResult.status === 'IMPOSTER_GUESSED' && '🧠'}
              {imposterFinalResult.status === 'TIE' && '⚖️'}
            </motion.div>

            <h2 className="text-2xl font-black uppercase tracking-tight">
              {imposterFinalResult.status === 'CAUGHT' && 'AJAN YAKALANDI!'}
              {imposterFinalResult.status === 'ESCAPED' && 'AJAN KANDIRDI!'}
              {imposterFinalResult.status === 'IMPOSTER_GUESSED' && 'AJAN KELİMEYİ BİLDİ!'}
              {imposterFinalResult.status === 'TIE' && 'OYLAR ÇIKMAZA GİRDİ!'}
            </h2>

            <p className="text-xs font-bold opacity-90 mt-1">
              {imposterFinalResult.status === 'CAUGHT' && 'Masumlar ajanı oy çokluğuyla tespit etti.'}
              {imposterFinalResult.status === 'ESCAPED' && 'Ajan yakalanmadan masumları yanılttı.'}
              {imposterFinalResult.status === 'IMPOSTER_GUESSED' && 'Ajan gizli kelimeyi tam tahmin ederek kazandı.'}
              {imposterFinalResult.status === 'TIE' && 'Eşit oy sebebiyle sonuç çıkmadı.'}
            </p>
          </div>

          <div className="space-y-2">
            <div className="bg-yellow-300 border-4 border-slate-950 p-4 rounded-3xl text-center shadow-[0_4px_0_#0f172a]">
              <span className="text-[10px] font-black uppercase text-slate-800 tracking-wider block">GİZLİ KELİME</span>
              <h3 className="text-3xl font-black text-slate-950 uppercase tracking-widest mt-0.5">
                {imposterFinalResult.secretWord}
              </h3>
            </div>

            <div className="bg-slate-100 border-2 border-slate-950 p-3 rounded-2xl flex items-center justify-center gap-3">
              <img 
                src={imposterFinalResult.imposterAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${imposterFinalResult.imposterName}`} 
                alt="" 
                className="w-10 h-10 rounded-full border-2 border-slate-950 bg-white" 
              />
              <div className="text-left">
                <span className="text-[9px] font-black uppercase text-rose-600 block">Gizli Ajan</span>
                <h4 className="text-sm font-black text-slate-900">{imposterFinalResult.imposterName}</h4>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 border-2 border-slate-950 p-3 rounded-2xl text-left space-y-2">
            <div className="flex justify-between items-center px-1">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Kim Kime Oy Verdi?</span>
              <span className="text-[10px] font-bold text-slate-400">
                Ajana Giden: {imposterFinalResult.imposterVoteCount || 0} / {imposterFinalResult.totalVotes || 0}
              </span>
            </div>

            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {imposterFinalResult.votes?.map((v, i) => {
                const voterName = v.voter || v.Voter;
                const targetName = v.votedTarget || v.VotedTarget;
                const isTargetImposter = targetName === imposterFinalResult.imposterName;

                return (
                  <div key={i} className="flex justify-between items-center bg-white p-2 rounded-xl text-xs border border-slate-200 shadow-sm">
                    <span className="font-bold text-slate-800">{voterName}</span>
                    <span className={`font-black px-2 py-0.5 rounded-lg border ${
                      isTargetImposter 
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                        : 'bg-slate-100 text-slate-700 border-slate-300'
                    }`}>
                      👉 {targetName} {isTargetImposter ? '🎯' : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {isHost ? (
            <button
              onClick={() => connection.invoke("ReturnToLobby", roomCode)}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-3.5 rounded-2xl transition-all border-2 border-slate-950 border-b-4 border-b-slate-950 active:border-b-2 active:translate-y-0.5 shadow-md text-sm tracking-wider"
            >
              LOBİYE DÖN 🏠
            </button>
          ) : (
            <div className="p-2.5 bg-slate-100 border-2 border-slate-950 rounded-xl text-xs font-bold text-slate-500">
              ⏳ Kurucunun lobiye dönmesi bekleniyor...
            </div>
          )}
        </motion.div>
      )}

      {/* ================= 3. DİĞER MODLAR: OYLAMA EKRANI ================= */}
      {roomCode && gameState === 'VOTING' && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm flex flex-col items-center space-y-3 relative z-10 max-h-[85dvh] overflow-y-auto no-scrollbar"
        >
          <div className="w-full flex justify-between items-center px-1">
            <span className="text-xs font-black bg-white px-3 py-1 rounded-full border-2 border-slate-950 shadow-[0_2px_0_#0f172a] text-slate-900">
              Soru {currentQuestionIndex + 1} / {questionCount}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-950 bg-yellow-300 px-3 py-1 rounded-full border-2 border-slate-950 shadow-[0_2px_0_#0f172a]">
                {gameMode === 'FLAGWARS' ? 'FLAGWARS 🚩' : gameMode === 'MOST_LIKELY' ? 'KİM YAPAR? 🪧' : 'KISKANÇLIK 🌡️'}
              </span>
              {isHost && (
                <button
                  onClick={() => setShowLeaveConfirm(true)}
                  className="bg-rose-500 text-white text-[10px] font-black px-2.5 py-1 rounded-xl border-2 border-slate-950 shadow-[0_2px_0_#0f172a] hover:bg-rose-600 transition"
                >
                  🚪 Çık
                </button>
              )}
            </div>
          </div>

          {gameMode === 'FLAGWARS' && (
            !hasVotedThisRound ? (
              <SwipeCard question={currentQuestion} onVote={handleFlagVote} />
            ) : (
              <div className="w-full h-[380px] bg-white border-4 border-slate-950 rounded-[36px] p-6 flex flex-col items-center justify-center text-center shadow-[0_12px_0_#0f172a]">
                <div className="text-6xl animate-bounce mb-3">🗳️</div>
                <h3 className="text-xl font-black text-slate-900">Oyun Kaydedildi!</h3>
                <p className="text-xs font-bold text-slate-500 mt-1">Diğer oyuncular bekleniyor...</p>
              </div>
            )
          )}

          {gameMode === 'MOST_LIKELY' && (
            <div className="w-full bg-white border-4 border-slate-950 rounded-[36px] p-5 shadow-[0_12px_0_#0f172a] space-y-4">
              <div className="text-center">
                <span className="bg-yellow-300 border-2 border-slate-950 text-slate-950 text-xs px-3.5 py-1 rounded-full font-black uppercase tracking-wider shadow-[0_2px_0_#0f172a]">
                  🏷️ {currentQuestion?.category}
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-3 leading-snug">
                  "{currentQuestion?.text}"
                </h3>
              </div>

              {!hasVotedThisRound ? (
                <div className="space-y-2">
                  <p className="text-xs text-center text-slate-600 font-black uppercase tracking-wider">Kimi seçiyorsun?</p>
                  <div className="grid grid-cols-2 gap-2.5">
                    {players.map(p => (
                      <button
                        key={p.connectionId}
                        onClick={() => handleTargetVote(p.username)}
                        className="flex items-center gap-2.5 p-3 bg-slate-100 hover:bg-yellow-100 border-2 border-slate-950 border-b-4 border-b-slate-950 active:border-b-2 active:translate-y-0.5 rounded-2xl transition-all text-left shadow-sm"
                      >
                        <img src={p.avatar} alt="avatar" className="w-10 h-10 rounded-full bg-white object-cover border-2 border-slate-950" />
                        <span className="text-xs font-black truncate text-slate-900">{p.username}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center space-y-2">
                  <div className="text-5xl animate-bounce">🪧</div>
                  <h4 className="text-base font-black text-slate-900">Pankartın Hazırlandı!</h4>
                  <p className="text-xs text-slate-500">Seçtiğin: <span className="font-black text-yellow-600">{selectedTargetUser}</span></p>
                </div>
              )}
            </div>
          )}

          {gameMode === 'JEALOUSY' && (
            <div className="w-full bg-white border-4 border-slate-950 rounded-[36px] p-5 shadow-[0_12px_0_#0f172a] space-y-4">
              <div className="text-center">
                <span className="bg-purple-500 text-white text-xs px-3.5 py-1 rounded-full font-black uppercase tracking-wider border-2 border-slate-950 shadow-[0_2px_0_#0f172a]">
                  🏷️ {currentQuestion?.category}
                </span>
                <h3 className="text-base font-black text-slate-900 mt-3 leading-snug">
                  "{currentQuestion?.text}"
                </h3>
              </div>

              {!hasVotedThisRound ? (
                <div className="space-y-4 pt-2">
                  <div className="text-center">
                    <span className="text-5xl font-black text-purple-600">{jealousyValue}</span>
                    <span className="text-xs text-purple-900 font-black block mt-1">{getJealousyEmoji(jealousyValue)}</span>
                  </div>

                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={jealousyValue}
                    onChange={(e) => setJealousyValue(Number(e.target.value))}
                    className="w-full accent-purple-600 h-3 bg-slate-200 rounded-lg cursor-pointer border-2 border-slate-950"
                  />

                  <div className="flex justify-between text-[10px] font-black text-slate-500">
                    <span>1 (Sıfır Dert)</span>
                    <span>5 (Ortalama)</span>
                    <span>10 (Cinnet)</span>
                  </div>

                  <button
                    onClick={handleJealousyVote}
                    className="w-full bg-purple-500 hover:bg-purple-400 text-white font-black py-4 rounded-2xl transition-all border-2 border-slate-950 border-b-4 border-b-slate-950 active:border-b-2 active:translate-y-0.5 shadow-md text-sm tracking-wider"
                  >
                    PUANI GÖNDER 🌡️
                  </button>
                </div>
              ) : (
                <div className="py-8 text-center space-y-2">
                  <div className="text-5xl animate-bounce">🌡️</div>
                  <h4 className="text-base font-black text-slate-900">Kıskançlık Puanın: {jealousyValue} / 10</h4>
                  <p className="text-xs text-slate-500">Diğer puanlar bekleniyor...</p>
                </div>
              )}
            </div>
          )}

          <div className="w-full bg-white p-3 rounded-2xl border-2 border-slate-950 flex items-center justify-around shadow-[0_4px_0_#0f172a]">
            {players.map(p => (
              <div key={p.connectionId} className="flex flex-col items-center">
                <img src={p.avatar} alt="avatar" className="w-8 h-8 rounded-full bg-slate-100 object-cover border-2 border-slate-950 mb-0.5" />
                <span className="text-[9px] font-bold text-slate-800 truncate max-w-[50px]">{p.username}</span>
                <span className="text-[12px] mt-0.5 font-black">
                  {p.currentVote ? '✅' : '⏳'}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ================= 4. DİĞER MODLAR: SONUÇ EKRANI ================= */}
      {roomCode && gameState === 'REVEAL' && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white border-4 border-slate-950 rounded-[36px] p-6 shadow-[0_12px_0_#0f172a] space-y-5 relative z-10 max-h-[85dvh] overflow-y-auto no-scrollbar"
        >
          <div className="flex justify-between items-center border-b-2 border-slate-100 pb-2.5">
            <span className="bg-slate-100 text-slate-800 text-xs px-3 py-1 rounded-full border-2 border-slate-950 font-black">
              🏷️ {currentQuestion?.category}
            </span>
            {isHost && (
              <button
                onClick={() => setShowLeaveConfirm(true)}
                className="bg-rose-500 text-white text-[10px] font-black px-2.5 py-1 rounded-xl border-2 border-slate-950 shadow-[0_2px_0_#0f172a] hover:bg-rose-600 transition"
              >
                🚪 Çık
              </button>
            )}
          </div>

          <p className="text-lg font-black text-slate-900 text-center">"{currentQuestion?.text}"</p>

          {gameMode === 'FLAGWARS' && latestRoundResult && (() => {
            const redPct = latestRoundResult.redPercentage ?? latestRoundResult.RedPercentage ?? 50;
            const greenPct = latestRoundResult.greenPercentage ?? latestRoundResult.GreenPercentage ?? (100 - redPct);

            return (
              <div className="space-y-2 mt-3">
                <div className="h-8 w-full bg-slate-100 rounded-full flex overflow-hidden p-1 border-2 border-slate-950 shadow-inner">
                  <div 
                    style={{ width: `${redPct}%` }} 
                    className="bg-rose-500 h-full rounded-l-full transition-all duration-700"
                  />
                  <div 
                    style={{ width: `${greenPct}%` }} 
                    className="bg-emerald-400 h-full rounded-r-full transition-all duration-700"
                  />
                </div>
                <div className="flex justify-between text-xs font-black tracking-wide px-1">
                  <span className="text-rose-600">🚩 %{redPct} KIRMIZI</span>
                  <span className="text-emerald-600">%{greenPct} YEŞİL 🟢</span>
                </div>
              </div>
            );
          })()}

          {gameMode === 'MOST_LIKELY' && (
            <div className="space-y-4">
              {mostVoted && (
                <div className="bg-yellow-300 border-4 border-slate-950 p-4 rounded-3xl text-center shadow-[0_6px_0_#0f172a]">
                  <span className="text-[10px] font-black uppercase text-slate-800 tracking-wider">
                    {mostVoted.isTie ? '⚡ Çelişki / Beraberlik!' : '👑 En Çok Seçilen:'}
                  </span>
                  <h3 className="text-2xl font-black text-slate-950 mt-0.5">
                    {mostVoted.isTie ? 'Oylar Eşit Bölündü!' : `${mostVoted.winner} (${mostVoted.count} Oy)`}
                  </h3>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-1">
                {players.map(p => {
                  const vote = latestRoundResult?.votes?.find(v => v.username === p.username);
                  return (
                    <div key={p.connectionId} className="flex flex-col items-center bg-slate-100 border-2 border-slate-950 p-3 rounded-2xl relative shadow-[0_3px_0_#0f172a]">
                      <div className="bg-yellow-300 text-slate-950 font-black text-xs px-3 py-1 rounded-xl shadow border-2 border-slate-950 mb-2 flex items-center gap-1 max-w-full truncate">
                        <span>🪧</span>
                        <span className="truncate">{vote ? vote.choice : '?'}</span>
                      </div>
                      <img src={p.avatar} alt="avatar" className="w-12 h-12 rounded-full bg-white object-cover border-2 border-slate-950 shadow" />
                      <span className="text-xs font-black text-slate-900 mt-1 truncate max-w-[100px]">{p.username}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {gameMode === 'JEALOUSY' && latestRoundResult && (
            <div className="space-y-3">
              <div className="bg-purple-100 border-4 border-slate-950 p-3 rounded-3xl text-center shadow-[0_6px_0_#0f172a]">
                <span className="text-[10px] uppercase font-black text-purple-900 tracking-wider">Grup Kıskançlık Ortalaması</span>
                <h3 className="text-3xl font-black text-purple-900 mt-0.5">🌡️ {latestRoundResult.averageScore} / 10</h3>
              </div>

              <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                {latestRoundResult.votes?.map(v => (
                  <div key={v.username} className="flex items-center justify-between bg-slate-100 p-2.5 rounded-2xl border-2 border-slate-950">
                    <div className="flex items-center gap-2">
                      <img src={v.avatar} alt="avatar" className="w-8 h-8 rounded-full bg-white object-cover border-2 border-slate-950" />
                      <span className="text-xs font-bold text-slate-900 truncate max-w-[120px]">{v.username}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-slate-200 h-3 rounded-full overflow-hidden border border-slate-950">
                        <div style={{ width: `${(Number(v.choice) / 10) * 100}%` }} className="bg-purple-500 h-full rounded-full"></div>
                      </div>
                      <span className="text-xs font-black text-purple-900 w-5 text-right">{v.choice}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isHost ? (
            <button
              onClick={handleNextQuestion}
              className="w-full bg-yellow-300 hover:bg-yellow-400 text-slate-950 font-black py-4 rounded-2xl transition-all border-2 border-slate-950 border-b-4 border-b-slate-950 active:border-b-2 active:translate-y-0.5 shadow-md text-base tracking-wider"
            >
              SONRAKİ SORU ➔
            </button>
          ) : (
            <div className="text-center text-xs font-bold text-slate-500 py-2">
              ⏳ Kurucunun sonraki soruya geçmesi bekleniyor...
            </div>
          )}
        </motion.div>
      )}

      {/* ================= 5. OYUN SONU RAPORU ================= */}
      {roomCode && gameState === 'GAMEOVER' && finalGameReport && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          // ✨ DÜZELTME: no-scrollbar yerine özel Tailwind sınıfları eklendi
          className="w-full max-w-md bg-white border-4 border-slate-950 rounded-[36px] p-6 shadow-[0_12px_0_#0f172a] space-y-4 text-center relative z-10 max-h-[85dvh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          <div>
            <h2 className="text-3xl font-black text-slate-950 tracking-wide">🏆 OYUN SONU RAPORU 🏆</h2>
            <p className="text-xs font-black text-slate-500 mt-1">{finalGameReport.totalRoundsPlayed || 5} Soru Tamamlandı</p>
          </div>

          {/* 🟢 FLAGWARS RAPORU */}
          {finalGameReport.gameMode === 'FLAGWARS' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {finalGameReport.theReddest && (
                  <div className="bg-rose-100 border-2 border-slate-950 p-3 rounded-2xl flex flex-col items-center shadow-[0_3px_0_#0f172a]">
                    <span className="text-[10px] font-black text-rose-800 uppercase tracking-wider">En Red Flag 🚩</span>
                    <img src={finalGameReport.theReddest.avatar} alt="avatar" className="w-12 h-12 rounded-full bg-white object-cover border-2 border-slate-950 my-1.5" />
                    <span className="text-xs font-black text-slate-900 truncate max-w-[100px]">{finalGameReport.theReddest.username}</span>
                    <span className="text-[10px] text-rose-700 font-bold">{finalGameReport.theReddest.redCount} Kırmızı</span>
                  </div>
                )}

                {finalGameReport.theGreenest && (
                  <div className="bg-emerald-100 border-2 border-slate-950 p-3 rounded-2xl flex flex-col items-center shadow-[0_3px_0_#0f172a]">
                    <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">En Yeşil Bayrak 🟢</span>
                    <img src={finalGameReport.theGreenest.avatar} alt="avatar" className="w-12 h-12 rounded-full bg-white object-cover border-2 border-slate-950 my-1.5" />
                    <span className="text-xs font-black text-slate-900 truncate max-w-[100px]">{finalGameReport.theGreenest.username}</span>
                    <span className="text-[10px] text-emerald-700 font-bold">{finalGameReport.theGreenest.greenCount} Yeşil</span>
                  </div>
                )}
              </div>

              <div className="bg-slate-100 border-2 border-slate-950 p-3.5 rounded-2xl text-left shadow-inner">
                <span className="text-[10px] font-black text-slate-700 uppercase block mb-1">⚡ Grubu En Çok Bölen Soru</span>
                <p className="text-xs text-slate-900 italic">
                  "{FLAG_QUESTIONS[((finalGameReport.mostDivisiveRound || 1) - 1) % FLAG_QUESTIONS.length]?.text || 'Tüm sorularda tam uyum sağlandı!'}"
                </p>
              </div>
            </div>
          )}

          {/* 👑 MOST LIKELY RAPORU */}
          {finalGameReport.gameMode === 'MOST_LIKELY' && (
            overallTopTarget && overallTopTarget.name ? (
              <div className="bg-yellow-300 border-4 border-slate-950 p-5 rounded-3xl text-center space-y-1 shadow-[0_6px_0_#0f172a]">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider">👑 Grubun En Çok Konuşulan İsmi</span>
                <h3 className="text-2xl font-black text-slate-950">{overallTopTarget.name}</h3>
                <p className="text-xs text-slate-800 font-bold">Toplamda <span className="font-black text-slate-950 text-sm">{overallTopTarget.count}</span> oy aldı!</p>
              </div>
            ) : (
              <div className="bg-slate-100 border-2 border-slate-950 p-5 rounded-3xl text-center shadow-inner">
                 <span className="text-2xl block mb-2">🤷‍♂️</span>
                 <h3 className="text-base font-black text-slate-900">Sonuçlar Gizli Kaldı</h3>
                 <p className="text-xs font-bold text-slate-500 mt-1">Sunucudan oylama geçmişi alınamadığı için kazanan hesaplanamadı.</p>
              </div>
            )
          )}

          {/* 💔 JEALOUSY (KISKANÇLIK) RAPORU */}
          {finalGameReport.gameMode === 'JEALOUSY' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-purple-100 border-2 border-slate-950 p-3 rounded-2xl flex flex-col items-center shadow-[0_3px_0_#0f172a]">
                  <span className="text-[10px] font-black text-purple-900 uppercase tracking-wider">Grubun En Toksiği 🚨</span>
                  <img 
                    src={finalGameReport.mostToxic?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=Toxic`} 
                    alt="avatar" 
                    className="w-12 h-12 rounded-full bg-white object-cover border-2 border-purple-400 my-1.5" 
                  />
                  <span className="text-xs font-black text-slate-900 truncate max-w-[100px]">
                    {finalGameReport.mostToxic?.username || 'Herkes Toksik'}
                  </span>
                  <span className="text-[10px] text-purple-800 font-bold">
                    {finalGameReport.mostToxic?.avgScore || finalGameReport.averageScore || '7.5'} / 10 Ort.
                  </span>
                </div>

                <div className="bg-teal-100 border-2 border-slate-950 p-3 rounded-2xl flex flex-col items-center shadow-[0_3px_0_#0f172a]">
                  <span className="text-[10px] font-black text-teal-900 uppercase tracking-wider">En Geniş / Rahatı 😌</span>
                  <img 
                    src={finalGameReport.mostRelaxed?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=Relaxed`} 
                    alt="avatar" 
                    className="w-12 h-12 rounded-full bg-white object-cover border-2 border-teal-400 my-1.5" 
                  />
                  <span className="text-xs font-black text-slate-900 truncate max-w-[100px]">
                    {finalGameReport.mostRelaxed?.username || 'Herkes Chill'}
                  </span>
                  <span className="text-[10px] text-teal-800 font-bold">
                    {finalGameReport.mostRelaxed?.avgScore || '3.2'} / 10 Ort.
                  </span>
                </div>
              </div>

              <div className="bg-slate-100 border-2 border-slate-950 p-3.5 rounded-2xl text-left shadow-inner">
                <span className="text-[10px] font-black text-slate-700 uppercase block mb-1">⚡ Grubu En Çok Bölen Soru</span>
                <p className="text-xs text-slate-900 italic">
                  "{JEALOUSY_QUESTIONS[((finalGameReport.mostDivisiveRound || 1) - 1) % JEALOUSY_QUESTIONS.length]?.text || 'Grup genel olarak hemfikirdi!'}"
                </p>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleReturnToLobby}
            className="w-full bg-pink-500 hover:bg-pink-400 text-white font-black py-4 rounded-2xl transition-all border-2 border-slate-950 border-b-4 border-b-slate-950 active:border-b-2 active:translate-y-0.5 shadow-md text-base mt-2 tracking-wider cursor-pointer"
          >
            Lobiye Dön & Yeni Oyun Seç 🔄
          </button>
        </motion.div>
      )}
    </div>
  );
}