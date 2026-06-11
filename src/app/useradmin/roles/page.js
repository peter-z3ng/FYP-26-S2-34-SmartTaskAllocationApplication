import RoleManagement from "@/components/RoleManagement";
import SideMenuLayout from "@/components/SideMenuLayout";

export default function UserAdminRolesPage() {
  return (
    <SideMenuLayout actor="useradmin">
      <header className="pb-6">
        <p className="text-sm font-bold uppercase tracking-wider text-[#57708f]">
          User Admin
        </p>
        <h1 className="mt-1 text-3xl font-bold text-[#07183b]">Roles</h1>
        <p className="mt-2 text-sm text-[#52627a]">
          Review role definitions used for account routing.
        </p>
      </header>
      <RoleManagement />
    </SideMenuLayout>
  );
}
