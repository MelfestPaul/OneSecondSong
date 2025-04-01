document.addEventListener("DOMContentLoaded", () => {
    // Spotify-Konstanten
    const clientId = "4c0f7f2072cd4c4291ea5e75a4b90e99";
    const redirectUri = "http://melfestpaul.github.io/OneSecondSong/"; 
    const playlistId = "57CDRmfgoMRMnoMDSiiEqO";
  
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
      window.history.pushState("", document.title, window.location.pathname + window.location.search);
    } else {
      const scopes = "playlist-read-private";
      window.location = `https://accounts.spotify.com/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&response_type=token`;
    }
  
    // Variablen für die Steuerung
    let tracks = [];
    let currentSong = null;
    let duration = parseFloat(document.getElementById("durationSlider").value);
    let audio = new Audio(); 
  
    // Event-Listener für den Slider
    document.getElementById("durationSlider").addEventListener("input", function() {
      duration = parseFloat(this.value);
      document.getElementById("durationDisplay").innerText = duration + " Sekunde" + (duration > 1 ? "n" : "");
    });
  
    // Buttons beschriften
    document.getElementById("weiter").innerText = "Auflösung";
    document.getElementById("replay").innerText = "Nochmal";
  
    function fetchPlaylistTracks() {
      fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      })
        .then(response => response.json())
        .then(data => {
          tracks = data.items.filter(item => item.track && item.track.preview_url).map(item => item.track);
          console.log("Playlist-Tracks geladen:", tracks);
          if (tracks.length === 0) {
            console.error("Es wurden keine Tracks mit preview_url gefunden.");
          }
        })
        .catch(err => console.error("Fehler beim Abrufen der Playlist:", err));
    }
  
    fetchPlaylistTracks();
  
    function getNextSong() {
      if (tracks.length === 0) {
        console.warn("Keine Songs geladen.");
        return null;
      }
      let song = tracks[Math.floor(Math.random() * tracks.length)];
      console.log("Neuer Song ausgewählt:", song);
      return song;
    }
  
    function playSong(song, playDuration) {
      if (!song || !song.preview_url) {
        console.error("Kein gültiger Song zum Abspielen.");
        return;
      }
  
      audio.src = song.preview_url;
      audio.load(); // WICHTIG: Dadurch wird sichergestellt, dass die Datei richtig geladen wird
      audio.play().then(() => {
        console.log("Song wird abgespielt:", song.name);
        setTimeout(() => {
          audio.pause();
          audio.currentTime = 0;
          console.log("Song gestoppt nach", playDuration, "Sekunden.");
        }, playDuration * 1000);
      }).catch(err => {
        console.error("Fehler beim Abspielen des Songs:", err);
      });
    }
  
    document.getElementById("nextSong").addEventListener("click", function() {
      currentSong = getNextSong();
      if (currentSong) {
        playSong(currentSong, duration);
        document.getElementById("songInfo").innerText = "";
        document.getElementById("weiter").disabled = false;
        document.getElementById("replay").disabled = false;
      }
    });
  
    document.getElementById("weiter").addEventListener("click", function() {
      if (currentSong) {
        document.getElementById("songInfo").innerText = "Jetzt spielt: " + currentSong.name;
      }
    });
  
    document.getElementById("replay").addEventListener("click", function() {
      if (currentSong) {
        playSong(currentSong, 1);
      }
    });
  });
  