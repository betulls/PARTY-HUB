using Microsoft.AspNetCore.SignalR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace flagwarsbackend;

    public class GameHub : Hub
    {
        // Tüm odaların tutulduğu static liste
        private static readonly Dictionary<string, Room> Rooms = new();

        // 1. Oda Oluşturma
        public async Task<string> CreateRoom(string username, string avatar)
        {
            var random = new Random();
            string roomCode;
            do
            {
                roomCode = random.Next(1000, 9999).ToString();
            } while (Rooms.ContainsKey(roomCode));

            var room = new Room
            {
                RoomCode = roomCode,
                HostConnectionId = Context.ConnectionId
            };

            var player = new Player
            {
                ConnectionId = Context.ConnectionId,
                Username = username,
                Avatar = avatar,
                IsHost = true
            };

            room.Players.Add(player);
            Rooms[roomCode] = room;

            await Groups.AddToGroupAsync(Context.ConnectionId, roomCode);
            await Clients.Caller.SendAsync("RoomCreated", roomCode);
            await Clients.Group(roomCode).SendAsync("UpdatePlayers", room.Players);

            return roomCode;
        }

        // 2. Odaya Katılma
        public async Task<bool> JoinRoom(string roomCode, string username, string avatar)
        {
            roomCode = roomCode.ToUpper();
            if (!Rooms.TryGetValue(roomCode, out var room))
            {
                return false;
            }

            var player = new Player
            {
                ConnectionId = Context.ConnectionId,
                Username = username,
                Avatar = avatar,
                IsHost = false
            };

            room.Players.Add(player);
            await Groups.AddToGroupAsync(Context.ConnectionId, roomCode);
            await Clients.Group(roomCode).SendAsync("UpdatePlayers", room.Players);
            await Clients.Caller.SendAsync("GameModeChanged", new
            {
                gameMode = room.GameMode,
                subMode = room.SubMode,
                questionCount = room.QuestionCount
            });

            return true;
        }

        // 3. Odadan Ayrılma
        public async Task LeaveRoom(string roomCode)
        {
            if (!Rooms.TryGetValue(roomCode, out var room)) return;

            var player = room.Players.FirstOrDefault(p => p.ConnectionId == Context.ConnectionId);
            if (player != null)
            {
                room.Players.Remove(player);
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, roomCode);

                if (room.Players.Count == 0)
                {
                    Rooms.Remove(roomCode);
                }
                else
                {
                    if (player.IsHost)
                    {
                        var newHost = room.Players.First();
                        newHost.IsHost = true;
                        room.HostConnectionId = newHost.ConnectionId;
                        await Clients.Group(roomCode).SendAsync("HostChanged", newHost.Username);
                    }
                    await Clients.Group(roomCode).SendAsync("UpdatePlayers", room.Players);
                }
            }
        }

        // 4. Oyun Modu Değiştirme
        public async Task ChangeGameMode(string roomCode, string newMode, string newSubMode, int questionCount)
        {
            if (!Rooms.TryGetValue(roomCode, out var room)) return;

            room.GameMode = newMode;
            room.SubMode = newSubMode;
            room.QuestionCount = questionCount;

            await Clients.Group(roomCode).SendAsync("GameModeChanged", new
            {
                gameMode = newMode,
                subMode = newSubMode,
                questionCount = questionCount
            });
        }

        // 5. Standart Oyun Başlatma (FlagWars, Aramızda En, Kıskançlık)
        public async Task StartGame(string roomCode)
        {
            if (!Rooms.TryGetValue(roomCode, out var room)) return;

            room.CurrentQuestionIndex = 0;
            room.Votes.Clear();
            room.History.Clear();

            await Clients.Group(roomCode).SendAsync("GameStarted", new
            {
                gameMode = room.GameMode,
                subMode = room.SubMode,
                questionCount = room.QuestionCount
            });
        }

        // 6. 🕵️‍♂️ Ajan Kim Başlatma
        public async Task StartImposterGame(string roomCode, string categoryKey, string secretWord, int rounds = 3)
        {
            if (!Rooms.TryGetValue(roomCode, out var room)) return;

            // En az 3 oyuncu kuralı
            if (room.Players.Count < 3) return;

            var random = new Random();
            var chosenImposter = room.Players[random.Next(room.Players.Count)];

            room.ImposterCategory = categoryKey;
            room.ImposterSecretWord = secretWord;
            room.ImposterConnectionId = chosenImposter.ConnectionId;
            room.ImposterTotalRounds = rounds;
            room.ImposterCurrentRound = 1;
            room.ImposterClues.Clear();
            room.Votes.Clear();

            foreach (var player in room.Players)
            {
                bool isImposter = player.ConnectionId == chosenImposter.ConnectionId;
                await Clients.Client(player.ConnectionId).SendAsync("ImposterGameStarted", new
                {
                    category = categoryKey,
                    secretWord = isImposter ? "???" : secretWord,
                    isImposter = isImposter,
                    totalRounds = rounds,
                    currentRound = 1
                });
            }
        }

        // 7. 🕵️‍♂️ Ajan Kim İpucu Gönderme
