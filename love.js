function onNavigation(a) {
    a.progress === 2
}

Flowtime.showProgress(true);
Flowtime.addEventListener("flowtimenavigation", onNavigation);
Flowtime.start();


function startMusic(e){
    if(e.keyCode === 40){
        document.querySelector('audio').play()
        $(window).unbind('keydown', startMusic)
    }
}

$(function() {
    $(".nojavascript").remove();

    $(window).on('keydown', startMusic)
});


const audio = document.querySelector('audio');
audio.volume = 0.7;
let musicToggle = true;
audio.addEventListener('ended', ()=>{
	audio.src = musicToggle ? 'https://cdn.jsdelivr.net/gh/memory25/samlovemia@gh-pages/neverLearn.mp3' : 'https://cdn.jsdelivr.net/gh/memory25/samlovemia@gh-pages/remember.mp3';
	musicToggle = !musicToggle;
})