import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "@tanstack/react-router"
import { Button } from "@workspace/ui/components/button"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from "@workspace/ui/components/field"
import { FingerprintIcon, LogOutIcon, XIcon } from "lucide-react"
import { toast } from "sonner"
import { authClient } from "@/lib/auth-client"
import { formatDate } from "@/lib/format"
import { viewerQuery } from "@/queries/auth"

/** Throws Better Auth's `{ error }` results so Query/mutations see failures. */
async function unwrap<T>(
  promise: Promise<{
    data: T | null
    error: { message?: string | undefined } | null
  }>
): Promise<T> {
  const { data, error } = await promise
  if (error || data === null)
    throw new Error(error?.message ?? "Request failed")
  return data
}

const authKeys = {
  passkeys: ["auth", "passkeys"] as const,
  sessions: ["auth", "sessions"] as const,
}

/** "Safari on iPhone"-style label; good enough to tell your devices apart. */
function describeDevice(userAgent: string | null | undefined) {
  if (!userAgent) return "Unknown device"
  const os =
    (
      [
        ["iPhone", "iPhone"],
        ["iPad", "iPad"],
        ["Android", "Android"],
        ["Mac OS X", "Mac"],
        ["Windows", "Windows"],
        ["Linux", "Linux"],
      ] as const
    ).find(([needle]) => userAgent.includes(needle))?.[1] ?? "Unknown OS"
  const browser =
    (
      [
        ["Edg/", "Edge"],
        ["Firefox/", "Firefox"],
        ["CriOS/", "Chrome"],
        ["Chrome/", "Chrome"],
        ["Safari/", "Safari"],
      ] as const
    ).find(([needle]) => userAgent.includes(needle))?.[1] ?? "Browser"
  return `${browser} on ${os}`
}

const shortDate = (date: Date | string) =>
  formatDate(new Date(date).toISOString())

const fail = (title: string) => (error: Error) =>
  toast.error(title, { description: error.message })

export function AccountSettings() {
  const router = useRouter()
  const viewer = useQuery(viewerQuery())

  async function signOut() {
    await authClient.signOut()
    // Leave first, so this page's queries don't refetch without a session.
    await router.navigate({ to: "/login", replace: true })
    router.options.context.queryClient.clear()
    // The service worker keeps pages and server-function data for offline use.
    if ("caches" in window) {
      const keys = await caches.keys()
      await Promise.all(
        keys
          .filter((key) => /^(pages|data)-/.test(key))
          .map((key) => caches.delete(key))
      )
    }
  }

  return (
    <>
      <Field orientation="horizontal">
        <FieldContent>
          <FieldLabel>Account</FieldLabel>
          <FieldDescription>
            {viewer.data ? `Signed in as ${viewer.data.email}` : "Signed in"}
          </FieldDescription>
        </FieldContent>
        <Button variant="outline" size="lg" onClick={signOut}>
          <LogOutIcon />
          Sign out
        </Button>
      </Field>
      <Passkeys />
      <Sessions />
    </>
  )
}

function Passkeys() {
  const queryClient = useQueryClient()
  const passkeys = useQuery({
    queryKey: authKeys.passkeys,
    queryFn: () => unwrap(authClient.passkey.listUserPasskeys()),
  })
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: authKeys.passkeys })
  const add = useMutation({
    mutationFn: () => unwrap(authClient.passkey.addPasskey()),
    onSuccess: () => {
      toast.success("Passkey added")
      return refresh()
    },
    onError: fail("Couldn't add a passkey"),
  })
  const remove = useMutation({
    mutationFn: (id: string) =>
      unwrap(authClient.passkey.deletePasskey({ id })),
    onSuccess: refresh,
    onError: fail("Couldn't remove the passkey"),
  })

  return (
    <Field>
      <div className="flex items-center gap-4">
        <FieldContent>
          <FieldLabel>Passkeys</FieldLabel>
          <FieldDescription>
            Sign in with Face ID, Touch ID or your device PIN.
          </FieldDescription>
        </FieldContent>
        <Button
          variant="outline"
          size="lg"
          onClick={() => add.mutate()}
          disabled={add.isPending}
        >
          <FingerprintIcon />
          Add
        </Button>
      </div>
      <CredentialList
        items={(passkeys.data ?? []).map((p) => ({
          id: p.id,
          name: p.name ?? "Passkey",
          detail: `Added ${shortDate(p.createdAt)}`,
        }))}
        onRemove={(id) => remove.mutate(id)}
        removeLabel="Remove passkey"
      />
    </Field>
  )
}

function Sessions() {
  const queryClient = useQueryClient()
  const current = useQuery({
    queryKey: [...authKeys.sessions, "current"],
    queryFn: () => unwrap(authClient.getSession()),
  })
  const sessions = useQuery({
    queryKey: authKeys.sessions,
    queryFn: () => unwrap(authClient.listSessions()),
  })
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: authKeys.sessions })
  const revoke = useMutation({
    mutationFn: (token: string) => unwrap(authClient.revokeSession({ token })),
    onSuccess: refresh,
    onError: fail("Couldn't sign out that device"),
  })
  const revokeOthers = useMutation({
    mutationFn: () => unwrap(authClient.revokeOtherSessions()),
    onSuccess: () => {
      toast.success("Signed out everywhere else")
      return refresh()
    },
    onError: fail("Couldn't sign out the other devices"),
  })

  const currentId = current.data?.session.id
  // This device is left out: "Sign out" above covers it.
  const others = (sessions.data ?? []).filter((s) => s.id !== currentId)

  return (
    <Field>
      <div className="flex items-center gap-4">
        <FieldContent>
          <FieldLabel>Devices</FieldLabel>
          <FieldDescription>
            {others.length === 0
              ? "Only this device is signed in."
              : `Signed in on ${others.length + 1} devices.`}
          </FieldDescription>
        </FieldContent>
        {others.length > 0 ? (
          <Button
            variant="outline"
            size="lg"
            onClick={() => revokeOthers.mutate()}
            disabled={revokeOthers.isPending}
          >
            <LogOutIcon />
            Sign out others
          </Button>
        ) : null}
      </div>
      <CredentialList
        items={others.map((s) => ({
          id: s.token,
          name: describeDevice(s.userAgent),
          detail: `Last active ${shortDate(s.updatedAt)}`,
        }))}
        onRemove={(token) => revoke.mutate(token)}
        removeLabel="Sign out this device"
      />
    </Field>
  )
}

function CredentialList({
  items,
  onRemove,
  removeLabel,
}: {
  items: Array<{ id: string; name: string; detail?: string }>
  onRemove: (id: string) => void
  removeLabel: string
}) {
  if (items.length === 0) return null
  return (
    <ul className="divide-y rounded-lg border">
      {items.map((item) => (
        <li key={item.id} className="flex items-center gap-3 py-2 pr-1 pl-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{item.name}</p>
            {item.detail ? (
              <p className="truncate text-xs text-muted-foreground">
                {item.detail}
              </p>
            ) : null}
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label={removeLabel}
            onClick={() => onRemove(item.id)}
          >
            <XIcon />
          </Button>
        </li>
      ))}
    </ul>
  )
}
