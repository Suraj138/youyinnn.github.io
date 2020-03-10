function load(src, opts, cb) {
    var head = document.head || document.getElementsByTagName('head')[0]
    var script = document.createElement('script')

    if (typeof opts === 'function') {
        cb = opts
        opts = {}
    }

    opts = opts || {}
    cb = cb || function() {}

    script.type = opts.type || 'text/javascript'
    script.charset = opts.charset || 'utf8';
    script.async = 'async' in opts ? !!opts.async : true
    script.src = src

    if (opts.attrs) {
        setAttributes(script, opts.attrs)
    }

    if (opts.text) {
        script.text = '' + opts.text
    }

    var onend = 'onload' in script ? stdOnEnd : ieOnEnd
    onend(script, cb)

    // some good legacy browsers (firefox) fail the 'in' detection above
    // so as a fallback we always set onload
    // old IE will ignore this and new IE will set onload
    if (!script.onload) {
        stdOnEnd(script, cb);
    }

    head.appendChild(script)
}

function setAttributes(script, attrs) {
    for (var attr in attrs) {
        script.setAttribute(attr, attrs[attr]);
    }
}

function stdOnEnd(script, cb) {
    script.onload = function() {
        this.onerror = this.onload = null
        cb(null, script)
    }
    script.onerror = function() {
        // this.onload = null here is necessary
        // because even IE9 works not like others
        this.onerror = this.onload = null
        cb(new Error('Failed to load ' + this.src), script)
    }
}

function ieOnEnd(script, cb) {
    script.onreadystatechange = function() {
        if (this.readyState != 'complete' && this.readyState != 'loaded') return
        this.onreadystatechange = null
        cb(null, script) // there is no way to catch loading errors in IE8
    }
}

var before = [
    'https://cdn.jsdelivr.net/gh/youyinnn/youyinnn.github.io@master/lib/emoji.js',
    'https://cdn.jsdelivr.net/npm/katex@0.10.0-rc.1/dist/katex.min.js',
    'https://cdn.jsdelivr.net/algoliasearch/3/algoliasearchLite.min.js',
]

var after = [
    'https://cdn.jsdelivr.net/gh/youyinnn/youyinnn.github.io@master/js/jquery.js',
    'https://cdn.jsdelivr.net/gh/youyinnn/youyinnn.github.io@master/js/jquery.hotkeys.js',
    'https://cdn.jsdelivr.net/gh/youyinnn/youyinnn.github.io@master/js/bootstrap.bundle.min.js',
    'https://cdn.jsdelivr.net/gh/youyinnn/youyinnn.github.io@master/js/dayjs.min.js',
    'https://cdn.jsdelivr.net/gh/youyinnn/youyinnn.github.io@master/js/yaml.min.js',
    'https://cdn.jsdelivr.net/gh/youyinnn/youyinnn.github.io@master/lib/marked.min-0.7.0.js',
    'https://cdn.jsdelivr.net/gh/youyinnn/youyinnn.github.io@master/lib/clipboard.js',
    'https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@latest/build/highlight.min.js',
    'https://cdnjs.com/libraries/flowchart',
    'https://cdnjs.cloudflare.com/ajax/libs/raphael/2.3.0/raphael.min.js',

    '/myjs/tool.js',
    '/myjs/init.js',
    '/myjs/eventbind.js',
    '/myjs/githubapi.js',
    '/myjs/elementcreate.js',
    '/myjs/main.js',
    '/resources/friendslink.js',
    '/resources/cache.js',
]

function importJsBeforeLoad() {
    for (path of before) {
        load(path, {
            async: false
        })
    }
}

function importJsAfterLoad() {
    for (path of after) {
        load(path, {
            async: false
        })
    }

    // specially loading for KaXTex https://katex.org/docs/autorender.html
    let map = new Map()
    map.set('defer', true)
    map.set('integrity', 'sha384-y23I5Q6l+B6vatafAwxRu/0oK/79VlbSz7Q9aiSZUvyWYIYsd+qj+o24G5ZU2zJz')
    map.set('crossorigin', 'anonymous')
    load('https://cdn.jsdelivr.net/npm/katex@0.11.1/dist/katex.min.js', {
        attrs: map
    })    
    map.set('defer', true)
    map.set('integrity', 'sha384-kWPLUVMOks5AQFrykwIup5lo0m3iMkkHrD0uJ4H5cjeGihAutqP0yW0J6dpFiVkI')
    map.set('crossorigin', 'anonymous')
    load('https://cdn.jsdelivr.net/npm/katex@0.11.1/dist/contrib/auto-render.min.js', {
        attrs: map
    }, () => {
        renderMathInElement(document.body)
    })
}