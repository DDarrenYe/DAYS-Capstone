"use client";

import { useEffect } from "react";

import { parseRange, rangeProgress, splitTop } from "@/lib/scroll-range";
import type { Edge } from "@/lib/scroll-range";

interface Track {
  animation: Animation;
  duration: number;
  subject: Element | null;
  start: Edge;
  end: Edge;
}

const resolve = (host: HTMLElement | SVGElement, offset: string) => {
  host.style.setProperty("--range-probe", offset);
  const value = getComputedStyle(host).getPropertyValue("--range-probe").trim();
  host.style.removeProperty("--range-probe");
  const amount = Number(value.replace(/(?:%|px)$/u, ""));
  return value.endsWith("%") ? { percent: amount } : { px: amount };
};

const edges = (host: HTMLElement | SVGElement, range: string) =>
  parseRange(range).map(({ name, offset }) => ({
    name,
    ...resolve(host, offset),
  }));

const subjectOf = (host: Element, timeline: string) => {
  if (timeline.startsWith("scroll(")) {
    return null;
  }
  if (timeline.startsWith("view(")) {
    return host;
  }
  for (let node: Element | null = host; node; node = node.parentElement) {
    if (
      getComputedStyle(node).getPropertyValue("--timeline-name").trim() ===
      timeline
    ) {
      return node;
    }
  }
  return host;
};

const progressOf = ({ subject, start, end }: Track) => {
  if (!subject) {
    return rangeProgress(start, end, {
      max: document.documentElement.scrollHeight - innerHeight,
      position: scrollY,
    });
  }
  const { height, top } = subject.getBoundingClientRect();
  return rangeProgress(start, end, { height, top, viewport: innerHeight });
};

export const ScrollTimelines = () => {
  useEffect(() => {
    if (
      CSS.supports("animation-timeline: view()") ||
      matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const root = document.documentElement;
    root.dataset.scrollTimelines = "";
    let tracks: Track[] = [];
    for (const animation of document.getAnimations()) {
      const { effect } = animation;
      if (!(effect instanceof KeyframeEffect)) {
        continue;
      }
      const host = effect.target;
      if (!(host instanceof HTMLElement || host instanceof SVGElement)) {
        continue;
      }
      const style = getComputedStyle(host, effect.pseudoElement);
      const timeline = style.getPropertyValue("--timeline").trim();
      if (!timeline || !(animation instanceof CSSAnimation)) {
        continue;
      }
      const names = style.animationName.split(",").map((name) => name.trim());
      const ranges = splitTop(style.getPropertyValue("--range"), /,/u);
      const [start, end] = edges(
        host,
        ranges[names.indexOf(animation.animationName)] ?? ranges[0] ?? ""
      );
      animation.pause();
      tracks.push({
        animation,
        duration: Number(effect.getComputedTiming().duration),
        end,
        start,
        subject: subjectOf(host, timeline),
      });
    }
    const update = () => {
      tracks = tracks.filter(({ animation }) => animation.playState !== "idle");
      for (const track of tracks) {
        track.animation.currentTime = progressOf(track) * track.duration;
      }
    };
    update();
    addEventListener("scroll", update, { passive: true });
    addEventListener("resize", update);
    return () => {
      removeEventListener("scroll", update);
      removeEventListener("resize", update);
      delete root.dataset.scrollTimelines;
    };
  }, []);
  return null;
};
