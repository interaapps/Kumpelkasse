export function parseInviteGroupId(value?: string | null) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  try {
    const url = new URL(trimmed);
    const pathMatch = url.pathname.match(/\/?invite\/([^/?#]+)/i);
    if (pathMatch?.[1]) {
      return decodeURIComponent(pathMatch[1]);
    }
  } catch {
    // Fall through to relaxed matching for pasted partial links.
  }

  const match = trimmed.match(/(?:^|\/)invite\/([^/?#]+)/i);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

export function getInviteLink(groupId: string) {
  return `https://kumpelkasse.interaapps.de/invite/${groupId}`;
}
