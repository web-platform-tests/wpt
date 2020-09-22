let appendScript = (src, resolve) => {
    // This PerformanceObserver ensures the Promise resolves once the script's
    // entry was added to the observer, under the assumption that this implies
    // it was also added to the PerformanceTimeline.
    const po = new PerformanceObserver((list, observer) =>  { 
      observer.disconnect();
      resolve();
    });
    po.observe({entryTypes: ["resource"]});
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = src;
    document.body.appendChild(script);
}

const syncXHR = src => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", src, false);
    xhr.send(null);
}

let waitForNextTask = () => {
    return new Promise(resolve => {
        step_timeout(resolve, 0);
    });
};

let waitUntilConditionIsMet = cond => {
    return new Promise(resolve => {
        let checkCondition = function() {
            if (cond.apply(null)) {
                resolve();
            } else {
                step_timeout(checkCondition.bind(null,cond), 0);
            }
        }
        step_timeout(checkCondition.bind(null, cond), 0);
    });
}

let waitForEventToFire = () => {
    return new Promise(resolve => {
        let waitForIt = function() {
            if (eventFired) {
                eventFired = false;
                resolve();
            } else {
                step_timeout(waitForIt, 0);
            }
        }
        step_timeout(waitForIt, 0);
    });
};

let clearBufferAndSetSize = size => {
    performance.clearResourceTimings();
    performance.setResourceTimingBufferSize(size);
}

let fillUpTheBufferWithSingleResource = src => {
    return new Promise(resolve => {
        // This resource gets buffered in the resource timing entry buffer.
        appendScript(src, resolve);
    });
};

let loadResource = src => {
    return new Promise(resolve => {
        appendScript(src, resolve);
    });
};

let fillUpTheBufferWithTwoResources = async src => {
    // These resources get buffered in the resource timing entry buffer.
    await loadResource(src);
    await loadResource(src + '?second');
};

