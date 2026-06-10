import OrganizationProfileForm from "@/components/OrganizationProfileForm";
import SideMenuLayout from "@/components/SideMenuLayout";

export default function UserAdminOrganizationPage() {
  return (
    <SideMenuLayout actor="useradmin">
      <header className="pb-6">
        <p className="text-sm font-bold uppercase tracking-wider text-[#57708f]">
          User Admin
        </p>
        <h1 className="mt-1 text-3xl font-bold text-[#07183b]">Organization</h1>
        <p className="mt-2 text-sm text-[#52627a]">
          View and manage organization details.
        </p>
      </header>
      <OrganizationProfileForm />
    </SideMenuLayout>
  );
}
