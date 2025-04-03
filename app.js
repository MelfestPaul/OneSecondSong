const clientId = "4c0f7f2072cd4c4291ea5e75a4b90e99";
const redirectUri = "https://melfestpaul.github.io/OneSecondSong/"; 
let playlistId = "4GRdso2zaUDKossAfv9ZYk"; 
let accessToken;
let track;
let playlistChanged = true;
let playlistLength;

const playlist = document.getElementById("playlist");
const playButton = document.getElementById("playButton");
const revealButton = document.getElementById("revealButton");
const againButton = document.getElementById("againButton");
const songInfo = document.getElementById("songInfo");
const durationSlider = document.getElementById("durationSlider");
const durationLabel = document.getElementById("durationLabel");
const playingTime = document.getElementById("playingTime");
playingTime.textContent = `1 second(s)`;

// 1. Spotify Authentifizierung (Implicit Grant Flow)
function getAccessToken() {
  // Entferne das führende '#' und parse die Parameter
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  const token = params.get("access_token");
  
  if (token) {
    accessToken = token;
    // Speichern, damit auch nach Reload der Token verfügbar ist
    //localStorage.setItem("spotify_access_token", accessToken); TODO
    // URL bereinigen
    window.history.pushState({}, document.title, window.location.pathname);
    console.log("✅ Access token retrieved:", accessToken);
  } else 
    if (!accessToken) {
      // Weiterleiten zur Spotify-Autorisierung
      const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user-read-playback-state%20user-modify-playback-state`;
      window.location.href = authUrl;
    } else {
      console.log("✅ Access token from localStorage:", accessToken);
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
      console.log("✅ Active device found:", activeDevice.id, activeDevice.name);
      return activeDevice.id;
    } else {
      console.error("❌ No active device found. Please ensure that your Spotify app is running and active.");
      songInfo.innerText = "❌ No active device found. Open Spotify!";
      return null;
    }
  } catch (error) {
    console.error("❌ Error retrieving devices:", error);
    songInfo.innerText = "❌ Error retrieving devices.";
    return null;
  }
}

async function getPlaylistLength() {
  let totalTracks = 0;
  let url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100`;

  while (url) {
      const response = await fetch(url, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      
      if (!response.ok) {
          throw new Error(`Fehler: ${response.status} - ${response.statusText}`);
      }
      
      const data = await response.json();
      totalTracks += data.items.length;
      url = data.next; // URL für die nächste Seite, falls vorhanden
  }

  console.log(`✅ ${totalTracks} songs found.`);
  return totalTracks;
}

async function getTrackAtIndex(index) {
  if (index < 0) {
      throw new Error("Index must be 0 or greater");
  }
  
  let url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100`;
  let offset = 0;
  
  while (url) {
      const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100&offset=${offset}`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      
      if (!response.ok) {
          throw new Error(`Fehler: ${response.status} - ${response.statusText}`);
      }
      
      const data = await response.json();
      if (index < offset + data.items.length) {
          return data.items[index - offset].track;
      }
      
      if (!data.next) {
          throw new Error("Index out of playlist bounds");
      }
      
      offset += 100;
  }
}

// 3. Hole zufälligen Song aus der Playlist
async function getRandomSong() {
  console.log("📀 Fetching a random song from the playlist...");
  console.log(`PlaylistChanged = ${playlistChanged}`);
  if(playlistChanged)
    playlistLength = await getPlaylistLength();
  playlistChanged = false;
  track = await getTrackAtIndex(Math.floor(Math.random() * playlistLength));
  return track;
}

// 4. Song kurz abspielen
async function playOneSecond(again) {
  const deviceId = await getActiveDeviceId();
  if (!deviceId) return;
  
  if(!again) track = await getRandomSong();
  if (!track) return;
  
  console.log(`🎵 Trying to play ${track.name} on device ${deviceId}...`);
  
  // Starte die Wiedergabe des Tracks auf dem aktiven Gerät
  songInfo.textContent = ``;
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
      console.log("✅ Song started!");
    } else {
      console.error("❌ Error while starting playback:", playResponse.status);
    }
  } catch (err) {
    console.error("❌ Error while starting playback:", err);
    songInfo.innerText = "❌ Error while starting playback.";
    return;
  }
  
  // Pausieren
  setTimeout(async () => {
    try {
      const pauseResponse = await fetch("https://api.spotify.com/v1/me/player/pause", {
        method: "PUT",
        headers: { "Authorization": `Bearer ${accessToken}` }
      });
      if (pauseResponse.status === 204) {
        console.log("⏸ Song paused!");
      } else {
        console.error("❌ Error while pausing:", pauseResponse.status);
      }
    } catch (err) {
      console.error("❌ Error while pausing:", err);
    }
  }, durationSlider.value * 1000);
}

// Dauer-Label aktualisieren
durationSlider.addEventListener("input", () => {
    playingTime.textContent = `${durationSlider.value} second(s)`;
});

// Playlist aktualisieren
playlist.addEventListener("change", () => {
    playlistChanged = true;
    var text = playlist.options[playlist.selectedIndex].text;
    switch (text) {
        case "Eurovision 2025":
            playlistId = "4GRdso2zaUDKossAfv9ZYk";
            	break;
        case "Melodifestivalen 2025":
            playlistId = "57CDRmfgoMRMnoMDSiiEqO";
            break;
        case "Mellovision 2025":
            playlistId = "0vPoCHXo2MpwZYdUjzdy0t";
            break;
        case "Preselections 2025":
            playlistId = "4x9NwuUwnZaUEMXTRqxyTz";
            break;
        case "Eurovision 2024":
            playlistId = "6rsWc7Z7AidcPjUfJNjhp5";
            break;
        case "Preselections 2024":
            playlistId = "38D3qbdFukoyCw9W6lYoim";
            break;
        case "Eurovision":
            playlistId = "3pVznEeaCmjbDqjjuOuAOO";
            break;
        case "Melodifestivalen":
            playlistId = "5Y6mYaL6fTUPkzRs0MFEn0";
            break;
        case "Preselections":
            playlistId = "2j5dnS9rSf4hxOhfTn3ZtH";
            break;
        case "Individual":
            playlistId = "5Abi47HRV71THt5C39hz2K";
      }
});

// 5. Event-Listener für den Button
playButton.addEventListener("click", () => {
  console.log("🎵 play-button was clicked!");
  songInfo.textContent = `choosing a random song...`;
  playOneSecond(false);
});

againButton.addEventListener("click", () => {
    console.log("🎵 again-button was clicked!");
    playOneSecond(true);
});

// **🎵 Auflösen/Auflösung verstecken**
revealButton.addEventListener("click", () => {
    console.log("✔️❌❔ reveal-button was clicked!");
    songInfo.style.display = "block";
    songInfo.textContent = `${track.artists.map(a => a.name).join(", ")} - ${track.name}`;
});

// 6. Beim Laden der Seite den Access Token abrufen
getAccessToken();