import { useLogout, useMe } from "@/features/auth/useAuth";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const me = useMe();
  const logout = useLogout();

  return (
    <div className="space-y-3 p-8">
      <p>
        Signed in as {me.data?.first_name} ({me.data?.role}) at {me.data?.practice?.name}
      </p>
      <Button variant="outline" onClick={() => logout.mutate()}>
        Log out
      </Button>
    </div>
  );
}