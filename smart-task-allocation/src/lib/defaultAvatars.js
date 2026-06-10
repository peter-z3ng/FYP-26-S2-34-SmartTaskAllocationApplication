const defaultAvatarUrls = [
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=320&h=320&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=320&h=320&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=320&h=320&q=80",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=320&h=320&q=80",
  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=320&h=320&q=80",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=320&h=320&q=80",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=320&h=320&q=80",
  "https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=320&h=320&q=80",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=320&h=320&q=80",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=320&h=320&q=80",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=320&h=320&q=80",
  "https://images.unsplash.com/photo-1554151228-14d9def656e4?auto=format&fit=crop&w=320&h=320&q=80",
  "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=320&h=320&q=80",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=320&h=320&q=80",
  "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=320&h=320&q=80",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=320&h=320&q=80",
  "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=320&h=320&q=80",
  "https://images.unsplash.com/photo-1552058544-f2b08422138a?auto=format&fit=crop&w=320&h=320&q=80",
  "https://images.unsplash.com/photo-1530268729831-4b0b9e170218?auto=format&fit=crop&w=320&h=320&q=80",
];

const knownAvatarIndexes = {
  "demo-platformadmin": 12,
  "platform admin": 12,
  "platformadmin@workflow.test": 12,
  "demo-useradmin": 13,
  "user_admin": 13,
  "useradmin@workflow.test": 13,
  "demo-manager": 14,
  "optima-manager": 16,
  "optima_manager": 16,
  manager: 14,
  "manager@workflow.test": 14,
  "manager@optima.co": 14,
  "demo-employee": 15,
  employee: 15,
  "employee@workflow.test": 15,
  "demo-employee-2": 0,
  "alicia tan": 0,
  "alicia@workflow.test": 0,
  "demo-employee-3": 1,
  "ben lee": 1,
  "ben@workflow.test": 1,
  "demo-employee-4": 2,
  "chen wei": 2,
  "chen.wei@workflow.test": 2,
  "demo-employee-5": 3,
  "daniel ong": 3,
  "daniel.ong@workflow.test": 3,
  "demo-employee-6": 4,
  "farah lim": 4,
  "farah.lim@workflow.test": 4,
  "demo-employee-7": 5,
  "grace koh": 5,
  "grace.koh@workflow.test": 5,
  "demo-employee-8": 6,
  "iman rahman": 6,
  "iman.rahman@workflow.test": 6,
  "demo-employee-9": 7,
  "mei wong": 7,
  "mei.wong@workflow.test": 7,
  "demo-employee-10": 8,
  "ravi kumar": 8,
  "ravi.kumar@workflow.test": 8,
  "demo-employee-11": 9,
  "sofia tan": 9,
  "sofia.tan@workflow.test": 9,
};

function hashString(value) {
  return String(value || "optima-user")
    .split("")
    .reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0, 0);
}

function normalizeAvatarKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function avatarKeysForUser(user, index) {
  return [
    user?.user_id,
    user?.email,
    user?.username,
    user?.full_name,
    user?.profile?.full_name,
    user?.name,
    `user-${index}`,
  ]
    .map(normalizeAvatarKey)
    .filter(Boolean);
}

export function getDefaultAvatarUrl(user, index = 0) {
  const keys = avatarKeysForUser(user, index);
  const knownIndex = keys.map((key) => knownAvatarIndexes[key]).find((value) => value != null);

  if (knownIndex != null) {
    return defaultAvatarUrls[knownIndex % defaultAvatarUrls.length];
  }

  const stableKey = keys[0] || `user-${index}`;
  return defaultAvatarUrls[(hashString(stableKey) + index) % defaultAvatarUrls.length];
}
