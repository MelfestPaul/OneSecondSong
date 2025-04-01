const clientId = "4c0f7f2072cd4c4291ea5e75a4b90e99";
const redirectUri = "https://MelfestPaul.github.io/OneSecondSong/";
const playlistId = "57CDRmfgoMRMnoMDSiiEqO";
let accessToken, deviceId, player, currentTrack;

// Token abrufen
function getAccessToken() {
    const hash = window.location.hash.substring(1).split("&").reduce((acc, item) => {
        let parts = item.split("=");
        acc[parts[0]] = decodeURIComponent(parts[1]);
        return acc;
    }, {});
    accessToken = hash.access_token;
    if (!accessToken) {
        window.location.href = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user-read-playback-state user-modify-playback-state`;
    }
}

window.onSpotifyWebPlaybackSDKReady = () => {
    player = new Spotify.Player({
        name: "One Second Player",
        getOAuthToken: cb => { cb(accessToken); }
    });
    player.addListener("ready", ({ device_id }) => { deviceId = device_id; });
    player.connect();
};

document.getElementById("playButton").addEventListener("click", playNewTrack);
document.getElementById("replayButton").addEventListener("click", replayTrack);
document.getElementById("revealButton").addEventListener("click", revealTrack);
document.getElementById("durationSlider").addEventListener("input", updateDurationLabel);

async function getRandomSong() {
    const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
        headers: { "Authorization": `Bearer ${accessToken}` }
    });
    const data = await response.json();
    const tracks = data.items.map(item => item.track);
    return tracks[Math.floor(Math.random() * tracks.length)];
}

function playTrack(track, duration) {
    fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${accessToken}` },
        body: JSON.stringify({ uris: [track.uri], position_ms: 0 })
    }).then(() => {
        setTimeout(() => {
            fetch("https://api.spotify.com/v1/me/player/pause", {
                method: "PUT",
                headers: { "Authorization": `Bearer ${accessToken}` }
            });
        }, duration * 1000);
    });
}

async function playNewTrack() {
    document.getElementById("songInfo").style.display = "none";
    document.getElementById("revealButton").disabled = false;
    document.getElementById("replayButton").disabled = false;
    const duration = parseFloat(document.getElementById("durationSlider").value);
    currentTrack = await getRandomSong();
    playTrack(currentTrack, duration);
}

function replayTrack() {
    if (currentTrack) {
        const duration = parseFloat(document.getElementById("durationSlider").value);
        playTrack(currentTrack, duration);
    }
}

function revealTrack() {
    if (currentTrack) {
        document.getElementById("songInfo").innerText = `Jetzt spielte: ${currentTrack.name} von ${currentTrack.artists.map(a => a.name).join(", ")}`;
        document.getElementById("songInfo").style.display = "block";
    }
}

function updateDurationLabel() {
    document.getElementById("durationValue").innerText = document.getElementById("durationSlider").value;
}

getAccessToken();