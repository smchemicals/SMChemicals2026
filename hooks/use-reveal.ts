"use client";

import {useRef} from "react";
import {useGSAP} from "@gsap/react";
import {gsap} from "@/lib/gsap";

interface RevealOptions {
    selector?: string;
    y?: number;
    blur?: number;
    duration?: number;
    delay?: number;
    stagger?: number;
    ease?: string;
    scroll?: boolean;
    start?: string;
    /** Re-run (and reset) the reveal when these change, e.g. the route, for parts of the layout that outlive a page. */
    dependencies?: unknown[];
}

export function useReveal<T extends HTMLElement = HTMLDivElement>(options: RevealOptions = {}) {
    const {
        selector = "[data-reveal]",
        y = 30,
        blur = 8,
        duration = 1,
        delay = 0.1,
        stagger = 0.15,
        ease = "expo",
        scroll = false,
        start = "top 85%",
        dependencies,
    } = options;

    const scope = useRef<T>(null);

    useGSAP(() => {
        const targets = gsap.utils.toArray<HTMLElement>(selector, scope.current);
        if (!targets.length) return;

        gsap.from(targets, {
            autoAlpha: 0,
            y,
            filter: blur ? `blur(${blur}px)` : "blur(0px)",
            duration,
            delay: scroll ? 0 : delay,
            ease,
            stagger,
            scrollTrigger: scroll
                ? {trigger: scope.current, start, once: true}
                : undefined,
        });
    }, dependencies ? {scope, dependencies, revertOnUpdate: true} : {scope});

    return scope;
}
