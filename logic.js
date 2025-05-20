console.log("lets write some js ");

let currentlyPlaying = null;
let isrepeat = false;// Track the currently playing audio
let isshuffle = false;

function formatTime(seconds) {
    if (isNaN(seconds)) return "00:00";

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`;
}


// using api for supabase
//import {createclient} 
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://dmjdukvrbtntqrrpgvbg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtamR1a3ZyYnRudHFycnBndmJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMDgzOTEsImV4cCI6MjA2Mjc4NDM5MX0.pIxxUyhhGY81zl0vB5rqIQcrp98bfUt2P6OJmzkSmSY';
const supabase = createClient(supabaseUrl, supabaseKey);

// Make supabase available globally for debugging
window.supabase = supabase; // Optional for debugging

console.log(`Supabase URL: ${supabaseUrl}`);


// fecthing songs from supabase 
async function getSongsForPlaylist(playlistFolder) {
    try {
        const { data, error } = await supabase
            .storage
            .from('spotify-songs')
            .list(playlistFolder, { sortBy: { column: 'name', order: 'asc' } });

        if (error || !data || data.length === 0) {
            console.error('Error fetching songs or no songs found:', error);
            return [];
        }

        return data
            .filter(item => !item.id.endsWith('/') && !item.name.startsWith('.'))
            .map(file => {
                const [_, songName = 'Unknown Song', artistPart = 'Unknown Artist'] = file.name.split('-');
                const artistName = artistPart.split('.')[0]?.trim();
                const url = `${supabaseUrl}/storage/v1/object/public/spotify-songs/${playlistFolder}/${encodeURIComponent(file.name)}`;
                return { name: songName.trim(), artist: artistName, url };
            });
    } catch (error) {
        console.error('Unexpected error fetching songs:', error);
        return [];
    }
}



// Function to directly debug specific folder contents
async function debugFolderContents(folderName) {
    try {
        console.log(`DEBUG: Checking contents of folder: ${folderName}`);
        
        const { data, error } = await supabase
            .storage
            .from('spotify-songs')
            .list(folderName);
            
        if (error) {
            console.error(`DEBUG: Error listing folder ${folderName}:`, error);
            return;
        }
        
        console.log(`DEBUG: Raw contents of folder ${folderName}:`, data);
        
        // Check public accessibility of files
        if (data && data.length > 0) {
            const firstFile = data[0];
            if (firstFile && !firstFile.id.endsWith('/')) {
                const publicUrl = `${supabaseUrl}/storage/v1/object/public/spotify-songs/${folderName}/${encodeURIComponent(firstFile.name)}`;
                console.log(`DEBUG: Sample public URL for testing: ${publicUrl}`);
                
                // Test if the URL is accessible
                const testAudio = new Audio();
                testAudio.src = publicUrl;
                testAudio.onloadedmetadata = () => {
                    console.log('DEBUG: Audio URL is valid and can be loaded');
                };
                testAudio.onerror = (e) => {
                    console.error('DEBUG: Audio URL cannot be loaded:', e);
                };
            }
        }
    } catch (e) {
        console.error('DEBUG: Unexpected error in debug function:', e);
    }
}




































// ----------------->fteching songs for local host<--------------------

// async function getSongsForPlaylist(playlistFolder) {
//     let a = await fetch(`/songs/${playlistFolder}`);
//     let response = await a.text();
//     console.log("Fetching from:", playlistFolder);
//     // console.log(response);

//     let div = document.createElement("div");
//     div.innerHTML = response;

//     let links = div.querySelectorAll('a[href$=".mp3"]');
//     console.log(links);
//     let songs = Array.from(links).map(link => {
//         let fullName = link.textContent.trim();
//         let parts = fullName.split('-');
//         let songName = parts[1] ? parts[1].trim() : 'Unknown Song';
//         let artistName = parts[2] ? parts[2].trim() : 'Unknown Artist';

//         artistName = artistName.split('.')[0].trim();

//         return {
//             name: songName,
//             artist: artistName,
//             url: link.href
//         };
//     });

//     return songs;
// }




















// without using api 
function displaySongs(songs, container) {
    container.innerHTML = '';

    const songsList = document.createElement('div');
    songsList.className = 'songs-list';

    songs.forEach((song, index) => {
        const songElement = document.createElement('div');
        songElement.className = 'song-item';
        songElement.innerHTML = `
            <div class="song-number">${index + 1}</div>
            <div class="song-info">
                <div class="song-name">${song.name}</div>
                <div class="song-artist">${song.artist}</div>
            </div>
        `;



        // Add click handler to the entire song element
        songElement.addEventListener('click', () => {
            // If there's a song currently playing, stop it
            if (currentlyPlaying) {
                currentlyPlaying.pause();
                currentlyPlaying.currentTime = 0;
            }

            // Play the new song

            const audio = new Audio(song.url);
            audio.play();
            currentlyPlaying = audio;
            play.src = "images/pause (1).png";
            document.querySelector(".songinfoplaybar").innerHTML = song.name;
            document.querySelector(".songartistplaybar").innerHTML = song.artist;


            // time update 

            currentlyPlaying.addEventListener("timeupdate", () => {
                console.log(currentlyPlaying.currentTime, currentlyPlaying.duration);
                document.querySelector(".seekbar .songtime").innerHTML = `${formatTime(currentlyPlaying.duration)}`;
                document.querySelector(".seekbar .songtimer").innerHTML = `${formatTime(currentlyPlaying.currentTime)}`;
                const progress = (currentlyPlaying.currentTime / currentlyPlaying.duration) * 100;
                const leftPosition = -50 + progress; // progress goes from 0 to 100
                document.querySelector(".circle2").style.left = leftPosition + "%";
                document.querySelector(".seekbar").style.setProperty('--seek-progress', `${progress}%`);
            })

            // add a event listener to handle seekbar
            document.querySelector(".seekbar").addEventListener("click", e => {
                let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
                document.querySelector(".circle2").style.left = (percent - 50) + "%";
                document.querySelector(".seekbar").style.setProperty('--seek-progress', `${percent}%`);
                currentlyPlaying.currentTime = ((currentlyPlaying.duration) * percent) / 100;
            })





            // add js for previous and next 


            document.querySelector("#previous").addEventListener("click", e => {
                const currentSongUrl = new URL(currentlyPlaying.src).pathname; // Normalize URL
                const index = songs.findIndex(song => new URL(song.url).pathname === currentSongUrl);

                console.log("Current Song Index:", index);
                console.log("Songs Array:", songs);
                
                const playButton = document.querySelector("#play");
                if (playButton.src.includes("play")) {
                    playButton.src = "images/pause (1).png"; // Change to play image
                }

                if (isrepeat) {
                    currentlyPlaying.currentTime = 0;
                    currentlyPlaying.play();
                    return;
                }

                

                let previousIndex;
                if (index === -1 || index <= 0) {
                    // If the current song is the first one or not found, loop back to the last song
                    previousIndex = songs.length - 1;
                } else {
                    // Otherwise, move to the previous song
                    previousIndex = index - 1;
                }

                const previousSong = songs[previousIndex];

                // Stop the current song
                if (currentlyPlaying) {
                    currentlyPlaying.pause();
                    currentlyPlaying.currentTime = 0;
                }

                // Play the previous song
                const audio = new Audio(previousSong.url);
                audio.play();
                currentlyPlaying = audio;

                // Update the UI
                document.querySelector(".songinfoplaybar").innerHTML = previousSong.name;
                document.querySelector(".songartistplaybar").innerHTML = previousSong.artist;
                currentlyPlaying.addEventListener("timeupdate", () => {
                    console.log(currentlyPlaying.currentTime, currentlyPlaying.duration);
                    document.querySelector(".seekbar .songtime").innerHTML = `${formatTime(currentlyPlaying.duration)}`;
                    document.querySelector(".seekbar .songtimer").innerHTML = `${formatTime(currentlyPlaying.currentTime)}`;
                    const progress = (currentlyPlaying.currentTime / currentlyPlaying.duration) * 100;
                    const leftPosition = -50 + progress; // progress goes from 0 to 100
                    document.querySelector(".circle2").style.left = leftPosition + "%";
                    document.querySelector(".seekbar").style.setProperty('--seek-progress', `${progress}%`);
                })


                // Highlight the previous song in the UI
                const songElements = document.querySelectorAll('.song-item');
                songElements.forEach(item => item.classList.remove('playing'));
                if (songElements[previousIndex]) {
                    songElements[previousIndex].classList.add('playing');
                }

                // Auto-play the previous song when the current one ends
                // currentlyPlaying.onended = () => {
                //     document.querySelector("#next").click();
                // };
            });
            document.querySelector("#next").addEventListener("click", e => {
                const currentSongUrl = new URL(currentlyPlaying.src).pathname; // Normalize URL
                const index = songs.findIndex(song => new URL(song.url).pathname === currentSongUrl);

                console.log("Current Song Index:", index);
                console.log("Songs Array:", songs);

                // Check and update play/pause button
                const playButton = document.querySelector("#play");
                if (playButton.src.includes("play")) {
                    playButton.src = "images/pause (1).png"; // Change to play image
                }

                if (isshuffle) {
                    let randomindex = Math.floor(Math.random() * songs.length);
                    const randomsong = songs[randomindex];

                    // Stop the current song
                    currentlyPlaying.pause();
                    currentlyPlaying.currentTime = 0;

                    // Play the random song
                    const audio = new Audio(randomsong.url);
                    audio.play();
                    currentlyPlaying = audio;

                    // Update the UI
                    document.querySelector(".songinfoplaybar").innerHTML = randomsong.name;
                    document.querySelector(".songartistplaybar").innerHTML = randomsong.artist;

                    const songElements = document.querySelectorAll('.song-item');
                    songElements.forEach(item => item.classList.remove('playing'));
                    if (songElements[randomindex]) {
                        songElements[randomindex].classList.add('playing');
                    }

                    currentlyPlaying.addEventListener("timeupdate", () => {
                        console.log(currentlyPlaying.currentTime, currentlyPlaying.duration);
                        document.querySelector(".seekbar .songtime").innerHTML = `${formatTime(currentlyPlaying.duration)}`;
                        document.querySelector(".seekbar .songtimer").innerHTML = `${formatTime(currentlyPlaying.currentTime)}`;
                        const progress = (currentlyPlaying.currentTime / currentlyPlaying.duration) * 100;
                        const leftPosition = -50 + progress; // progress goes from 0 to 100
                        document.querySelector(".circle2").style.left = leftPosition + "%";
                        document.querySelector(".seekbar").style.setProperty('--seek-progress', `${progress}%`);
                    });

                    return; // Exit after shuffle logic
                }

                if (isrepeat) {
                    currentlyPlaying.currentTime = 0;
                    currentlyPlaying.play();
                    return;
                }

                let nextIndex;
                if (index === -1 || index >= songs.length - 1) {
                    // If the current song is the last one or not found, loop back to the first song
                    nextIndex = 0;
                } else {
                    // Otherwise, move to the next song
                    nextIndex = index + 1;
                }

                const nextSong = songs[nextIndex];

                // Stop the current song
                if (currentlyPlaying) {
                    currentlyPlaying.pause();
                    currentlyPlaying.currentTime = 0;
                }

                // Play the next song
                const audio = new Audio(nextSong.url);
                audio.play();
                currentlyPlaying = audio;

                // Update the UI
                document.querySelector(".songinfoplaybar").innerHTML = nextSong.name;
                document.querySelector(".songartistplaybar").innerHTML = nextSong.artist;

                currentlyPlaying.addEventListener("timeupdate", () => {
                    console.log(currentlyPlaying.currentTime, currentlyPlaying.duration);
                    document.querySelector(".seekbar .songtime").innerHTML = `${formatTime(currentlyPlaying.duration)}`;
                    document.querySelector(".seekbar .songtimer").innerHTML = `${formatTime(currentlyPlaying.currentTime)}`;
                    const progress = (currentlyPlaying.currentTime / currentlyPlaying.duration) * 100;
                    const leftPosition = -50 + progress; // progress goes from 0 to 100
                    document.querySelector(".circle2").style.left = leftPosition + "%";
                    document.querySelector(".seekbar").style.setProperty('--seek-progress', `${progress}%`);
                });

                // Highlight the next song in the UI
                const songElements = document.querySelectorAll('.song-item');
                songElements.forEach(item => item.classList.remove('playing'));
                if (songElements[nextIndex]) {
                    songElements[nextIndex].classList.add('playing');
                }

                // Auto-play the next song when the current one ends
                currentlyPlaying.onended = () => {
                    if (isrepeat) {
                        currentlyPlaying.currentTime = 0; // Restart the song
                        currentlyPlaying.play(); // Play the song again
                    }
                    if (isshuffle) {

                        let randomindex = Math.floor(Math.random() * songs.length);
                        const randomsong = songs[randomindex];
                        // stop the current song 
                        currentlyPlaying.pause();
                        currentlyPlaying.currentTime = 0;

                        // play the random song 

                        const audio = new Audio(randomsong.url);
                        audio.play();
                        currentlyPlaying = audio;

                        // update the ui 
                        document.querySelector(".songinfoplaybar").innerHTML = randomsong.name;
                        document.querySelector(".songartistplaybar").innerHTML = randomsong.artist;

                        const songElements = document.querySelectorAll('.song-item');
                        songElements.forEach(item => item.classList.remove('playing'));
                        if (songElements[randomindex]) {
                            songElements[randomindex].classList.add('playing');
                        }

                        currentlyPlaying.addEventListener("timeupdate", () => {
                            console.log(currentlyPlaying.currentTime, currentlyPlaying.duration);
                            document.querySelector(".seekbar .songtime").innerHTML = `${formatTime(currentlyPlaying.duration)}`;
                            document.querySelector(".seekbar .songtimer").innerHTML = `${formatTime(currentlyPlaying.currentTime)}`;
                            const progress = (currentlyPlaying.currentTime / currentlyPlaying.duration) * 100;
                            const leftPosition = -50 + progress; // progress goes from 0 to 100
                            document.querySelector(".circle2").style.left = leftPosition + "%";
                            document.querySelector(".seekbar").style.setProperty('--seek-progress', `${progress}%`);
                        })

                    } else {
                        document.querySelector("#next").click(); // Move to the next song
                    }
                };
            });


            // Update visual state
            document.querySelectorAll('.song-item').forEach(item => {
                item.classList.remove('playing');
            });
            songElement.classList.add('playing');

            // // When song ends
            // setupOnEndedHandler(audio);

            // only one oneended event handler is enough in next because two handlerr will create problem so we add only one in next 
            currentlyPlaying.onended = () => {
                if (isrepeat) {
                    currentlyPlaying.currentTime = 0; // Restart the song
                    currentlyPlaying.play(); // Play the song again
                }
                if (isshuffle) {
                    let randomindex = Math.floor(Math.random() * songs.length);
                    const randomsong = songs[randomindex];
                    // stop the current song 
                    currentlyPlaying.pause();
                    currentlyPlaying.currentTime = 0;

                    // play the random song 

                    const audio = new audio(randomsong.url);
                    audio.play();
                    currentlyPlaying = audio;

                    // update the ui 
                    document.querySelector(".songinfoplaybar").innerHTML = randomsong.name;
                    document.querySelector(".songartistplaybar").innerHTML = randomsong.artist;

                    currentlyPlaying.addEventListener("timeupdate", () => {
                        console.log(currentlyPlaying.currentTime, currentlyPlaying.duration);
                        document.querySelector(".seekbar .songtime").innerHTML = `${formatTime(currentlyPlaying.duration)}`;
                        document.querySelector(".seekbar .songtimer").innerHTML = `${formatTime(currentlyPlaying.currentTime)}`;
                        const progress = (currentlyPlaying.currentTime / currentlyPlaying.duration) * 100;
                        const leftPosition = -50 + progress; // progress goes from 0 to 100
                        document.querySelector(".circle2").style.left = leftPosition + "%";
                        document.querySelector(".seekbar").style.setProperty('--seek-progress', `${progress}%`);
                    })

                }
                else {
                    document.querySelector("#next").click(); // Move to the next song
                }
            };

            if (currentlyPlaying) {
                currentlyPlaying.addEventListener("ended", () => {
                    if (isrepeat) {
                        currentlyPlaying.currentTime = 0; // Restart the song
                        currentlyPlaying.play(); // Play the song again
                    }
                });
            }
        });

        songsList.appendChild(songElement);
    });

    container.appendChild(songsList);
}


// function setupOnEndedHandler(audio) {
//     audio.onended = () => {
//         // Update UI state
//         const currentSongElement = document.querySelector('.song-item.playing');
//         if (currentSongElement) {
//             currentSongElement.classList.remove('playing');
//         }

//         // Play the next song
//         document.querySelector("#next").click();
//     };
// }


function attachPlaylistCardListeners() {
    const playlistcard = document.querySelectorAll(".tappable-card");
    const rightside = document.querySelector(".right-box");

    playlistcard.forEach(card => {
        card.addEventListener("click", async () => {
            const playlistFolder = card.getAttribute("data-folder");

            if (!playlistFolder) {
                rightside.innerHTML = '<div class="error">This playlist is not available</div>';
                return;
            }

            try {
                rightside.innerHTML = '<div class="loading">Loading songs...</div>';
                const songs = await getSongsForPlaylist(playlistFolder);
                displaySongs(songs, rightside);
            } catch (error) {
                console.error("Error loading playlist:", error);
                rightside.innerHTML = '<div class="error">Error loading songs</div>';
            }
        });
    });
}

document.addEventListener("DOMContentLoaded", () => {
    // Save default content
    const defaultContent = document.querySelector('.right-box').innerHTML;

    // Attach event listeners to playlist cards
    attachPlaylistCardListeners();

    // Home button event listener
    document.querySelector(".home").addEventListener("click", () => {
        const rightside = document.querySelector(".right-box");
        rightside.innerHTML = defaultContent;

        // Re-attach event listeners after updating the content
        attachPlaylistCardListeners();
    });


});

// add repeat the song 
// Add event listener to repeat button
const repeatIcon = document.querySelector('#repeat');
if (repeatIcon) {
    repeatIcon.addEventListener('click', () => {
        console.log("Repeat button clicked");
        isrepeat = !isrepeat;
        if(isshuffle){
            isshuffle = false;
            document.querySelector('#shuffle').src = "images/shuffle.svg";
        }
        if (isrepeat) {
            repeatIcon.src = "images/repeatgreen.svg";
        } else {
            repeatIcon.src = "images/repeat.svg";
        }
        console.log("Repeat button clicked, isrepeat:", isrepeat);
    });
}

else {
    console.error("#repeat element not found in the DOM.");
}

// add shuffle the song 
const shuffleicon = document.querySelector('#shuffle');
document.querySelector("#shuffle").addEventListener("click", () => {
    isshuffle = !isshuffle;
    if(isrepeat){
        isrepeat = false;
        document.querySelector('#repeat').src = "images/repeat.svg";
    }
    if (isshuffle) {
        shuffleicon.src = "images/shufflegreen.svg";
    }
    else {
        shuffleicon.src = "images/shuffle.svg";
    }
})



play.addEventListener("click", () => {
    if (currentlyPlaying.paused) {
        currentlyPlaying.play();
        play.src = "images/pause (1).png";
    }
    else {
        currentlyPlaying.pause();
        play.src = "images/play-solid.svg"
    }
})


let isopen = false;
document.querySelector(".hamburger").addEventListener("click", () => {
    const leftbox = document.querySelector(".left-box");

    if (!isopen) {
        leftbox.style.left = "8px";
    }
    else {
        leftbox.style.left = "-300px";
    }

    document.querySelector(".right-box").addEventListener("click" , () =>{
        if(isopen){
            leftbox.style.left = "-300px";
        }
    })

    isopen = !isopen;

})


// add event listner to volume slider

document.querySelector(".range").getElementsByTagName("input")[0].addEventListener("change", e => {
    console.log(e.target.value);
    currentlyPlaying.volume = e.target.value / 100;
})
// Add volume slider functionality
const volumeSlider = document.querySelector('.volume input');
volumeSlider.addEventListener('input', (e) => {
    const value = e.target.value;
    e.target.style.setProperty('--range-progress', `${value}%`);

    // Set the volume of the currently playing audio
    if (currentlyPlaying) {
        currentlyPlaying.volume = value / 100;
    }
});

// Initialize volume slider
volumeSlider.style.setProperty('--range-progress', '100%');
volumeSlider.value = 100; // Set initial value to 100%
currentlyPlaying.volume = 1; // Set the audio volume to maximum









