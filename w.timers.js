function workerTimers() {
    var idCounter = Date.now();
    const script = `self.onmessage = (function (self) { const handles = [setTimeout, clearTimeout, setInterval, clearInterval].reduce((result, fn) => (result[fn.name] = fn, result), {}); const ids = []; return function (event) { const { id = 0, type = '', delay = 0 } = event.data || {}; const handle = handles[type]; if (!handle) return self.postMessage({ id }); if (handle.name.startsWith('set')) { ids[id] = handle(() => self.postMessage({ id, type }), delay || 0); } else { handle(ids[id]); } }; })(self);`;
    const blob = new Blob([script], { type: 'application/javascript' });
    const worker = new Worker(URL.createObjectURL(blob));
    const callbacks = {};
    worker.onmessage = (e) => {
        const { id, type } = e.data || {};
        if (!id || !type) return;
        const callback = callbacks[id];
        if (!callback) return;
        callback();
    };
    return function (type, ...args) {
        if (!type) return worker.terminate();
        if (args.length == 2 && typeof (args[0]) == 'function') {
            const id = ++idCounter;
            const callback = args[0];
            const delay = args[1];
            callbacks[id] = callback;
            worker.postMessage({ id, type, delay });
            return id;
        } else if (args.length == 1 && typeof (args[0]) == 'number') {
            const id = args[0];
            worker.postMessage({ id, type });
            return;
        }
    };
}
