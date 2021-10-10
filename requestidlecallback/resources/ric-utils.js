function getDeadlineForNextIdleCallback() {
    return new Promise(
        resolve =>
            requestIdleCallback(deadline => resolve(deadline.timeRemaining()))
    );
}

