/** Read-only helpers to pull well-known fields out of a raw Wazuh/Sysmon doc. */

function get(obj: unknown, path: string[]): unknown {
  let cur: unknown = obj;
  for (const k of path) {
    if (cur && typeof cur === "object" && k in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[k];
    } else return undefined;
  }
  return cur;
}

function str(v: unknown): string | null {
  return typeof v === "string" && v.length ? v : null;
}

export interface Eventdata {
  image: string | null;
  parentImage: string | null;
  commandLine: string | null;
  parentCommandLine: string | null;
  sourceImage: string | null;
  targetImage: string | null;
  targetObject: string | null;
  grantedAccess: string | null;
  user: string | null;
  eventId: string | null;
  channel: string | null;
}

export function readEventdata(raw: Record<string, unknown>): Eventdata {
  const ed = get(raw, ["data", "win", "eventdata"]) as Record<string, unknown> | undefined;
  const sys = get(raw, ["data", "win", "system"]) as Record<string, unknown> | undefined;
  const e = ed ?? {};
  return {
    image: str(e.image),
    parentImage: str(e.parentImage),
    commandLine: str(e.commandLine),
    parentCommandLine: str(e.parentCommandLine),
    sourceImage: str(e.sourceImage),
    targetImage: str(e.targetImage),
    targetObject: str(e.targetObject),
    grantedAccess: str(e.grantedAccess),
    user: str(e.user) ?? str(e.targetUserName),
    eventId: str(sys?.eventID) ?? str(sys?.eventID),
    channel: str(sys?.channel),
  };
}

export function baseName(image: string | null): string | null {
  if (!image) return null;
  const parts = image.split(/[\\/]/);
  return parts[parts.length - 1] || image;
}

/** A linear process chain for the tree view: parent -> process (-> target). */
export interface ProcessNode {
  image: string;
  commandLine?: string | null;
  role: "parent" | "process" | "target";
}

export function buildProcessChain(raw: Record<string, unknown>): ProcessNode[] {
  const e = readEventdata(raw);
  const nodes: ProcessNode[] = [];
  const parent = e.parentImage ?? null;
  const proc = e.image ?? e.sourceImage ?? null;
  const target = e.targetImage ?? null;

  if (parent) nodes.push({ image: parent, commandLine: e.parentCommandLine, role: "parent" });
  if (proc && proc !== parent)
    nodes.push({ image: proc, commandLine: e.commandLine, role: "process" });
  if (target && target !== proc) nodes.push({ image: target, role: "target" });
  return nodes;
}
