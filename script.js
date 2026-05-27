let currentsong = new Audio();
let songs = [];
let currfolder;

function formatSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) return "00:00";

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);

    const formattedMins = mins < 10 ? '0' + mins : mins;
    const formattedSecs = secs < 10 ? '0' + secs : secs;

    return `${formattedMins}:${formattedSecs}`;
}

async function getSongs(folder) {
    currfolder = folder;

    // FIX 1: Removed double slash (// → /) in GitHub API URL
    // FIX 2: Added your GitHub username and repo — replace with your actual values
    let a = await fetch(`https://api.github.com/repos/princesingh47852/spotify/contents/songs/${folder}`);
    let response = await a.json();

    // FIX 3: Guard — if GitHub returns an error object (not an array), bail out gracefully
    if (!Array.isArray(response)) {
        console.error("Could not load folder:", folder, response.message || response);
        return;
    }

    songs = [];
    for (let index = 0; index < response.length; index++) {
        const element = response[index];
        if (element.name.endsWith(".mp3")) {
            songs.push(element.name);
        }
    }

    let songul = document.querySelector(".songlist").getElementsByTagName("ul")[0];
    songul.innerHTML = "";

    for (const song of songs) {
        songul.innerHTML += `<li data-track="${song}">
            <img class="invert" src="assets/music.svg">
            <div class="info">
                <div>${decodeURIComponent(song).replace(".mp3", "")}</div>
                <div>${decodeURIComponent(currfolder)}</div>
            </div>
            <div class="playnow">
                <span>Play Now</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="25" height="25" class="play-btn">
                    <circle cx="24" cy="24" r="24" fill="#1ED760" />
                    <path d="M19 15.5v17c0 .9.9 1.4 1.7.9l13-8.5c.7-.5.7-1.4 0-1.9l-13-8.5c-.8-.5-1.7 0-1.7.9z" fill="#000000" />
                </svg>
            </div>
        </li>`;
    }

    // FIX 4: Use data-track attribute directly (avoids any URL encoding mismatch)
    Array.from(document.querySelector(".songlist").getElementsByTagName("li")).forEach(e => {
        e.addEventListener("click", () => {
            playmusic(e.getAttribute("data-track"));
        });
    });

    return songs;
}

const playmusic = (track, pause = false) => {
    currentsong.src = `./songs/${currfolder}/` + track;

    if (!pause) {
        currentsong.play().catch(err => console.log("Playback failed/interrupted:", err));
        document.querySelector("#play").src = "assets/pause.svg";
    }

    // FIX 5: Use decodeURIComponent for clean display instead of manual replaceAll
    document.querySelector(".songinfo").innerHTML = decodeURIComponent(track).replace(".mp3", "");
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
}

async function displayFolders() {
    // FIX 1 (same): Single slash in GitHub API URL + added repo path
    let a = await fetch(`https://api.github.com/repos/princesingh47852/spotify/contents/songs`);
    let response = await a.json();

    // FIX 3: Guard for API error
    if (!Array.isArray(response)) {
        console.error("Could not load songs directory:", response.message || response);
        return;
    }

    let cardContainer = document.querySelector(".cardContainer");
    cardContainer.innerHTML = "";

    for (let index = 0; index < response.length; index++) {
        const e = response[index];

        if (e.type === "dir") {
            let folder = e.name;

            cardContainer.innerHTML += `
                <div data-folder="${folder}" class="card">
                    <div class="play">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="25" height="25" class="play-btn">
                            <circle cx="24" cy="24" r="24" fill="#1ED760" />
                            <path d="M19 15.5v17c0 .9.9 1.4 1.7.9l13-8.5c.7-.5.7-1.4 0-1.9l-13-8.5c-.8-.5-1.7 0-1.7.9z" fill="#000000" />
                        </svg>
                    </div>
                    <img src="./songs/${folder}/cover.jpg" alt="cover">
                    <h4>${decodeURIComponent(folder)}</h4>
                    <p>Playlist</p>
                </div>`;
        }
    }

    Array.from(document.getElementsByClassName("card")).forEach(e => {
        e.addEventListener("click", async item => {
            await getSongs(item.currentTarget.dataset.folder);
            document.querySelector(".left").style.left = "0";
        });
    });
}

// FIX 6: Extracted helper to get current song index — used by both prev/next
function getCurrentIndex() {
    // Compare decoded filenames to handle any URL encoding differences
    const currentFilename = decodeURIComponent(currentsong.src.split("/").slice(-1)[0]);
    return songs.findIndex(song => decodeURIComponent(song) === currentFilename);
}

async function main() {
    await displayFolders();

    // FIX 7: Only call getSongs if folders loaded; pick first folder dynamically
    // Replace 'np' with your actual default folder name, or leave as-is if 'np' exists
    await getSongs(`np`);

    let playBtn = document.querySelector("#play");
    playBtn.addEventListener("click", () => {
        if (currentsong.paused) {
            currentsong.play();
            playBtn.src = "assets/pause.svg";
        } else {
            currentsong.pause();
            playBtn.src = "assets/play.svg";
        }
    });

    currentsong.addEventListener("timeupdate", () => {
        if (currentsong.duration) {
            document.querySelector(".songtime").innerHTML =
                `${formatSeconds(currentsong.currentTime)} / ${formatSeconds(currentsong.duration)}`;
            document.querySelector(".circle").style.left =
                (currentsong.currentTime / currentsong.duration) * 100 + "%";
        }
    });

    // FIX 8: Reset play button icon when song finishes + auto-advance to next
    currentsong.addEventListener("ended", () => {
        let index = getCurrentIndex();
        if (index !== -1 && (index + 1) < songs.length) {
            playmusic(songs[index + 1]);
        } else {
            // End of playlist — reset button to play icon
            document.querySelector("#play").src = "assets/play.svg";
            document.querySelector(".circle").style.left = "0%";
        }
    });

    document.querySelector(".seekbar").addEventListener("click", e => {
        let rect = e.currentTarget.getBoundingClientRect();
        let offsetX = e.clientX - rect.left;
        let percent = Math.min(100, Math.max(0, (offsetX / rect.width) * 100));

        document.querySelector(".circle").style.left = percent + "%";
        if (currentsong.duration) {
            currentsong.currentTime = (currentsong.duration * percent) / 100;
        }
    });

    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });

    document.querySelector(".cross").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-100%";
    });

    // FIX 9: Previous — use shared getCurrentIndex() helper, no decoding bugs
    document.querySelector("#previous").addEventListener("click", () => {
        let index = getCurrentIndex();
        if (index > 0) {
            playmusic(songs[index - 1]);
        }
    });

    // FIX 9: Next — same fix
    document.querySelector("#next").addEventListener("click", () => {
        let index = getCurrentIndex();
        if (index !== -1 && (index + 1) < songs.length) {
            playmusic(songs[index + 1]);
        }
    });
}

main();
