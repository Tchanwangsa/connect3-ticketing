import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ClubProfile } from "../shared/types";

interface HostDisplayContentProps {
  creatorProfile: ClubProfile;
  hosts: ClubProfile[];
}

/** Reusable content for displaying hosts list */
export function HostDisplayContent({
  creatorProfile,
  hosts,
}: HostDisplayContentProps) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Hosts
      </p>
      <div className="space-y-2">
        {[creatorProfile, ...hosts].map((h) => (
          <div key={h.id} className="flex items-center gap-2">
            <Avatar className="h-7 w-7">
              {h.avatar_url && (
                <AvatarImage src={h.avatar_url} alt={h.first_name} />
              )}
              <AvatarFallback className="text-[10px] truncate">
                {h.first_name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{h.first_name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
