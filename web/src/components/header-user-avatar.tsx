import Image from "next/image";
import { initialsFromName } from "@/lib/analyst-ui";

/** Small profile image or initials for the shell header (next to Sign out). */
export function HeaderUserAvatar({
  name,
  avatarUrl,
}: {
  name: string;
  avatarUrl: string | null;
}) {
  const initials = initialsFromName(name);
  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt=""
        width={32}
        height={32}
        unoptimized
        className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-white/10"
      />
    );
  }
  return (
    <div
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-600 text-[10px] font-semibold uppercase text-white ring-1 ring-white/10"
      aria-hidden
    >
      {initials}
    </div>
  );
}
