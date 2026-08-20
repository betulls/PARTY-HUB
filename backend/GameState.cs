using System.Collections.Concurrent;
using System.Collections.Generic;

namespace flagwarsbackend;

public static class GameState
{
    public static ConcurrentDictionary<string, Room> Rooms = new();
}

public class Room
{
    public string RoomCode { get; set; } = string.Empty;
    public string HostConnectionId { get; set; } = string.Empty;
    public string GameState { get; set; } = "LOBBY"; // LOBBY, VOTING, REVEAL, GAMEOVER
    public string GameMode { get; set; } = "FLAGWARS"; // FLAGWARS, MOST_LIKELY, JEALOUSY, IMPOSTER
    public string SubMode { get; set; } = "GROUP"; // GROUP, COUPLE
    public int QuestionCount { get; set; } = 10;
    public int CurrentQuestionIndex { get; set; } = 0;
    public List<Player> Players { get; set; } = new();
    public Dictionary<string, string> Votes { get; set; } = new();
    public List<RoundResult> History { get; set; } = new();
    
    // 🕵️‍♂️ Ajan Kim Alanları
    public string ImposterSecretWord { get; set; } = "";
    public string ImposterCategory { get; set; } = "";
    public string ImposterConnectionId { get; set; } = "";
    public int ImposterTotalRounds { get; set; } = 3;
    public int ImposterCurrentRound { get; set; } = 1;
    public List<ImposterClue> ImposterClues { get; set; } = new();
}

public class Player
{
    public string ConnectionId { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string Avatar { get; set; } = string.Empty;
    public bool IsHost { get; set; } = false;
    public string? CurrentVote { get; set; } = null;
    public int RedCount { get; set; } = 0;
    public int GreenCount { get; set; } = 0;
    public int TotalScore { get; set; } = 0;
}

public class VoteEntry
{
    public string Username { get; set; } = string.Empty;
    public string Avatar { get; set; } = string.Empty;
    public string Choice { get; set; } = string.Empty;
}

public class RoundResult
{
    public int RoundIndex { get; set; }
    public int RedPercentage { get; set; }
    public int GreenPercentage { get; set; }
    public double AverageScore { get; set; }
    public string SecretWord { get; set; } = "";
    public List<VoteEntry> Votes { get; set; } = new();
}

public class ImposterClue
{
    public string Username { get; set; } = "";
    public string Avatar { get; set; } = "";
    public string ClueText { get; set; } = "";
    public int RoundNumber { get; set; }
}

public class GameFinalReport
{
    public string GameMode { get; set; } = "";
    public int TotalRoundsPlayed { get; set; }
    public List<RoundResult> History { get; set; } = new();
}
public class ClueEntry
{
    public string Username { get; set; } = string.Empty;
    public string Avatar { get; set; } = string.Empty;
    public string ClueText { get; set; } = string.Empty;
    public int RoundNumber { get; set; } = 1;
}