export interface Character {
  id: string;
  firstName: string;
  lastName: string;
  gender: "male" | "female";
  voiceId: string;
  avatarUrl: string;
  role: "interviewer" | "judge" | "opponent";
  description: string;
  tagline: string;
}

export const CHARACTERS: Character[] = [
  {
    id: "olivia",
    firstName: "Olivia",
    lastName: "Bennett",
    gender: "female",
    voiceId: "aura-asteria-en",
    avatarUrl: "/avatars/olivia.png",
    role: "interviewer",
    description: "A seasoned tech recruiter with years of experience at top firms. Known for her analytical yet empathetic approach.",
    tagline: "Senior Tech Recruiter"
  },
  {
    id: "sophia",
    firstName: "Sophia",
    lastName: "Rhodes",
    gender: "female",
    voiceId: "aura-luna-en",
    avatarUrl: "/avatars/sophia.png",
    role: "opponent",
    description: "A sharp litigator and competitive debater. She excels at identifying logical fallacies and building ironclad arguments.",
    tagline: "Litigator & Competitive Debater"
  },
  {
    id: "ethan",
    firstName: "Ethan",
    lastName: "Pierce",
    gender: "male",
    voiceId: "aura-orion-en",
    avatarUrl: "/avatars/ethan.png",
    role: "judge",
    description: "A former law professor with a reputation for impartiality and deep insight into complex moral dilemmas.",
    tagline: "Former Law Professor"
  },
  {
    id: "leo",
    firstName: "Leo",
    lastName: "Vance",
    gender: "male",
    voiceId: "aura-arcas-en",
    avatarUrl: "/avatars/leo.png",
    role: "opponent",
    description: "A charismatic policy expert with a focus on economics. He is persuasive, articulate, and always backs his claims with data.",
    tagline: "Economic Policy Expert"
  },
  {
    id: "noah",
    firstName: "Noah",
    lastName: "Sterling",
    gender: "male",
    voiceId: "aura-perseus-en",
    avatarUrl: "/avatars/noah.png",
    role: "opponent",
    description: "A tech visionary and philosopher. He challenges conventional wisdom and pushes for radical rethinking of societal structures.",
    tagline: "Tech Visionary & Philosopher"
  },
  {
    id: "mia",
    firstName: "Mia",
    lastName: "Thornton",
    gender: "female",
    voiceId: "aura-stella-en",
    avatarUrl: "/avatars/mia.png",
    role: "judge",
    description: "A professional ethics consultant. She focuses on the human impact and moral consistency of every argument.",
    tagline: "Professional Ethics Consultant"
  },
  {
    id: "emily",
    firstName: "Emily",
    lastName: "Watson",
    gender: "female",
    voiceId: "aura-athena-en",
    avatarUrl: "/avatars/emily.png",
    role: "interviewer",
    description: "A software architect with a passion for mentorship. She asks deep technical questions that reveal a candidate's true potential.",
    tagline: "Software Architect"
  },
  {
    id: "ava",
    firstName: "Ava",
    lastName: "Montgomery",
    gender: "female",
    voiceId: "aura-hera-en",
    avatarUrl: "/avatars/ava.png",
    role: "interviewer",
    description: "A behavioral psychologist turned HR executive. She focuses on emotional intelligence and long-term potential.",
    tagline: "HR Executive"
  },
  {
    id: "chloe",
    firstName: "Chloe",
    lastName: "Harrington",
    gender: "female",
    voiceId: "aura-asteria-en",
    avatarUrl: "/avatars/chloe.png",
    role: "judge",
    description: "A veteran journalist specializing in political analysis. She values clarity, brevity, and synthesized complex information.",
    tagline: "Veteran Political Journalist"
  }
];

export function getCharacter(id: string): Character | undefined {
  return CHARACTERS.find(c => c.id === id);
}
