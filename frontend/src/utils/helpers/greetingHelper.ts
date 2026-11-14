export interface RoleGreeting {
  salutation: string;
  headline: string;
  subtext: string;
  badge: string;
  badgeColor: string;
  quote: string;
}

export const getRoleGreeting = (fullName?: string, role?: string): RoleGreeting => {
  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';
  const name = fullName ? fullName.split(' ')[0] : 'Defender';

  if (role === 'ADMIN') {
    return {
      salutation: `Good ${timeOfDay}, Commander ${name}!`,
      headline: 'All defense perimeters and squads are under your watchful command.',
      subtext:
        'Infrastructure is fortified, automated escalation is guarding active SLAs, and your operations squads stand ready. Leading cloud security with unwavering precision.',
      badge: 'Command Authority · Full Oversight',
      badgeColor: 'border-purple-500/40 bg-purple-950/50 text-purple-300',
      quote: '“True authority brings calm to the storm — guarding every asset with clarity and strength.”',
    };
  }

  if (role === 'ANALYST') {
    return {
      salutation: `Good ${timeOfDay}, Investigator ${name}!`,
      headline: 'Ready to turn raw threat signals into swift, decisive resolutions?',
      subtext:
        'Your sharp forensic intuition is the frontline shield of our cloud. The smart routing engine is aligned, on-duty shift tracking is active, and the queue is primed for your expertise.',
      badge: 'Active SOC Responder · Forensics On-Duty',
      badgeColor: 'border-sky-500/40 bg-sky-950/50 text-sky-300',
      quote: '“Every pattern unraveled and resolved brings harmony back to the digital perimeter.”',
    };
  }

  // VIEWER or general user
  return {
    salutation: `Good ${timeOfDay}, ${name}!`,
    headline: 'Welcome to CloudSec Monitor — your cloud estate is calm, shielded, and serene.',
    subtext:
      'Enjoy clear, real-time observability into active threat metrics, SLA compliance, and system health. Every asset is continuously monitored with zero uncontained breaches.',
    badge: 'Telemetry Observer · Real-Time Shield',
    badgeColor: 'border-emerald-500/40 bg-emerald-950/50 text-emerald-300',
    quote: '“Where vigilant defense meets serene clarity — your digital horizon rests in safe hands.”',
  };
};
