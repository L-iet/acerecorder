$(document).ready(function(){
    ace.config.set('basePath', '/static/ace-builds/src-min-noconflict');

    var editor = ace.edit("editor");

    editor.$blockScrolling = Infinity;
    editor.setTheme("ace/theme/monokai");
    editor.getSession().setMode("ace/mode/python");
    editor.setOptions({
        enableBasicAutocompletion: true,
        enableSnippets: true,
        enableLiveAutocompletion: false
    });

    //TODO: Handle user deny media access

    var closePopupConf = document.getElementById("popupclose-conf");
    var closePopupSucc = document.getElementById("popupclose-succ");
    var closePopupFail = document.getElementById("popupclose-fail");
    var overlay = document.getElementById("overlay");
    var popupConfirm = document.getElementById("popup-confirm");
    var popupSucc = document.getElementById("popup-succ");
    var popupFail = document.getElementById("popup-fail");
    var button = document.getElementById("button");

    var closePs = [closePopupConf, closePopupSucc, closePopupFail];
    var pops = [popupConfirm, popupSucc, popupFail]
    
    for (var i = 0; i < closePs.length; i++) {
        closePs[i].onclick = function() {
          overlay.style.display = 'none';
          (this.id === "popupclose-conf"? popupConfirm : (this.id === "popupclose-succ" ?popupSucc : popupFail)).style.display = "none";
        }; 
    }


    //var keystrokes = []; //will not define keystrokes from here, so I can use it on main page
    //var terminalOuts = [];
    var playbackEvents = [];
    var terminalEvents = [];
    var curTimestamp = 0; //will hold the current timestamp of the video when a recording exists
    var moveSlider = false;
    var slider = document.getElementById('myRange');
    slider.oninput = function() {
        curTimestamp = parseInt(this.value);
        pause();

        if (currentMediaType === "video") {
            let prevVid = document.getElementById('preview');
            prevVid.currentTime = curTimestamp / 1000;
            prevVid.pause();
        } else if (currentMediaType === "audio") {
            let prevAud = document.getElementById('prev-aud');
            prevAud.currentTime = parseInt(curTimestamp) / 1000;
            prevAud.pause();
        }

        moveSlider = false;
        setStartTimeandIndex();
    }

    var hideWhenRecording = document.getElementsByClassName('hide-when-rec');
    var hideWhenPlaying = document.getElementsByClassName('hide-when-play');
    var terminalOutput = document.getElementById("out");
    var terminalError = document.getElementById("err");

    var startTime = 0;
    var startind = 0;
    var tstartind = 0;
    var isRecording = false;
    var hasRecordedOnce = false;
    var isPlaying = false;
    const playBtn = document.getElementById('play-btn');
    var radios = document.getElementsByName('rec_media');
    var mediaToRecord = 'text';
    var currentMediaType = 'text';
    var mediaChunks = [];
    var mediaBlob;

    if (mediaUrl !== '') {
        var _type = auxmedia;
        currentMediaType = auxmedia;
        var recMedia = _type === "audio" ? document.getElementById('prev-aud') : document.getElementById('preview');
        if (_type === "video") document.getElementById('preview').style.display = "block";
        recMedia.src = mediaUrl;
    }

    const audioMediaConstraints = {
        audio: true,
        video: false
    };
    const videoMediaConstraints = {
        // or you can set audio to false 
        // to record only video
        audio: true,
        video: true
    };
    const webCamContainer = document.getElementById('web-cam-container');

    for (var i = 0; i < radios.length; i++) {
        radios[i].addEventListener('change', function() {
            if(this.checked) mediaToRecord = this.value;
            if (this.value === "video") {
                webCamContainer.style.display = "block";
                document.getElementById("mic").style.display = "none";
            }
            else if (this.value === "audio") {
                document.getElementById("mic").style.display = "block";
                webCamContainer.style.display = "none";
            }
            else {
                webCamContainer.style.display = "none";
                document.getElementById("mic").style.display = "none";
            }
        });
    }

    function togglePlayPause (e) {
        if ( (event.type === 'click') ) { // || (event.type === 'keypress' && event.key === ' ' && !isRecording)
            isPlaying = !isPlaying;
            playBtn.style.backgroundImage = isPlaying ? "url('/static/images/pause.png')" : "url('/static/images/play.png')";
            if (isPlaying) {
                //TODO
                play();
            }
            else {
                document.getElementById("recordmenu").style.display = "block";
                curTimestamp = parseInt(slider.value);
                pause();
                moveSlider = false;
                setStartTimeandIndex();
            }
        }
    }

    playBtn.addEventListener('click', togglePlayPause);
    //document.addEventListener('keypress', togglePlayPause)

    function startRecordingMedia() {

        let p = document.getElementById("preview");
        p.src = ''; p.style.display = "none";

        document.getElementById("web-cam-container").style.display = "block";
      
        navigator.mediaDevices.getUserMedia(
                mediaToRecord === "video" ? 
                videoMediaConstraints : 
                audioMediaConstraints)
            .then(mediaStream => {
                //offset the initial time in keystrokes to the time user granted permission
                keystrokes[0].timeoffset = parseInt(Date.now()) - parseInt(keystrokes[0].starttimestamp);
                terminalOuts[0].timeoffset = keystrokes[0].timeoffset;
                keystrokes[0].auxmedia = mediaToRecord;

                if (mediaToRecord === "audio") {
                    document.getElementById("web-cam-container").style.display = "none";
                    document.getElementById("mic").style.display = "block";
                }

                // Use the mediaStream in 
                // your application
                const mediaRecorder = new MediaRecorder(mediaStream, {mimeType: (mediaToRecord === "video" ? "video/webm" : "audio/webm")});
      
                // Make the mediaStream global
                window.mediaStream = mediaStream;
                window.mediaRecorder = mediaRecorder;

                mediaRecorder.start();
                mediaRecorder.ondataavailable = function(e) {mediaChunks.push(e.data);console.log(e.data);}
                mediaRecorder.onstop = function() {
                    console.log(mediaChunks);
                    mediaBlob = new Blob(mediaChunks, {type: mediaToRecord === "video" ? "video/webm" : "audio/webm"});
                    mediaChunks = [];

                    document.getElementById("web-cam-container").style.display = "none";

                    var recordedMedia;
                    if (mediaToRecord === "video") {

                        recordedMedia = document.getElementById("preview");
                        recordedMedia.style.maxWidth = "150px";
                        
                            recordedMedia.style.display = "block";
                        //recordedMedia.controls = true;
                    }

                    else {
                        recordedMedia = document.getElementById("prev-aud");
                        recordedMedia.style.display = "none";
                    }

                    var recordedMediaUrl = URL.createObjectURL(mediaBlob);

                    recordedMedia.src = recordedMediaUrl;
                    //console.log(recordedMedia)
                }
      
                if (mediaToRecord === 'video') {
      
                    // Remember to use the "srcObject" 
                    // attribute since the "src" attribute 
                    // doesn't support media stream as a value
                    webCamContainer.srcObject = mediaStream;
                    webCamContainer.muted = true;

                }
            });
      
    }
    window.startRecordingMedia = startRecordingMedia;
    function stopRecordingMedia() {
        window.mediaRecorder.stop();

        // Stop all the tracks in the received 
        // media stream i.e. close the camera
        // and microphone
        window.mediaStream.getTracks().forEach(track => {
            track.stop();
        });
        currentMediaType = mediaToRecord;
    }
    window.stopRecordingMedia = stopRecordingMedia;


    function recordKeystroke(e) {
        var keyEvent = {
            'data': {
                'action': e.action,
                'text': e.lines.join('\n'),
                'range': {
                    'start': e.start,'end': e.end
                },
                'alltext': editor.getValue()
            },
            'timestamp': Date.now() - keystrokes[0].starttimestamp
        };

        keystrokes.push(keyEvent);
    }

    function recordSelection(e) {
        let range = editor.session.selection.getRange();
        var selEvent = {
            'data': {
                'action': e.type, //changeSelection
                'range': range,
                'alltext': editor.getValue()
            },
            'timestamp': Date.now() - keystrokes[0].starttimestamp
        }

        keystrokes.push(selEvent); //selections.push(selEvent);

    }


    function captureState() {
        var keyEvent = {
            'data': {
                'action': 'insert', //changed from insertText
                'text': editor.getValue(),
                'alltext': editor.getValue()
            },
            'starttimestamp': Date.now(),
            'timeoffset': 0,
            'timestamp': 0
        };

        keystrokes.push(keyEvent);
        terminalOuts.push({'out':document.getElementById('out').textContent, 'err':document.getElementById('err').textContent, 'starttimestamp':Date.now(), 'timestamp':0,'timeoffset':0});
    }

    function record() {
        isRecording = !isRecording;
        if (!isRecording) {
            document.getElementById("recording-text").innerText = "Record";
            // document.getElementById("mediaTypes").style.display = "block";
            // document.getElementById("play-btn").style.display = "block";

            for (let i=0; i<hideWhenRecording.length; i++) hideWhenRecording[i].style.display = "block";

            if (mediaToRecord !== "text") {
                stopRecordingMedia();
            }
            keystrokes.push({'data': {'action': 'idle'}, 'timestamp':Date.now()-keystrokes[0].starttimestamp}); //previously only added the idle end for audio/video recording, now for all
            stop();
            hasRecordedOnce = true;
        }
        else {
            document.getElementById("preview").src = "";
            document.getElementById("prev-aud").src = "";
            document.getElementById("recording-text").innerText = "Recording";
            keystrokes = []; playbackEvents = []; terminalOuts = []; terminalEvents = [];
            document.getElementById('rec').style.backgroundColor = "green";
            for (let i=0; i<hideWhenRecording.length; i++) hideWhenRecording[i].style.display = "none";
            captureState();
            editor.on("change", recordKeystroke);

            editor.session.selection.on('changeSelection', recordSelection);
            if (mediaToRecord !== 'text')
                startRecordingMedia();
            else currentMediaType = "text";
        }
    }
    window.record = record;


    function pause() {

        for (let i=0; i<hideWhenPlaying.length; i++) hideWhenPlaying[i].style.display = "block";
        document.getElementById('upload-public').style.display = hasRecordedOnce ? 'block' : 'none';
        document.getElementById('runCode').disabled = false;

        if (currentMediaType === "video" || currentMediaType === "audio") {
            let prevVid = document.getElementById(  currentMediaType === "video" ? 'preview' : 'prev-aud');
            prevVid.currentTime = curTimestamp / 1000;
            prevVid.pause();
        }

        moveSlider = false;
        editor.setReadOnly(false);
        if (playbackEvents[0]) {
            for (i = 0; i < playbackEvents.length; i++) {
                clearTimeout(playbackEvents[i]);
            }

            for (i = 0; i < terminalEvents.length; i++) {
                clearTimeout(terminalEvents[i]);
            }

        }
    }

    function stop() {
        startTime = 0;
        startind = 0;
        tstartind = 0;
        //document.getElementById('rec').style.backgroundColor = "buttonface";
        moveSlider = false;

        slider.max = (keystrokes[keystrokes.length - 1].timestamp - keystrokes[0].timestamp) - keystrokes[0].timeoffset; //offset for audio and video recordings to sync
        slider.style.display = 'block';

        editor.off("change", recordKeystroke);
        editor.session.selection.off('changeSelection', recordSelection);
        editor.setReadOnly(false);

        if (playbackEvents[0]) {
            for (i = 0; i < playbackEvents.length; i++) {
                clearTimeout(playbackEvents[i]);
            }

            for (i = 0; i < terminalEvents.length; i++) {
                clearTimeout(terminalEvents[i]);
            }
        }
    }
    window.stop = stop;

    //binary search
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
        tstartind = getIndexofFirstEventAfterTimestamp(curTimestamp + terminalOuts[0].timeoffset, terminalOuts);
        editor.setValue(keystrokes[(startind===0?0:startind-1)].data.alltext);
        let tind = tstartind===0?0:tstartind-1;
        terminalOutput.textContent = terminalOuts[tind].out;
        terminalError.textContent = terminalOuts[tind].err;
        editor.clearSelection();
    }


    function play() {
        moveSlider = true;
        //setStartTimeandIndex();

        for (let i=0; i<hideWhenPlaying.length; i++) hideWhenPlaying[i].style.display = "none";
        document.getElementById('runCode').disabled = true;
        if (startind === 0 && startTime === 0) {
            editor.setValue("");
            let tind = tstartind===0?0:tstartind-1;
            terminalOutput.textContent = terminalOuts[tind].out;
            terminalError.textContent = terminalOuts[tind].err;
            slider.value = 0;
        }
        else {
            editor.setValue(keystrokes[(startind===0?0:startind-1)].data.alltext);
            let tind = tstartind===0?0:tstartind-1;
            terminalOutput.textContent = terminalOuts[tind].out;
            terminalError.textContent = terminalOuts[tind].err;
        }

        if (currentMediaType === "video") {
            let prevVid = document.getElementById('preview');
            prevVid.style.display = "block";
            prevVid.currentTime = parseInt(startTime) / 1000;
            prevVid.play();
        } else if (currentMediaType === "audio") {
            document.getElementById("mic").style.display = "block";
            let prevAud = document.getElementById('prev-aud');
            prevAud.currentTime = parseInt(startTime) / 1000;
            prevAud.play();
        }

        editor.setReadOnly(true);
        editor.clearSelection();
        var slidermove = setInterval(function(){
            var sli = document.getElementById('myRange');
            sli.value = parseInt(sli.value) + 10;
            var hasEnded = parseInt(sli.value) >= parseInt(sli.max);
            if (hasEnded || (!moveSlider)) {
                clearInterval(slidermove);
                if (hasEnded) {
                    curTimestamp = 0;
                    startind = 0; startTime = 0;
                    tstartind = 0;
                    for (let i=0; i<hideWhenPlaying.length; i++) hideWhenPlaying[i].style.display = "block";
                    document.getElementById('upload-public').style.display = hasRecordedOnce ? 'block' : 'none';
                    document.getElementById('runCode').disabled = false;
                }
                playBtn.style.backgroundImage = "url(/static/images/play.png)";
                isPlaying = false;
            }
        }, 10)

        for (i = startind; i < keystrokes.length; i++) {
            createEvent(startTime, i);
        }

        for (i=tstartind; i<terminalOuts.length; i++) {
            createTermEvent(startTime, i);
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

            if (i == keystrokes.length - 1) {
                editor.setReadOnly(false);
            }


        }, dT * ( (keystrokes[i].timestamp - starttime) - keystrokes[0].timeoffset) );

        playbackEvents.push(evt);

    }

    function createTermEvent(starttime, i) {
        var t = terminalOuts[i], dT=1;
        var evt = setTimeout( function(){
            terminalOutput.textContent = t.out;
            terminalError.textContent=t.err;
            if (t.type) {
                let runBtn = document.getElementById('runCode');
                runBtn.style.backgroundColor = "#FFD580";
            }
        } ,
                dT * ((terminalOuts[i].timestamp - starttime) - terminalOuts[0].timeoffset) );
        if (t.type) setTimeout(function(){document.getElementById('runCode').style.backgroundColor = "buttonface";}, dT * ((terminalOuts[i].timestamp - starttime) - terminalOuts[0].timeoffset) + 500);
        terminalEvents.push(evt);
    }

    function download(content, fileName, contentType) {
        var a = document.createElement("a");
        var file = new Blob([JSON.stringify(content)], {type: contentType});
        a.href = URL.createObjectURL(file);
        a.download = fileName;
        a.click();
    }

    function downloadTextRecording() {
        var time = Date.now();
        var fileName = time+'.tvf';
        download({'filename':fileName,'code':keystrokes,'terminal':terminalOuts}, fileName, 'text/plain');
    }
    function downloadMediaRecording() {
        var zip = new JSZip();
        var time = Date.now();
        zip.file(time+'.tvf', JSON.stringify({'filename':fileName,'code':keystrokes,'terminal':terminalOuts}));

        zip.file( time+'.webm' , mediaBlob);
        zip.generateAsync({type:"blob"})
        .then(function(content) {
            // see FileSaver.js
            saveAs(content, time+".tvm");
        });
    }
    function downloadRecording () {
        console.log(keystrokes);
        if (keystrokes.length > 0){

            if (currentMediaType === "text") downloadTextRecording();
            else downloadMediaRecording();
            //tvf file is just text recording
            //tvm file is text and media, in this case keystrokes[0] has a auxmedia key whose value is video or audio
        } else alert('No recording available.');
    }
    window.downloadRecording = downloadRecording;

    function reset(){
        stop();
        keystrokes = [];
        playbackEvents = [];
        terminalEvents = [];
        terminalOuts = [];
        location.href = "/environ/new";
    }
    window.reset = reset;

    function confirmUpload() {
        overlay.style.display = 'block';
        popupConfirm.style.display = 'block';
    }
    window.confirmUpload = confirmUpload;

    function alertPopup(message) {
        overlay.style.display = 'block';
        if (message.type === 's') {
            popupSucc.style.display = 'block';
            document.getElementById('succ-link').href = message.url;
        }
        else if (message.type === 'f') popupFail.style.display = 'block';
    }

    function uploadPublic() {
        // const xhr = new XMLHttpRequest();

        overlay.style.display = 'none';
        popupConfirm.style.display = 'none';
        console.log('closed this');

        const url= "/text";
        // xhr.open("POST", url, true);
        // xhr.setRequestHeader('Content-Type', 'application/json');
        var recordedMedia = currentMediaType === "video" ? document.getElementById("preview") : document.getElementById("prev-aud");
        // xhr.send(  JSON.stringify({'filename':Date.now(), 'textRec':keystrokes, 'media': mediaBlob}) );
        let fileName = Date.now();

        fetch(url, {method: "POST", body: JSON.stringify({'filename':fileName, 'code':keystrokes,'terminal':terminalOuts}), headers: {'Content-Type': 'application/json'}}
            ).then(function(response) {
                        if (currentMediaType === 'text') {
                            if (response.ok) alertPopup({type: 's', url: new URL(`./${fileName}`, document.baseURI).href });
                            else alertPopup({type: 'f'});
                        }
                    }
            ).catch(function(error) {console.log(error);alertPopup({type:'f'});});

        if (currentMediaType !== "text")
            fetch(`/media/${fileName}`, {method: "POST", body: mediaBlob}
            ).then(response => (response.ok ? alertPopup({type: 's', url: new URL(`./${fileName}`, document.baseURI).href }) : null)
            ).catch(function(error) {console.log(error);alertPopup({type:'f'});});


        // xhr.onreadystatechange = (e) => {
        //   console.log(xhr.responseText)
        // }
    }
    window.uploadPublic = uploadPublic;

    function runCode() {
        if (isRecording) terminalOuts.push({'out':'','err':'','type':'runClicked','timestamp':Date.now() - terminalOuts[0].starttimestamp});
        const url= "/runCode";
        fetch(url, {method:"POST", body: JSON.stringify({'text': editor.getValue()}), headers: {'Content-Type': 'application/json'}}
            ).then(response => response.json().then(
                function (data) {
                    let output = data.output.length > 1000 ? data.output.slice(data.output.length - 1000) : data.output;
                    output = output + '\n[Program finished on ' + (new Date(Date.now())) + ']';
                    terminalOutput.textContent = output;
                    terminalError.textContent = data.error;
                    if (isRecording) {
                        terminalOuts.push({'out':data.output, 'err':data.error, 'timestamp':Date.now() - terminalOuts[0].starttimestamp});
                    }
                }
                )
            ).catch(error => console.log(error));
    }
    window.runCode = runCode;

});