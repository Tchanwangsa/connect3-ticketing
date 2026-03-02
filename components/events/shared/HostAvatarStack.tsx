import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ClubProfile } from "./types";

interface HostAvatarStackProps {
  creator: ClubProfile;
  hosts: ClubProfile[];
}

/**
 * Renders a horizontally-overlapping stack of host avatars.
 * Shows the creator first, then up to 2 additional hosts, then a "+N" badge.
 */
export function HostAvatarStack({ creator, hosts }: HostAvatarStackProps) {
  return (
    <div className="flex items-center -space-x-2">
      <Avatar className="z-10 h-8 w-8 border-2 border-background">
        {creator.avatar_url && (
          <AvatarImage src={creator.avatar_url} alt={creator.first_name} />
        )}
        <AvatarFallback className="text-xs">
          {creator.first_name.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      {hosts.slice(0, 2).map((club, i) => (
        <Avatar
          key={club.id}
          className="h-8 w-8 border-2 border-background"
          style={{ zIndex: 9 - i }}
        >
          {club.avatar_url && (
            <AvatarImage src={club.avatar_url} alt={club.first_name} />
          )}
          <AvatarFallback className="text-xs">
            {club.first_name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      ))}
      {hosts.length > 2 && (
        <div className="z-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-semibold text-foreground">
          +{hosts.length - 2}
        </div>
      )}
    </div>
  );
}
