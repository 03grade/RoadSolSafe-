export type TripEvents = {
  hardBrake: number;
  hardAccel: number;
  harshTurn: number;
  speeding: number; // percent or severity indicator
  phoneUse: number;
};

export function getRecommendation(events: TripEvents, score: number): string {
  const issues: string[] = [];

  if (events.speeding >= 2) issues.push("watch your speed and adhere to limits");
  if (events.hardBrake >= 2) issues.push("avoid sudden braking by increasing following distance");
  if (events.hardAccel >= 2) issues.push("accelerate more smoothly to reduce risk");
  if (events.phoneUse >= 2) issues.push("keep your phone down and stay focused");
  if (events.harshTurn >= 2) issues.push("take corners more gently for stability");

  if (score >= 8 && issues.length === 0) {
    return "Outstanding performance! You're setting a great example for safe driving.";
  }

  if (score >= 7 && issues.length <= 1) {
    return "Good overall driving! " + (issues[0] ? `Tip: ${capitalize(issues[0])}.` : "Keep it up!");
  }

  if (score >= 5) {
    const tip = issues.slice(0, 2).map(capitalize).join(". ");
    return tip ? `You're on the right track. ${tip}.` : "You're on the right track. Keep improving your smoothness and awareness.";
  }

  const tip = issues.slice(0, 3).map(capitalize).join(". ");
  return tip ? `Let's focus on the basics: ${tip}.` : "Let's focus on consistent, smooth inputs and staying attentive.";
}

function capitalize(s: string): string {
  return s.length ? s[0].toUpperCase() + s.slice(1) : s;
}

