import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "@tanstack/react-router"
import { Button } from "@workspace/ui/components/button"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from "@workspace/ui/components/field"
import { FingerprintIcon, KeyRoundIcon, LogOutIcon, XIcon } from "lucide-react"
import { toast } from "sonner"
import { authClient } from "@/lib/auth-client"
import { formatDate, joinDefined } from "@/lib/format"
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
  apiKeys: ["auth", "api-keys"] as const,
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
      <ApiKeys />
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

function ApiKeys() {
  const queryClient = useQueryClient()
  const keys = useQuery({
    queryKey: authKeys.apiKeys,
    queryFn: () => unwrap(authClient.apiKey.list()),
  })
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: authKeys.apiKeys })
  const create = useMutation({
    mutationFn: (name: string) => unwrap(authClient.apiKey.create({ name })),
    onSuccess: async (created) => {
      await refresh()
      // The full key is only available now; it's stored hashed.
      await navigator.clipboard.writeText(created.key).catch(() => undefined)
      toast.success("API key created and copied", {
        description: `${created.key}\nSave it now, it won't be shown again.`,
        duration: Infinity,
        action: {
          label: "Copy",
          onClick: () => void navigator.clipboard.writeText(created.key),
        },
      })
    },
    onError: fail("Couldn't create the key"),
  })
  const remove = useMutation({
    mutationFn: (keyId: string) => unwrap(authClient.apiKey.delete({ keyId })),
    onSuccess: refresh,
    onError: fail("Couldn't revoke the key"),
  })

  function handleCreate() {
    const name = window.prompt("Name this key (e.g. Website)", "Website")
    if (name?.trim()) create.mutate(name.trim().slice(0, 32))
  }

  return (
    <Field>
      <div className="flex items-center gap-4">
        <FieldContent>
          <FieldLabel>API keys</FieldLabel>
          <FieldDescription>
            Read-only access to /api/v1 for your website. Use them only on a
            server.
          </FieldDescription>
        </FieldContent>
        <Button
          variant="outline"
          size="lg"
          onClick={handleCreate}
          disabled={create.isPending}
        >
          <KeyRoundIcon />
          New
        </Button>
      </div>
      <CredentialList
        items={(keys.data?.apiKeys ?? []).map((k) => ({
          id: k.id,
          name: k.name ?? "API key",
          detail: joinDefined([
            k.start ? `${k.start}…` : undefined,
            `Created ${shortDate(k.createdAt)}`,
          ]),
        }))}
        onRemove={(id) => {
          if (
            window.confirm("Revoke this key? Anything using it stops working.")
          )
            remove.mutate(id)
        }}
        removeLabel="Revoke key"
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
