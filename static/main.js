$(document).ready(function(){
    ace.config.set('basePath', './static/ace-builds/src-min-noconflict');

    var editor = ace.edit("editor");

    editor.$blockScrolling = Infinity;
    editor.setTheme("ace/theme/monokai");
    editor.getSession().setMode("ace/mode/python");
    editor.setOptions({
        enableBasicAutocompletion: true,
        enableSnippets: true,
        enableLiveAutocompletion: false
    });

    //define functions

});