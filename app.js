document.addEventListener("DOMContentLoaded", () => {
    // Spotify-Konstanten
    const clientId = "4c0f7f2072cd4c4291ea5e75a4b90e99";
    const redirectUri = "https://MelfestPaul.github.io/OneSecondSong/"; 
    const playlistId = "57CDRmfgoMRMnoMDSiiEqO";
  
    // Funktion: Token aus der URL extrahieren
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
      // Entferne den Token aus der URL
      window.history.pushState("", document.title, window.location.pathname + window.location.search);
    } else {
      // Falls kein Token vorhanden ist, zur Spotify-Login-Seite weiterleiten
      const scopes = "playlist-read-private";
      window.location = `https://accounts.spotify.com/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&response_type=token`;
    }
  
    // Variablen für die Steuerung
    let tracks = [];      // Array für Songs aus der Playlist
    let currentSong = null;
    let duration = parseFloat(document.getElementById("durationSlider").value);
    let audio = new Audio(); // Globale Audio-Instanz
  
    // Schieberegler: Anzeige aktualisieren
    document.getElementById("durationSlider").addEventListener("input", function() {
      duration = parseFloat(this.value);
      document.getElementById("durationDisplay").innerText = duration + " Sekunde" + (duration > 1 ? "n" : "");
    });
  
    // Stelle sicher, dass die Buttons den gewünschten Text haben
    document.getElementById("weiter").innerText = "Auflösung";
    document.getElementById("replay").innerText = "Nochmal";
  
    // Spotify: Playlist-Tracks abrufen
    function fetchPlaylistTracks() {
      fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      })
        .then(response => response.json())
        .then(data => {
          // Filter: Nur Tracks mit einer Preview-URL berücksichtigen
          tracks = data.items
            .filter(item => item.track && item.track.preview_url)
            .map(item => item.track);
          console.log("Playlist-Tracks geladen:", tracks);
          if(tracks.length === 0){
            console.error("Es wurden keine Tracks mit gültiger preview_url gefunden.");
          }
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
      let song = tracks[Math.floor(Math.random() * tracks.length)];
      console.log("Ausgewählter Song:", song);
      return song;
    }
  
    // Spielt einen Song (Preview) für eine bestimmte Dauer ab
    function playSong(song, playDuration) {
      if (!song) {
        console.error("Kein Song verfügbar, der abgespielt werden könnte.");
        return;
      }
      if (!song.preview_url) {
        console.error("Dieser Song besitzt keine preview_url.");
        return;
      }
      audio.src = song.preview_url;
      audio.play().then(() => {
        console.log("Song wird abgespielt:", song.name);
      }).catch(err => {
        console.error("Fehler beim Abspielen des Songs:", err);
      });
      // Stoppt den Song nach playDuration Sekunden
      setTimeout(() => {
        audio.pause();
        audio.currentTime = 0;
        console.log("Song gestoppt nach", playDuration, "Sekunden.");
      }, playDuration * 1000);
    }
  
    // "Nächstes Lied": Wählt einen neuen Song aus und spielt ihn für die im Slider definierte Dauer ab
    document.getElementById("nextSong").addEventListener("click", function() {
      currentSong = getNextSong();
      playSong(currentSong, duration);
      document.getElementById("songInfo").innerText = "";
      document.getElementById("weiter").disabled = false;
      document.getElementById("replay").disabled = false;
    });
  
    // "Auflösung" (früher "Weiter"): Zeigt den Namen des aktuell geladenen Songs an
    document.getElementById("weiter").addEventListener("click", function() {
      if (currentSong) {
        document.getElementById("songInfo").innerText = "Jetzt spielt: " + currentSong.name;
      }
    });
  
    // "Nochmal": Spielt das aktuell geladene Lied erneut für exakt 1 Sekunde ab
    document.getElementById("replay").addEventListener("click", function() {
      if (currentSong) {
        playSong(currentSong, 1);
      }
    });
  });  