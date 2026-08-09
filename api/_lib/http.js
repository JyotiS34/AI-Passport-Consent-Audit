export function base64url(buf) {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function base64urlDecode(str) {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((str.length + 3) % 4);
  return Buffer.from(padded, "base64").toString("utf8");
}

export function parseCookie(header, name) {
  if (!header) return null;
  const match = header.split(/;\s*/).find((c) => c.startsWith(`${name}=`));
  return match ? match.slice(name.length + 1) : null;
}
