import { getNotificationsPaginated } from "@/lib/notifications-server"
import { parseListParams, type RawSearchParams } from "@/lib/pagination"
import { NotificationsListClient } from "@/components/learner/NotificationsListClient"
import { getTranslations } from "@/lib/i18n/server"

export default async function LearnerNotificationsPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>
}) {
  // Server Component: memakai getTranslations(), bukan hook useI18n().
  const { t } = await getTranslations()
  const raw = await searchParams
  const params = parseListParams<Record<string, never>>(raw, {
    sortable: ["created_at"],
    defaultSort: "created_at",
    defaultDir: "desc",
    defaultPageSize: 10,
  })

  const page = await getNotificationsPaginated(params)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{t.notifications.title}</h1>
        <p className="text-sm text-muted-foreground">{t.notifications.subtitle}</p>
      </div>

      <NotificationsListClient page={page} />
    </div>
  )
}
