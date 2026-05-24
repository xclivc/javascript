function workerTimers() {
    let idCounter = Date.now();
    
    const script = `self.onmessage = (function(self) { const handles = new Map([ ['setTimeout', setTimeout], ['clearTimeout', clearTimeout], ['setInterval', setInterval], ['clearInterval', clearInterval] ]); const ids = new Map(); const detach = true; return function(event) { const { id = 0, type = '', delay = 0 } = event.data || {}; const handle = handles.get(type); if (!handle) return self.postMessage({ id }); if (type.startsWith('set')) { const timerId = handle(() => self.postMessage({ id }), delay || 0); ids.set(id, timerId); } else { if (!ids.has(id)) return; handle(ids.get(id)); ids.delete(id); self.postMessage({ id, detach }); } }; })(self);`;
    const blob = new Blob([script], { type: 'application/javascript' });
    const worker = new Worker(URL.createObjectURL(blob));
    //# const dataUrl = 'data:application/javascript;base64,' + btoa(script);
    //# const worker = new Worker(dataUrl);
    //# const worker = new Worker('[URL]');
    
    const callbacks = new Map();
    
    worker.onmessage = (e) => {
        const { id, detach } = e.data || {};
        if (!id) return;
        
        if (!detach) {
            const callback = callbacks.get(id);
            if (!callback) return;
            callback();
            return;
        }
        
        callbacks.delete(id);
    };
    
    return function(type, ...args) {
        if (!type) {
            worker.terminate();
            return;
        }
        
        if (args.length == 2 && typeof args[0] == 'function') {
            const id = ++idCounter;
            const callback = args[0];
            const delay = args[1];
            callbacks.set(id, callback);
            worker.postMessage({ id, type, delay });
            return id;
        } 
        
        if (args.length == 1 && typeof args[0] == 'number') {
            const id = args[0];
            worker.postMessage({ id, type });
            return;
        }
    };
}
/* script
self.onmessage = (function(self) {
    const handles = new Map([
        ['setTimeout', setTimeout],
        ['clearTimeout', clearTimeout],
        ['setInterval', setInterval],
        ['clearInterval', clearInterval]
    ]);
    
    const ids = new Map();
    const detach = true;
    
    return function(event) {
        const { id = 0, type = '', delay = 0 } = event.data || {};
        const handle = handles.get(type);
        
        if (!handle) return self.postMessage({ id });
        
        if (type.startsWith('set')) {
            const timerId = handle(() => self.postMessage({ id }), delay || 0);
            ids.set(id, timerId);
        } else {
            if (!ids.has(id)) return;
            handle(ids.get(id));
            ids.delete(id);
            self.postMessage({ id, detach });
        }
    };
})(self);
*/


/* testing
const timers = workerTimers();
const setTimeout = (callback, delay) => timers('setTimeout', callback, delay);
const setInterval = (callback, delay) => timers('setInterval', callback, delay);
const clearTimeout = (id) => timers('clearTimeout', id);
const clearInterval = (id) => timers('clearInterval', id);

const id = setInterval(() => console.log('test'), 1000);
setTimeout(() => clearInterval(id), 10000);
*/
