import { createFileRoute, useRouter } from "@tanstack/react-router"
import { Button } from "@workspace/ui/components/button"
import { ArchiveIcon, FingerprintIcon } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { z } from "zod"
import { authClient } from "@/lib/auth-client"

export const Route = createFileRoute("/login")({
  validateSearch: z.object({ redirect: z.string().optional() }),
  head: () => ({ meta: [{ title: "Sign in · Archive" }] }),
  component: LoginPage,
})

/** Only same-app paths, so the redirect can't send you to another site. */
function safeRedirect(target: string | undefined) {
  return target?.startsWith("/") && !target.startsWith("//") ? target : "/"
}

function GitHubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.8 1.19 1.83 1.19 3.09 0 4.42-2.7 5.39-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  )
}

function LoginPage() {
  const { redirect } = Route.useSearch()
  const router = useRouter()
  const [pending, setPending] = useState<"github" | "passkey">()
  const target = safeRedirect(redirect)

  async function withGitHub() {
    setPending("github")
    const { error } = await authClient.signIn.social({
      provider: "github",
      callbackURL: target,
      errorCallbackURL: "/login",
    })
    if (error) {
      setPending(undefined)
      toast.error("Couldn't start GitHub sign-in", {
        description: error.message,
      })
    }
  }

  async function withPasskey() {
    setPending("passkey")
    const { error } = await authClient.signIn.passkey()
    setPending(undefined)
    if (error) {
      toast.error("Passkey sign-in failed", { description: error.message })
      return
    }
    await router.invalidate()
    await router.navigate({ href: target, replace: true })
  }

  return (
    <div className="pt-safe px-safe flex min-h-dvh items-center justify-center">
      <div className="flex w-full max-w-xs flex-col items-center gap-8 px-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <ArchiveIcon className="size-10" />
          <h1 className="font-heading text-2xl font-semibold">Archive</h1>
          <p className="text-sm text-muted-foreground">
            A private archive. Sign in to continue.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2">
          <Button
            size="lg"
            className="pressable w-full"
            onClick={withPasskey}
            disabled={pending !== undefined}
          >
            <FingerprintIcon />
            Sign in with passkey
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="pressable w-full"
            onClick={withGitHub}
            disabled={pending !== undefined}
          >
            <GitHubIcon className="size-4" />
            Continue with GitHub
          </Button>
        </div>
      </div>
    </div>
  )
}
