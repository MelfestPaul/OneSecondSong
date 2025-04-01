const clientId = "4c0f7f2072cd4c4291ea5e75a4b90e99";
const redirectUri = "https://melfestpaul.github.io/OneSecondSong/"; 
const playlistId = "57CDRmfgoMRMnoMDSiiEqO"; 
let accessToken;
let track;

const playButton = document.getElementById("playButton");
const revealButton = document.getElementById("revealButton");
const songInfo = document.getElementById("songInfo");

// 1. Spotify Authentifizierung (Implicit Grant Flow)
function getAccessToken() {
  // Entferne das führende '#' und parse die Parameter
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  const token = params.get("access_token");
  
  if (token) {
    accessToken = token;
    // Speichern, damit auch nach Reload der Token verfügbar ist
    localStorage.setItem("spotify_access_token", accessToken);
    // URL bereinigen
    window.history.pushState({}, document.title, window.location.pathname);
    console.log("✅ Access Token erhalten:", accessToken);
  } else {
    // Falls schon ein Token im localStorage vorhanden ist, verwende diesen
    accessToken = localStorage.getItem("spotify_access_token");
    if (!accessToken) {
      // Weiterleiten zur Spotify-Autorisierung
      const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user-read-playback-state%20user-modify-playback-state`;
      window.location.href = authUrl;
    } else {
      console.log("✅ Access Token aus localStorage:", accessToken);
    }
  }
}

// 2. Hole die aktiven Geräte (Spotify App muss bereits laufen)
async function getActiveDeviceId() {
  try {
    const response = await fetch("https://api.spotify.com/v1/me/player/devices", {
      headers: { "Authorization": `Bearer ${accessToken}` }
    });
    const data = await response.json();
    console.log("Geräte:", data.devices);
    // Wähle das erste verfügbare Gerät, das online ist
    const activeDevice = data.devices.find(device => device.is_active || device.type === "Smartphone" || device.type === "Computer");
    if (activeDevice) {
      console.log("✅ Aktives Gerät gefunden:", activeDevice.id, activeDevice.name);
      return activeDevice.id;
    } else {
      console.error("❌ Kein aktives Gerät gefunden. Stelle sicher, dass deine Spotify-App läuft und aktiv ist.");
      songInfo.innerText = "❌ Kein aktives Gerät gefunden. Öffne Spotify!";
      return null;
    }
  } catch (error) {
    console.error("❌ Fehler beim Abrufen der Geräte:", error);
    songInfo.innerText = "❌ Fehler beim Abrufen der Geräte.";
    return null;
  }
}

// 3. Hole zufälligen Song aus der Playlist
async function getRandomSong() {
  try {
    console.log("📀 Hole einen zufälligen Song aus der Playlist...");
    const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
      headers: { "Authorization": `Bearer ${accessToken}` }
    });
    if (!response.ok) throw new Error("❌ Fehler beim Laden der Playlist");
    const data = await response.json();
    const tracks = data.items.map(item => item.track);
    console.log(`✅ ${tracks.length} Songs gefunden.`);
    const song = tracks[Math.floor(Math.random() * tracks.length)];
    console.log(`🎶 Zufälliger Song: ${song?.name || "Kein Song gefunden"}`);
    return song;
  } catch (error) {
    console.error(error);
    songInfo.innerText = "❌ Fehler beim Laden der Playlist.";
    return null;
  }
}

// 4. Song für eine Sekunde abspielen
async function playOneSecond() {
  const deviceId = await getActiveDeviceId();
  if (!deviceId) return;
  
  track = await getRandomSong();
  if (!track) return;
  
  console.log(`🎵 Versuche, ${track.name} zu spielen auf Gerät ${deviceId}...`);
  
  // Starte die Wiedergabe des Tracks auf dem aktiven Gerät
  try {
    const playResponse = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ uris: [track.uri], position_ms: 0 })
    });
    if (playResponse.status === 204) {
      console.log("✅ Song gestartet!");
    } else {
      console.error("❌ Fehler beim Starten der Wiedergabe:", playResponse.status);
    }
  } catch (err) {
    console.error("❌ Fehler beim Starten der Wiedergabe:", err);
    songInfo.innerText = "❌ Fehler beim Starten der Wiedergabe.";
    return;
  }
  
  // Nach 1 Sekunde pausieren
  setTimeout(async () => {
    try {
      const pauseResponse = await fetch("https://api.spotify.com/v1/me/player/pause", {
        method: "PUT",
        headers: { "Authorization": `Bearer ${accessToken}` }
      });
      if (pauseResponse.status === 204) {
        console.log("⏸ Song pausiert!");
      } else {
        console.error("❌ Fehler beim Pausieren:", pauseResponse.status);
      }
    } catch (err) {
      console.error("❌ Fehler beim Pausieren:", err);
    }
  }, 1000);
}

// 5. Event-Listener für den Button
playButton.addEventListener("click", () => {
  console.log("🎵 Play-Button wurde geklickt!");
  playOneSecond();
});

// **🎵 Auflösen/Auflösung verstecken**
revealButton.addEventListener("click", () => {
    console.log("✔️❌❔ Reveal-Button wurde geklickt!");
    if (songInfo.style.display === "none") {
        songInfo.style.display = "block";
        songInfo.textContent = `${currentTrack.artists.map(a => a.name).join(", ")} von ${currentTrack.name}`;
        revealButton.textContent = "Auflösung verstecken";
    } else {
        songInfo.style.display = "none";
        revealButton.textContent = "Auflösung";
    }
});

// 6. Beim Laden der Seite den Access Token abrufen
getAccessToken();