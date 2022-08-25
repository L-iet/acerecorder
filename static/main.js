$(document).ready(function(){
    ace.config.set('basePath', './static/ace-builds/src-min-noconflict');

    var editor = ace.edit("editor-main");

    editor.$blockScrolling = Infinity;
    editor.setTheme("ace/theme/monokai");
    editor.getSession().setMode("ace/mode/python");
    editor.setOptions({
        enableBasicAutocompletion: true,
        enableSnippets: true,
        enableLiveAutocompletion: false
    });

    var slider = document.getElementById('myRange');
    var curTimestamp = 0;
    var moveSlider = false;
    var playbackEvents = [];
    slider.oninput = function() {
        curTimestamp = parseInt(this.value);
        pause();
        moveSlider = false;
        setStartTimeandIndex();
    }

    var isPlaying = true;
    var startTime = 0;
    var startind = 0;
    const playBtn = document.getElementById('play-btn');
    playBtn.style.backgroundImage = "url('/static/images/pause.png')"

    // fetch("https://storage.googleapis.com/litstorage/1661348085983.tvf",{method:"no-cors"}).then(response => response.json().then(function(data){keystrokes=data.code;}));

    //define functions
    function togglePlayPause (e) {
        if ( (event.type === 'click') ) { // || (event.type === 'keypress' && event.key === ' ' && !isRecording)
            isPlaying = !isPlaying;
            playBtn.style.backgroundImage = isPlaying ? "url('/static/images/pause.png')" : "url('/static/images/play.png')";
            if (isPlaying) {
                play();
            }
            else {
                curTimestamp = parseInt(slider.value);
                pause();
                moveSlider = false;
                setStartTimeandIndex();
            }
        }
    }
    playBtn.addEventListener('click', togglePlayPause);

    function pause() {

        moveSlider = false;

        editor.setReadOnly(false);
        if (playbackEvents[0]) {
            for (i = 0; i < playbackEvents.length; i++) {
                clearTimeout(playbackEvents[i]);
            }

        }
    }

    function getIndexofFirstEventAfterTimestamp(tstamp, arr) {
        let start=0, end=arr.length-1;
         
        // Iterate while start not meets end
        while (start<=end){
     
            // Find the mid index
            let mid=Math.floor((start + end)/2);

            let ts = arr[mid].timestamp;
      
            // If element is present at mid, return True
            if (ts===tstamp) return mid;
     
            // Else look in left or right half accordingly
            else if (ts < tstamp)
                 start = mid + 1;
            else
                 end = mid - 1;
        }
  
        return start;
    }

    function setStartTimeandIndex() {
        startTime = curTimestamp;
        startind = getIndexofFirstEventAfterTimestamp(curTimestamp + keystrokes[0].timeoffset, keystrokes); //add timeoffset to sync when paused
        editor.setValue(keystrokes[(startind===0?0:startind-1)].data.alltext);
        editor.clearSelection();
    }

    function play() {
        moveSlider = true;
        console.log(slider.max);
        if (startind === 0 && startTime === 0) {
            editor.setValue("");
            slider.value = 0;
        }
        else {
            editor.setValue(keystrokes[(startind===0?0:startind-1)].data.alltext);
        }

        editor.setReadOnly(true);
        editor.clearSelection();
        var slidermove = setInterval(function(){
            var sli = document.getElementById('myRange');
            sli.value = parseInt(sli.value) + 10;
            var hasEnded = parseInt(sli.value) >= parseInt(sli.max);
            if (hasEnded) {
                curTimestamp = 0;
                sli.value = 0;
                startind = 0; startTime = 0;
                clearInterval(slidermove);
                pause();
                play();
            }
            if (!moveSlider) {
                clearInterval(slidermove);
                playBtn.style.backgroundImage = "url(/static/images/play.png)";
                isPlaying = false;
            }
        }, 10)


            for (var i = startind; i < keystrokes.length; i++) {
                createEvent(startTime, i);
            }
    }
    window.play = play;

    function createEvent(starttime, i) {
        var k = keystrokes[i],
            dT = 1;


        var evt = setTimeout(function(){

            editor.clearSelection();
            //console.log(k);

            switch (k.data.action) {
                case 'insert': //changed from insertText
                    if (k.data.range) {
                        editor.moveCursorTo(k.data.range.start.row, k.data.range.start.column);
                    } else {
                        editor.moveCursorTo(0, 0);
                    }
                    editor.insert(k.data.text);
                    if (k.data.range) {
                        editor.moveCursorTo(k.data.range.end.row, k.data.range.end.column);
                    }
                    break;

                case 'remove': //changed from removeText

                    editor.getSession().remove(k.data.range);
                    break;
                case 'changeSelection':
                    editor.session.selection.setSelectionRange(k.data.range);
                    break

                case 'removeLines':
                    editor.getSession().remove(k.data.range);
                    break;
                case 'idle':
                    break;

                default:
                    console.log('unknown action: ' + k.data.action);
            }

        }, dT * ( (keystrokes[i].timestamp - starttime) - keystrokes[0].timeoffset) );

        playbackEvents.push(evt);

    }

});