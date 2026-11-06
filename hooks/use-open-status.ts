"use client";

import { useEffect, useState } from "react";
import { openStatus, parseHours, type OpenStatus } from "@/lib/hours";

/* Whether the office is open right now, in India time. Null until mounted, so the server and client markup agree. */
export function useOpenStatus(hours: string): OpenStatus | null {
	const [status, setStatus] = useState<OpenStatus | null>(null);
	useEffect(() => {
		const parsed = parseHours(hours);
		if (!parsed) return;
		const tick = () => setStatus(openStatus(parsed));
		tick();
		const id = setInterval(tick, 60_000);
		return () => clearInterval(id);
	}, [hours]);
	return status;
}
