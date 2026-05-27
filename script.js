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

    // NOTE: Make sure to add your GitHub username and repo name in the URL below if not done!
    let a = await fetch(`https://api.github.com/princesingh47852/spotify/contents/songs/${folder}`);
    let response = await a.json(); 
    
    songs = []; 
    for (let index = 0; index < response.length; index++) {
        const element = response[index];
        if (element.name.endsWith(".mp3")) {
            songs.push(element.name); 
        }
    }

    // Displaying songs in library
    let songul = document.querySelector(".songlist").getElementsByTagName("ul")[0];
    songul.innerHTML = ""; 
    
    for (const song of songs) {
        songul.innerHTML = songul.innerHTML + `<li data-track="${song}"> <img class="invert" src="assets/music.svg">
                        <div class="info">
                            <div>${song.replaceAll("%20", " ").replace(".mp3", "")}</div>
                            <div>${currfolder.replaceAll("%20", " ")}</div>
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

    Array.from(document.querySelector(".songlist").getElementsByTagName("li")).forEach(e => {
        e.addEventListener("click", () => {
            playmusic(e.getAttribute("data-track"));
        });
    });
}

const playmusic = (track) => {
    currentsong.src = `./songs/${currfolder}/` + track;
    currentsong.play().catch(err => console.log("Playback failed/interrupted:", err));
    
    document.querySelector("#play").src = "assets/pause.svg";
    document.querySelector(".songinfo").innerHTML = track.replaceAll("%20", " ").replace(".mp3", "");
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
}

async function displayFolders() {
    let a = await fetch(`https://api.github.com/princesingh47852/spotify/contents/songs`);
    let response = await a.json();
    let cardContainer = document.querySelector(".cardContainer");
    
    cardContainer.innerHTML = ""; 
    
    for (let index = 0; index < response.length; index++) {
        const e = response[index];
        
        if (e.type === "dir") { 
            let folder = e.name;
            
            cardContainer.innerHTML = cardContainer.innerHTML + `
                <div data-folder="${folder}" class="card">
                    <div class="play">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="25" height="25"
                            class="play-btn">
                            <circle cx="24" cy="24" r="24" fill="#1ED760" />
                            <path d="M19 15.5v17c0 .9.9 1.4 1.7.9l13-8.5c.7-.5.7-1.4 0-1.9l-13-8.5c-.8-.5-1.7 0-1.7.9z"
                                fill="#000000" />
                        </svg>
                    </div>
                    <img src="./songs/${folder}/cover.jpg" alt="cover">
                    <h4>${folder}</h4>
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

async function main() {
    await displayFolders();
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
            document.querySelector(".songtime").innerHTML = `${formatSeconds(currentsong.currentTime)} / ${formatSeconds(currentsong.duration)}`;
            document.querySelector(".circle").style.left = (currentsong.currentTime / currentsong.duration) * 100 + "%";
        }
    });

    // FIXED: Using getBoundingClientRect to ensure accurate seekbar clicking even if clicking the inner progress bar
    document.querySelector(".seekbar").addEventListener("click", e => {
        let rect = e.currentTarget.getBoundingClientRect();
        let offsetX = e.clientX - rect.left; 
        let percent = (offsetX / rect.width) * 100;
        
        if (percent < 0) percent = 0;
        if (percent > 100) percent = 100;

        document.querySelector(".circle").style.left = percent + "%";
        currentsong.currentTime = (currentsong.duration * percent) / 100;
    });

    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });
    
    document.querySelector(".cross").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-100%";
    });

    // FIXED: Decodes the URL correctly so it matches strings perfectly inside the songs array
    document.querySelector("#previous").addEventListener("click", () => {
    let currentFilename = decodeURIComponent(currentsong.src.split("/").slice(-1)[0]);
    let index = songs.findIndex(song => decodeURIComponent(song) === currentFilename);
    
    if (index > 0) {
        playmusic(songs[index - 1]);
    }
});

document.querySelector("#next").addEventListener("click", () => {
    let currentFilename = decodeURIComponent(currentsong.src.split("/").slice(-1)[0]);
    let index = songs.findIndex(song => decodeURIComponent(song) === currentFilename);
    
    if (index !== -1 && (index + 1) < songs.length) {
        playmusic(songs[index + 1]);
    }
});
    
}

main();
