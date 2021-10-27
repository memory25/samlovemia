function onNavigation(a) {
    a.progress === 2
}

Flowtime.showProgress(true);
Flowtime.addEventListener("flowtimenavigation", onNavigation);
Flowtime.start();


function startMusic(e){
    console.log(e)
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
let musicToggle = true;
audio.addEventListener('ended', (a)=>{
	console.log('test')
	audio.src = musicToggle ? './neverLearn.mp3' : './remember.mp3';
	musicToggle = !musicToggle;
})