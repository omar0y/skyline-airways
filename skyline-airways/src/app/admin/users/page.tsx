import { removeUserAction } from "@/lib/actions/admin";
import { requireAdmin } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { prisma } from "@/lib/db";

export const metadata = { title: "Admin users" };

export default async function AdminUsersPage() {
  const admin = await requireAdmin();

  const users = await prisma.user.findMany({
    include: { customer: true, admin: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:px-6">
      <h1 className="mb-6 text-3xl font-bold text-primary">Users</h1>
      <ul className="space-y-3">
        {users.map((u) => (
          <li key={u.id} className="surface flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="text-sm">
              <p className="font-bold text-foreground">{u.email}</p>
              <p>
                {u.role} · {u.status}
                {u.customer
                  ? ` · ${u.customer.firstName} ${u.customer.lastName}`
                  : ""}
              </p>
              <p className="text-muted-foreground">Joined {formatDateTime(u.createdAt)}</p>
            </div>
            {u.id !== admin.id && u.status === "ACTIVE" ? (
              <form action={removeUserAction}>
                <input type="hidden" name="userId" value={u.id} />
                <button type="submit" className="btn btn-ghost !min-h-10 !px-3 text-sm">
                  Disable user
                </button>
              </form>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
