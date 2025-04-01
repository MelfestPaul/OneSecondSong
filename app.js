document.addEventListener("DOMContentLoaded", () => {
    // Spotify-Konstanten
    const clientId = "4c0f7f2072cd4c4291ea5e75a4b90e99";
    const redirectUri = "https://melfestpaul.github.io/OneSecondSong/"; 
    const playlistId = "57CDRmfgoMRMnoMDSiiEqO";
  
    // Auslesen des Access Tokens aus der URL (nach erfolgreichem OAuth)
    function getTokenFromUrl() {
      const hash = window.location.hash.substring(1).split('&').reduce((acc, item) => {
        let parts = item.split('=');
        acc[parts[0]] = decodeURIComponent(parts[1]);
        return acc;
      }, {});
      return hash.access_token;
    }
  
    let accessToken = getTokenFromUrl();
    if (accessToken) {
      // Entferne den Token-Teil aus der URL, damit er nicht sichtbar bleibt
      window.history.pushState("", document.title, window.location.pathname + window.location.search);
    } else {
      // Falls noch kein Token vorliegt, leite zur Spotify-Login-Seite weiter
      const scopes = "playlist-read-private"; // ggf. weitere Scopes hinzufügen
      window.location = `https://accounts.spotify.com/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&response_type=token`;
    }
  
    // Variablen zur Steuerung
    let tracks = [];      // Array für Songs aus der Playlist
    let currentSong = null;
    let duration = parseFloat(document.getElementById("durationSlider").value);
    let audio = new Audio(); // Globale Audio-Instanz, die wiederverwendet wird
  
    // Schieberegler aktualisieren
    document.getElementById("durationSlider").addEventListener("input", function() {
      duration = parseFloat(this.value);
      document.getElementById("durationDisplay").innerText = duration + " Sekunde" + (duration > 1 ? "n" : "");
    });
  
    // Playlist-Tracks von Spotify abrufen
    function fetchPlaylistTracks() {
      fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      })
        .then(response => response.json())
        .then(data => {
          // Filtere nur Tracks, die auch eine Vorschau-URL haben
          tracks = data.items
            .filter(item => item.track && item.track.preview_url)
            .map(item => item.track);
          console.log("Playlist-Tracks geladen:", tracks);
        })
        .catch(err => console.error("Fehler beim Abrufen der Playlist:", err));
    }
  
    fetchPlaylistTracks();
  
    // Wählt zufällig einen Song aus der geladenen Playlist aus
    function getNextSong() {
      if (tracks.length === 0) {
        console.warn("Noch keine Tracks geladen.");
        return null;
      }
      return tracks[Math.floor(Math.random() * tracks.length)];
    }
  
    // Spielt einen Song (Preview) für eine bestimmte Dauer ab
    function playSong(song, playDuration) {
      if (!song) return;
      audio.src = song.preview_url;
      audio.play();
      // Stoppt den Song nach der angegebenen Dauer
      setTimeout(() => {
        audio.pause();
        audio.currentTime = 0;
      }, playDuration * 1000);
    }
  
    // Event-Listener für die Buttons
  
    // "Nächstes Lied": Wählt einen neuen Song und spielt ihn für die im Slider eingestellte Dauer ab
    document.getElementById("nextSong").addEventListener("click", function() {
      currentSong = getNextSong();
      playSong(currentSong, duration);
      document.getElementById("songInfo").innerText = "";
      document.getElementById("weiter").disabled = false;
      document.getElementById("replay").disabled = false;
    });
  
    // "Weiter": Zeigt den Namen des aktuell geladenen Songs an
    document.getElementById("weiter").addEventListener("click", function() {
      if (currentSong) {
        document.getElementById("songInfo").innerText = "Jetzt spielt: " + currentSong.name;
      }
    });
  
    // "Nochmal drücken": Spielt das aktuell geladene Lied erneut für exakt 1 Sekunde ab
    document.getElementById("replay").addEventListener("click", function() {
      if (currentSong) {
        playSong(currentSong, 1);
      }
    });
  });
  