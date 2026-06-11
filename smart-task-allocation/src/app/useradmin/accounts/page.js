import AccountsPageContent from "@/components/AccountsPageContent";
import SideMenuLayout from "@/components/SideMenuLayout";
import GlassSurface from "@/components/ui/glass-surface";

export default function UserAdminAccountsPage() {
  return (
    <SideMenuLayout actor="useradmin">
      <GlassSurface className="h-full overflow-y-auto p-8">
        <header className="pb-6">
          <p className="text-sm font-bold uppercase tracking-wider text-[#57708f]">
            User Admin
          </p>
          <h1 className="mt-1 text-3xl font-bold text-[#07183b]">Accounts</h1>
          <p className="mt-2 text-sm text-[#52627a]">
            Create accounts directly or send invitation emails.
          </p>
        </header>
        <AccountsPageContent />
      </GlassSurface>
    </SideMenuLayout>
  );
}
