using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;

namespace flagwarsbackend
{
    public static class WordleDictionary
    {
        // Kelimelerin RAM'de tutulacağı, ışık hızında çalışan liste
        public static HashSet<string> Kelimeler = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        public static async Task LoadWordsFromApiAsync()
        {
            try
            {
                using var client = new HttpClient();
                
                // 🚀 GIST RAW LINKINI BURAYA YAPIŞTIR:
                string url = "https://gist.githubusercontent.com/betulls/9e0f8645fbda92c0195dc85cc759d533/raw/kelimeler.json";
                var response = await client.GetStringAsync(url);
                var wordsList = JsonSerializer.Deserialize<List<string>>(response);

                if (wordsList != null)
                {
                    foreach (var word in wordsList)
                    {
                        if (word.Length == 5)
                        {
                            Kelimeler.Add(word.ToUpper(new System.Globalization.CultureInfo("tr-TR")));
                        }
                    }
                    Console.WriteLine($"[WORDLE] {Kelimeler.Count} adet kelime API'den başarıyla yüklendi!");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[WORDLE HATA] Kelimeler API'den çekilemedi: {ex.Message}");
                // API çökerse oyun kilitlenmesin diye acil durum kelimeleri
                var yedekKelimeler = new List<string> { "KİTAP", "KALEM", "SEVGİ", "ÇİÇEK", "BÖCEK" };
                foreach (var y in yedekKelimeler) Kelimeler.Add(y);
            }
        }
    }
}