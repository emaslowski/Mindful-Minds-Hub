/** Browsers vary in how they label QuickTime files, especially iPhone uploads. */
export function uploadVideoContentType(file: { name: string; type: string }): string {
  const type = file.type.toLowerCase();
  const extension = file.name.split(".").at(-1)?.toLowerCase();
  if (extension === "mov" && (!type || type === "application/octet-stream" || type.startsWith("video/"))) {
    return "video/quicktime";
  }
  if (type === "video/mov" || type === "video/x-quicktime") return "video/quicktime";
  if (!type || type === "application/octet-stream") {
    return ({ mp4: "video/mp4", webm: "video/webm", mov: "video/quicktime", ogv: "video/ogg" } as Record<string, string>)[extension ?? ""] ?? type;
  }
  return type;
}
