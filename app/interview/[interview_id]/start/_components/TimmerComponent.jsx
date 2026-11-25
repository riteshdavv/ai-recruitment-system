"use client"
import React, { useState, useEffect, useRef } from 'react';

const formatTime = (totalSeconds) => {
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
};

// durationSeconds: total limit in seconds (0 = unlimited, shows elapsed)
// When a limit is set, shows countdown and turns red in the last 60 seconds.
const TimmerComponent = ({ start, durationSeconds = 0 }) => {
    const [elapsed, setElapsed] = useState(0);
    const intervalRef = useRef(null);

    useEffect(() => {
        if (start) {
            intervalRef.current = setInterval(() => {
                setElapsed(prev => prev + 1);
            }, 1000);
        } else {
            clearInterval(intervalRef.current);
        }
        return () => clearInterval(intervalRef.current);
    }, [start]);

    if (durationSeconds > 0) {
        const remaining = Math.max(0, durationSeconds - elapsed);
        const isLow = remaining <= 60;
        return (
            <div className={isLow ? 'text-danger' : ''}>
                <h2>{formatTime(remaining)}</h2>
            </div>
        );
    }

    return (
        <div>
            <h2>{formatTime(elapsed)}</h2>
        </div>
    );
};

export default TimmerComponent;
