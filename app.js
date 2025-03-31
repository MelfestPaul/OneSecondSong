const clientId = "4c0f7f2072cd4c4291ea5e75a4b90e99"; 
const redirectUri = "https://MelfestPaul.github.io/OneSecondSong/"; 
const playlistId = "57CDRmfgoMRMnoMDSiiEqO"; 
let accessToken;
let deviceId;
let player;

// 1️⃣ **Spotify Authentifizierung (Implicit Grant Flow)**
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
    } else {
        console.log("✅ Access Token erhalten:", accessToken);
    }
}

// 2️⃣ **Spotify Web Playback SDK initialisieren**
window.onSpotifyWebPlaybackSDKReady = () => {
    player = new Spotify.Player({
        name: "One Second Player",
        getOAuthToken: cb => { cb(accessToken); }
    });

    player.addListener("ready", ({ device_id }) => {
        console.log("✅ Player ist bereit, Device ID:", device_id);
        deviceId = device_id;
        transferPlayback();
    });

    player.addListener("not_ready", ({ device_id }) => {
        console.log("❌ Player nicht bereit, Device ID:", device_id);
    });

    player.connect();
};

// 3️⃣ **Spotify-Wiedergabe auf unser Gerät umstellen**
function transferPlayback() {
    fetch("https://api.spotify.com/v1/me/player", {
        method: "PUT",
        headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ device_ids: [deviceId], play: true })
    }).catch(err => console.error("Fehler beim Übertragen der Wiedergabe:", err));
}

// 4️⃣ **Zufälligen Song aus der Playlist abrufen**
async function getRandomSong() {
    try {
        const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
            headers: { "Authorization": `Bearer ${accessToken}` }
        });

        if (!response.ok) throw new Error("❌ Fehler beim Laden der Playlist");

        const data = await response.json();
        const tracks = data.items.map(item => item.track);
        return tracks[Math.floor(Math.random() * tracks.length)];
    } catch (error) {
        console.error(error);
        return null;
    }
}

// 5️⃣ **Song für eine Sekunde abspielen**
async function playOneSecond() {
    const track = await getRandomSong();
    if (!track) return;

    console.log("🎵 Spiele Song:", track.name, "von", track.artists.map(a => a.name).join(", "));

    fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: "PUT",
        headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ uris: [track.uri], position_ms: 0 })
    }).then(() => {
        setTimeout(() => {
            fetch("https://api.spotify.com/v1/me/player/pause", {
                method: "PUT",
                headers: { "Authorization": `Bearer ${accessToken}` }
            });
        }, 1000);
    }).catch(err => console.error("❌ Wiedergabe konnte nicht gestartet werden:", err));

    document.getElementById("songInfo").innerText = `Jetzt spielt: ${track.name} von ${track.artists.map(a => a.name).join(", ")}`;
}

// Event-Listener für den Button
document.getElementById("playButton").addEventListener("click", playOneSecond);

// 6️⃣ **Beim Laden der Seite Token abrufen**
getAccessToken();