public async Task SubmitImposterClue(string roomCode, string clueText)
{
    if (!Rooms.TryGetValue(roomCode, out var room)) return;
    var player = room.Players.FirstOrDefault(p => p.ConnectionId == Context.ConnectionId);
    if (player == null) return;

    string cleanedClue = clueText.Trim();

    // 🎯 1. AJAN KELİMEYİ DOĞRUDAN BİLDİ Mİ?
    if (player.ConnectionId == room.ImposterConnectionId && 
        string.Equals(cleanedClue, room.ImposterSecretWord, StringComparison.OrdinalIgnoreCase))
    {
        await Clients.Group(roomCode).SendAsync("ImposterGameOver", new
        {
            secretWord = room.ImposterSecretWord,
            imposterName = player.Username,
            imposterAvatar = player.Avatar,
            votes = new List<object>(),
            status = "IMPOSTER_GUESSED",
            imposterVoteCount = 0,
            totalVotes = room.Players.Count
        });
        return;
    }

    // 🎯 2. İPUCUNU LİSTEYE EKLE
    room.ImposterClues.Add(new ImposterClue 
    { 
        Username = player.Username, 
        Avatar = player.Avatar, 
        ClueText = cleanedClue, 
        RoundNumber = room.ImposterCurrentRound 
    });

    // Anlık olarak masadaki herkese güncel ipuçlarını gönder
    await Clients.Group(roomCode).SendAsync("UpdateImposterClues", room.ImposterClues);

    // 🎯 BU TURDAKİ TÜM OYUNCULAR İPUCU VERDİ Mİ?
    int currentRoundClueCount = room.ImposterClues.Count(c => c.RoundNumber == room.ImposterCurrentRound);

    if (currentRoundClueCount >= room.Players.Count)
    {
        // 3 Tur tamamlanmadıysa bir sonraki tura geç
        if (room.ImposterCurrentRound < 3)
        {
            room.ImposterCurrentRound++;
            await Clients.Group(roomCode).SendAsync("StartNextClueRound", room.ImposterCurrentRound);
        }
        else
        {
            // 3 Tur bitti -> Frontend'in beklediği oylama sinyalini gönder!
            room.GameState = "IMPOSTER_VOTE";
            await Clients.Group(roomCode).SendAsync("ImposterStartVoting");
        }
    }
}


        // 8. Oy Verme (Tüm Oyunlar İçin)
        public async Task SubmitVote(string roomCode, string choice)
        {
            if (!Rooms.TryGetValue(roomCode, out var room)) return;
            var player = room.Players.FirstOrDefault(p => p.ConnectionId == Context.ConnectionId);
            if (player == null) return;

            room.Votes[Context.ConnectionId] = choice;
            await Clients.Group(roomCode).SendAsync("PlayerVoted", player.Username);

            // Herkes oy verdiyse
    if (room.Votes.Count >= room.Players.Count)
    {
        if (room.GameMode == "IMPOSTER")
        {
            var imposterPlayer = room.Players.FirstOrDefault(p => p.ConnectionId == room.ImposterConnectionId);
            string imposterName = imposterPlayer?.Username ?? "Ajan";

            // Oyları listele
            var votesDetail = room.Votes.Select(kv => new
            {
                voter = room.Players.FirstOrDefault(p => p.ConnectionId == kv.Key)?.Username ?? "Bilinmiyor",
                votedTarget = kv.Value
            }).ToList();

            // Oy sayılarını hesapla
            var voteCounts = room.Votes.Values
                .GroupBy(v => v)
                .ToDictionary(g => g.Key, g => g.Count());

            int maxVotes = voteCounts.Values.Max();
            var topVotedPlayers = voteCounts.Where(kv => kv.Value == maxVotes).Select(kv => kv.Key).ToList();

            string outcomeStatus = "CAUGHT"; // CAUGHT (Yakalandı), ESCAPED (Kandırdı), TIE (Eşitlik)

            if (topVotedPlayers.Count > 1)
            {
                // En çok oyu alan birden fazla kişi varsa eşitlik
                outcomeStatus = "TIE";
            }
            else if (topVotedPlayers.First() == imposterName)
            {
                // Tek başına en çok oyu ajan aldıysa yakalandı
                outcomeStatus = "CAUGHT";
            }
            else
            {
                // En çok oyu masum biri aldıysa ajan kandırdı
                outcomeStatus = "ESCAPED";
            }

            await Clients.Group(roomCode).SendAsync("ImposterGameOver", new
            {
                secretWord = room.ImposterSecretWord,
                imposterName = imposterName,
                imposterAvatar = imposterPlayer?.Avatar ?? "",
                votes = votesDetail,
                status = outcomeStatus,
                imposterVoteCount = voteCounts.ContainsKey(imposterName) ? voteCounts[imposterName] : 0,
                totalVotes = room.Players.Count
            });
            return;
        }

        // Diğer modlar için normal akış
        var roundResult = CalculateRoundResult(room);
        room.History.Add(roundResult);
        await Clients.Group(roomCode).SendAsync("AllVotesCompleted", new
        {
            players = room.Players,
            roundResult = roundResult
        });
    }
        }

        // 9. Sonraki Soruya Geçiş / Oyun Sonu
        public async Task NextQuestion(string roomCode)
        {
            if (!Rooms.TryGetValue(roomCode, out var room)) return;

            room.CurrentQuestionIndex++;
            room.Votes.Clear();

            if (room.CurrentQuestionIndex >= room.QuestionCount)
            {
                var finalReport = GenerateFinalReport(room);
                await Clients.Group(roomCode).SendAsync("GameOver", finalReport);
            }
            else
            {
                await Clients.Group(roomCode).SendAsync("NextQuestionStarted", room.CurrentQuestionIndex);
            }
        }

        // 10. Lobiye Geri Dönüş
        public async Task ReturnToLobby(string roomCode)
        {
            if (!Rooms.TryGetValue(roomCode, out var room)) return;

            room.Votes.Clear();
            room.History.Clear();
            room.CurrentQuestionIndex = 0;
            room.ImposterClues.Clear();

            await Clients.Group(roomCode).SendAsync("ReturnedToLobby", room.Players);
        }

        // 11. Dürtme & Emoji Reaksiyonları
        public async Task PokePlayer(string roomCode, string targetConnectionId)
        {
            if (!Rooms.TryGetValue(roomCode, out var room)) return;
            var sender = room.Players.FirstOrDefault(p => p.ConnectionId == Context.ConnectionId);
            if (sender != null)
            {
                await Clients.Client(targetConnectionId).SendAsync("PlayerPoked", sender.Username);
            }
        }

        public async Task SendReaction(string roomCode, string emoji)
        {
            if (!Rooms.TryGetValue(roomCode, out var room)) return;
            var sender = room.Players.FirstOrDefault(p => p.ConnectionId == Context.ConnectionId);
            if (sender != null)
            {
                await Clients.Group(roomCode).SendAsync("EmojiReceived", new
                {
                    username = sender.Username,
                    emoji = emoji
                });
            }
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            foreach (var kvp in Rooms.ToList())
            {
                var room = kvp.Value;
                var player = room.Players.FirstOrDefault(p => p.ConnectionId == Context.ConnectionId);
                if (player != null)
                {
                    await LeaveRoom(room.RoomCode);
                    break;
                }
            }
            await base.OnDisconnectedAsync(exception);
        }

        // --- YARDIMCI METODLAR ---
        private RoundResult CalculateRoundResult(Room room)
        {
            var voteList = room.Votes.Select(kv =>
            {
                var p = room.Players.FirstOrDefault(pl => pl.ConnectionId == kv.Key);
                return new VoteEntry
                {
                    Username = p?.Username ?? "Bilinmiyor",
                    Avatar = p?.Avatar ?? "",
                    Choice = kv.Value
                };
            }).ToList();

            var result = new RoundResult
            {
                RoundIndex = room.CurrentQuestionIndex,
                Votes = voteList,
                SecretWord = room.ImposterSecretWord
            };

            if (room.GameMode == "FLAGWARS")
            {
                int redCount = voteList.Count(v => v.Choice == "RED");
                int greenCount = voteList.Count(v => v.Choice == "GREEN");
                int total = voteList.Count;

                result.RedPercentage = total > 0 ? (int)Math.Round((double)redCount / total * 100) : 0;
                result.GreenPercentage = total > 0 ? 100 - result.RedPercentage : 0;
            }
            else if (room.GameMode == "JEALOUSY")
            {
                double avg = voteList.Count > 0 ? voteList.Average(v => double.TryParse(v.Choice, out var val) ? val : 5) : 5;
                result.AverageScore = Math.Round(avg, 1);
            }

            return result;
        }

        private GameFinalReport GenerateFinalReport(Room room)
        {
            return new GameFinalReport
            {
                GameMode = room.GameMode,
                TotalRoundsPlayed = room.History.Count,
                History = room.History
            };
        }
    }
