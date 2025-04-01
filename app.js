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

    if (accessToken) {
        console.log("✅ Access Token erhalten:", accessToken);
        localStorage.setItem("spotify_access_token", accessToken);
        window.history.pushState({}, document.title, window.location.pathname);
    } else {
        accessToken = localStorage.getItem("spotify_access_token");
        if (!accessToken) {
            const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user-read-playback-state user-modify-playback-state`;
            window.location.href = authUrl;
        } else {
            console.log("✅ Access Token aus localStorage geladen:", accessToken);
        }
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
        deviceId = device_id; // **Hier setzen wir die deviceId!**
        transferPlayback(); // **Sobald der Player bereit ist, setzen wir die Wiedergabe auf unser Gerät**
    });

    player.addListener("not_ready", ({ device_id }) => {
        console.log("❌ Player nicht bereit, Device ID:", device_id);
    });

    player.connect().then(success => {
        if (success) {
            console.log("🔗 Verbindung zum Player erfolgreich!");
        } else {
            console.error("❌ Verbindung zum Player fehlgeschlagen!");
        }
    });
};


// 3️⃣ **Spotify-Wiedergabe auf unser Gerät umstellen**
function transferPlayback() {
    if (!deviceId) {
        console.error("❌ Fehler: Keine deviceId vorhanden! Kann die Wiedergabe nicht übertragen.");
        return;
    }

    console.log("🔄 Versuche, die Wiedergabe auf das neue Gerät zu übertragen...");

    fetch("https://api.spotify.com/v1/me/player", {
        method: "PUT",
        headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ device_ids: [deviceId], play: true })
    }).then(response => {
        if (response.ok) {
            console.log("✅ Wiedergabe erfolgreich übertragen!");
        } else {
            console.error("❌ Fehler beim Übertragen der Wiedergabe:", response.status);
        }
    }).catch(err => console.error("❌ Netzwerkfehler beim Übertragen der Wiedergabe:", err));
}


// 4️⃣ **Zufälligen Song aus der Playlist abrufen**
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
        return null;
    }
}


// 5️⃣ **Song für eine Sekunde abspielen**
async function playOneSecond() {
    if (!deviceId) {
        console.error("❌ Fehler: Player noch nicht bereit! Bitte warte, bis der Player initialisiert ist.");
        return;
    }

    console.log("🎵 playOneSecond() wird aufgerufen.");

    const track = await getRandomSong();
    if (!track) {
        console.error("❌ Kein Song gefunden, Wiedergabe gestoppt.");
        return;
    }

    console.log(`🎵 Versuche, ${track.name} zu spielen...`);

    fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: "PUT",
        headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ uris: [track.uri], position_ms: 0 })
    }).then(() => {
        console.log("✅ Song gestartet!");
        setTimeout(() => {
            fetch("https://api.spotify.com/v1/me/player/pause", {
                method: "PUT",
                headers: { "Authorization": `Bearer ${accessToken}` }
            }).then(() => console.log("⏸ Song pausiert!"));
        }, 1000);
    }).catch(err => console.error("❌ Fehler beim Starten der Wiedergabe:", err));
}




// Event-Listener für den Button
document.getElementById("playButton").addEventListener("click", () => {
    if (!deviceId) {
        console.log("⏳ Warten auf Player-Initialisierung...");
        return;
    }
    console.log("🎵 Button geklickt!");
    playOneSecond();
});


// 6️⃣ **Beim Laden der Seite Token abrufen**
getAccessToken();
