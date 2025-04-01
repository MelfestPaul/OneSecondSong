const clientId = "4c0f7f2072cd4c4291ea5e75a4b90e99"; 
const redirectUri = "https://MelfestPaul.github.io/OneSecondSong/"; 
const playlistId = "57CDRmfgoMRMnoMDSiiEqO"; 
let accessToken;
let deviceId;
let currentTrack = null;

// Elemente abrufen
const playButton = document.getElementById("playButton");
const replayButton = document.getElementById("replayButton");
const revealButton = document.getElementById("revealButton");
const songInfo = document.getElementById("songInfo");
const durationSlider = document.getElementById("durationSlider");
const durationLabel = document.getElementById("durationLabel");

// Dauer aktualisieren
durationSlider.addEventListener("input", () => {
    durationLabel.textContent = `${(durationSlider.value / 1000).toFixed(3)} Sekunden`;
});

// Authentifizierung
function getAccessToken() {
    const hash = window.location.hash.substring(1).split("&").reduce((acc, item) => {
        let parts = item.split("=");
        acc[parts[0]] = decodeURIComponent(parts[1]);
        return acc;
    }, {});

    accessToken = hash.access_token;

    if (!accessToken) {
        const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user-read-playback-state user-modify-playback-state`;
        window.location.href = authUrl;
    }
}

window.onSpotifyWebPlaybackSDKReady = () => {
    const player = new Spotify.Player({
        name: "One Second Player",
        getOAuthToken: cb => { cb(accessToken); }
    });

    player.addListener("ready", ({ device_id }) => {
        console.log("✅ Player bereit, Device ID:", device_id);
        deviceId = device_id;
    });

    player.connect();
};

// Zufälligen Song aus der Playlist abrufen
async function getRandomSong() {
    const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
        headers: { "Authorization": `Bearer ${accessToken}` }
    });

    if (!response.ok) {
        console.error("❌ Fehler beim Laden der Playlist");
        return null;
    }

    const data = await response.json();
    const tracks = data.items.map(item => item.track);
    return tracks[Math.floor(Math.random() * tracks.length)];
}

// Song für die gewählte Dauer abspielen
async function playSong(track) {
    if (!track) return;
    
    console.log("🎵 Spiele Song:", track.name, "von", track.artists.map(a => a.name).join(", "));
    
    await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ uris: [track.uri], position_ms: 0 })
    });

    setTimeout(() => {
        fetch("https://api.spotify.com/v1/me/player/pause", {
            method: "PUT",
            headers: { "Authorization": `Bearer ${accessToken}` }
        }).then(() => console.log("⏸ Song pausiert!"));
    }, durationSlider.value);
}

// Event: Nächstes Lied
playButton.addEventListener("click", async () => {
    console.log("🎵 Nächstes Lied wird geladen...");
    currentTrack = await getRandomSong();
    if (!currentTrack) return;

    await playSong(currentTrack);

    // Buttons aktivieren/deaktivieren
    playButton.disabled = true;
    replayButton.disabled = false;
    revealButton.disabled = false;
});

// Event: Nochmal spielen
replayButton.addEventListener("click", async () => {
    if (!currentTrack) return;
    console.log("🔄 Spiele aktuellen Song erneut...");
    await playSong(currentTrack);
});

// Event: Auflösen/Auflösung verstecken
revealButton.addEventListener("click", () => {
    if (songInfo.style.display === "none") {
        songInfo.style.display = "block";
        songInfo.textContent = `Jetzt spielte: ${currentTrack.name} von ${currentTrack.artists.map(a => a.name).join(", ")}`;
        revealButton.textContent = "Auflösung verstecken";
    } else {
        songInfo.style.display = "none";
        revealButton.textContent = "Auflösen";
    }
});

// Token abrufen
getAccessToken();
